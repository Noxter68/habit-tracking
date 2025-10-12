// utils/premiumStatsCalculations.ts
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, subDays, differenceInDays } from 'date-fns';
import { Habit } from '@/types';

export type PeriodType = 'week' | 'month' | '4weeks';
export type ChartType = 'area' | 'stacked' | 'ring' | 'heatmap';

interface DailyStat {
  date: Date;
  dateStr: string;
  completed: number;
  missed: number;
  partial: number;
  total: number;
  completionRate: number;
  partialRate: number;
  progressRate: number; // New: progression based on habit count
}

interface StatsSummary {
  totalCompleted: number;
  totalMissed: number;
  totalPartial: number;
  overallTotal: number;
  averageCompletion: number;
  perfectDays: number;
  averageProgress: number; // New: average progression
}

export interface PremiumStats {
  dailyStats: DailyStat[];
  summary: StatsSummary;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface AreaChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color: (opacity?: number) => string;
    strokeWidth: number;
  }>;
  legend: string[];
}

interface StackedChartData {
  labels: string[];
  legend: string[];
  data: number[][];
  barColors: string[];
}

interface RingChartData {
  data: number[];
  colors: string[];
  summary: {
    percentage: number;
    completed: number;
    total: number;
    perfectDays: number;
  };
}

export type ChartData = AreaChartData | StackedChartData | RingChartData;

/**
 * Calculate premium statistics for habits over a specified period
 */
