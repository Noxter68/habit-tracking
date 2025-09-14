// src/context/HabitContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Habit } from '../types';
import { useAuth } from './AuthContext';
import { HabitService } from '../services/habitService';

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
      Alert.alert('Error', 'Failed to load habits. Please check your connection.');
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

      const newHabit: Habit = {
        id: habitData.id || Date.now().toString(),
        name: habitData.name || 'New Habit',
        type: habitData.type || 'good',
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

      // Add to local state for immediate UI update
      setHabits([createdHabit, ...habits]);
    } catch (error: any) {
      console.error('Error adding habit:', error);

      if (error.code === '42501') {
        Alert.alert('Permission Error', 'Unable to create habit. Please ensure you are logged in.');
      } else if (error.message?.includes('user_id')) {
        Alert.alert('Authentication Error', 'Please log out and log back in.');
      } else {
        Alert.alert('Error', error.message || 'Failed to create habit. Please try again.');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateHabitNotification = async (habitId: string, enabled: boolean, time?: string) => {
    if (!user) return;

    try {
      await HabitService.updateHabitNotification(habitId, user.id, enabled, time);

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
    } catch (error) {
      console.error('Error updating habit notification:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Reload to ensure consistency
      await loadHabits();
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    if (!user) return;

    try {
      // Optimistically update UI
      setHabits(habits.map((habit) => (habit.id === habitId ? { ...habit, ...updates } : habit)));

      // Update in database
      await HabitService.updateHabit(habitId, user.id, updates);
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

      const allCompleted = completedTasks.length === habit.tasks.length && habit.tasks.length > 0;

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
      const { currentStreak, bestStreak } = await HabitService.calculateStreaks(habitId, user.id, date, allCompleted);

      // Update local state immediately for responsive UI
      setHabits(
        habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                dailyTasks: updatedDailyTasks,
                completedDays,
                currentStreak,
                bestStreak,
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

      const isCurrentlyCompleted = habit.completedDays.includes(date);
      const completedTasks = isCurrentlyCompleted ? [] : habit.tasks;
      const allCompleted = !isCurrentlyCompleted && habit.tasks.length > 0;

      // Update daily tasks
      const updatedDailyTasks = {
        ...habit.dailyTasks,
        [date]: {
          completedTasks,
          allCompleted,
        },
      };

      // Update completed days
      const completedDays = isCurrentlyCompleted ? habit.completedDays.filter((d) => d !== date) : [...habit.completedDays, date].sort();

      // Calculate streak
      const { currentStreak, bestStreak } = await HabitService.calculateStreaks(habitId, user.id, date, allCompleted);

      // Update local state
      setHabits(
        habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                dailyTasks: updatedDailyTasks,
                completedDays,
                currentStreak,
                bestStreak,
              }
            : h
        )
      );

      // Sync with database
      await HabitService.updateTaskCompletion(habitId, user.id, date, completedTasks, habit.tasks.length);
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
