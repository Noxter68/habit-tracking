// src/utils/analyticsData.ts
import { Habit } from '@/types';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export interface DailyAnalyticsData {
  date: string;
  fullDate: string;
  value: number; // Completion percentage 0-100
  completedTasks: number;
  totalTasks: number;
  habits: string[];
}

/**
 * Calculate real analytics data from habits
 * Goes from earliest habit creation date to today
 */
export const calculateAnalyticsData = (habits: Habit[], selectedRange: 'week' | 'month' | '4weeks'): DailyAnalyticsData[] => {
  if (!habits || habits.length === 0) {
    return [];
  }

  const today = new Date();
  const days = selectedRange === 'week' ? 7 : selectedRange === 'month' ? 30 : 28;

  // Get the date range
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  return dateRange.map((date) => {
    const dateString = format(date, 'yyyy-MM-dd');

    let totalTasksForDay = 0;
    let completedTasksForDay = 0;
    const activeHabits: string[] = [];

    // Check each habit for this date
    habits.forEach((habit) => {
      const habitTotalTasks = habit.tasks?.length || 0;
      totalTasksForDay += habitTotalTasks;

      // Check if habit has data for this date
      const dayTasks = habit.dailyTasks?.[dateString];

      if (dayTasks) {
        const completedCount = dayTasks.completedTasks?.length || 0;
        completedTasksForDay += completedCount;

        if (completedCount > 0) {
          activeHabits.push(habit.name);
        }
      }
    });

    // Calculate completion percentage
    const completionPercentage = totalTasksForDay > 0 ? Math.round((completedTasksForDay / totalTasksForDay) * 100) : 0;

    return {
      date: format(date, 'MMM d'),
      fullDate: format(date, 'EEEE, MMM d'),
      value: completionPercentage,
      completedTasks: completedTasksForDay,
      totalTasks: totalTasksForDay,
      habits: activeHabits,
    };
  });
};

/**
 * Calculate summary statistics from habits
 */
export const calculateSummaryStats = (habits: Habit[], selectedRange: 'week' | 'month' | '4weeks') => {
  const analyticsData = calculateAnalyticsData(habits, selectedRange);

  if (analyticsData.length === 0) {
    return {
      averageCompletion: 0,
      bestDay: 'N/A',
      bestDayPercentage: 0,
      activeDays: 0,
      consistency: 'Low',
      trend: 0,
      highPerformanceDays: 0,
      moderatePerformanceDays: 0,
      lowPerformanceDays: 0,
      currentStreak: 0,
    };
  }

  // Average completion
  const totalCompletion = analyticsData.reduce((sum, day) => sum + day.value, 0);
  const averageCompletion = Math.round(totalCompletion / analyticsData.length);

  // Best day
  const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayTotals: { [key: string]: { sum: number; count: number } } = {};

  analyticsData.forEach((day, index) => {
    const date = subDays(new Date(), analyticsData.length - 1 - index);
    const dayName = dayMap[date.getDay()];

    if (!dayTotals[dayName]) {
      dayTotals[dayName] = { sum: 0, count: 0 };
    }
    dayTotals[dayName].sum += day.value;
    dayTotals[dayName].count += 1;
  });

  let bestDay = 'N/A';
  let bestDayPercentage = 0;
  Object.entries(dayTotals).forEach(([day, { sum, count }]) => {
    const avg = sum / count;
    if (avg > bestDayPercentage) {
      bestDayPercentage = avg;
      bestDay = day.slice(0, 3); // Mon, Tue, etc.
    }
  });

  // Active days (days with any completion)
  const activeDays = analyticsData.filter((day) => day.completedTasks > 0).length;

  // Consistency score
  const hasData = analyticsData.filter((day) => day.totalTasks > 0).length;
  const consistencyRate = hasData > 0 ? (activeDays / hasData) * 100 : 0;
  let consistency = 'Low';
  if (consistencyRate >= 80) consistency = 'High';
  else if (consistencyRate >= 50) consistency = 'Moderate';

  // Trend (compare first half vs second half) - IMPROVED CALCULATION
  const midPoint = Math.floor(analyticsData.length / 2);
  const firstHalf = analyticsData.slice(0, midPoint);
  const secondHalf = analyticsData.slice(midPoint);

  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;

  // Use absolute difference instead of percentage to avoid huge numbers with small base values
  // Cap at ±100% for display purposes
  let trend = Math.round(secondHalfAvg - firstHalfAvg);

  // If both halves have very low activity (< 5%), show 0 trend
  if (firstHalfAvg < 5 && secondHalfAvg < 5) {
    trend = 0;
  }

  // Cap trend at ±100 for reasonable display
  trend = Math.max(-100, Math.min(100, trend));

  // Performance breakdown
  const highPerformanceDays = analyticsData.filter((d) => d.value >= 70).length;
  const moderatePerformanceDays = analyticsData.filter((d) => d.value >= 40 && d.value < 70).length;
  const lowPerformanceDays = analyticsData.filter((d) => d.value < 40 && d.totalTasks > 0).length;

  const totalDaysWithData = highPerformanceDays + moderatePerformanceDays + lowPerformanceDays;

  // Current streak (consecutive days with 100% completion)
  let currentStreak = 0;
  for (let i = analyticsData.length - 1; i >= 0; i--) {
    if (analyticsData[i].value === 100) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    averageCompletion,
    bestDay,
    bestDayPercentage: Math.round(bestDayPercentage),
    activeDays,
    consistency,
    trend,
    highPerformanceDays: totalDaysWithData > 0 ? Math.round((highPerformanceDays / totalDaysWithData) * 100) : 0,
    moderatePerformanceDays: totalDaysWithData > 0 ? Math.round((moderatePerformanceDays / totalDaysWithData) * 100) : 0,
    lowPerformanceDays: totalDaysWithData > 0 ? Math.round((lowPerformanceDays / totalDaysWithData) * 100) : 0,
    currentStreak,
  };
};
