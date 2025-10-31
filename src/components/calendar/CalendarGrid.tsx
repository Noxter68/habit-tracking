// src/components/calendar/CalendarGrid.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight, Sun } from 'lucide-react-native';
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
  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={tw`bg-sand rounded-2xl p-4 shadow-sm`}>
      {/* Month Navigation */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Pressable onPress={() => onNavigateMonth('prev')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-sand-100`]}>
          <ChevronLeft size={20} color="#6b7280" />
        </Pressable>

        <Text style={tw`text-lg font-bold text-stone-800`}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

        <Pressable onPress={() => onNavigateMonth('next')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-sand-100`]}>
          <ChevronRight size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* Week Days Header */}
      <View style={tw`flex-row mb-2`}>
        {weekDays.map((day, index) => (
          <View key={index} style={tw`flex-1 items-center py-2`}>
            <Text style={tw`text-xs font-semibold text-sand-500`}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days */}
      <View style={tw`flex-row flex-wrap`}>
        {days.map((date, index) => (
          <CalendarDay key={`day-${index}`} date={date} habit={habit} selectedDate={selectedDate} onSelect={onSelectDate} theme={theme} activeHoliday={activeHoliday} allHolidays={allHolidays} />
        ))}
      </View>

      {/* Legend */}
      <View style={tw`flex-row justify-center items-center gap-3 mt-4 pt-4 border-t border-stone-100 flex-wrap`}>
        <LegendItem color={theme.accent} label="Complete" />
        <LegendItem color={theme.accent + '40'} label="Partial" />
        <LegendItem color="#fee2e2" label="Missed" />
        <LegendItem color="#fef3c7" label="Holiday" icon={<Sun size={10} color="#f59e0b" />} />
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
}> = ({ date, habit, selectedDate, onSelect, theme, activeHoliday = null, allHolidays = [] }) => {
  if (!date) {
    return <View style={tw`w-1/7 h-12`} />;
  }

  const dateString = getLocalDateString(date);
  const dayTasks = habit.dailyTasks[dateString];
  const totalTasks = habit.tasks?.length || 0;
  const completedTasks = dayTasks?.completedTasks?.length || 0;

  const isCompleted = dayTasks?.allCompleted || false;
  const isPartial = completedTasks > 0 && !isCompleted;
  const isSelected = isSameDay(date, selectedDate);
  const isCurrentDay = isToday(date);

  // ✅ FIX: Normalize both dates to midnight for accurate comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const creationDate = new Date(habit.createdAt);
  creationDate.setHours(0, 0, 0, 0);

  // Date is "before creation" only if it's strictly before the creation date
  // This means the creation date itself (Oct 29) will NOT be considered "before"
  const beforeCreation = checkDate.getTime() < creationDate.getTime();
  const isPast = date < new Date() && !isCurrentDay;
  const isMissed = isPast && !isCompleted && !isPartial && !beforeCreation;

  // ✅ NEW: Check if this date is in a holiday period
  const taskIds = habit.tasks.map((t) => t.id);
  const isHoliday = HolidayModeService.isDateInAnyHoliday(date, allHolidays, habit.id, taskIds);
  // Priority order: Holiday > Complete > Partial > Missed > Before Creation
  let backgroundColor = 'transparent';
  let textColor = tw.color('sand-700');
  let showIcon = false;

  if (beforeCreation) {
    textColor = tw.color('gray-300');
  } else if (isHoliday) {
    // 🏖️ HOLIDAY STATE - TOPAZ THEME
    backgroundColor = '#fef3c7'; // amber-100
    textColor = '#f59e0b'; // amber-500
    showIcon = true;
  } else if (isCompleted) {
    backgroundColor = theme.accent;
    textColor = '#ffffff';
  } else if (isPartial) {
    backgroundColor = theme.accent + '40';
    textColor = '#ffffff';
  } else if (isMissed) {
    backgroundColor = '#fee2e2'; // red-50
    textColor = '#ef4444'; // red-500
  }

  return (
    <Pressable onPress={() => onSelect(date)} style={({ pressed }) => [tw`w-1/7 h-12 items-center justify-center`, pressed && tw`opacity-70`]}>
      <View
        style={[
          tw`w-9 h-9 rounded-xl items-center justify-center relative`,
          { backgroundColor },
          isSelected && !beforeCreation && tw`border-2`,
          isSelected && { borderColor: theme.accent },
          isCurrentDay && !isSelected && tw`border`,
          isCurrentDay && { borderColor: theme.accent + '60' },
        ]}
      >
        {/* Holiday Icon - TOPAZ COLOR */}
        {showIcon && (
          <View style={tw`absolute -top-1 -right-1 bg-white rounded-full p-0.5`}>
            <Sun size={10} color="#f59e0b" strokeWidth={2.5} />
          </View>
        )}

        <Text style={[tw`text-sm font-medium`, { color: textColor }, beforeCreation && tw`text-gray-300`]}>{date.getDate()}</Text>
      </View>
    </Pressable>
  );
};

const LegendItem: React.FC<{
  color: string;
  label: string;
  icon?: React.ReactNode;
}> = ({ color, label, icon }) => (
  <View style={tw`flex-row items-center`}>
    {icon ? <View style={[tw`w-3 h-3 rounded items-center justify-center`, { backgroundColor: color }]}>{icon}</View> : <View style={[tw`w-3 h-3 rounded`, { backgroundColor: color }]} />}
    <Text style={tw`text-xs text-gray-600 ml-1.5`}>{label}</Text>
  </View>
);

export default CalendarGrid;
