// src/utils/stats/core.ts
// Module central pour les calculs de statistiques partagés
// Ce fichier contient les fonctions de base utilisées par tous les autres modules de stats

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  subDays,
  eachDayOfInterval
} from 'date-fns';
import { Habit } from '@/types';
import { getLocalDateString, getTodayString } from '../dateHelpers';

// NOTE: On utilise getLocalDateString() partout pour les comparaisons de dates
// au lieu de format() de date-fns, pour garantir la cohérence timezone
// dans toute l'application (support mondial)

// =============================================================================
// TYPES
// =============================================================================

/**
 * Types de périodes supportées pour les calculs de stats
 */
export type StatsPeriod = 'week' | 'month' | '4weeks' | 'all';

/**
 * Plage de dates pour les calculs
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Direction de la tendance
 */
export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

/**
 * Résultat du calcul de streak
 */
export interface StreakResult {
  current: number;
  best: number;
}

// =============================================================================
// DATE RANGE HELPERS
// =============================================================================

/**
 * Calcule la plage de dates pour une période donnée
 *
 * @param period - La période à calculer ('week', 'month', '4weeks', 'all')
 * @returns DateRange avec start et end
 *
 * @example
 * const range = getDateRangeForPeriod('week');
 * // { start: Date(lundi), end: Date(dimanche) }
 */
export const getDateRangeForPeriod = (period: StatsPeriod): DateRange => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

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

    case '4weeks':
      return {
        start: subDays(now, 27), // 28 jours incluant aujourd'hui
        end: now,
      };

    case 'all':
      return {
        start: new Date(2020, 0, 1), // Date arbitraire ancienne
        end: new Date(2030, 11, 31), // Date arbitraire future
      };

    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};

/**
 * Génère un tableau de dates pour une période
 *
 * @param period - La période
 * @returns Tableau de dates
 */
export const getDatesForPeriod = (period: StatsPeriod): Date[] => {
  const range = getDateRangeForPeriod(period);
  return eachDayOfInterval(range);
};

/**
 * Calcule le nombre de jours dans une période
 *
 * @param period - La période
 * @returns Nombre de jours
 */
export const getDaysInPeriod = (period: StatsPeriod): number => {
  const range = getDateRangeForPeriod(period);
  return differenceInDays(range.end, range.start) + 1;
};

// =============================================================================
// STREAK CALCULATIONS
// =============================================================================

/**
 * Calcule le streak actuel d'une habitude individuelle
 * Le streak compte les jours consécutifs de complétion jusqu'à aujourd'hui
 *
 * @param habit - L'habitude à analyser
 * @param referenceDate - Date de référence (par défaut aujourd'hui)
 * @returns Nombre de jours consécutifs
 *
 * @example
 * const streak = calculateHabitStreak(myHabit);
 * // 5 (jours consécutifs)
 */