export const calculatePremiumStats = (habits: Habit[], period: PeriodType = 'week'): PremiumStats => {
  // Handle empty habits array
  if (!habits || habits.length === 0) {
    return {
      dailyStats: [],
      summary: {
        totalCompleted: 0,
        totalMissed: 0,
        totalPartial: 0,
        overallTotal: 0,
        averageCompletion: 0,
        perfectDays: 0,
        averageProgress: 0,
      },
    };
  }

  const now = new Date();
  let dateRange: DateRange;

  // Find the earliest habit creation date
  const earliestHabitDate = habits.reduce((earliest, habit) => {
    const habitDate = new Date(habit.createdAt);
    return habitDate < earliest ? habitDate : earliest;
  }, new Date(habits[0].createdAt));

  // Find the latest end date if any habit has one
  const latestEndDate = habits.reduce((latest, habit) => {
    if (habit.hasEndGoal && habit.endGoalDays) {
      const endDate = new Date(habit.createdAt);
      endDate.setDate(endDate.getDate() + habit.endGoalDays);
      return endDate > latest ? endDate : latest;
    }
    return latest;
  }, now);

  switch (period) {
    case 'week':
      dateRange = {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
      break;
    case 'month':
      dateRange = {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
      break;
    case '4weeks':
      dateRange = {
        start: subDays(now, 27), // 28 days including today
        end: now,
      };
      break;
    default:
      dateRange = {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
  }

  // Make sure we don't go before the earliest habit
  if (dateRange.start < earliestHabitDate) {
    dateRange.start = earliestHabitDate;
  }

  const days = eachDayOfInterval(dateRange);

  // Calculate stats for each day
  const dailyStats: DailyStat[] = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    let completed = 0;
    let missed = 0;
    let partial = 0;
    let activeHabitsCount = 0;

    habits.forEach((habit) => {
      const habitCreated = new Date(habit.createdAt);

      // Only count if habit existed on this day
      if (habitCreated <= day) {
        // Check if habit has ended
        if (habit.hasEndGoal && habit.endGoalDays) {
          const endDate = new Date(habitCreated);
          endDate.setDate(endDate.getDate() + habit.endGoalDays);
          if (day > endDate) {
            return; // Skip this habit as it has ended
          }
        }

        activeHabitsCount++;

        // Check if fully completed
        if (habit.completedDays && Array.isArray(habit.completedDays) && habit.completedDays.includes(dayStr)) {
          completed++;
        }
        // Check if partially completed (has some tasks done but not all)
        else if (habit.dailyTasks && habit.dailyTasks[dayStr]) {
          const dayData = habit.dailyTasks[dayStr];
          if (dayData.completedTasks && Array.isArray(dayData.completedTasks) && dayData.completedTasks.length > 0 && !dayData.allCompleted) {
            partial++;
          } else if (!dayData.allCompleted) {
            missed++;
          }
        }
        // No data for this day means missed
        else {
          missed++;
        }
      }
    });

    const total = activeHabitsCount;
    const progressRate = total > 0 ? ((completed + partial * 0.5) / total) * 100 : 0;

    return {
      date: day,
      dateStr: dayStr,
      completed,
      missed,
      partial,
      total,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      partialRate: total > 0 ? (partial / total) * 100 : 0,
      progressRate,
    };
  });

  // Calculate aggregated stats
  const totalCompleted = dailyStats.reduce((sum, day) => sum + day.completed, 0);
  const totalMissed = dailyStats.reduce((sum, day) => sum + day.missed, 0);
  const totalPartial = dailyStats.reduce((sum, day) => sum + day.partial, 0);
  const overallTotal = dailyStats.reduce((sum, day) => sum + day.total, 0);

  const averageProgress = dailyStats.length > 0 ? dailyStats.reduce((sum, day) => sum + day.progressRate, 0) / dailyStats.length : 0;

  return {
    dailyStats,
    summary: {
      totalCompleted,
      totalMissed,
      totalPartial,
      overallTotal,
      averageCompletion: overallTotal > 0 ? (totalCompleted / overallTotal) * 100 : 0,
      perfectDays: dailyStats.filter((d) => d.total > 0 && d.completed === d.total).length,
      averageProgress,
    },
  };
};

/**
 * Transform stats into chart-specific data format
 */
export const getChartData = (stats: PremiumStats, chartType: ChartType, period: PeriodType): ChartData | null => {
  const { dailyStats, summary } = stats;

  // Handle empty stats
  if (!dailyStats || dailyStats.length === 0) {
    return null;
  }

  switch (chartType) {
    case 'area':
      // For month and 4weeks, reduce data points for better visibility
      let dataPoints = dailyStats;
      let labels = dailyStats.map((s) => format(s.date, 'MMM d'));

      if (period === 'month' || period === '4weeks') {
        // Group by every 2-3 days for better readability
        const groupSize = period === 'month' ? 3 : 2;
        const groupedData: DailyStat[] = [];
        const groupedLabels: string[] = [];

        for (let i = 0; i < dailyStats.length; i += groupSize) {
          const group = dailyStats.slice(i, Math.min(i + groupSize, dailyStats.length));
          const avgProgress = group.reduce((sum, d) => sum + d.progressRate, 0) / group.length;

          groupedData.push({
            ...group[0],
            progressRate: avgProgress,
          });

          // Use first and last date of group for label
          if (group.length > 1) {
            groupedLabels.push(`${format(group[0].date, 'd')}-${format(group[group.length - 1].date, 'd')}`);
          } else {
            groupedLabels.push(format(group[0].date, 'd'));
          }
        }

        dataPoints = groupedData;
        labels = groupedLabels;
      }

      return {
        labels,
        datasets: [
          {
            data: dataPoints.map((s) => Math.round(s.progressRate)),
            color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`, // quartz-300
            strokeWidth: 2,
          },
        ],
        legend: ['Progress %'],
      } as AreaChartData;

    case 'stacked':
      // For stacked chart, show weekly summary for month/4weeks
      let stackedData = dailyStats;
      let stackedLabels = dailyStats.map((s) => format(s.date, 'EEE'));

      if (period === 'month' || period === '4weeks') {
        // Group by week
        const weeks: { [key: string]: DailyStat[] } = {};

        dailyStats.forEach((stat) => {
          const weekStart = startOfWeek(stat.date, { weekStartsOn: 1 });
          const weekKey = format(weekStart, 'MMM d');

          if (!weeks[weekKey]) {
            weeks[weekKey] = [];
          }
          weeks[weekKey].push(stat);
        });

        stackedData = [];
        stackedLabels = [];

        Object.entries(weeks).forEach(([weekLabel, weekDays]) => {
          const totalCompleted = weekDays.reduce((sum, d) => sum + d.completed, 0);
          const totalPartial = weekDays.reduce((sum, d) => sum + d.partial, 0);
          const totalMissed = weekDays.reduce((sum, d) => sum + d.missed, 0);

          stackedData.push({
            ...weekDays[0],
            completed: totalCompleted,
            partial: totalPartial,
            missed: totalMissed,
          });
          stackedLabels.push(weekLabel);
        });
      }

      return {
        labels: stackedLabels,
        legend: ['Completed', 'Partial', 'Missed'],
        data: stackedData.map((s) => [s.completed, s.partial, s.missed]),
        barColors: ['#9CA3AF', '#D1D5DB', '#E5E7EB'], // quartz shades
      } as StackedChartData;

    case 'ring':
      // Ensure we have valid data
      const percentage = Math.round(summary.averageProgress || 0);
      const completed = summary.totalCompleted || 0;
      const total = summary.overallTotal || 1; // Prevent division by zero
      const perfectDays = summary.perfectDays || 0;

      // Calculate progress data with safety checks
      const completionRatio = Math.min(completed / total, 1);
      const partialRatio = Math.min(summary.totalPartial / total, 1 - completionRatio);
      const missedRatio = Math.max(0, 1 - completionRatio - partialRatio);

      return {
        data: [completionRatio, partialRatio, missedRatio],
        colors: ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
        summary: {
          percentage,
          completed,
          total: Math.max(total, 1),
          perfectDays,
        },
      } as RingChartData;

    case 'heatmap':
      // Return heatmap specific data structure
      return {
        labels: dailyStats.map((s) => format(s.date, 'd')),
        data: [], // This will be filled by the component
        dailyStats: dailyStats, // Pass the raw stats for processing
        habitNames: [],
      } as any;
  }
};

/**
 * Calculate streak statistics for the period
 */
export const calculateStreakStats = (
  habits: Habit[],
  period: PeriodType
): {
  currentMaxStreak: number;
  averageStreak: number;
  habitsWithActiveStreaks: number;
} => {
  if (!habits || habits.length === 0) {
    return {
      currentMaxStreak: 0,
      averageStreak: 0,
      habitsWithActiveStreaks: 0,
    };
  }

  const streaks = habits.map((h) => h.currentStreak || 0);
  const activeStreaks = streaks.filter((s) => s > 0);

  return {
    currentMaxStreak: Math.max(...streaks, 0),
    averageStreak: activeStreaks.length > 0 ? activeStreaks.reduce((sum, s) => sum + s, 0) / activeStreaks.length : 0,
    habitsWithActiveStreaks: activeStreaks.length,
  };
};

/**
 * Get formatted date labels for charts
 */
export const getDateLabels = (dailyStats: DailyStat[], formatType: 'short' | 'long' = 'short'): string[] => {
  if (!dailyStats || dailyStats.length === 0) return [];

  const formatString = formatType === 'short' ? 'MMM d' : 'MMMM d, yyyy';
  return dailyStats.map((stat) => format(stat.date, formatString));
};

/**
 * Calculate completion trend (increasing, stable, decreasing)
 */
export const calculateTrend = (dailyStats: DailyStat[]): 'increasing' | 'stable' | 'decreasing' => {
  if (!dailyStats || dailyStats.length < 2) return 'stable';

  const halfPoint = Math.floor(dailyStats.length / 2);
  const firstHalf = dailyStats.slice(0, halfPoint);
  const secondHalf = dailyStats.slice(halfPoint);

  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + (d.progressRate || 0), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + (d.progressRate || 0), 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;

  if (difference > 5) return 'increasing';
  if (difference < -5) return 'decreasing';
  return 'stable';
};

/**
 * Get color based on completion percentage
 */
export const getCompletionColor = (percentage: number): string => {
  if (percentage >= 80) return '#6B7280'; // quartz-400 - excellent
  if (percentage >= 60) return '#9CA3AF'; // quartz-300 - good
  if (percentage >= 40) return '#D1D5DB'; // quartz-200 - fair
  return '#E5E7EB'; // quartz-100 - needs improvement
};
