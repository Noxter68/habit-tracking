// src/context/HabitContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Habit } from '../types';
import { useAuth } from './AuthContext';
import { HabitService } from '../services/habitService';
import { HabitProgressionService } from '@/services/habitProgressionService';

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
  processingTasks: Set<string>;
  xpEarnedTasks: Set<string>;
  checkTaskXPStatus: (habitId: string, date: string, taskId: string) => Promise<boolean>;
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
  const [processingTasks, setProcessingTasks] = useState<Set<string>>(new Set());
  const [xpEarnedTasks, setXpEarnedTasks] = useState<Set<string>>(new Set());

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

  const refreshHabits = useCallback(async () => {
    await loadHabits();
  }, [user]);

  const addHabit = useCallback(
    async (habitData: Habit | Partial<Habit>) => {
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
      console.error('Error updating habit notification:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      // Reload to ensure consistency
      await loadHabits();
    }
  };

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
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
    },
    [user, habits]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
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
    },
    [user, loadHabits]
  );

  // context/HabitContext.tsx - Fixed toggleTask method
  // context/HabitContext.tsx - Update the toggleTask method
  const toggleTask = useCallback(
    async (habitId: string, date: string, taskId: string) => {
      if (!user) return;

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const taskKey = `${habitId}-${date}-${taskId}`;

      // Check if already processing
      if (processingTasks.has(taskKey)) {
        console.log('Task already being processed');
        return;
      }

      const currentDayTasks = habit.dailyTasks[date] || {
        completedTasks: [],
        allCompleted: false,
      };

      setProcessingTasks((prev) => new Set(prev).add(taskKey));

      try {
        // 1. Optimistic update (keep your existing code)
        const isCurrentlyCompleted = currentDayTasks.completedTasks.includes(taskId);
        const optimisticCompletedTasks = isCurrentlyCompleted ? currentDayTasks.completedTasks.filter((t) => t !== taskId) : [...currentDayTasks.completedTasks, taskId];

        const optimisticAllCompleted = optimisticCompletedTasks.length === habit.tasks.length && habit.tasks.length > 0;

        // Update UI immediately
        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: {
                    ...h.dailyTasks,
                    [date]: {
                      completedTasks: optimisticCompletedTasks,
                      allCompleted: optimisticAllCompleted,
                    },
                  },
                }
              : h
          )
        );

        // 2. Call protected backend
        const result = await HabitService.toggleTask(habitId, user.id, date, taskId);

        // Update progression with the new streak
        if (result.streakUpdated !== undefined) {
          await HabitProgressionService.updateProgression(habitId, user.id, {
            overrideStreak: result.streakUpdated,
            allTasksCompleted: result.allTasksComplete,
          });

          // Check for milestone unlock
          const milestoneRes = await HabitProgressionService.checkMilestoneUnlock(habitId, user.id, {
            overrideStreak: result.streakUpdated,
          });

          if (milestoneRes.unlocked) {
            Alert.alert('🎉 Milestone Reached!', `Congratulations! You've unlocked: ${milestoneRes.unlocked.title}`);
          }
        }

        if (!result.success) {
          throw new Error('Failed to update task');
        }

        // 3. Update with REAL data from backend (THE KEY FIX)
        const actualCompletedTasks = result.completedTasks || optimisticCompletedTasks;
        const actualAllCompleted = result.allTasksComplete;

        // Update XP tracking if XP was earned
        if (result.xpEarned > 0) {
          setXpEarnedTasks((prev) => new Set(prev).add(taskKey));
          console.log(`Earned ${result.xpEarned} XP!`);
        }

        // 4. Update with backend data
        const updatedCompletedDays = actualAllCompleted ? [...habit.completedDays, date].filter((v, i, a) => a.indexOf(v) === i).sort() : habit.completedDays.filter((d) => d !== date);

        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: {
                    ...h.dailyTasks,
                    [date]: {
                      completedTasks: actualCompletedTasks, // Use backend data
                      allCompleted: actualAllCompleted, // Use backend data
                    },
                  },
                  completedDays: updatedCompletedDays,
                  currentStreak: result.streakUpdated ?? h.currentStreak,
                  bestStreak: Math.max(h.bestStreak, result.streakUpdated ?? h.currentStreak),
                }
              : h
          )
        );

        // 5. Show milestone feedback
        if (result.milestoneReached) {
          Alert.alert('🎉 Milestone Reached!', `Congratulations! You've unlocked: ${result.milestoneReached}`);
        }

        return result;
      } catch (error) {
        console.error('Error toggling task:', error);

        // Revert optimistic update
        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: {
                    ...h.dailyTasks,
                    [date]: currentDayTasks,
                  },
                }
              : h
          )
        );

        Alert.alert('Error', 'Failed to update task');
      } finally {
        setProcessingTasks((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskKey);
          return newSet;
        });
      }
    },
    [user, habits, processingTasks]
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
        console.error('Error toggling habit day:', error);
        Alert.alert('Error', 'Failed to update habit');
        await loadHabits();
      }
    },
    [user, habits, loadHabits]
  );

  // Load XP status for today's tasks when habits load
  const loadXPStatus = useCallback(async () => {
    if (!user || habits.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const xpStatusSet = new Set<string>();

    // Check XP status for all tasks
    for (const habit of habits) {
      if (habit.tasks && habit.tasks.length > 0) {
        for (const task of habit.tasks) {
          const taskId = typeof task === 'string' ? task : task.id;
          const hasXP = await HabitService.hasEarnedXPToday(user.id, habit.id, taskId, today);

          if (hasXP) {
            const key = `${habit.id}-${today}-${taskId}`;
            xpStatusSet.add(key);
          }
        }
      }
    }

    setXpEarnedTasks(xpStatusSet);
  }, [user?.id, habits.length]);

  // Load XP status when habits change
  useEffect(() => {
    loadXPStatus();
  }, [loadXPStatus]); // Proper dependency

  const checkTaskXPStatus = useCallback(
    async (habitId: string, date: string, taskId: string): Promise<boolean> => {
      if (!user) return false;

      const key = `${habitId}-${date}-${taskId}`;

      // Check cache first
      if (xpEarnedTasks.has(key)) {
        return true;
      }

      // Check database
      const hasXP = await HabitService.hasEarnedXPToday(user.id, habitId, taskId, date);

      // Update cache if XP was earned
      if (hasXP) {
        setXpEarnedTasks((prev) => new Set(prev).add(key));
      }

      return hasXP;
    },
    [user, xpEarnedTasks]
  );

  const value = useMemo(
    () => ({
      habits,
      loading,
      processingTasks,
      xpEarnedTasks,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleTask,
      toggleHabitDay,
      refreshHabits,
      updateHabitNotification,
      checkTaskXPStatus,
    }),
    [habits, loading, processingTasks, xpEarnedTasks, addHabit, updateHabit, deleteHabit, toggleTask, toggleHabitDay, refreshHabits, updateHabitNotification, checkTaskXPStatus]
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
