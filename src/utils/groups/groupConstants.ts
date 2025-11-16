// constants/groupConstants.ts
// Système de tiers basé sur le NIVEAU (pas l'XP) avec support i18n

import { getTranslatedGroupTier, type GroupTierTranslation } from '@/i18n/groupTiersTranslation';

/**
 * XP System - Pour progresser de niveau en niveau
 * Formule: xpForNextLevel = currentLevel * 100
 * Exemple: Niveau 5 → Besoin de 500 XP pour passer niveau 6
 */
export const GROUP_XP = {
  /** XP gagné par membre qui complète (+10 XP immédiat) */
  PER_MEMBER_COMPLETION: 10,

  /** Bonus XP à minuit si 100% complété */
  DAILY_BONUS_FULL: 50,

  /** Bonus XP à minuit si 50-99% + tolérance */
  DAILY_BONUS_REDUCED: 35,

  /** Bonus XP le samedi si toute la semaine validée */
  WEEKLY_BONUS: 200,

  /** Formule XP pour niveau suivant */
  XP_PER_LEVEL: (level: number) => level * 100,
} as const;

// ============================================
// TIER SYSTEM - Basé sur le NIVEAU
// ============================================

export interface GroupTierConfig {
  tier: number;
  name: string; // Nom technique (Crystal, Ruby, etc.) - ne change jamais
  minLevel: number;
  maxLevel: number | null; // null = tier max
  themeKey: string;
  icon: any; // require('path/to/icon.png')
  description: string; // Description par défaut (FR) - utilisée comme fallback
}

/**
 * ⚠️ IMPORTANT: Ce sont les données RAW (techniques)
 * Pour afficher les traductions, utilisez getTranslatedGroupTierConfig()
 *
 * Mapping NIVEAU → TIER
 * Les tiers se débloquent selon le niveau du groupe
 */
export const GROUP_TIERS_BY_LEVEL: Record<number, GroupTierConfig> = {
  1: {
    tier: 1,
    name: 'Crystal',
    minLevel: 1,
    maxLevel: 9,
    themeKey: 'novice',
    icon: require('../../../assets/groupHabit/tiers/group-tier-1.png'),
    description: 'Fondation cristalline', // Fallback FR
  },
  2: {
    tier: 2,
    name: 'Ruby',
    minLevel: 10,
    maxLevel: 19,
    themeKey: 'risingHero',
    icon: require('../../../assets/groupHabit/tiers/group-tier-2.png'),
    description: 'Passion rouge collective',
  },
  3: {
    tier: 3,
    name: 'Amethyst',
    minLevel: 20,
    maxLevel: 29,
    themeKey: 'masteryAwakens',
    icon: require('../../../assets/groupHabit/tiers/group-tier-3.png'),
    description: 'Synergie violette mystique',
  },
  4: {
    tier: 4,
    name: 'Jade',
    minLevel: 30,
    maxLevel: 39,
    themeKey: 'legendaryAscent',
    icon: require('../../../assets/groupHabit/tiers/group-tier-4.png'),
    description: 'Harmonie verte partagée',
  },
  5: {
    tier: 5,
    name: 'Topaz',
    minLevel: 40,
    maxLevel: 49,
    themeKey: 'epicMastery',
    icon: require('../../../assets/groupHabit/tiers/group-tier-5.png'),
    description: 'Excellence dorée en groupe',
  },
  6: {
    tier: 6,
    name: 'Obsidian',
    minLevel: 50,
    maxLevel: null, // Tier max
    themeKey: 'mythicGlory',
    icon: require('../../../assets/groupHabit/tiers/group-tier-6.png'),
    description: 'Maîtrise ultime collective',
  },
} as const;

// ============================================
// HELPER FUNCTIONS - TIER PAR NIVEAU
// ============================================

/**
 * Calcule le tier actuel selon le NIVEAU du groupe
 * @param level - Niveau actuel du groupe
 * @returns Tier number (1-6)
 */
export function calculateGroupTierFromLevel(level: number): number {
  if (level >= 50) return 6; // Obsidian
  if (level >= 40) return 5; // Topaz
  if (level >= 30) return 4; // Jade
  if (level >= 20) return 3; // Amethyst
  if (level >= 10) return 2; // Ruby
  return 1; // Crystal
}

/**
 * Récupère la config complète d'un tier (RAW - non traduite)
 * @param tier - Numéro du tier (1-6)
 */
export function getGroupTierConfig(tier: number): GroupTierConfig {
  return GROUP_TIERS_BY_LEVEL[tier] || GROUP_TIERS_BY_LEVEL[1];
}

/**
 * Récupère la config du tier selon le niveau (RAW - non traduite)
 * @param level - Niveau du groupe
 */
export function getGroupTierConfigByLevel(level: number): GroupTierConfig {
  const tier = calculateGroupTierFromLevel(level);
  return getGroupTierConfig(tier);
}

/**
 * ✨ NEW: Récupère la config du tier TRADUITE selon le niveau
 * @param level - Niveau du groupe
 * @param language - Langue ('en' ou 'fr')
 * @returns Config complète avec nom et description traduits
 */
export function getTranslatedGroupTierConfig(level: number, language: 'en' | 'fr'): GroupTierConfig & { translatedName: string; translatedDescription: string } {
  const tierConfig = getGroupTierConfigByLevel(level);
  const translation = getTranslatedGroupTier(tierConfig.name as any, language);

  return {
    ...tierConfig,
    translatedName: translation.name,
    translatedDescription: translation.description,
    // Garde aussi le name/description original pour compatibilité
    name: tierConfig.name,
    description: tierConfig.description,
  };
}

