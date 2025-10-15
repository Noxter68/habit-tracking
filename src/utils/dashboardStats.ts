// src/utils/dashboardStats.ts
import { Habit } from '../types';

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
 */
export const calculateTotalStreak = (habits: Habit[]): number => {
  // Ensure habits is an array
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check backwards from today
  for (let i = 0; i < 365; i++) {
    // Max 365 days to prevent infinite loop
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    // Check if ALL active habits were completed on this date
    const allCompletedOnDate = habits.every((habit) => {
      if (!habit) return false;

      // Check dailyTasks first (more accurate)
      if (habit.dailyTasks && typeof habit.dailyTasks === 'object') {
        const dayData = habit.dailyTasks[dateStr];
        if (dayData) {
          return dayData.allCompleted === true;
        }
      }

      // Fallback to completedDays array
      if (habit.completedDays && Array.isArray(habit.completedDays)) {
        return habit.completedDays.includes(dateStr);
      }

      // If no data, treat as not completed
      return false;
    });

    if (allCompletedOnDate) {
      streak++;
    } else {
      // Stop at first day where not all habits were completed
      break;
    }
  }

  return streak;
};

export const calculateWeekProgress = (habits: Habit[]): number => {
  // Ensure habits is an array
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const completions = last7Days.map((date) => {
    return habits.filter((h) => {
      // Safe check for completedDays
      return h?.completedDays && Array.isArray(h.completedDays) && h.completedDays.includes(date);
    }).length;
  });

  const totalPossible = habits.length * 7;
  const totalCompleted = completions.reduce((a, b) => a + b, 0);

  if (totalPossible === 0) {
    return 0;
  }

  return Math.round((totalCompleted / totalPossible) * 100);
};

export const calculateTodayCompleted = (habits: Habit[]): number => {
  // Ensure habits is an array
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];

  return habits.filter((habit) => {
    if (!habit) return false;

    // Check if habit has dailyTasks
    if (habit.dailyTasks && typeof habit.dailyTasks === 'object') {
      const todayTasks = habit.dailyTasks[today];
      return todayTasks?.allCompleted === true;
    }

    // Fallback: check completedDays array
    if (habit.completedDays && Array.isArray(habit.completedDays)) {
      return habit.completedDays.includes(today);
    }

    return false;
  }).length;
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

  const today = new Date().toISOString().split('T')[0];

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
    return date.toISOString().split('T')[0];
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
