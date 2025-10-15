import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';
import { getLocalDateString, getDaysInMonth, isToday, isSameDay } from '@/utils/dateHelpers';

interface CalendarGridProps {
  habit: Habit;
  currentMonth: Date;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ habit, currentMonth, selectedDate, onSelectDate, onNavigateMonth }) => {
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
          <CalendarDay key={`day-${index}`} date={date} habit={habit} selectedDate={selectedDate} onSelect={onSelectDate} theme={theme} />
        ))}
      </View>

      {/* Legend */}
      <View style={tw`flex-row justify-center items-center gap-4 mt-4 pt-4 border-t border-stone-100`}>
        <LegendItem color={theme.accent} label="Complete" />
        <LegendItem color={theme.accent + '40'} label="Partial" />
        <LegendItem color="#fee2e2" label="Missed" />
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
}> = ({ date, habit, selectedDate, onSelect, theme }) => {
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
  const beforeCreation = date < new Date(habit.createdAt);
  const isPast = date < new Date() && !isCurrentDay;
  const isMissed = isPast && !isCompleted && !isPartial && !beforeCreation;

  return (
    <Pressable onPress={() => onSelect(date)} style={({ pressed }) => [tw`w-1/7 h-12 items-center justify-center`, pressed && tw`opacity-70`]}>
      <View
        style={[
          tw`w-9 h-9 rounded-xl items-center justify-center`,
          isCompleted && { backgroundColor: theme.accent },
          isPartial && { backgroundColor: theme.accent + '40' },
          isMissed && tw`bg-red-50`,
          isSelected && !isCompleted && !isPartial && tw`border-2`,
          isSelected && { borderColor: theme.accent },
          isCurrentDay && tw`border`,
          isCurrentDay && { borderColor: theme.accent + '60' },
        ]}
      >
        <Text style={[tw`text-sm font-medium`, isCompleted ? tw`text-white` : tw`text-sand-700`, isMissed && tw`text-red-500`, beforeCreation && tw`text-gray-300`]}>{date.getDate()}</Text>
      </View>
    </Pressable>
  );
};

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={tw`flex-row items-center`}>
    <View style={[tw`w-3 h-3 rounded`, { backgroundColor: color }]} />
    <Text style={tw`text-xs text-gray-600 ml-1.5`}>{label}</Text>
  </View>
);

export default CalendarGrid;
