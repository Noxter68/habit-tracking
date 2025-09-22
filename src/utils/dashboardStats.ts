// src/utils/dashboardStats.ts
import { Habit } from '../types';

export interface DashboardStats {
  totalStreak: number;
  weekProgress: number;
  todayCompleted: number;
  totalActive: number;
  completionRate: number;
}

export const calculateTotalStreak = (habits: Habit[]): number => {
  return habits.reduce((max, habit) => Math.max(max, habit.currentStreak || 0), 0);
};

export const calculateWeekProgress = (habits: Habit[]): number => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const completions = last7Days.map((date) => habits.filter((h) => h.completedDays?.includes(date)).length);

  return Math.round((completions.reduce((a, b) => a + b, 0) / (habits.length * 7)) * 100) || 0;
};

export const calculateTodayCompleted = (habits: Habit[]): number => {
  const today = new Date().toISOString().split('T')[0];

  return habits.filter((habit) => {
    const todayTasks = habit.dailyTasks?.[today];
    return todayTasks?.allCompleted;
  }).length;
};

export const getDashboardStats = (habits: Habit[]): DashboardStats => {
  const todayCompleted = calculateTodayCompleted(habits);
  const completionRate = habits.length > 0 ? Math.round((todayCompleted / habits.length) * 100) : 0;

  return {
    totalStreak: calculateTotalStreak(habits),
    weekProgress: calculateWeekProgress(habits),
    todayCompleted,
    totalActive: habits.length,
    completionRate,
  };
};