export const calculateHabitStreak = (habit: Habit, referenceDate?: Date): number => {
  if (!habit.completedDays || habit.completedDays.length === 0) {
    return 0;
  }

  const today = referenceDate || new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Si aujourd'hui n'est pas complété, commencer à partir d'hier
  const todayStr = getLocalDateString(today);
  if (!habit.completedDays.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Compter les jours consécutifs en arrière
  while (true) {
    const dateStr = getLocalDateString(checkDate);
    if (habit.completedDays.includes(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calcule le meilleur streak d'une habitude dans une période donnée
 *
 * @param habit - L'habitude à analyser
 * @param dateRange - Plage de dates à considérer
 * @returns Meilleur streak dans la période
 */
export const calculateBestStreak = (habit: Habit, dateRange: DateRange): number => {
  if (!habit.completedDays || habit.completedDays.length === 0) {
    return 0;
  }

  // Filtrer et trier les jours complétés dans la période
  const relevantDays = habit.completedDays
    .map((d) => new Date(d))
    .filter((date) => date >= dateRange.start && date <= dateRange.end)
    .sort((a, b) => a.getTime() - b.getTime());

  if (relevantDays.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < relevantDays.length; i++) {
    const dayDiff = differenceInDays(relevantDays[i], relevantDays[i - 1]);

    if (dayDiff === 1) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
};

/**
 * Calcule le streak global - jours consécutifs où TOUTES les habitudes sont complétées
 * C'est différent du streak individuel d'une habitude
 *
 * @param habits - Liste des habitudes
 * @param maxDays - Nombre maximum de jours à vérifier (défaut: 365)
 * @returns Streak global
 *
 * @example
 * const globalStreak = calculateGlobalStreak(habits);
 * // 3 (jours où toutes les habitudes ont été complétées)
 */
export const calculateGlobalStreak = (habits: Habit[], maxDays: number = 365): number => {
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < maxDays; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = getLocalDateString(checkDate);

    // Vérifier si TOUTES les habitudes actives sont complétées ce jour
    const allCompletedOnDate = habits.every((habit) => {
      if (!habit) return false;

      // Vérifier d'abord dailyTasks (plus précis)
      if (habit.dailyTasks && typeof habit.dailyTasks === 'object') {
        const dayData = habit.dailyTasks[dateStr];
        if (dayData) {
          return dayData.allCompleted === true;
        }
      }

      // Fallback vers completedDays
      if (habit.completedDays && Array.isArray(habit.completedDays)) {
        return habit.completedDays.includes(dateStr);
      }

      return false;
    });

    if (allCompletedOnDate) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// =============================================================================
// TREND CALCULATIONS
// =============================================================================

/**
 * Calcule la tendance de progression en comparant deux moitiés de données
 *
 * @param values - Tableau de valeurs (pourcentages)
 * @param threshold - Seuil pour déterminer une tendance (défaut: 5)
 * @returns Direction de la tendance
 *
 * @example
 * const trend = calculateTrend([20, 30, 40, 50, 60, 70]);
 * // 'increasing'
 */
export const calculateTrend = (values: number[], threshold: number = 5): TrendDirection => {
  if (!values || values.length < 2) {
    return 'stable';
  }

  const midPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midPoint);
  const secondHalf = values.slice(midPoint);

  const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  const difference = secondHalfAvg - firstHalfAvg;

  if (difference > threshold) return 'increasing';
  if (difference < -threshold) return 'decreasing';
  return 'stable';
};

/**
 * Calcule la tendance numérique (différence en points de pourcentage)
 * Utile pour afficher "+5%" ou "-3%"
 *
 * @param values - Tableau de valeurs
 * @returns Différence numérique (cappée à ±100)
 */
export const calculateTrendValue = (values: number[]): number => {
  if (!values || values.length < 2) {
    return 0;
  }

  const midPoint = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, midPoint);
  const secondHalf = values.slice(midPoint);

  const firstHalfAvg = firstHalf.reduce((sum, v) => sum + v, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, v) => sum + v, 0) / secondHalf.length;

  // Si les deux moitiés ont une activité très faible, pas de tendance
  if (firstHalfAvg < 5 && secondHalfAvg < 5) {
    return 0;
  }

  let trend = Math.round(secondHalfAvg - firstHalfAvg);

  // Capper à ±100 pour un affichage raisonnable
  return Math.max(-100, Math.min(100, trend));
};

// =============================================================================
// COMPLETION CALCULATIONS
// =============================================================================

/**
 * Calcule le taux de complétion pour aujourd'hui
 *
 * @param habits - Liste des habitudes
 * @returns Nombre d'habitudes complétées aujourd'hui
 */
export const calculateTodayCompleted = (habits: Habit[]): number => {
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  const today = getTodayString();

  return habits.filter((habit) => {
    if (!habit) return false;

    // Vérifier dailyTasks en premier
    if (habit.dailyTasks && typeof habit.dailyTasks === 'object') {
      const todayTasks = habit.dailyTasks[today];
      return todayTasks?.allCompleted === true;
    }

    // Fallback vers completedDays
    if (habit.completedDays && Array.isArray(habit.completedDays)) {
      return habit.completedDays.includes(today);
    }

    return false;
  }).length;
};

/**
 * Calcule la progression sur les 7 derniers jours
 *
 * @param habits - Liste des habitudes
 * @returns Pourcentage de complétion sur la semaine
 */
export const calculateWeekProgress = (habits: Habit[]): number => {
  if (!Array.isArray(habits) || habits.length === 0) {
    return 0;
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return getLocalDateString(date);
  });

  const completions = last7Days.map((date) => {
    return habits.filter((h) => {
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

/**
 * Calcule la consistance (taux de complétion global)
 *
 * @param habits - Liste des habitudes
 * @param dateRange - Plage de dates
 * @returns Pourcentage de consistance
 */
export const calculateConsistency = (habits: Habit[], dateRange: DateRange): number => {
  if (!habits || habits.length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalCompletedDays = 0;
  let totalPossibleDays = 0;

  habits.forEach((habit) => {
    const habitCreated = new Date(habit.createdAt);
    habitCreated.setHours(0, 0, 0, 0);

    // Calculer la période effective pour cette habitude
    const effectiveStart = habitCreated > dateRange.start ? habitCreated : dateRange.start;
    const effectiveEnd = today < dateRange.end ? today : dateRange.end;

    if (effectiveStart <= effectiveEnd) {
      const possibleDays = differenceInDays(effectiveEnd, effectiveStart) + 1;
      totalPossibleDays += possibleDays;

      // Compter les jours complétés dans la période effective
      const completedInPeriod = habit.completedDays?.filter((date) => {
        const completedDate = new Date(date);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate >= effectiveStart && completedDate <= effectiveEnd;
      }).length || 0;

      totalCompletedDays += completedInPeriod;
    }
  });

  if (totalPossibleDays === 0) {
    return 0;
  }

  const consistency = (totalCompletedDays / totalPossibleDays) * 100;
  return Math.min(100, Math.round(consistency));
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formate un pourcentage pour l'affichage
 *
 * @param value - Valeur numérique
 * @returns Chaîne formatée avec %
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Détermine la couleur en fonction du pourcentage de complétion
 *
 * @param percentage - Pourcentage de complétion
 * @returns Code couleur hex
 */
export const getCompletionColor = (percentage: number): string => {
  if (percentage >= 80) return '#6B7280'; // Excellent
  if (percentage >= 60) return '#9CA3AF'; // Bon
  if (percentage >= 40) return '#D1D5DB'; // Moyen
  return '#E5E7EB'; // À améliorer
};

/**
 * Vérifie si une date est dans une plage donnée
 *
 * @param date - Date à vérifier
 * @param range - Plage de dates
 * @returns true si la date est dans la plage
 */
export const isDateInRange = (date: Date, range: DateRange): boolean => {
  return date >= range.start && date <= range.end;
};
