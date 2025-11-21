// src/components/calendar/CalendarGrid.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
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

  // Week days avec traduction - commence par lundi
  const weekDays = [
    t('calendar.weekDays.short.monday'),
    t('calendar.weekDays.short.tuesday'),
    t('calendar.weekDays.short.wednesday'),
    t('calendar.weekDays.short.thursday'),
    t('calendar.weekDays.short.friday'),
    t('calendar.weekDays.short.saturday'),
    t('calendar.weekDays.short.sunday'),
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

          const isWeeklyHabitForStreak = habit.frequency === 'weekly';

          if (date) {
            const dateString = getLocalDateString(date);
            const dailyCompleted = habit.dailyTasks[dateString]?.allCompleted || false;

            // For weekly habits, check if the week is completed
            const isWeekCompletedForStreak = isWeeklyHabitForStreak ? isWeeklyHabitCompletedForWeek(date, habit) : false;
            const isCompleted = isWeeklyHabitForStreak ? isWeekCompletedForStreak : dailyCompleted;

            if (isCompleted) {
              // Check previous day
              const prevDate = new Date(date);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevDateString = getLocalDateString(prevDate);
              const prevDailyCompleted = habit.dailyTasks[prevDateString]?.allCompleted || false;
              const prevWeekCompleted = isWeeklyHabitForStreak ? isWeeklyHabitCompletedForWeek(prevDate, habit) : false;
              const prevCompleted = isWeeklyHabitForStreak ? prevWeekCompleted : prevDailyCompleted;

              // Check next day
              const nextDate = new Date(date);
              nextDate.setDate(nextDate.getDate() + 1);
              const nextDateString = getLocalDateString(nextDate);
              const nextDailyCompleted = habit.dailyTasks[nextDateString]?.allCompleted || false;
              const nextWeekCompleted = isWeeklyHabitForStreak ? isWeeklyHabitCompletedForWeek(nextDate, habit) : false;
              const nextCompleted = isWeeklyHabitForStreak ? nextWeekCompleted : nextDailyCompleted;

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

          const isWeeklyHabit = habit.frequency === 'weekly';

          if (date) {
            const dateString = getLocalDateString(date);
            const dayTasks = habit.dailyTasks[dateString];
            const completedTasks = dayTasks?.completedTasks?.length || 0;
            const dailyCompleted = dayTasks?.allCompleted || false;

            // For weekly habits, check if the week is completed
            const isWeekCompleted = isWeeklyHabit ? isWeeklyHabitCompletedForWeek(date, habit) : false;
            const isCompleted = isWeeklyHabit ? isWeekCompleted : dailyCompleted;
            const isPartial = !isWeeklyHabit && completedTasks > 0 && !isCompleted;

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

            // For weekly habits, only mark missed if entire week is past
            let isMissed = false;
            if (isWeeklyHabit) {
              const weekStart = getWeekStart(date);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekStart.getDate() + 6);
              weekEnd.setHours(23, 59, 59, 999);
              const isWeekPast = weekEnd < new Date();
              isMissed = isWeekPast && !isWeekCompleted && !beforeCreation && !isHoliday;
            } else {
              isMissed = isPast && !isCompleted && !isPartial && !beforeCreation && !isHoliday;
            }

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

/**
 * Helper to get the start of a week (Monday) for a given date
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Convertir dimanche (0) en 7 pour le calcul basé sur lundi
  const dayFromMonday = day === 0 ? 7 : day;
  d.setDate(d.getDate() - (dayFromMonday - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Check if a weekly habit was completed during the week containing the given date
 */
const isWeeklyHabitCompletedForWeek = (date: Date, habit: Habit): boolean => {
  const weekStart = getWeekStart(date);

  // Check each day of the week
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);
    const dateString = getLocalDateString(checkDate);

    if (habit.dailyTasks[dateString]?.allCompleted) {
      return true;
    }
  }
  return false;
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
  isInMissedStreak = false,
  isInHolidayStreak = false,
}) => {
  if (!date) {
    return <View style={tw`w-1/7 h-11 mb-1`} />;
  }

  const isWeeklyHabit = habit.frequency === 'weekly';
  const dateString = getLocalDateString(date);
  const dayTasks = habit.dailyTasks[dateString];
  const completedTasks = dayTasks?.completedTasks?.length || 0;

  // For weekly habits, check if the week is completed
  const isWeekCompleted = isWeeklyHabit ? isWeeklyHabitCompletedForWeek(date, habit) : false;

  const isCompleted = isWeeklyHabit ? isWeekCompleted : (dayTasks?.allCompleted || false);
  const isPartial = !isWeeklyHabit && completedTasks > 0 && !isCompleted;
  const isSelected = isSameDay(date, selectedDate);
  const isCurrentDay = isToday(date);

  // Normalize both dates to midnight for accurate comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0, 0, 0, 0);

  const beforeCreation = checkDate.getTime() < creationDate.getTime();
  const isPast = date < new Date() && !isCurrentDay;

  // For weekly habits, don't show individual days as missed
  // Only show missed if the entire week is past and not completed
  let isMissed = false;
  if (isWeeklyHabit) {
    // Check if the entire week has passed
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const now = new Date();
    const isWeekPast = weekEnd < now;

    // Only mark as missed if the week is past and not completed
    isMissed = isWeekPast && !isWeekCompleted && !beforeCreation;
  } else {
    isMissed = isPast && !isCompleted && !isPartial && !beforeCreation;
  }

  // Check if this date is in a holiday period
  const taskIds = habit.tasks.map((t) => t.id);
  const isHoliday = HolidayModeService.isDateInAnyHoliday(date, allHolidays, habit.id, taskIds);

  // ✨ NEW MINIMALIST DESIGN
  // Determine background color and border
  let backgroundColor = 'transparent';
  let textColor = tw.color('slate-600');
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (beforeCreation) {
    textColor = tw.color('gray-300');
  } else if (isHoliday) {
    backgroundColor = '#fef3c7'; // amber-100
    textColor = '#d97706'; // amber-600
    if (isInHolidayStreak) {
      borderColor = '#f59e0b'; // amber-500
      borderWidth = 1.5;
    }
  } else if (isCompleted) {
    backgroundColor = theme.accent;
    textColor = '#ffffff';
    if (isInStreak) {
      borderColor = theme.accent;
      borderWidth = 1.5;
    }
  } else if (isPartial) {
    backgroundColor = theme.accent + '40';
    textColor = theme.accent;
  } else if (isMissed) {
    backgroundColor = '#fecaca'; // red-200
    textColor = '#dc2626'; // red-600
    if (isInMissedStreak) {
      borderColor = '#ef4444'; // red-500
      borderWidth = 1.5;
    }
  }

  return (
    <View style={tw`w-1/7 h-11 mb-1 items-center justify-center px-0.5`}>
      <Pressable
        onPress={() => onSelect(date)}
        style={({ pressed }) => [
          tw`items-center justify-center`,
          pressed && tw`opacity-70`
        ]}
        disabled={beforeCreation}
      >
        <View style={tw`relative`}>
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center`,
              {
                backgroundColor,
                borderWidth,
                borderColor,
              },
              isSelected && !beforeCreation && {
                borderWidth: 2,
                borderColor: theme.accent,
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
          >
            <Text
              style={[
                tw`text-base font-black`,
                { color: textColor },
                beforeCreation && tw`text-gray-300`,
              ]}
            >
              {date.getDate()}
            </Text>
          </View>

          {/* Flame icon for streak days */}
          {(isInStreak && isCompleted) && (
            <View
              style={[
                tw`absolute -top-1 -right-1 w-4 h-4 rounded-full items-center justify-center`,
                { backgroundColor: theme.accent }
              ]}
            >
              <Flame size={10} color="#ffffff" fill="#ffffff" />
            </View>
          )}
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
