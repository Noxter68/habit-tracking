// src/utils/statsUtils.ts
import { Habit } from '../types/habit';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, format } from 'date-fns';

export interface Stats {
  currentMaxStreak: number;
  bestOverallStreak: number;
  totalCompletions: number;
  perfectDays: number;
  consistency: number;
  todayCompleted: number;
  totalActiveHabits: number;
  weeklyAverage: number;
  buildingHabits: number;
  quittingHabits: number;
  longestHabit: Habit | null;
}

export const calculateStats = (habits: Habit[], period: 'week' | 'month' | 'all'): Stats => {
  if (habits.length === 0) {
    return {
      currentMaxStreak: 0,
      bestOverallStreak: 0,
      totalCompletions: 0,
      perfectDays: 0,
      consistency: 0,
      todayCompleted: 0,
      totalActiveHabits: 0,
      weeklyAverage: 0,
      buildingHabits: 0,
      quittingHabits: 0,
      longestHabit: null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateRange = getDateRangeForPeriod(period);

  // Calculate current max streak and best overall streak across all habits
  let currentMaxStreak = 0;
  let bestOverallStreak = 0;
  let longestHabit: Habit | null = null;
  let longestStreak = 0;

  habits.forEach((habit) => {
    const currentStreak = calculateCurrentStreak(habit, today);
    const bestStreak = calculateBestStreak(habit, dateRange);

    // Track the current maximum streak among all habits
    if (currentStreak > currentMaxStreak) {
      currentMaxStreak = currentStreak;
    }

    // Track the best streak for the selected period
    if (bestStreak > bestOverallStreak) {
      bestOverallStreak = bestStreak;
      longestHabit = habit;
      longestStreak = bestStreak;
    }
  });

  // Calculate total completions
  const totalCompletions = habits.reduce((sum, habit) => {
    return (
      sum +
      habit.completedDays.filter((date) => {
        if (period === 'all') return true;
        const completedDate = new Date(date);
        return isWithinInterval(completedDate, dateRange);
      }).length
    );
  }, 0);

  // Calculate perfect days (days where all active habits were completed)
  const perfectDays = calculatePerfectDays(habits, dateRange, period);

  // Calculate consistency
  const consistency = calculateConsistency(habits, dateRange, period);

  // Calculate today's progress
  const todayCompleted = habits.filter((habit) => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return habit.completedDays.includes(todayStr);
  }).length;

  // Count active habits
  const totalActiveHabits = habits.length;

  // Calculate weekly average
  const weeklyAverage = calculateWeeklyAverage(habits);

  // Count habit types
  const buildingHabits = habits.filter((h) => h.habitType === 'build').length;
  const quittingHabits = habits.filter((h) => h.habitType === 'quit').length;

  return {
    currentMaxStreak,
    bestOverallStreak,
    totalCompletions,
    perfectDays,
    consistency,
    todayCompleted,
    totalActiveHabits,
    weeklyAverage,
    buildingHabits,
    quittingHabits,
    longestHabit,
  };
};

const calculateCurrentStreak = (habit: Habit, today: Date): number => {
  if (habit.completedDays.length === 0) return 0;

  // Sort completed days in descending order
  const sortedDays = [...habit.completedDays].map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  let checkDate = new Date(today);

  // Check if today is completed
  const todayStr = format(today, 'yyyy-MM-dd');
  if (!habit.completedDays.includes(todayStr)) {
    // If today isn't completed, start checking from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days backwards from today/yesterday
  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (habit.completedDays.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const calculateBestStreak = (habit: Habit, dateRange: { start: Date; end: Date }): number => {
  if (habit.completedDays.length === 0) return 0;

  // Filter and sort completed days within the date range
  const relevantDays = habit.completedDays
    .map((d) => new Date(d))
    .filter((date) => date >= dateRange.start && date <= dateRange.end)
    .sort((a, b) => a.getTime() - b.getTime());

  if (relevantDays.length === 0) return 0;

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < relevantDays.length; i++) {
    const dayDiff = differenceInDays(relevantDays[i], relevantDays[i - 1]);

    if (dayDiff === 1) {
      // Consecutive day
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      // Gap in dates, reset current streak
      currentStreak = 1;
    }
  }

  return bestStreak;
};

const calculatePerfectDays = (habits: Habit[], dateRange: { start: Date; end: Date }, period: string): number => {
  if (habits.length === 0) return 0;

  const allDates = new Set<string>();
  habits.forEach((habit) => {
    habit.completedDays.forEach((date) => {
      if (period === 'all') {
        allDates.add(date);
      } else {
        const completedDate = new Date(date);
        if (isWithinInterval(completedDate, dateRange)) {
          allDates.add(date);
        }
      }
    });
  });

  let perfectDays = 0;
  allDates.forEach((date) => {
    const completedCount = habits.filter((habit) => habit.completedDays.includes(date)).length;

    if (completedCount === habits.length) {
      perfectDays++;
    }
  });

  return perfectDays;
};

const calculateConsistency = (habits: Habit[], dateRange: { start: Date; end: Date }, period: string): number => {
  if (habits.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalCompletedDays = 0;
  let totalPossibleDays = 0;

  habits.forEach((habit) => {
    const habitCreated = new Date(habit.createdAt);
    habitCreated.setHours(0, 0, 0, 0);

    let effectiveStart: Date;
    let effectiveEnd: Date;

    if (period === 'all') {
      effectiveStart = habitCreated;
      effectiveEnd = today;
    } else {
      effectiveStart = habitCreated > dateRange.start ? habitCreated : dateRange.start;
      effectiveEnd = today < dateRange.end ? today : dateRange.end;
    }

    // Only count if the habit exists within the period
    if (effectiveStart <= effectiveEnd) {
      const possibleDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
      totalPossibleDays += possibleDays;

      // Count completed days within the effective range
      const completedInPeriod = habit.completedDays.filter((date) => {
        const completedDate = new Date(date);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= effectiveStart && completedDate <= effectiveEnd;
      }).length;

      totalCompletedDays += completedInPeriod;
    }
  });

  if (totalPossibleDays === 0) return 0;

  const consistency = (totalCompletedDays / totalPossibleDays) * 100;
  return Math.min(100, Math.round(consistency)); // Cap at 100%
};

const calculateWeeklyAverage = (habits: Habit[]): number => {
  if (habits.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  let totalCompletions = 0;
  let totalPossibleDays = 0;

  habits.forEach((habit) => {
    const habitCreated = new Date(habit.createdAt);
    habitCreated.setHours(0, 0, 0, 0);

    // Only count from when habit was created or start of week, whichever is later
    const effectiveStart = habitCreated > weekStart ? habitCreated : weekStart;
    // Only count up to today, not future days in the week
    const effectiveEnd = today < weekEnd ? today : weekEnd;

    // Only process if habit exists in this week
    if (effectiveStart <= effectiveEnd) {
      const possibleDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
      totalPossibleDays += possibleDays;

      const completionsThisWeek = habit.completedDays.filter((date) => {
        const completedDate = new Date(date);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= effectiveStart && completedDate <= effectiveEnd;
      }).length;

      totalCompletions += completionsThisWeek;
    }
  });

  if (totalPossibleDays === 0) return 0;

  const average = (totalCompletions / totalPossibleDays) * 100;
  return Math.min(100, Math.round(average)); // Cap at 100%
};

export const getDateRangeForPeriod = (period: 'week' | 'month' | 'all') => {
  const now = new Date();

  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'all':
      return {
        start: new Date(2020, 0, 1), // Arbitrary old date
        end: new Date(2030, 11, 31), // Arbitrary future date
      };
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};
