// src/context/HabitContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Habit } from '../types';
import { useAuth } from './AuthContext';
import { HabitService } from '../services/habitService';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { useStats } from './StatsContext';
import { supabase } from '@/lib/supabase';
import { getTodayString } from '@/utils/dateHelpers';
import { NotificationService } from '@/services/notificationService';
import { NotificationScheduleService } from '@/services/notificationScheduleService';
import Logger from '@/utils/logger';

interface ToggleTaskResult {
  success: boolean;
  xpEarned: number;
  allTasksComplete: boolean;
  milestoneReached?: string;
  streakUpdated?: number;
  alreadyEarnedXP?: boolean;
  completedTasks?: string[];
}

interface HabitContextType {
  habits: Habit[];
  loading: boolean;
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  toggleTask: (habitId: string, date: string, taskId: string) => Promise<ToggleTaskResult | undefined>;
  toggleHabitDay: (habitId: string, date: string) => Promise<void>;
  refreshHabits: () => Promise<void>;
  updateHabitNotification: (habitId: string, enabled: boolean, time?: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { refreshStats } = useStats();

  // ============================================================================
  // LOAD HABITS
  // ============================================================================

  const loadHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedHabits = await HabitService.fetchHabits(user.id);
      setHabits(fetchedHabits);
    } catch (error: any) {
      Logger.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load habits when user logs in
  useEffect(() => {
    if (user) {
      loadHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  // Subscribe to XP updates
  useEffect(() => {
    const subscription = supabase
      .channel('xp_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        () => {
          refreshStats(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ============================================================================
  // HABIT CRUD OPERATIONS
  // ============================================================================

  const refreshHabits = useCallback(async () => {
    await loadHabits();
  }, [user]);

  // In src/context/HabitContext.tsx, update the addHabit function:

  const addHabit = useCallback(
    async (habitData: Habit | Partial<Habit>) => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create habits');
        return;
      }

      try {
        setLoading(true);

        const newHabit: Habit = {
          id: habitData.id || Date.now().toString(), // ⚠️ Temporary - will be replaced by database UUID
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

        // ✅ Create in database FIRST to get the real UUID
        const createdHabit = await HabitService.createHabit(newHabit, user.id);

        // ✅ NOW schedule notifications with the real UUID from database
        if (createdHabit.notifications && createdHabit.notificationTime) {
          // Schedule local device notifications
          // await NotificationService.scheduleSmartHabitNotifications(createdHabit, user.id);

          // Save to database for backend notifications
          const timeWithSeconds = createdHabit.notificationTime.includes(':00:') ? createdHabit.notificationTime : `${createdHabit.notificationTime}:00`;

          await NotificationScheduleService.scheduleHabitNotification(
            createdHabit.id, // ✅ Use the real UUID from database
            user.id,
            timeWithSeconds,
            true
          );
        }

        // Add to local state
        setHabits([createdHabit, ...habits]);
      } catch (error: any) {
        Logger.error('Error adding habit:', error);

        if (error.code === '42501') {
          Alert.alert('Permission Error', 'Unable to create habit. Please ensure you are logged in.');
        } else if (error.message?.includes('user_id')) {
          Alert.alert('Authentication Error', 'Please log out and log back in.');
        } else {
          Alert.alert('Error', error.message || 'Failed to create habit. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [user, habits]
  );

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
      Logger.error('Error updating habit notification:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
      if (!user) return;

      try {
        // Update in database first
        await HabitService.updateHabit(habitId, user.id, updates);

        // Then update local state
        setHabits(habits.map((habit) => (habit.id === habitId ? { ...habit, ...updates } : habit)));
      } catch (error: any) {
        Logger.error('Error updating habit:', error);
        Alert.alert('Error', 'Failed to update habit');
        // Reload habits to get correct state
        await loadHabits();
      }
    },
    [user, habits]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;

      try {
        setLoading(true);

        // Delete from database first
        await HabitService.deleteHabit(habitId, user.id);

        // Then remove from local state
        setHabits(habits.filter((h) => h.id !== habitId));
      } catch (error: any) {
        Logger.error('Error deleting habit:', error);
        Alert.alert('Error', 'Failed to delete habit');
        // Reload habits to restore state
        await loadHabits();
      } finally {
        setLoading(false);
      }
    },
    [user, habits]
  );

  // ============================================================================
  // TASK OPERATIONS - CLEAN BACKEND SYNC
  // ============================================================================

  const toggleTask = useCallback(
    async (habitId: string, date: string, taskId: string): Promise<ToggleTaskResult | undefined> => {
      if (!user) return;

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      try {
        // Call backend - this handles ALL logic including XP, streaks, etc.
        const result = await HabitService.toggleTask(habitId, user.id, date, taskId);

        if (!result.success) {
          throw new Error('Failed to update task');
        }

        // Update progression if streak changed
        if (result.streakUpdated !== undefined) {
          await HabitProgressionService.updateProgression(habitId, user.id, {
            overrideStreak: result.streakUpdated,
            allTasksCompleted: result.allTasksComplete,
          });

          // Check for milestone unlocks
          const milestoneRes = await HabitProgressionService.checkMilestoneUnlock(habitId, user.id, {
            overrideStreak: result.streakUpdated,
          });

          if (milestoneRes.unlocked) {
            Alert.alert('🎉 Milestone Reached!', `You've unlocked: ${milestoneRes.unlocked.title}`);
          }
        }

        // Update local state with backend truth
        const actualCompletedTasks = Array.isArray(result.completedTasks) ? result.completedTasks : [];
        const actualAllCompleted = result.allTasksComplete;

        const updatedCompletedDays = actualAllCompleted ? [...habit.completedDays, date].filter((v, i, a) => a.indexOf(v) === i).sort() : habit.completedDays.filter((d) => d !== date);

        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: {
                    ...h.dailyTasks,
                    [date]: {
                      completedTasks: actualCompletedTasks,
                      allCompleted: actualAllCompleted,
                    },
                  },
                  completedDays: updatedCompletedDays,
                  // ✅ ONLY update streak if backend explicitly returns a new value
                  ...(result.streakUpdated !== undefined && result.streakUpdated !== null
                    ? {
                        currentStreak: result.streakUpdated,
                        bestStreak: Math.max(h.bestStreak, result.streakUpdated),
                      }
                    : {}),
                }
              : h
          )
        );

        // Refresh global stats
        await refreshStats(true);

        return result;
      } catch (error) {
        Logger.error('Error toggling task:', error);
        Alert.alert('Error', 'Failed to update task');

        // Reload habits to get correct state from backend
        await loadHabits();
      }
    },
    [user, habits, refreshStats]
  );

  const toggleHabitDay = useCallback(
    async (habitId: string, date: string) => {
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
        Logger.error('Error toggling habit day:', error);
        Alert.alert('Error', 'Failed to update habit');
        await loadHabits();
      }
    },
    [user, habits]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = useMemo(
    () => ({
      habits,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleTask,
      toggleHabitDay,
      refreshHabits,
      updateHabitNotification,
    }),
    [habits, loading, addHabit, updateHabit, deleteHabit, toggleTask, toggleHabitDay, refreshHabits, updateHabitNotification]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
