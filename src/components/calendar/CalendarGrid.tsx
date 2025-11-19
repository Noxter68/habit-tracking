// src/components/calendar/CalendarGrid.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HolidayPeriod } from '@/types/holiday.types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { HolidayModeService } from '@/services/holidayModeService';
import { tierThemes } from '@/utils/tierTheme';
import { getLocalDateString, getDaysInMonth, isToday, isSameDay } from '@/utils/dateHelpers';

interface CalendarGridProps {
  habit: Habit;
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  activeHoliday?: HolidayPeriod | null;
  allHolidays?: HolidayPeriod[];
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ habit, currentMonth, selectedDate, onSelectDate, onNavigateMonth, activeHoliday = null, allHolidays = [] }) => {
  const { t, i18n } = useTranslation();
  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];
  const days = getDaysInMonth(currentMonth);

  // Week days avec traduction
  const weekDays = [
    t('calendar.weekDays.short.sunday'),
    t('calendar.weekDays.short.monday'),
    t('calendar.weekDays.short.tuesday'),
    t('calendar.weekDays.short.wednesday'),
    t('calendar.weekDays.short.thursday'),
    t('calendar.weekDays.short.friday'),
    t('calendar.weekDays.short.saturday'),
  ];

  return (
    <View style={tw`bg-white rounded-3xl p-5 shadow-lg`}>
      {/* Month Navigation - Duolingo Style */}
      <View style={tw`flex-row items-center justify-between mb-5`}>
        <Pressable
          onPress={() => onNavigateMonth('prev')}
          style={({ pressed }) => [tw`p-2.5 rounded-full bg-slate-100`, pressed && tw`bg-slate-200`]}
          accessibilityLabel={t('calendar.navigation.previousMonth')}
        >
          <ChevronLeft size={22} color="#475569" strokeWidth={2.5} />
        </Pressable>

        <Text style={tw`text-xl font-black text-slate-800 uppercase tracking-wide`}>
          {currentMonth.toLocaleDateString(i18n.language, {
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        <Pressable
          onPress={() => onNavigateMonth('next')}
          style={({ pressed }) => [tw`p-2.5 rounded-full bg-slate-100`, pressed && tw`bg-slate-200`]}
          accessibilityLabel={t('calendar.navigation.nextMonth')}
        >
          <ChevronRight size={22} color="#475569" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Week Days Header */}
      <View style={tw`flex-row mb-3`}>
        {weekDays.map((day, index) => (
          <View key={index} style={tw`flex-1 items-center py-2`}>
            <Text style={tw`text-xs font-black text-slate-400 uppercase`}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={[tw`flex-row flex-wrap`, { overflow: 'visible' }]}>
        {days.map((date, index) => {
          // Calculate streak info for this day
          let isInStreak = false;
          let isStreakStart = false;
          let isStreakEnd = false;

          if (date) {
            const dateString = getLocalDateString(date);
            const isCompleted = habit.dailyTasks[dateString]?.allCompleted || false;

            if (isCompleted) {
              // Check previous day
              const prevDate = new Date(date);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevDateString = getLocalDateString(prevDate);
              const prevCompleted = habit.dailyTasks[prevDateString]?.allCompleted || false;

              // Check next day
              const nextDate = new Date(date);
              nextDate.setDate(nextDate.getDate() + 1);
              const nextDateString = getLocalDateString(nextDate);
              const nextCompleted = habit.dailyTasks[nextDateString]?.allCompleted || false;

              // Determine streak position
              if (prevCompleted || nextCompleted) {
                isInStreak = true;
                isStreakStart = !prevCompleted;
                isStreakEnd = !nextCompleted;
              }
            }
          }

          // Calculate missed streak info
          let isInMissedStreak = false;
          let isMissedStreakStart = false;
          let isMissedStreakEnd = false;

          // Calculate holiday streak info
          let isInHolidayStreak = false;
          let isHolidayStreakStart = false;
          let isHolidayStreakEnd = false;

          if (date) {
            const dateString = getLocalDateString(date);
            const dayTasks = habit.dailyTasks[dateString];
            const completedTasks = dayTasks?.completedTasks?.length || 0;
            const isCompleted = dayTasks?.allCompleted || false;
            const isPartial = completedTasks > 0 && !isCompleted;

            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            const creationDate = new Date(habit.createdAt);
            creationDate.setHours(0, 0, 0, 0);
            const beforeCreation = checkDate.getTime() < creationDate.getTime();

            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const isCurrentDay = date.toDateString() === now.toDateString();
            const isPast = checkDate < now && !isCurrentDay;

            const taskIds = habit.tasks.map((t: any) => t.id);
            const isHoliday = HolidayModeService.isDateInAnyHoliday(date, allHolidays, habit.id, taskIds);
            const isMissed = isPast && !isCompleted && !isPartial && !beforeCreation && !isHoliday;

            // Check missed streak
            if (isMissed) {
              const prevDate = new Date(date);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevDateString = getLocalDateString(prevDate);
              const prevDayTasks = habit.dailyTasks[prevDateString];
              const prevCompleted = prevDayTasks?.allCompleted || false;
              const prevPartial = (prevDayTasks?.completedTasks?.length || 0) > 0 && !prevCompleted;
              const prevCheckDate = new Date(prevDate);
              prevCheckDate.setHours(0, 0, 0, 0);
              const prevBeforeCreation = prevCheckDate.getTime() < creationDate.getTime();
              const prevIsHoliday = HolidayModeService.isDateInAnyHoliday(prevDate, allHolidays, habit.id, taskIds);
              const prevMissed = prevCheckDate < now && !prevCompleted && !prevPartial && !prevBeforeCreation && !prevIsHoliday;

              const nextDate = new Date(date);
              nextDate.setDate(nextDate.getDate() + 1);
              const nextDateString = getLocalDateString(nextDate);
              const nextDayTasks = habit.dailyTasks[nextDateString];
              const nextCompleted = nextDayTasks?.allCompleted || false;
              const nextPartial = (nextDayTasks?.completedTasks?.length || 0) > 0 && !nextCompleted;
              const nextCheckDate = new Date(nextDate);
              nextCheckDate.setHours(0, 0, 0, 0);
              const nextIsHoliday = HolidayModeService.isDateInAnyHoliday(nextDate, allHolidays, habit.id, taskIds);
              const nextMissed = nextCheckDate < now && !nextCompleted && !nextPartial && !nextIsHoliday;

              if (prevMissed || nextMissed) {
                isInMissedStreak = true;
                isMissedStreakStart = !prevMissed;
                isMissedStreakEnd = !nextMissed;
              }
            }

            // Check holiday streak
            if (isHoliday) {
              const prevDate = new Date(date);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevIsHoliday = HolidayModeService.isDateInAnyHoliday(prevDate, allHolidays, habit.id, taskIds);

              const nextDate = new Date(date);
              nextDate.setDate(nextDate.getDate() + 1);
              const nextIsHoliday = HolidayModeService.isDateInAnyHoliday(nextDate, allHolidays, habit.id, taskIds);

              if (prevIsHoliday || nextIsHoliday) {
                isInHolidayStreak = true;
                isHolidayStreakStart = !prevIsHoliday;
                isHolidayStreakEnd = !nextIsHoliday;
              }
            }
          }

          return (
            <CalendarDay
              key={`day-${index}`}
              date={date}
              habit={habit}
              selectedDate={selectedDate}
              onSelect={onSelectDate}
              theme={theme}
              activeHoliday={activeHoliday}
              allHolidays={allHolidays}
              isInStreak={isInStreak}
              isStreakStart={isStreakStart}
              isStreakEnd={isStreakEnd}
              isInMissedStreak={isInMissedStreak}
              isMissedStreakStart={isMissedStreakStart}
              isMissedStreakEnd={isMissedStreakEnd}
              isInHolidayStreak={isInHolidayStreak}
              isHolidayStreakStart={isHolidayStreakStart}
              isHolidayStreakEnd={isHolidayStreakEnd}
            />
          );
        })}
      </View>

      {/* Legend - Extended Duolingo Style */}
      <View style={tw`mt-5 pt-4 border-t border-slate-100`}>
        <View style={tw`flex-row justify-center items-center gap-3 flex-wrap`}>
          <LegendItem color={theme.accent} label={t('calendar.legend.complete')} />
          <LegendItem color={theme.accent + '40'} label={t('calendar.legend.partial')} />
          <LegendItem color="#fecaca" label={t('calendar.legend.missed')} />
          <LegendItem color="#fef3c7" label={t('calendar.legend.holiday')} />
        </View>
      </View>
    </View>
  );
};

const CalendarDay: React.FC<{
  date: Date | null;
  habit: Habit;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  theme: any;
  activeHoliday?: HolidayPeriod | null;
  allHolidays?: HolidayPeriod[];
  isInStreak?: boolean;
  isStreakStart?: boolean;
  isStreakEnd?: boolean;
  isInMissedStreak?: boolean;
  isMissedStreakStart?: boolean;
  isMissedStreakEnd?: boolean;
  isInHolidayStreak?: boolean;
  isHolidayStreakStart?: boolean;
  isHolidayStreakEnd?: boolean;
}> = ({
  date,
  habit,
  selectedDate,
  onSelect,
  theme,
  activeHoliday = null,
  allHolidays = [],
  isInStreak = false,
  isStreakStart = false,
  isStreakEnd = false,
  isInMissedStreak = false,
  isMissedStreakStart = false,
  isMissedStreakEnd = false,
  isInHolidayStreak = false,
  isHolidayStreakStart = false,
  isHolidayStreakEnd = false,
}) => {
  if (!date) {
    return <View style={tw`w-1/7 h-11 mb-1`} />;
  }

  const dateString = getLocalDateString(date);
  const dayTasks = habit.dailyTasks[dateString];
  const totalTasks = habit.tasks?.length || 0;
  const completedTasks = dayTasks?.completedTasks?.length || 0;

  const isCompleted = dayTasks?.allCompleted || false;
  const isPartial = completedTasks > 0 && !isCompleted;
  const isSelected = isSameDay(date, selectedDate);
  const isCurrentDay = isToday(date);

  // Normalize both dates to midnight for accurate comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0, 0, 0, 0);

  const beforeCreation = checkDate.getTime() < creationDate.getTime();
  const isPast = date < new Date() && !isCurrentDay;
  const isMissed = isPast && !isCompleted && !isPartial && !beforeCreation;

  // Check if this date is in a holiday period
  const taskIds = habit.tasks.map((t) => t.id);
  const isHoliday = HolidayModeService.isDateInAnyHoliday(date, allHolidays, habit.id, taskIds);

  // Priority order: Holiday > Complete > Partial > Missed > Before Creation
  let backgroundColor = 'transparent';
  let textColor = tw.color('slate-600');

  if (beforeCreation) {
    textColor = tw.color('gray-300');
  } else if (isHoliday) {
    // Holiday state - Amber theme
    backgroundColor = '#fef3c7'; // amber-100
    textColor = '#d97706'; // amber-600
  } else if (isCompleted) {
    // Use tier color for completed days
    backgroundColor = theme.accent;
    textColor = '#ffffff';
  } else if (isPartial) {
    backgroundColor = theme.accent + '40'; // 25% opacity
    textColor = theme.accent;
  } else if (isMissed) {
    backgroundColor = '#fecaca'; // red-200
    textColor = '#dc2626'; // red-600
  }

  // Streak background styles - continuous background connecting days
  let streakBackgroundStyle: any = {};

  if (isInStreak && isCompleted) {
    streakBackgroundStyle = {
      backgroundColor: theme.accent,
      borderTopLeftRadius: isStreakStart ? 20 : 0,
      borderBottomLeftRadius: isStreakStart ? 20 : 0,
      borderTopRightRadius: isStreakEnd ? 20 : 0,
      borderBottomRightRadius: isStreakEnd ? 20 : 0,
      paddingLeft: isStreakStart ? 2 : 0,
      paddingRight: isStreakEnd ? 2 : 0,
    };
  } else if (isInMissedStreak && isMissed) {
    streakBackgroundStyle = {
      backgroundColor: '#fecaca',
      borderTopLeftRadius: isMissedStreakStart ? 20 : 0,
      borderBottomLeftRadius: isMissedStreakStart ? 20 : 0,
      borderTopRightRadius: isMissedStreakEnd ? 20 : 0,
      borderBottomRightRadius: isMissedStreakEnd ? 20 : 0,
      paddingLeft: isMissedStreakStart ? 2 : 0,
      paddingRight: isMissedStreakEnd ? 2 : 0,
    };
  } else if (isInHolidayStreak && isHoliday) {
    streakBackgroundStyle = {
      backgroundColor: '#fef3c7',
      borderTopLeftRadius: isHolidayStreakStart ? 20 : 0,
      borderBottomLeftRadius: isHolidayStreakStart ? 20 : 0,
      borderTopRightRadius: isHolidayStreakEnd ? 20 : 0,
      borderBottomRightRadius: isHolidayStreakEnd ? 20 : 0,
      paddingLeft: isHolidayStreakStart ? 2 : 0,
      paddingRight: isHolidayStreakEnd ? 2 : 0,
    };
  } else if (isPartial) {
    // Single partial day - apply background with full rounded corners like streak endpoints
    streakBackgroundStyle = {
      backgroundColor: theme.accent + '40',
      borderRadius: 20,
      paddingLeft: 2,
      paddingRight: 2,
    };
  } else if (isCompleted) {
    // Single completed day - apply background with full rounded corners
    streakBackgroundStyle = {
      backgroundColor: theme.accent,
      borderRadius: 20,
      paddingLeft: 2,
      paddingRight: 2,
    };
  } else if (isMissed && !beforeCreation) {
    // Single missed day - apply background with full rounded corners
    streakBackgroundStyle = {
      backgroundColor: '#fecaca',
      borderRadius: 20,
      paddingLeft: 2,
      paddingRight: 2,
    };
  } else if (isHoliday) {
    // Single holiday day - apply background with full rounded corners
    streakBackgroundStyle = {
      backgroundColor: '#fef3c7',
      borderRadius: 20,
      paddingLeft: 2,
      paddingRight: 2,
    };
  } else if (!beforeCreation) {
    // Default padding for days without special state (including current day)
    streakBackgroundStyle = {
      paddingLeft: 2,
      paddingRight: 2,
    };
  }

  // Determine if we should hide the inner background (when streak style has background)
  const hasStreakBackground = streakBackgroundStyle.backgroundColor !== undefined;

  return (
    <View style={[tw`w-1/7 h-11 mb-1 items-center justify-center`, { overflow: 'visible' }, streakBackgroundStyle]}>
      <Pressable onPress={() => onSelect(date)} style={({ pressed }) => [tw`items-center justify-center`, { overflow: 'visible' }, pressed && tw`opacity-70`]} disabled={beforeCreation}>
        <View style={[tw`w-7 h-7 rounded-lg items-center justify-center`, !hasStreakBackground && { backgroundColor }, isSelected && !beforeCreation && { borderWidth: 2, borderColor: theme.accent }]}>
          <Text style={[tw`text-sm font-black`, { color: textColor }, beforeCreation && tw`text-gray-300`]}>{date.getDate()}</Text>
        </View>
      </Pressable>
    </View>
  );
};

const LegendItem: React.FC<{
  color: string;
  label: string;
  icon?: React.ReactNode;
}> = ({ color, label, icon }) => (
  <View style={tw`flex-row items-center`}>
    {icon ? <View style={[tw`w-4 h-4 rounded-md items-center justify-center`, { backgroundColor: color }]}>{icon}</View> : <View style={[tw`w-4 h-4 rounded-md`, { backgroundColor: color }]} />}
    <Text style={tw`text-xs font-semibold text-gray-600 ml-1.5`}>{label}</Text>
  </View>
);

export default CalendarGrid;
