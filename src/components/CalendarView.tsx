// src/components/CalendarView.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '../lib/tailwind';
import { Habit } from '../types';

interface CalendarViewProps {
  habit: Habit;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ habit, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDateString = (day: number) => {
    return `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Check if ALL tasks are completed for a given day
  const isDateCompleted = (day: number) => {
    const dateString = getDateString(day);
    const dayTasks = habit.dailyTasks[dateString];

    // Check if all tasks are completed for this day
    if (dayTasks && habit.tasks.length > 0) {
      return dayTasks.completedTasks.length === habit.tasks.length;
    }

    // Fallback to completedDays for backward compatibility
    return habit.completedDays.includes(dateString);
  };

  // Check if date is partially completed (some but not all tasks)
  const isDatePartiallyCompleted = (day: number) => {
    const dateString = getDateString(day);
    const dayTasks = habit.dailyTasks[dateString];

    if (dayTasks && habit.tasks.length > 0) {
      const completedCount = dayTasks.completedTasks.length;
      return completedCount > 0 && completedCount < habit.tasks.length;
    }

    return false;
  };

  const isDateMissed = (day: number) => {
    const dateString = getDateString(day);
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habitStart = new Date(habit.createdAt);
    habitStart.setHours(0, 0, 0, 0);

    // Check if date is after habit creation, before or equal to today, and not completed
    return date >= habitStart && date < today && !isDateCompleted(day) && !isDatePartiallyCompleted(day);
  };

  const isFutureDate = (day: number) => {
    const dateString = getDateString(day);
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const isBeforeHabitStart = (day: number) => {
    const dateString = getDateString(day);
    const date = new Date(dateString);
    const habitStart = new Date(habit.createdAt);
    habitStart.setHours(0, 0, 0, 0);
    return date < habitStart;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDatePress = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(newDate);
  };

  const calendarDays = generateCalendarDays();

  // Calculate stats for the month based on actual task completion
  const getMonthStats = () => {
    let completed = 0;
    let partial = 0;
    let missed = 0;

    const daysInMonth = getDaysInMonth(currentMonth);
    for (let day = 1; day <= daysInMonth; day++) {
      if (isDateCompleted(day)) {
        completed++;
      } else if (isDatePartiallyCompleted(day)) {
        partial++;
      } else if (isDateMissed(day)) {
        missed++;
      }
    }

    return { completed, partial, missed };
  };

  const monthStats = getMonthStats();

  return (
    <View style={tw`bg-white rounded-xl p-4`}>
      {/* Month Navigation */}
      <View style={tw`flex-row justify-between items-center mb-4`}>
        <Pressable onPress={handlePreviousMonth} style={({ pressed }) => [tw`p-2`, pressed && tw`opacity-50`]}>
          <Text style={tw`text-2xl text-slate-600`}>‹</Text>
        </Pressable>

        <Text style={tw`text-lg font-semibold text-slate-800`}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </Text>

        <Pressable onPress={handleNextMonth} style={({ pressed }) => [tw`p-2`, pressed && tw`opacity-50`]}>
          <Text style={tw`text-2xl text-slate-600`}>›</Text>
        </Pressable>
      </View>

      {/* Days of Week Header */}
      <View style={tw`flex-row mb-2`}>
        {daysOfWeek.map((day) => (
          <View key={day} style={tw`flex-1 items-center`}>
            <Text style={tw`text-xs font-medium text-slate-500`}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={tw`flex-row flex-wrap`}>
        {calendarDays.map((day, index) => (
          <View key={index} style={tw`w-1/7 p-1`}>
            {day ? (
              <Pressable
                onPress={() => handleDatePress(day)}
                disabled={isFutureDate(day) || isBeforeHabitStart(day)}
                style={({ pressed }) => [
                  tw`aspect-square rounded-lg items-center justify-center`,
                  isDateCompleted(day) && (habit.type === 'good' ? tw`bg-teal-500` : tw`bg-green-500`),
                  isDatePartiallyCompleted(day) && tw`bg-amber-200 border border-amber-400`,
                  isDateMissed(day) && tw`bg-red-100 border border-red-300`,
                  isSelected(day) && tw`border-2 border-slate-700`,
                  isToday(day) && !isDateCompleted(day) && !isDatePartiallyCompleted(day) && !isDateMissed(day) && tw`bg-blue-100`,
                  (isFutureDate(day) || isBeforeHabitStart(day)) && tw`opacity-30`,
                  pressed && tw`opacity-70`,
                ]}
              >
                <Text
                  style={[
                    tw`text-sm`,
                    isDateCompleted(day)
                      ? tw`text-white font-bold`
                      : isDatePartiallyCompleted(day)
                      ? tw`text-amber-800 font-medium`
                      : isDateMissed(day)
                      ? tw`text-red-700 font-medium`
                      : isFutureDate(day) || isBeforeHabitStart(day)
                      ? tw`text-slate-400`
                      : tw`text-slate-700`,
                    isToday(day) && !isDateCompleted(day) && tw`font-bold`,
                  ]}
                >
                  {day}
                </Text>
                {isDateMissed(day) && (
                  <View style={tw`absolute bottom-0.5`}>
                    <Text style={tw`text-xs text-red-600`}>×</Text>
                  </View>
                )}
                {isDatePartiallyCompleted(day) && (
                  <View style={tw`absolute bottom-0.5`}>
                    <Text style={tw`text-xs text-amber-600`}>◐</Text>
                  </View>
                )}
              </Pressable>
            ) : (
              <View style={tw`aspect-square`} />
            )}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={tw`mt-4 pt-3 border-t border-slate-200`}>
        <View style={tw`flex-row flex-wrap gap-3`}>
          <View style={tw`flex-row items-center`}>
            <View style={[tw`w-4 h-4 rounded`, habit.type === 'good' ? tw`bg-teal-500` : tw`bg-green-500`]} />
            <Text style={tw`text-xs text-slate-600 ml-1`}>All Complete</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-4 h-4 rounded bg-amber-200 border border-amber-400`} />
            <Text style={tw`text-xs text-slate-600 ml-1`}>Partial</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-4 h-4 rounded bg-red-100 border border-red-300`} />
            <Text style={tw`text-xs text-slate-600 ml-1`}>Missed</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <View style={tw`w-4 h-4 rounded bg-blue-100`} />
            <Text style={tw`text-xs text-slate-600 ml-1`}>Today</Text>
          </View>
        </View>
      </View>

      {/* Month Stats */}
      <View style={tw`mt-3 pt-3 border-t border-slate-200 flex-row justify-around`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-2xl font-bold text-teal-600`}>{monthStats.completed}</Text>
          <Text style={tw`text-xs text-slate-600`}>Complete</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-2xl font-bold text-amber-600`}>{monthStats.partial}</Text>
          <Text style={tw`text-xs text-slate-600`}>Partial</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-2xl font-bold text-red-600`}>{monthStats.missed}</Text>
          <Text style={tw`text-xs text-slate-600`}>Missed</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-2xl font-bold text-slate-600`}>
            {monthStats.completed > 0 ? Math.round((monthStats.completed / (monthStats.completed + monthStats.partial + monthStats.missed)) * 100) : 0}%
          </Text>
          <Text style={tw`text-xs text-slate-600`}>Success</Text>
        </View>
      </View>
    </View>
  );
};

export default CalendarView;
