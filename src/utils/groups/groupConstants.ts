/**
 * Constants pour le système de Group Habits
 * @module constants/groupConstants
 */

// ============================================
// XP SYSTEM
// ============================================

export const GROUP_XP = {
  /** XP gagné par complétion d'une tâche */
  PER_TASK: 10,

  /** Bonus XP quand toutes les tâches du jour sont complétées */
  DAILY_BONUS: 50,

  /** Bonus XP le samedi si toute la semaine est validée */
  WEEKLY_BONUS: 200,
} as const;

// ============================================
// TIER SYSTEM
// ============================================

export interface GroupTierConfig {
  tier: number;
  name: string;
  minXP: number;
  maxXP: number;
  estimatedDays: number;
  themeKey: string;
}

export interface GroupTierThresholds {
  tier: number;
  minXP: number;
  maxXP: number;
  estimatedDays: number;
}

export const GROUP_TIERS: Record<number, GroupTierConfig> = {
  1: {
    tier: 1,
    name: 'Crystal',
    minXP: 0,
    maxXP: 500,
    estimatedDays: 10,
    themeKey: 'novice',
  },
  2: {
    tier: 2,
    name: 'Ruby',
    minXP: 500,
    maxXP: 2000,
    estimatedDays: 30,
    themeKey: 'risingHero',
  },
  3: {
    tier: 3,
    name: 'Amethyst',
    minXP: 2000,
    maxXP: 4000,
    estimatedDays: 45,
    themeKey: 'masteryAwakens',
  },
  4: {
    tier: 4,
    name: 'Jade',
    minXP: 4000,
    maxXP: 7000,
    estimatedDays: 60,
    themeKey: 'legendaryAscent',
  },
  5: {
    tier: 5,
    name: 'Topaz',
    minXP: 7000,
    maxXP: 11000,
    estimatedDays: 80,
    themeKey: 'epicMastery',
  },
  6: {
    tier: 6,
    name: 'Obsidian',
    minXP: 11000,
    maxXP: Infinity,
    estimatedDays: 100,
    themeKey: 'mythicGlory',
  },
} as const;

export const GROUP_TIER_THRESHOLDS: Record<number, GroupTierThresholds> = {
  1: { tier: 1, minXP: 0, maxXP: 500, estimatedDays: 10 },
  2: { tier: 2, minXP: 500, maxXP: 2000, estimatedDays: 30 },
  3: { tier: 3, minXP: 2000, maxXP: 4000, estimatedDays: 45 },
  4: { tier: 4, minXP: 4000, maxXP: 7000, estimatedDays: 60 },
  5: { tier: 5, minXP: 7000, maxXP: 11000, estimatedDays: 80 },
  6: { tier: 6, minXP: 11000, maxXP: Infinity, estimatedDays: 100 },
} as const;

export const GROUP_TIER_TO_ACHIEVEMENT_KEY: Record<number, string> = {
  1: 'novice',
  2: 'risingHero',
  3: 'masteryAwakens',
  4: 'legendaryAscent',
  5: 'epicMastery',
  6: 'mythicGlory',
} as const;

// ============================================
// VALIDATION RULES
// ============================================

