// src/components/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { Habit } from '../types';

interface CalendarViewProps {
  habit: Habit;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ habit, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const animatedValue = useSharedValue(0);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => {
    animatedValue.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentMonth]);

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

  const isDateCompleted = (day: number) => {
    const dateString = getDateString(day);
    const dayTasks = habit.dailyTasks[dateString];

    if (dayTasks && habit.tasks.length > 0) {
      return dayTasks.completedTasks.length === habit.tasks.length;
    }

    return habit.completedDays.includes(dateString);
  };

  const isDatePartiallyCompleted = (day: number) => {
    const dateString = getDateString(day);
    const dayTasks = habit.dailyTasks[dateString];

    if (dayTasks && habit.tasks.length > 0) {
      const completedCount = dayTasks.completedTasks.length;
      return completedCount > 0 && completedCount < habit.tasks.length;
    }

    return false;
  };

  const getCompletionPercentage = (day: number) => {
    const dateString = getDateString(day);
    const dayTasks = habit.dailyTasks[dateString];

    if (dayTasks && habit.tasks.length > 0) {
      return (dayTasks.completedTasks.length / habit.tasks.length) * 100;
    }

    return isDateCompleted(day) ? 100 : 0;
  };

  const isDateMissed = (day: number) => {
    const dateString = getDateString(day);
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habitStart = new Date(habit.createdAt);
    habitStart.setHours(0, 0, 0, 0);

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
    animatedValue.value = 0;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    animatedValue.value = 0;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDatePress = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateSelect(newDate);
  };

  const calendarDays = generateCalendarDays();

  // Calculate month statistics
  const getMonthStats = () => {
    let completed = 0;
    let partial = 0;
    let missed = 0;
    let streak = 0;
    let maxStreak = 0;
    let currentStreak = 0;

    const daysInMonth = getDaysInMonth(currentMonth);
    for (let day = 1; day <= daysInMonth; day++) {
      if (isDateCompleted(day)) {
        completed++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (isDatePartiallyCompleted(day)) {
        partial++;
        currentStreak = 0;
      } else if (isDateMissed(day)) {
        missed++;
        currentStreak = 0;
      }
    }

    const total = completed + partial + missed;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, partial, missed, successRate, maxStreak };
  };

  const monthStats = getMonthStats();

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [
      {
        scale: interpolate(animatedValue.value, [0, 1], [0.95, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={[containerStyle]}>
      <View style={tw`bg-white rounded-2xl shadow-sm overflow-hidden`}>
        {/* Enhanced Header */}
        <LinearGradient colors={['#f8fafc', '#ffffff']} style={tw`px-5 py-4 border-b border-gray-100`}>
          <View style={tw`flex-row justify-between items-center`}>
            <Pressable onPress={handlePreviousMonth} style={({ pressed }) => [tw`p-2 rounded-xl`, pressed && tw`bg-gray-100`]}>
              <ChevronLeft size={20} color="#64748b" strokeWidth={2.5} />
            </Pressable>

            <View style={tw`items-center`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>{monthNames[currentMonth.getMonth()]}</Text>
              <Text style={tw`text-xs text-gray-500`}>{currentMonth.getFullYear()}</Text>
            </View>

            <Pressable onPress={handleNextMonth} style={({ pressed }) => [tw`p-2 rounded-xl`, pressed && tw`bg-gray-100`]}>
              <ChevronRight size={20} color="#64748b" strokeWidth={2.5} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Month Stats Bar */}
        <View style={tw`px-5 py-3 bg-gray-50/50`}>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-xl font-bold text-green-600`}>{monthStats.completed}</Text>
              <Text style={tw`text-xs text-gray-500`}>Complete</Text>
            </View>

            <View style={tw`w-px bg-gray-200 mx-3`} />

            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-xl font-bold text-amber-600`}>{monthStats.partial}</Text>
              <Text style={tw`text-xs text-gray-500`}>Partial</Text>
            </View>

            <View style={tw`w-px bg-gray-200 mx-3`} />

            <View style={tw`items-center flex-1`}>
              <Text style={tw`text-xl font-bold text-indigo-600`}>{monthStats.successRate}%</Text>
              <Text style={tw`text-xs text-gray-500`}>Success</Text>
            </View>

            <View style={tw`w-px bg-gray-200 mx-3`} />

            <View style={tw`items-center flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text style={tw`text-xl font-bold text-orange-600`}>{monthStats.maxStreak}</Text>
              </View>
              <Text style={tw`text-xs text-gray-500`}>Streak</Text>
            </View>
          </View>
        </View>

        <View style={tw`p-4`}>
          {/* Days of Week Header */}
          <View style={tw`flex-row mb-3`}>
            {daysOfWeek.map((day, index) => (
              <View key={`weekday-${index}`} style={tw`flex-1 items-center`}>
                <Text style={[tw`text-xs font-semibold`, index === 0 || index === 6 ? tw`text-gray-400` : tw`text-gray-600`]}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={tw`flex-row flex-wrap`}>
            {calendarDays.map((day, index) => (
              <View key={index} style={tw`w-1/7 p-0.5`}>
                {day ? (
                  <Pressable
                    onPress={() => handleDatePress(day)}
                    disabled={isFutureDate(day) || isBeforeHabitStart(day)}
                    style={({ pressed }) => [tw`aspect-square rounded-xl items-center justify-center relative`, pressed && !isFutureDate(day) && !isBeforeHabitStart(day) && tw`scale-95`]}
                  >
                    <Animated.View entering={FadeIn.delay(index * 10)} style={tw`absolute inset-0 rounded-xl overflow-hidden`}>
                      {/* Background based on completion status */}
                      {isDateCompleted(day) && <LinearGradient colors={habit.type === 'good' ? ['#10b981', '#059669'] : ['#22c55e', '#16a34a']} style={tw`absolute inset-0`} />}

                      {isDatePartiallyCompleted(day) && (
                        <View style={tw`absolute inset-0 bg-amber-100`}>
                          <View style={[tw`absolute bottom-0 left-0 right-0 bg-amber-400`, { height: `${getCompletionPercentage(day)}%` }]} />
                        </View>
                      )}

                      {isDateMissed(day) && <View style={tw`absolute inset-0 bg-red-50 border border-red-200`} />}

                      {isToday(day) && !isDateCompleted(day) && !isDatePartiallyCompleted(day) && <View style={tw`absolute inset-0 bg-indigo-100 border-2 border-indigo-400`} />}

                      {isSelected(day) && <View style={tw`absolute inset-0 border-2 border-gray-900 rounded-xl`} />}
                    </Animated.View>

                    {/* Day Number */}
                    <Text
                      style={[
                        tw`text-sm font-medium z-10`,
                        isDateCompleted(day)
                          ? tw`text-white`
                          : isDatePartiallyCompleted(day)
                          ? tw`text-amber-900`
                          : isDateMissed(day)
                          ? tw`text-red-600`
                          : isToday(day)
                          ? tw`text-indigo-700 font-bold`
                          : isFutureDate(day) || isBeforeHabitStart(day)
                          ? tw`text-gray-300`
                          : tw`text-gray-700`,
                      ]}
                    >
                      {day}
                    </Text>

                    {/* Completion Indicator */}
                    {isDateCompleted(day) && (
                      <View style={tw`absolute bottom-1`}>
                        <Text style={tw`text-xs text-white/80`}>✓</Text>
                      </View>
                    )}

                    {isDatePartiallyCompleted(day) && (
                      <View style={tw`absolute bottom-1`}>
                        <Text style={tw`text-xs text-amber-700 font-bold`}>{Math.round(getCompletionPercentage(day))}%</Text>
                      </View>
                    )}
                  </Pressable>
                ) : (
                  <View style={tw`aspect-square`} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Enhanced Legend */}
        <View style={tw`px-5 pb-4`}>
          <View style={tw`bg-gray-50 rounded-xl p-3`}>
            <View style={tw`flex-row flex-wrap gap-3`}>
              <View style={tw`flex-row items-center`}>
                <LinearGradient colors={['#10b981', '#059669']} style={tw`w-4 h-4 rounded`} />
                <Text style={tw`text-xs text-gray-600 ml-1.5 font-medium`}>Complete</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-4 h-4 rounded bg-amber-200 border border-amber-400`} />
                <Text style={tw`text-xs text-gray-600 ml-1.5 font-medium`}>Partial</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-4 h-4 rounded bg-red-50 border border-red-200`} />
                <Text style={tw`text-xs text-gray-600 ml-1.5 font-medium`}>Missed</Text>
              </View>

              <View style={tw`flex-row items-center`}>
                <View style={tw`w-4 h-4 rounded bg-indigo-100 border-2 border-indigo-400`} />
                <Text style={tw`text-xs text-gray-600 ml-1.5 font-medium`}>Today</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default CalendarView;
