// src/utils/stats/index.ts
// Point d'entrée du module de statistiques
// Réexporte toutes les fonctions et types pour un import simplifié

export {
  // Types
  type StatsPeriod,
  type DateRange,
  type TrendDirection,
  type StreakResult,

  // Date helpers
  getDateRangeForPeriod,
  getDatesForPeriod,
  getDaysInPeriod,
  isDateInRange,

  // Streak calculations
  calculateHabitStreak,
  calculateBestStreak,
  calculateGlobalStreak,

  // Trend calculations
  calculateTrend,
  calculateTrendValue,

  // Completion calculations
  calculateTodayCompleted,
  calculateWeekProgress,
  calculateConsistency,

  // Utilities
  formatPercentage,
  getCompletionColor,
} from './core';
