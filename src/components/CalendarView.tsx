// src/components/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { Habit } from '../types';
import { HolidayPeriod } from '@/types/holiday.types';
import { HolidayModeService } from '@/services/holidayModeService';

interface CalendarViewProps {
  habit: Habit;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  allHolidays?: HolidayPeriod[];
}

// Helper to get local date string
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ habit, selectedDate, onDateSelect, allHolidays = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Update month when selected date changes
  useEffect(() => {
    if (selectedDate.getMonth() !== currentMonth.getMonth() || selectedDate.getFullYear() !== currentMonth.getFullYear()) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate]);

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDayStatus = (date: Date) => {
    const dateString = getLocalDateString(date);
    const dayTasks = habit.dailyTasks[dateString];

    if (!dayTasks) return { completed: false, partial: false, percentage: 0 };

    const totalTasks = habit.tasks.length;
    const completedTasks = dayTasks.completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completed: dayTasks.allCompleted,
      partial: completedTasks > 0 && !dayTasks.allCompleted,
      percentage,
    };
  };

  // Check if date is before habit creation
  const isBeforeHabitCreation = (date: Date) => {
    const creationDate = new Date(habit.createdAt);
    creationDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < creationDate;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
  };

  const days = getDaysInMonth();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={tw`bg-sand rounded-2xl shadow-sm p-4`}>
      {/* Month Navigation */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Pressable onPress={() => navigateMonth('prev')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-sand-100`]}>
          <ChevronLeft size={20} color="#6b7280" />
        </Pressable>

        <Text style={tw`text-base font-bold text-gray-800`}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

        <Pressable onPress={() => navigateMonth('next')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-sand-100`]}>
          <ChevronRight size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* Week Days Header */}
      <View style={tw`flex-row mb-2`}>
        {weekDays.map((day, index) => (
          <View key={index} style={tw`flex-1 items-center`}>
            <Text style={tw`text-xs font-medium text-sand-500`}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Days Grid */}
      <View style={tw`flex-row flex-wrap`}>
        {days.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={tw`w-1/7 h-10`} />;
          }

          const status = getDayStatus(date);
          const selected = isSelected(date);
          const today = isToday(date);
          const beforeCreation = isBeforeHabitCreation(date);

          //Vérifier si c'est un jour de holiday
          const taskIds = habit.tasks.map((t) => t.id);
          const isHoliday = HolidayModeService.isDateInAnyHoliday(date, allHolidays, habit.id, taskIds);
          // Check if day is in the past (missed) - only after habit creation
          const isPast = date < new Date() && !today;
          const isMissed = isPast && !status.completed && !status.partial && !beforeCreation && !isHoliday;

          // Determine if this day should be clickable
          const isClickable = !beforeCreation; // Only clickable after habit creation

          return (
            <Animated.View key={date.toISOString()} entering={FadeIn.delay(index * 10).duration(200)} style={tw`w-1/7 items-center mb-2`}>
              <Pressable
                onPress={() => !beforeCreation && onDateSelect(date)}
                disabled={beforeCreation}
                style={({ pressed }) => [
                  tw`w-10 h-10 rounded-xl items-center justify-center relative`,
                  status.completed && tw`bg-green-500`,
                  status.partial && tw`bg--stone-500`,
                  isMissed && tw`bg-red-50`,
                  beforeCreation && tw`opacity-30`,
                  selected && !status.completed && !status.partial && !isMissed && !beforeCreation && tw`bg-stone-100`,
                  today && !selected && tw`bg-sand-100`,
                  pressed && !beforeCreation && tw`opacity-80`,
                ]}
              >
                {/* Selection border with reduced opacity */}
                {selected && !beforeCreation && <View style={[tw`absolute inset-0 rounded-xl border-2`, { borderColor: 'rgba(99, 102, 241, 0.5)' }]} />}

                <Text
                  style={[
                    tw`text-base font-medium`,
                    status.completed || status.partial ? tw`text-white` : tw`text-sand-700`,
                    isMissed && tw`text-red-500`,
                    beforeCreation && tw`text-stone-300`,
                    selected && !status.completed && !status.partial && !isMissed && !beforeCreation && tw`text-stone-600`,
                  ]}
                >
                  {date.getDate()}
                </Text>

                {/* Today indicator */}
                {today && !status.completed && !status.partial && <View style={tw`absolute bottom-0.5 w-1 h-1 bg-sage-500 rounded-full`} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={tw`flex-row justify-center items-center mt-3 pt-3 border-t border-stone-100`}>
        <View style={tw`flex-row items-center mr-4`}>
          <View style={tw`w-3 h-3 bg-green-500 rounded`} />
          <Text style={tw`text-xs text-gray-600 ml-1`}>Complete</Text>
        </View>
        <View style={tw`flex-row items-center mr-4`}>
          <View style={tw`w-3 h-3 bg--stone-500 rounded`} />
          <Text style={tw`text-xs text-gray-600 ml-1`}>Partial</Text>
        </View>
        <View style={tw`flex-row items-center mr-4`}>
          <View style={tw`w-3 h-3 bg-red-50 rounded`} />
          <Text style={tw`text-xs text-gray-600 ml-1`}>Missed</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={[tw`w-3 h-3 rounded border`, { borderColor: 'rgba(99, 102, 241, 0.5)' }]} />
          <Text style={tw`text-xs text-gray-600 ml-1`}>Selected</Text>
        </View>
      </View>
    </View>
  );
};

export default CalendarView;
