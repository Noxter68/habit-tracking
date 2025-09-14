// src/context/HabitContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit } from '../types';
import { useAuth } from './AuthContext';
import { HabitService } from '../services/habitService';
import { supabase } from '../lib/supabase';

interface HabitContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleTask: (habitId: string, date: string, taskId: string) => Promise<void>;
  toggleHabitDay: (habitId: string, date: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  updateHabitNotification: (habitId: string, enabled: boolean, time?: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load habits when user logs in
  useEffect(() => {
    if (user) {
      loadHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedHabits = await HabitService.fetchHabits(user.id);
      setHabits(fetchedHabits);
    } catch (error: any) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  const refreshHabits = async () => {
    await loadHabits();
  };

  const addHabit = async (habitData: Habit | Partial<Habit>) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create habits');
      return;
    }

    try {
      setLoading(true);

      // If it's coming from HabitWizard, it already has the structure
      // Just ensure user_id is set for the database
      const newHabit: Habit = {
        id: habitData.id || Date.now().toString(),
        name: habitData.name || 'New Habit',
        type: habitData.type || 'build',
        category: habitData.category || 'health',
        tasks: habitData.tasks || [],
        dailyTasks: habitData.dailyTasks || {},
        frequency: habitData.frequency || 'daily',
        customDays: habitData.customDays || [],
        notifications: habitData.notifications !== undefined ? habitData.notifications : false,
        notificationTime: habitData.notificationTime || '09:00',
        hasEndGoal: habitData.hasEndGoal || false,
        endGoalDays: habitData.endGoalDays || 30,
        totalDays: habitData.totalDays || 61,
        currentStreak: habitData.currentStreak || 0,
        bestStreak: habitData.bestStreak || 0,
        completedDays: habitData.completedDays || [],
        createdAt: habitData.createdAt || new Date(),
      };

      // Create in database using HabitService
      const createdHabit = await HabitService.createHabit(newHabit, user.id);

      // Add to local state
      setHabits([createdHabit, ...habits]);

      // Store in AsyncStorage for offline support
      const storedHabits = await AsyncStorage.getItem('habits');
      const existingHabits = storedHabits ? JSON.parse(storedHabits) : [];
      await AsyncStorage.setItem('habits', JSON.stringify([createdHabit, ...existingHabits]));
    } catch (error: any) {
      console.error('Error adding habit:', error);

      // More specific error messages based on the error
      if (error.code === '42501') {
        Alert.alert('Permission Error', 'Unable to create habit. Please ensure you are logged in.');
      } else if (error.message?.includes('user_id')) {
        Alert.alert('Authentication Error', 'Please log out and log back in.');
      } else {
        Alert.alert('Error', error.message || 'Failed to create habit. Please try again.');
      }

      throw error; // Re-throw to let HabitWizard handle it
    } finally {
      setLoading(false);
    }
  };

  const updateHabitNotification = async (habitId: string, enabled: boolean, time?: string) => {
    if (!user) return;

    try {
      // Update in Supabase
      const { error } = await supabase
        .from('habits')
        .update({
          notifications: enabled,
          notification_time: time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setHabits((prevHabits) =>
        prevHabits.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                notifications: enabled,
                notificationTime: time,
              }
            : habit
        )
      );

      // Update AsyncStorage for offline support
      const storedHabits = await AsyncStorage.getItem('habits');
      if (storedHabits) {
        const parsedHabits = JSON.parse(storedHabits);
        const updatedHabits = parsedHabits.map((habit: Habit) =>
          habit.id === habitId
            ? {
                ...habit,
                notifications: enabled,
                notificationTime: time,
              }
            : habit
        );
        await AsyncStorage.setItem('habits', JSON.stringify(updatedHabits));
      }
    } catch (error) {
      console.error('Error updating habit notification:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    if (!user) return;

    try {
      // Update locally first for immediate feedback
      setHabits(habits.map((habit) => (habit.id === habitId ? { ...habit, ...updates } : habit)));

      // Update in database
      const { error } = await supabase
        .from('habits')
        .update({
          name: updates.name,
          type: updates.type,
          category: updates.category,
          tasks: updates.tasks,
          frequency: updates.frequency,
          custom_days: updates.customDays,
          notifications: updates.notifications,
          notification_time: updates.notificationTime,
          has_end_goal: updates.hasEndGoal,
          end_goal_days: updates.endGoalDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit');
      // Reload habits to get correct state
      await loadHabits();
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // Remove from local state immediately
      setHabits(habits.filter((h) => h.id !== habitId));

      // Delete from database
      await HabitService.deleteHabit(habitId, user.id);
    } catch (error: any) {
      console.error('Error deleting habit:', error);
      Alert.alert('Error', 'Failed to delete habit');
      // Reload habits to restore state
      await loadHabits();
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (habitId: string, date: string, taskId: string) => {
    if (!user) return;

    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const currentDayTasks = habit.dailyTasks[date] || {
        completedTasks: [],
        allCompleted: false,
      };

      const completedTasks = currentDayTasks.completedTasks.includes(taskId) ? currentDayTasks.completedTasks.filter((t) => t !== taskId) : [...currentDayTasks.completedTasks, taskId];

      const allCompleted = completedTasks.length === habit.tasks.length;

      // Update daily tasks
      const updatedDailyTasks = {
        ...habit.dailyTasks,
        [date]: {
          completedTasks,
          allCompleted,
        },
      };

      // Update completed days
      let completedDays = habit.completedDays.filter((d) => d !== date);
      if (allCompleted) {
        completedDays = [...completedDays, date].sort();
      }

      // Calculate streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let currentStreak = habit.currentStreak;
      if (date === today) {
        if (allCompleted) {
          const yesterdayCompleted = completedDays.includes(yesterday);
          if (yesterdayCompleted || currentStreak === 0) {
            currentStreak = currentStreak + 1;
          } else {
            currentStreak = 1;
          }
        } else {
          if (habit.completedDays.includes(today)) {
            currentStreak = Math.max(0, currentStreak - 1);
          }
        }
      }

      // Update local state immediately
      setHabits(
        habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                dailyTasks: updatedDailyTasks,
                completedDays,
                currentStreak,
                bestStreak: Math.max(currentStreak, h.bestStreak),
              }
            : h
        )
      );

      // Sync with database
      await HabitService.updateTaskCompletion(habitId, user.id, date, completedTasks, habit.tasks.length);
    } catch (error: any) {
      console.error('Error toggling task:', error);
      Alert.alert('Error', 'Failed to update task');
      await loadHabits();
    }
  };

  const toggleHabitDay = async (habitId: string, date: string) => {
    if (!user) return;

    try {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const completedDays = habit.completedDays.includes(date) ? habit.completedDays.filter((d) => d !== date) : [...habit.completedDays, date];

      // Also update daily tasks to reflect all tasks completed/uncompleted
      const allCompleted = completedDays.includes(date);
      const updatedDailyTasks = {
        ...habit.dailyTasks,
        [date]: {
          completedTasks: allCompleted ? habit.tasks : [],
          allCompleted,
        },
      };

      // Calculate streak
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let currentStreak = habit.currentStreak;
      if (completedDays.includes(today)) {
        if (completedDays.includes(yesterday) || currentStreak === 0) {
          currentStreak = currentStreak + 1;
        }
      } else {
        currentStreak = 0;
      }

      // Update local state
      setHabits(
        habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                dailyTasks: updatedDailyTasks,
                completedDays,
                currentStreak,
                bestStreak: Math.max(currentStreak, h.bestStreak),
              }
            : h
        )
      );

      // Sync with database
      await HabitService.updateTaskCompletion(habitId, user.id, date, allCompleted ? habit.tasks : [], habit.tasks.length);
    } catch (error: any) {
      console.error('Error toggling habit day:', error);
      Alert.alert('Error', 'Failed to update habit');
      await loadHabits();
    }
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        loading,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleTask,
        toggleHabitDay,
        refreshHabits,
        updateHabitNotification,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
