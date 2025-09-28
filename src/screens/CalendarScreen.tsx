// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import { Habit } from '../types';
import { HabitProgressionService, HabitTier } from '../services/habitProgressionService';
import { tierThemes } from '../utils/tierTheme';

// Helper function for date strings
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get gem icon based on tier
const getGemIcon = (tier: HabitTier) => {
  switch (tier) {
    case 'Ruby':
      return require('../../assets/interface/gems/ruby-gem.png');
    case 'Amethyst':
      return require('../../assets/interface/gems/amethyst-gem.png');
    case 'Crystal':
    default:
      return require('../../assets/interface/gems/crystal-gem.png');
  }
};

const CalendarScreen: React.FC = () => {
  const { habits, loading, refreshHabits } = useHabits();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    setSelectedDate(new Date());
    if (habits.length > 0) {
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        if (updatedHabit) {
          setSelectedHabit(updatedHabit);
        }
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits]);

  // Get tier for selected habit
  const getTierInfo = () => {
    if (!selectedHabit) return { tier: 'Crystal' as HabitTier, progress: 0 };
    const { tier, progress } = HabitProgressionService.calculateTierFromStreak(selectedHabit.currentStreak);
    return { tier: tier.name, progress };
  };

  const { tier, progress: tierProgress } = getTierInfo();
  const theme = tierThemes[tier];

  // Calendar functions
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
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
    if (!selectedHabit) return { completed: false, partial: false, percentage: 0 };

    const dateString = getLocalDateString(date);
    const dayTasks = selectedHabit.dailyTasks[dateString];

    if (!dayTasks) return { completed: false, partial: false, percentage: 0 };

    const totalTasks = selectedHabit.tasks?.length || 0;
    const completedTasks = dayTasks.completedTasks?.length || 0;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completed: dayTasks.allCompleted,
      partial: completedTasks > 0 && !dayTasks.allCompleted,
      percentage,
    };
  };

  const isBeforeHabitCreation = (date: Date) => {
    if (!selectedHabit) return true;
    const creationDate = new Date(selectedHabit.createdAt);
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

  // Empty state
  if (habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`flex-1 items-center justify-center px-8`}>
          <View style={tw`w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-4`}>
            <Plus size={32} color="#9ca3af" strokeWidth={1.5} />
          </View>
          <Text style={tw`text-xl font-bold text-gray-900 mb-2`}>No habits yet</Text>
          <Text style={tw`text-sm text-gray-500 text-center`}>Create your first habit to start tracking</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = getDaysInMonth();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor={theme.accent} />}>
        {/* Hero Header with Texture */}
        <ImageBackground source={theme.texture} style={tw`overflow-hidden`} imageStyle={tw`opacity-70`} resizeMode="cover">
          <LinearGradient colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-5 pt-6 pb-4`}>
            {/* Title with Gem */}
            <View style={tw`flex-row items-center justify-between mb-6`}>
              <View>
                <Text style={tw`text-2xl font-bold text-white mb-1`}>Calendar</Text>
                <Text style={tw`text-sm text-white/80`}>Track your habit journey</Text>
              </View>
              <Image source={getGemIcon(tier)} style={tw`w-16 h-16`} resizeMode="contain" />
            </View>

            {/* Habit Selector Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
              {habits.map((habit, index) => {
                const isActive = selectedHabit?.id === habit.id;
                const { tier: habitTier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);

                return (
                  <Animated.View key={habit.id} entering={FadeIn.delay(index * 50)}>
                    <Pressable onPress={() => setSelectedHabit(habit)} style={({ pressed }) => [tw`px-4 py-2.5 rounded-xl ${isActive ? 'bg-white/25' : 'bg-white/10'}`, pressed && tw`opacity-80`]}>
                      <Text style={tw`text-sm font-semibold ${isActive ? 'text-white' : 'text-white/80'}`}>{habit.name}</Text>
                      <View style={tw`flex-row items-center gap-1 mt-0.5`}>
                        <Text style={tw`text-xs ${isActive ? 'text-white/90' : 'text-white/70'}`}>{habit.currentStreak} day streak</Text>
                        <Text style={tw`text-[10px] ${isActive ? 'text-white/80' : 'text-white/60'} uppercase`}>• {habitTier.name}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </LinearGradient>
        </ImageBackground>

        {/* Stats Bar */}
        {selectedHabit && (
          <View style={tw`bg-white mx-5 mt-4 rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row justify-around`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-gray-900`}>{selectedHabit.currentStreak}</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>Current</Text>
              </View>
              <View style={tw`w-px bg-gray-200`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-gray-900`}>{selectedHabit.bestStreak}</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>Best</Text>
              </View>
              <View style={tw`w-px bg-gray-200`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-gray-900`}>{selectedHabit.completedDays.length}</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>Total</Text>
              </View>
              <View style={tw`w-px bg-gray-200`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold`} style={{ color: theme.accent }}>
                  {Math.round(tierProgress)}%
                </Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>Tier</Text>
              </View>
            </View>
          </View>
        )}

        {/* Calendar */}
        <View style={tw`mx-5 mt-4 mb-6`}>
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
            {/* Month Navigation */}
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <Pressable onPress={() => navigateMonth('prev')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-gray-100`]}>
                <ChevronLeft size={20} color="#6b7280" />
              </Pressable>

              <Text style={tw`text-lg font-bold text-gray-900`}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>

              <Pressable onPress={() => navigateMonth('next')} style={({ pressed }) => [tw`p-2 rounded-lg`, pressed && tw`bg-gray-100`]}>
                <ChevronRight size={20} color="#6b7280" />
              </Pressable>
            </View>

            {/* Week Days */}
            <View style={tw`flex-row mb-2`}>
              {weekDays.map((day, index) => (
                <View key={index} style={tw`flex-1 items-center py-2`}>
                  <Text style={tw`text-xs font-semibold text-gray-500`}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={tw`flex-row flex-wrap`}>
              {days.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={tw`w-1/7 h-12`} />;
                }

                const status = getDayStatus(date);
                const selected = isSelected(date);
                const today = isToday(date);
                const beforeCreation = isBeforeHabitCreation(date);
                const isPast = date < new Date() && !today;
                const isMissed = isPast && !status.completed && !status.partial && !beforeCreation;

                return (
                  <Pressable key={`day-${index}`} onPress={() => setSelectedDate(date)} style={({ pressed }) => [tw`w-1/7 h-12 items-center justify-center`, pressed && tw`opacity-70`]}>
                    <View
                      style={[
                        tw`w-9 h-9 rounded-xl items-center justify-center`,
                        status.completed && { backgroundColor: theme.accent },
                        status.partial && { backgroundColor: theme.accent + '40' },
                        isMissed && tw`bg-red-50`,
                        selected && !status.completed && !status.partial && tw`border-2`,
                        selected && { borderColor: theme.accent },
                        today && tw`border`,
                        today && { borderColor: theme.accent + '60' },
                      ]}
                    >
                      <Text style={[tw`text-sm font-medium`, status.completed ? tw`text-white` : tw`text-gray-700`, isMissed && tw`text-red-500`, beforeCreation && tw`text-gray-300`]}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Legend */}
            <View style={tw`flex-row justify-center items-center gap-4 mt-4 pt-4 border-t border-gray-100`}>
              <View style={tw`flex-row items-center`}>
                <View style={[tw`w-3 h-3 rounded`, { backgroundColor: theme.accent }]} />
                <Text style={tw`text-xs text-gray-600 ml-1.5`}>Complete</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <View style={[tw`w-3 h-3 rounded`, { backgroundColor: theme.accent + '40' }]} />
                <Text style={tw`text-xs text-gray-600 ml-1.5`}>Partial</Text>
              </View>
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-3 h-3 bg-red-50 rounded`} />
                <Text style={tw`text-xs text-gray-600 ml-1.5`}>Missed</Text>
              </View>
            </View>
          </View>

          {/* Selected Date Details */}
          {selectedHabit && selectedDate && (
            <Animated.View entering={FadeInDown.duration(300)} style={tw`bg-white rounded-2xl p-4 mt-4 shadow-sm`}>
              <Text style={tw`text-sm font-semibold text-gray-900 mb-3`}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>

              {(() => {
                const dateStatus = getDayStatus(selectedDate);
                const beforeCreation = isBeforeHabitCreation(selectedDate);

                if (beforeCreation) {
                  return <Text style={tw`text-sm text-gray-400`}>Habit not created yet</Text>;
                }

                if (dateStatus.completed) {
                  return (
                    <View>
                      <View style={tw`flex-row items-center`}>
                        <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: theme.accent }]} />
                        <Text style={tw`text-sm font-medium`} style={{ color: theme.accent }}>
                          Completed
                        </Text>
                      </View>
                      {selectedHabit.tasks?.length > 0 && <Text style={tw`text-xs text-gray-500 mt-1 ml-4`}>All tasks finished</Text>}
                    </View>
                  );
                }

                if (dateStatus.partial) {
                  return (
                    <View>
                      <View style={tw`flex-row items-center`}>
                        <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: theme.accent + '60' }]} />
                        <Text style={tw`text-sm font-medium text-gray-700`}>Partially Complete</Text>
                      </View>
                      <Text style={tw`text-xs text-gray-500 mt-1 ml-4`}>{dateStatus.percentage}% of tasks completed</Text>
                    </View>
                  );
                }

                const isPast = selectedDate < new Date() && !isToday(selectedDate);
                if (isPast) {
                  return (
                    <View style={tw`flex-row items-center`}>
                      <View style={tw`w-2 h-2 rounded-full bg-red-400 mr-2`} />
                      <Text style={tw`text-sm font-medium text-red-600`}>Missed</Text>
                    </View>
                  );
                }

                return <Text style={tw`text-sm text-gray-500`}>Not completed</Text>;
              })()}
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;