/**
 * ✨ NEW: Récupère UNIQUEMENT la traduction d'un tier
 * @param tier - Numéro du tier (1-6)
 * @param language - Langue ('en' ou 'fr')
 */
export function getGroupTierTranslation(tier: number, language: 'en' | 'fr'): GroupTierTranslation {
  const config = getGroupTierConfig(tier);
  return getTranslatedGroupTier(config.name as any, language);
}

/**
 * Récupère la clé thème pour utiliser avec getAchievementTierTheme()
 * Usage: getAchievementTierTheme(getGroupTierThemeKey(currentTier))
 */
export function getGroupTierThemeKey(tier: number): string {
  return GROUP_TIERS_BY_LEVEL[tier]?.themeKey || 'novice';
}

/**
 * Récupère le nom du tier pour utiliser avec getHabitTierTheme()
 * Usage: getHabitTierTheme(getGroupTierNameForTheme(currentLevel))
 * @param level - Niveau actuel du groupe
 * @returns Nom du tier compatible avec getHabitTierTheme (Crystal, Ruby, Amethyst, Jade, Topaz, Obsidian)
 */
export function getGroupTierNameForTheme(level: number): string {
  const tier = calculateGroupTierFromLevel(level);
  const config = getGroupTierConfig(tier);
  return config.name; // Returns: 'Crystal', 'Ruby', 'Amethyst', 'Jade', 'Topaz', 'Obsidian'
}

/**
 * Calcule le prochain tier et le niveau requis
 * @param currentLevel - Niveau actuel du groupe
 * @returns { nextTier, levelRequired } ou null si tier max atteint
 */
export function getNextTierInfo(currentLevel: number): {
  nextTier: number;
  levelRequired: number;
} | null {
  const currentTier = calculateGroupTierFromLevel(currentLevel);

  if (currentTier === 6) return null; // Déjà au tier max

  const nextTier = currentTier + 1;
  const nextTierConfig = getGroupTierConfig(nextTier);

  return {
    nextTier,
    levelRequired: nextTierConfig.minLevel,
  };
}

/**
 * Calcule les niveaux restants avant le prochain tier
 * @param currentLevel - Niveau actuel du groupe
 */
export function getLevelsToNextTier(currentLevel: number): number {
  const nextInfo = getNextTierInfo(currentLevel);
  if (!nextInfo) return 0; // Tier max

  return Math.max(0, nextInfo.levelRequired - currentLevel);
}

/**
 * Calcule la progression dans le tier actuel (0-100%)
 * Basé sur les niveaux, pas l'XP
 */
export function calculateTierProgress(currentLevel: number): number {
  const currentTier = calculateGroupTierFromLevel(currentLevel);
  const config = getGroupTierConfig(currentTier);

  if (currentTier === 6) return 100; // Tier max

  const levelsInTier = config.maxLevel! - config.minLevel + 1;
  const currentLevelInTier = currentLevel - config.minLevel;

  return Math.min(100, Math.max(0, (currentLevelInTier / levelsInTier) * 100));
}

/**
 * Calcule l'XP requis pour passer au niveau suivant
 * Formule: currentLevel * 100
 */
export function getXPForNextLevel(currentLevel: number): number {
  return GROUP_XP.XP_PER_LEVEL(currentLevel);
}

/**
 * Calcule la progression XP dans le niveau actuel (0-100%)
 */
export function calculateLevelProgress(currentXP: number, currentLevel: number): number {
  const xpNeeded = getXPForNextLevel(currentLevel);
  const previousLevelXP = currentLevel > 1 ? getXPForNextLevel(currentLevel - 1) : 0;
  const xpInCurrentLevel = currentXP - previousLevelXP;

  return Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeeded) * 100));
}

/**
 * Formate le nom du tier (version RAW - non traduite)
 * Pour la version traduite, utilisez getGroupTierTranslation()
 */
export function formatGroupTierName(tier: number): string {
  const config = getGroupTierConfig(tier);
  return config.name;
}

// ============================================
// VALIDATION RULES (inchangées)
// ============================================

export const GROUP_VALIDATION = {
  MIN_COMPLETION_RATE: 0.5, // 50%
  MAX_TOLERANCE_PER_WEEK: 1, // 1x par semaine par habit
  STREAK_SAVER_WINDOW_HOURS: 24,
} as const;

// ============================================
// LIMITS (inchangées)
// ============================================

export const GROUP_LIMITS = {
  MAX_MEMBERS: 10,
  MIN_MEMBERS: 2,
  MAX_HABITS_PREMIUM: Infinity,
  MAX_HABITS_FREE: 5,
} as const;

// ============================================
// EXPORT DEFAULT - Version améliorée avec i18n
// ============================================

export default {
  XP: GROUP_XP,
  TIERS: GROUP_TIERS_BY_LEVEL,
  VALIDATION: GROUP_VALIDATION,
  LIMITS: GROUP_LIMITS,

  // Helper functions - NIVEAU-BASED (RAW)
  calculateTierFromLevel: calculateGroupTierFromLevel,
  getTierConfig: getGroupTierConfig,
  getTierConfigByLevel: getGroupTierConfigByLevel,
  getTierThemeKey: getGroupTierThemeKey,
  getTierNameForTheme: getGroupTierNameForTheme,
  getNextTierInfo,
  getLevelsToNextTier,
  calculateTierProgress,
  getXPForNextLevel,
  calculateLevelProgress,
  formatTierName: formatGroupTierName,

  // ✨ NEW: i18n functions
  getTranslatedTierConfig: getTranslatedGroupTierConfig,
  getTierTranslation: getGroupTierTranslation,
} as const;
