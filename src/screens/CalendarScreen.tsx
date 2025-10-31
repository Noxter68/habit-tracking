// src/screens/CalendarScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from '../lib/tailwind';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { Habit } from '../types';
import { HolidayPeriod } from '../types/holiday.types';
import { RootStackParamList } from '../navigation/types';
import { HolidayModeService } from '../services/holidayModeService';
import { getTaskDetails } from '../utils/taskHelpers';
import { HapticFeedback } from '../utils/haptics';

import CalendarHeader from '../components/calendar/CalendarHeader';
import HabitSelector from '../components/calendar/HabitSelector';
import StatsBar from '../components/calendar/StatsBar';
import CalendarGrid from '../components/calendar/CalendarGrid';
import DateDetails from '../components/calendar/DateDetails';
import EmptyState from '../components/calendar/EmptyState';
import Logger from '@/utils/logger';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { habits, loading, refreshHabits } = useHabits();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [allHolidays, setAllHolidays] = useState<HolidayPeriod[]>([]);

  // Helper function to normalize habit tasks
  const normalizeHabitTasks = useCallback((habit: Habit): Habit => {
    if (!habit || !Array.isArray(habit.tasks) || habit.tasks.length === 0) {
      return habit;
    }

    // Check if tasks are strings (IDs) or already objects
    const firstTask = habit.tasks[0];
    if (typeof firstTask === 'string') {
      // Tasks are IDs, need to get full task details
      const normalizedTasks = getTaskDetails(habit.tasks, habit.category, habit.type);
      return {
        ...habit,
        tasks: normalizedTasks,
      };
    }

    // Tasks are already objects, return as is
    return habit;
  }, []);

  // ✅ FIX: Force reload holidays from database (no cache)
  const loadHoliday = useCallback(async () => {
    if (!user?.id) return;

    try {
      setHolidayLoading(true);

      // Fetch both active and all holidays in parallel - FRESH from DB
      const [activeHoliday, allHolidays] = await Promise.all([HolidayModeService.getActiveHoliday(user.id), HolidayModeService.getAllHolidays(user.id)]);

      Logger.debug('📅 Loaded holidays from database:', {
        active: activeHoliday?.id,
        total: allHolidays.length,
        allHolidays: allHolidays.map((h) => ({
          id: h.id,
          startDate: h.startDate,
          endDate: h.endDate,
          isActive: h.isActive,
          deactivatedAt: h.deactivatedAt,
        })),
      });

      setActiveHoliday(activeHoliday);
      setAllHolidays(allHolidays);
    } catch (error) {
      Logger.error('Error loading holidays:', error);
      setActiveHoliday(null);
      setAllHolidays([]);
    } finally {
      setHolidayLoading(false);
    }
  }, [user?.id]);

  // Initialize selected habit with normalized tasks
  useEffect(() => {
    if (habits.length > 0) {
      if (!selectedHabit) {
        // Set first habit with normalized tasks
        setSelectedHabit(normalizeHabitTasks(habits[0]));
      } else {
        // Find and update the selected habit
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        if (updatedHabit) {
          setSelectedHabit(normalizeHabitTasks(updatedHabit));
        } else {
          // If selected habit no longer exists, select first habit
          setSelectedHabit(normalizeHabitTasks(habits[0]));
        }
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits, normalizeHabitTasks]);

  // Load holiday on mount and when user changes
  useEffect(() => {
    loadHoliday();
  }, [loadHoliday]);

  // ✅ FIX: Refresh holiday data when screen comes into focus (clears cache)
  useFocusEffect(
    useCallback(() => {
      Logger.debug('🔄 Screen focused - reloading holidays');
      loadHoliday();
    }, [loadHoliday])
  );

  const handleCreateHabit = () => {
    HapticFeedback.light();
    navigation.navigate('HabitWizard');
  };

  const handleRefresh = async () => {
    HapticFeedback.light();
    Logger.debug('🔄 Manual refresh triggered');
    await Promise.all([refreshHabits(), loadHoliday()]);
  };

  // ✅ FIX: Proper month navigation using Date object methods
  const navigateMonth = (direction: 'prev' | 'next') => {
    HapticFeedback.light();
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev.getFullYear(), prev.getMonth(), 1);

      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }

      Logger.debug('📆 Month navigation:', {
        from: prev.toISOString().split('T')[0],
        to: newMonth.toISOString().split('T')[0],
        direction,
      });

      return newMonth;
    });
  };

  // Handle habit selection with task normalization
  const handleHabitSelect = useCallback(
    (habit: Habit) => {
      HapticFeedback.selection();
      setSelectedHabit(normalizeHabitTasks(habit));
    },
    [normalizeHabitTasks]
  );

  // Handle date selection with haptic
  const handleDateSelect = useCallback((date: Date) => {
    HapticFeedback.light();
    setSelectedDate(date);
  }, []);

  // Empty state
  if (habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50`}>
        <EmptyState onCreateHabit={handleCreateHabit} />
      </SafeAreaView>
    );
  }

  if (!selectedHabit) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <Text style={tw`text-sand-500`}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`}>
      <ScrollView
        style={tw`flex-1`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-20`}
        refreshControl={<RefreshControl refreshing={loading || holidayLoading} onRefresh={handleRefresh} tintColor={tw.color('sand-400')} />}
      >
        {/* Header */}
        <CalendarHeader habit={selectedHabit} />

        {/* Habit Selector */}
        <HabitSelector habits={habits} selectedHabit={selectedHabit} onSelectHabit={handleHabitSelect} />

        {/* Stats */}
        <StatsBar habit={selectedHabit} />

        {/* Calendar with Holiday Support */}
        <View style={tw`mx-5 mt-4 mb-6`}>
          <CalendarGrid
            habit={selectedHabit}
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            onNavigateMonth={navigateMonth}
            activeHoliday={activeHoliday}
            allHolidays={allHolidays}
          />

          {/* Selected Date Details with Holiday Info */}
          <DateDetails habit={selectedHabit} selectedDate={selectedDate} activeHoliday={activeHoliday} allHolidays={allHolidays} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CalendarScreen;