export const GROUP_VALIDATION = {
  /** Taux de complétion minimum pour valider avec l'exception */
  MIN_COMPLETION_RATE: 0.5, // 50%

  /** Nombre maximum d'échecs autorisés avant de casser la streak */
  MAX_FAILED_DAYS: 1,

  /** Fenêtre en heures pour utiliser un streak saver */
  STREAK_SAVER_WINDOW_HOURS: 24,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calcule le tier actuel selon l'XP total
 */
export function calculateGroupTier(totalXP: number): number {
  if (totalXP < 500) return 1;
  if (totalXP < 2000) return 2;
  if (totalXP < 4000) return 3;
  if (totalXP < 7000) return 4;
  if (totalXP < 11000) return 5;
  return 6;
}

/**
 * Récupère la config complète d'un tier de groupe
 */
export function getGroupTierConfig(tier: number): GroupTierConfig {
  return GROUP_TIERS[tier] || GROUP_TIERS[1];
}

/**
 * Récupère la clé thème pour utiliser avec getAchievementTierTheme()
 * Usage: getAchievementTierTheme(getGroupTierThemeKey(currentTier))
 */
export function getGroupTierThemeKey(tier: number): string {
  return GROUP_TIERS[tier]?.themeKey || 'novice';
}

/**
 * Calcule la progression dans le tier actuel (0-100%)
 */
export function calculateTierProgress(totalXP: number, currentTier: number): number {
  const config = getGroupTierConfig(currentTier);

  if (currentTier === 6) {
    // Tier max - toujours 100%
    return 100;
  }

  const xpInTier = totalXP - config.minXP;
  const xpNeededForTier = config.maxXP - config.minXP;

  return Math.min(100, Math.max(0, (xpInTier / xpNeededForTier) * 100));
}

/**
 * Calcule l'XP restant avant le prochain tier
 */
export function getXPToNextTier(totalXP: number, currentTier: number): number {
  if (currentTier === 6) return 0; // Déjà au tier max

  const config = getGroupTierConfig(currentTier);
  return Math.max(0, config.maxXP - totalXP);
}

/**
 * Formate le nom du tier
 */
export function formatGroupTierName(tier: number): string {
  const config = getGroupTierConfig(tier);
  return config.name;
}

/**
 * Vérifie si une journée est validée selon les règles
 */
export function isDayValidated(completionRate: number, failedDaysCount: number): boolean {
  // 100% de complétion = toujours validé
  if (completionRate >= 1.0) return true;

  // 50%+ et premier échec = validé avec exception
  if (completionRate >= GROUP_VALIDATION.MIN_COMPLETION_RATE && failedDaysCount === 0) {
    return true;
  }

  // Sinon échec
  return false;
}

/**
 * Calcule l'XP total pour un jour donné
 */
export function calculateDailyXP(completedTasks: number, isPerfectDay: boolean): number {
  const taskXP = completedTasks * GROUP_XP.PER_TASK;
  const bonus = isPerfectDay ? GROUP_XP.DAILY_BONUS : 0;
  return taskXP + bonus;
}

/**
 * Détermine si le streak saver est encore utilisable
 */
export function canUseStreakSaver(missedDate: Date): boolean {
  const now = new Date();
  const hoursSinceMiss = (now.getTime() - missedDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceMiss <= GROUP_VALIDATION.STREAK_SAVER_WINDOW_HOURS;
}

/**
 * Formate un message de raison XP
 */
export function formatXPReason(reason: 'task_completion' | 'daily_bonus' | 'weekly_bonus' | 'tier_upgrade'): string {
  const messages = {
    task_completion: 'Complétion de tâches',
    daily_bonus: 'Bonus journalier 🎉',
    weekly_bonus: 'Bonus hebdomadaire 🏆',
    tier_upgrade: 'Nouveau tier atteint! 🎊',
  };
  return messages[reason];
}

/**
 * Calcule le taux de complétion requis pour valider
 */
export function getRequiredCompletionRate(failedDaysCount: number): number {
  // Si c'est le premier échec, 50% suffit
  if (failedDaysCount === 0) {
    return GROUP_VALIDATION.MIN_COMPLETION_RATE;
  }
  // Sinon, il faut 100%
  return 1.0;
}

// ============================================
// FREQUENCY TYPES
// ============================================

export type GroupHabitFrequency = 'daily' | 'weekly';

export const FREQUENCY_LABELS: Record<GroupHabitFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
} as const;

export const FREQUENCY_EMOJIS: Record<GroupHabitFrequency, string> = {
  daily: '📅',
  weekly: '📆',
} as const;

// ============================================
// LIMITS
// ============================================

export const GROUP_LIMITS = {
  /** Nombre max de membres par groupe */
  MAX_MEMBERS: 10,

  /** Nombre min de membres pour créer un groupe */
  MIN_MEMBERS: 2,

  /** Nombre max d'habitudes par groupe (premium) */
  MAX_HABITS_PREMIUM: Infinity,

  /** Nombre max d'habitudes par groupe (free) */
  MAX_HABITS_FREE: 5,

  /** Durée max d'une habitude en minutes */
  MAX_DURATION_MINUTES: 240,
} as const;

// ============================================
// COLORS
// ============================================

export const GROUP_COLORS = {
  // Succès / Validation
  success: '#10B981', // green-500
  successBg: '#D1FAE5', // green-100

  // Avertissement (exception utilisée)
  warning: '#F59E0B', // yellow-500
  warningBg: '#FEF3C7', // yellow-100

  // Échec
  danger: '#EF4444', // red-500
  dangerBg: '#FEE2E2', // red-100

  // Neutre
  neutral: '#6B7280', // gray-500
  neutralBg: '#F3F4F6', // gray-100

  // Streak
  streak: '#F97316', // orange-500
  streakBg: '#FFEDD5', // orange-100

  // XP
  xp: '#8B5CF6', // purple-500
  xpBg: '#EDE9FE', // purple-100
} as const;

// ============================================
// MESSAGES
// ============================================

export const GROUP_MESSAGES = {
  streakSaved: (days: number) => `Streak sauvée ! Restaurée à ${days} jour${days > 1 ? 's' : ''} 🛡️`,

  tierUpgrade: (oldTier: number, newTier: number) => {
    const newTierName = formatGroupTierName(newTier);
    return `Niveau supérieur ! Tier ${oldTier} → ${newTierName} (Tier ${newTier})`;
  },

  weeklyBonus: 'Bonus hebdomadaire ! Toute la semaine complétée 🎉',

  dailyBonus: 'Bonus journalier ! Toutes les tâches complétées ✨',

  exceptionUsed: 'Exception utilisée (50%+). Prochain échec cassera la streak ⚠️',

  streakBroken: 'Streak perdue... Recommencez à zéro 💔',

  noStreakSavers: 'Aucun streak saver disponible',

  streakSaverTooLate: 'Trop tard ! Utilisable uniquement dans les 24h',
} as const;

// ============================================
// ANALYTICS EVENTS (pour tracking)
// ============================================

export const GROUP_ANALYTICS_EVENTS = {
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  GROUP_LEFT: 'group_left',
  HABIT_CREATED: 'group_habit_created',
  HABIT_COMPLETED: 'group_habit_completed',
  DAY_VALIDATED: 'group_day_validated',
  STREAK_BROKEN: 'group_streak_broken',
  STREAK_SAVED: 'group_streak_saved',
  TIER_UPGRADED: 'group_tier_upgraded',
  WEEKLY_BONUS: 'group_weekly_bonus',
} as const;

// ============================================
// EXPORT DEFAULT
// ============================================

export default {
  XP: GROUP_XP,
  TIERS: GROUP_TIERS,
  VALIDATION: GROUP_VALIDATION,
  LIMITS: GROUP_LIMITS,
  COLORS: GROUP_COLORS,
  MESSAGES: GROUP_MESSAGES,
  ANALYTICS: GROUP_ANALYTICS_EVENTS,

  // Helper functions
  calculateTier: calculateGroupTier,
  getTierConfig: getGroupTierConfig,
  getTierThemeKey: getGroupTierThemeKey,
  calculateTierProgress,
  getXPToNextTier,
  formatTierName: formatGroupTierName,
  isDayValidated,
  calculateDailyXP,
  canUseStreakSaver,
  formatXPReason,
  getRequiredCompletionRate,
} as const;
