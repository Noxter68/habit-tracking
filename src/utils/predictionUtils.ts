// src/utils/predictionUtils.ts
import { Habit } from '@/types';
import { differenceInDays, parseISO, addDays } from 'date-fns';

export interface PredictionResult {
  successRate: number; // 0-100
  status: 'excellent' | 'onTrack' | 'needsFocus' | 'atRisk';
  completedDays: number;
  requiredDays: number;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  predictedCompletion: number; // 0-100
  canStillSucceed: boolean;
  bufferDays: number; // How many days can be missed
  suggestedPace: string;
  trend: 'improving' | 'steady' | 'declining';
  endDate: Date; // Calculated end date
}

export interface PredictionTheme {
  gradient: string[];
  accent: string;
  backgroundGradient: string[];
  label: string;
  message: string;
}

/**
 * Calculate the end date for a habit based on created_at + total_days
 */
export const calculateHabitEndDate = (habit: Habit): Date => {
  const createdAt = new Date(habit.createdAt);
  // Handle both camelCase and snake_case
  const totalDays = habit.totalDays || (habit as any).total_days || 61;
  return addDays(createdAt, totalDays);
};

/**
 * Calculate success prediction for a habit
 */
export const calculatePrediction = (habit: Habit): PredictionResult => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day

  const createdAt = new Date(habit.createdAt);
  createdAt.setHours(0, 0, 0, 0); // Normalize to start of day

  // Calculate total days from habit (handle both camelCase and snake_case, default 61)
  const totalDays = habit.totalDays || (habit as any).total_days || 61;

  // Calculate days elapsed since creation
  // differenceInDays gives 0 if same day, so we add 1 to make it inclusive (Day 1, not Day 0)
  const daysDiff = differenceInDays(now, createdAt);
  const daysElapsed = daysDiff + 1; // Day 1 is the creation day
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  // Calculate required days based on frequency
  const requiredDays = calculateRequiredDays(habit, totalDays);

  // Get completed days count
  const completedDays = habit.completedDays?.length || 0;

  // Calculate expected completions at this point (proportional to progress)
  const progressRatio = daysElapsed / totalDays;
  const expectedCompletions = Math.max(1, Math.round(progressRatio * requiredDays));

  // Calculate success rate (actual vs expected)
  const successRate = Math.min(100, Math.round((completedDays / expectedCompletions) * 100));

  // Calculate predicted final completion rate (if continues at current pace)
  const currentRate = daysElapsed > 0 ? completedDays / daysElapsed : 0;
  const projectedTotal = Math.round(currentRate * totalDays);
  const predictedCompletion = Math.min(100, Math.round((projectedTotal / requiredDays) * 100));

  // Determine if can still succeed (need 70% completion)
  const neededCompletions = Math.ceil(requiredDays * 0.7);
  const canStillSucceed = completedDays + daysRemaining >= neededCompletions;

  // Calculate buffer days (how many can be missed and still hit 70%)
  const bufferDays = Math.max(0, completedDays + daysRemaining - neededCompletions);

  // Determine status
  let status: PredictionResult['status'];
  if (successRate >= 85) status = 'excellent';
  else if (successRate >= 70) status = 'onTrack';
  else if (successRate >= 50) status = 'needsFocus';
  else status = 'atRisk';

  // Calculate trend based on recent performance
  const trend = calculateTrend(habit);

  // Generate suggested pace
  const daysNeeded = Math.max(0, neededCompletions - completedDays);
  const neededPerWeek = daysRemaining > 0 ? Math.min(7, Math.ceil((daysNeeded / daysRemaining) * 7)) : 0;

  const suggestedPace = neededPerWeek > 0 ? `Complete ${neededPerWeek} of next 7 days` : completedDays >= neededCompletions ? "You're on track! Keep it up" : 'Keep up your pace!';

  return {
    successRate,
    status,
    completedDays,
    requiredDays,
    daysElapsed,
    totalDays,
    daysRemaining,
    predictedCompletion,
    canStillSucceed,
    bufferDays,
    suggestedPace,
    trend,
    endDate: calculateHabitEndDate(habit),
  };
};

/**
 * Calculate required days based on habit frequency
 */
const calculateRequiredDays = (habit: Habit, totalDays: number): number => {
  switch (habit.frequency) {
    case 'daily':
      return totalDays;

    case 'weekly':
      // Assume 1 day per week
      return Math.floor(totalDays / 7);

    case 'monthly':
      // Assume 1 day per month
      return Math.floor(totalDays / 30);

    case 'custom':
      if (habit.customDays && habit.customDays.length > 0) {
        // Calculate based on custom days per week
        const daysPerWeek = habit.customDays.length;
        const totalWeeks = Math.ceil(totalDays / 7);
        return Math.floor(daysPerWeek * totalWeeks);
      }
      return totalDays;

    default:
      return totalDays;
  }
};

/**
 * Calculate trend based on recent performance
 */
const calculateTrend = (habit: Habit): 'improving' | 'steady' | 'declining' => {
  const completedDays = habit.completedDays || [];

  if (completedDays.length < 14) {
    return 'steady'; // Not enough data
  }

  const now = new Date();

  // Get completions from last 7 days
  const last7Days = completedDays.filter((day) => {
    const dayDate = parseISO(day);
    const diff = differenceInDays(now, dayDate);
    return diff >= 0 && diff < 7;
  }).length;

  // Get completions from 7-14 days ago
  const previous7Days = completedDays.filter((day) => {
    const dayDate = parseISO(day);
    const diff = differenceInDays(now, dayDate);
    return diff >= 7 && diff < 14;
  }).length;

  if (last7Days > previous7Days + 1) return 'improving';
  if (last7Days < previous7Days - 1) return 'declining';
  return 'steady';
};

/**
 * Get theme based on prediction status
 */
export const getPredictionTheme = (status: PredictionResult['status']): PredictionTheme => {
  const themes: Record<PredictionResult['status'], PredictionTheme> = {
    excellent: {
      gradient: ['#10b981', '#059669', '#047857'],
      accent: '#059669',
      backgroundGradient: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
      label: 'Excellent Track',
      message: "You're crushing it! 🌟",
    },
    onTrack: {
      gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
      accent: '#3b82f6',
      backgroundGradient: ['#eff6ff', '#dbeafe', '#bfdbfe'],
      label: 'On Track',
      message: 'Keep up the momentum',
    },
    needsFocus: {
      gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
      accent: '#7c3aed',
      backgroundGradient: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
      label: 'Needs Focus',
      message: 'A few strong days will help',
    },
    atRisk: {
      gradient: ['#ef4444', '#dc2626', '#991b1b'],
      accent: '#dc2626',
      backgroundGradient: ['#fef2f2', '#fee2e2', '#fecaca'],
      label: 'At Risk',
      message: "Let's get back on track",
    },
  };

  return themes[status];
};
