// src/utils/dashboardStats.ts
// Statistiques spécifiques au Dashboard
// Utilise le module core pour les calculs de base

import { Habit } from '../types';
import { getTodayString } from './dateHelpers';
import {
  calculateGlobalStreak,
  calculateWeekProgress as coreCalculateWeekProgress,
  calculateTodayCompleted as coreCalculateTodayCompleted
} from './stats/core';

export interface DashboardStats {
  currentStreak: number;
  totalStreak: number;
  weekProgress: number;
  weeklyProgress: number;
  todayCompleted: number;
  totalActive: number;
  completionRate: number;
}

/**
 * Calculate GLOBAL streak - consecutive days where ALL habits were completed
 * This is different from individual habit streaks
 * @deprecated Utiliser calculateGlobalStreak depuis '@/utils/stats' à la place
 */
export const calculateTotalStreak = (habits: Habit[]): number => {
  return calculateGlobalStreak(habits);
};

/**
 * @deprecated Utiliser calculateWeekProgress depuis '@/utils/stats' à la place
 */
export const calculateWeekProgress = (habits: Habit[]): number => {
  return coreCalculateWeekProgress(habits);
};

/**
 * @deprecated Utiliser calculateTodayCompleted depuis '@/utils/stats' à la place
 */
export const calculateTodayCompleted = (habits: Habit[]): number => {
  return coreCalculateTodayCompleted(habits);
};

export const getDashboardStats = (habits: Habit[] | null | undefined): DashboardStats => {
  // Ensure habits is a valid array
  const safeHabits = Array.isArray(habits) ? habits : [];

  const todayCompleted = calculateTodayCompleted(safeHabits);
  const completionRate = safeHabits.length > 0 ? Math.round((todayCompleted / safeHabits.length) * 100) : 0;

  const totalStreak = calculateTotalStreak(safeHabits);
  const weekProgress = calculateWeekProgress(safeHabits);

  return {
    currentStreak: totalStreak, // Add currentStreak for compatibility
    totalStreak: totalStreak,
    weekProgress: weekProgress,
    weeklyProgress: weekProgress, // Add weeklyProgress for compatibility
    todayCompleted,
    totalActive: safeHabits.length,
    completionRate,
  };
};

// Additional helper function to get stats for a specific habit
export const getHabitStats = (
  habit: Habit | null | undefined
): {
  isCompleteToday: boolean;
  completionPercentage: number;
  currentStreak: number;
} => {
  if (!habit) {
    return {
      isCompleteToday: false,
      completionPercentage: 0,
      currentStreak: 0,
    };
  }

  const today = getTodayString();

  // Check if completed today
  let isCompleteToday = false;
  let completedTasksCount = 0;
  let totalTasksCount = habit.tasks?.length || 0;

  if (habit.dailyTasks && habit.dailyTasks[today]) {
    const todayData = habit.dailyTasks[today];
    isCompleteToday = todayData.allCompleted || false;
    completedTasksCount = todayData.completedTasks?.length || 0;
  } else if (habit.completedDays && Array.isArray(habit.completedDays)) {
    isCompleteToday = habit.completedDays.includes(today);
    if (isCompleteToday) {
      completedTasksCount = totalTasksCount;
    }
  }

  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : isCompleteToday ? 100 : 0;

  return {
    isCompleteToday,
    completionPercentage,
    currentStreak: habit.currentStreak || 0,
  };
};

// Helper to calculate stats for the last N days
export const getRecentStats = (
  habits: Habit[] | null | undefined,
  days: number = 30
): {
  dates: string[];
  completions: number[];
  averageCompletion: number;
} => {
  const safeHabits = Array.isArray(habits) ? habits : [];

  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return getLocalDateString(date);
  });

  const completions = dates.map((date) => {
    if (safeHabits.length === 0) return 0;

    const completed = safeHabits.filter((habit) => {
      if (!habit) return false;

      // Check dailyTasks first
      if (habit.dailyTasks && habit.dailyTasks[date]) {
        return habit.dailyTasks[date].allCompleted;
      }

      // Fallback to completedDays
      if (habit.completedDays && Array.isArray(habit.completedDays)) {
        return habit.completedDays.includes(date);
      }

      return false;
    }).length;

    return safeHabits.length > 0 ? Math.round((completed / safeHabits.length) * 100) : 0;
  });

  const averageCompletion = completions.length > 0 ? Math.round(completions.reduce((a, b) => a + b, 0) / completions.length) : 0;

  return {
    dates,
    completions,
    averageCompletion,
  };
};
