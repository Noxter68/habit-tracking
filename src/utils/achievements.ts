/**
 * @file achievements.ts
 * @description Gestion des achievements et niveaux de l'utilisateur.
 * Définit les 35 niveaux d'achievements répartis en 7 tiers de progression.
 */

import { quartzGradients } from '@/lib/tailwind';
import i18n from '@/i18n';
import type { Achievement, TierKey } from '@/types/achievement.types';

// Re-export Achievement type for backward compatibility
export type { Achievement } from '@/types/achievement.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Structure de base d'un achievement sans traductions.
 */
interface BaseAchievementData {
  /** Niveau de l'achievement (1-35) */
  level: number;
  /** Clé du tier pour les traductions */
  tierKey: TierKey;
  /** Couleur principale du tier */
  color: string;
  /** Image du badge */
  image: any;
}

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Image affichée pour les badges verrouillés.
 */
export const LOCKED_BADGE_IMAGE = require('../../assets/achievements/locked.png');

/**
 * Données de base des achievements (35 niveaux répartis en 7 tiers).
 * Les traductions sont appliquées dynamiquement via les getters.
 */
const baseAchievementData: BaseAchievementData[] = [
  // Novice (1-5)
  { level: 1, tierKey: 'novice', color: '#92400e', image: require('../../assets/achievements/level-1.png') },
  { level: 2, tierKey: 'novice', color: '#92400e', image: require('../../assets/achievements/level-2.png') },
  { level: 3, tierKey: 'novice', color: '#92400e', image: require('../../assets/achievements/level-3.png') },
  { level: 4, tierKey: 'novice', color: '#92400e', image: require('../../assets/achievements/level-4.png') },
  { level: 5, tierKey: 'novice', color: '#92400e', image: require('../../assets/achievements/level-5.png') },

  // Rising Hero (6-10)
  { level: 6, tierKey: 'risingHero', color: '#64748b', image: require('../../assets/achievements/level-6.png') },
  { level: 7, tierKey: 'risingHero', color: '#64748b', image: require('../../assets/achievements/level-7.png') },
  { level: 8, tierKey: 'risingHero', color: '#64748b', image: require('../../assets/achievements/level-8.png') },
  { level: 9, tierKey: 'risingHero', color: '#64748b', image: require('../../assets/achievements/level-9.png') },
  { level: 10, tierKey: 'risingHero', color: '#64748b', image: require('../../assets/achievements/level-10.png') },

  // Mastery Awakens (11-15)
  { level: 11, tierKey: 'masteryAwakens', color: '#f59e0b', image: require('../../assets/achievements/level-11.png') },
  { level: 12, tierKey: 'masteryAwakens', color: '#f59e0b', image: require('../../assets/achievements/level-12.png') },
  { level: 13, tierKey: 'masteryAwakens', color: '#f59e0b', image: require('../../assets/achievements/level-13.png') },
  { level: 14, tierKey: 'masteryAwakens', color: '#f59e0b', image: require('../../assets/achievements/level-14.png') },
  { level: 15, tierKey: 'masteryAwakens', color: '#f59e0b', image: require('../../assets/achievements/level-15.png') },

  // Legendary Ascent (16-20)
  { level: 16, tierKey: 'legendaryAscent', color: '#6366f1', image: require('../../assets/achievements/level-16.png') },
  { level: 17, tierKey: 'legendaryAscent', color: '#6366f1', image: require('../../assets/achievements/level-17.png') },
  { level: 18, tierKey: 'legendaryAscent', color: '#6366f1', image: require('../../assets/achievements/level-18.png') },
  { level: 19, tierKey: 'legendaryAscent', color: '#6366f1', image: require('../../assets/achievements/level-19.png') },
  { level: 20, tierKey: 'legendaryAscent', color: '#6366f1', image: require('../../assets/achievements/level-20.png') },

  // Epic Mastery (21-25)
  { level: 21, tierKey: 'epicMastery', color: '#dc2626', image: require('../../assets/achievements/level-21.png') },
  { level: 22, tierKey: 'epicMastery', color: '#dc2626', image: require('../../assets/achievements/level-22.png') },
  { level: 23, tierKey: 'epicMastery', color: '#dc2626', image: require('../../assets/achievements/level-23.png') },
  { level: 24, tierKey: 'epicMastery', color: '#dc2626', image: require('../../assets/achievements/level-24.png') },
  { level: 25, tierKey: 'epicMastery', color: '#dc2626', image: require('../../assets/achievements/level-25.png') },

  // Mythic Glory (26-30)
  { level: 26, tierKey: 'mythicGlory', color: '#8b5cf6', image: require('../../assets/achievements/level-26.png') },
  { level: 27, tierKey: 'mythicGlory', color: '#8b5cf6', image: require('../../assets/achievements/level-27.png') },
  { level: 28, tierKey: 'mythicGlory', color: '#8b5cf6', image: require('../../assets/achievements/level-28.png') },
  { level: 29, tierKey: 'mythicGlory', color: '#8b5cf6', image: require('../../assets/achievements/level-29.png') },
  { level: 30, tierKey: 'mythicGlory', color: '#8b5cf6', image: require('../../assets/achievements/level-30.png') },

  // Celestial Ascension (31-35)
  { level: 31, tierKey: 'celestialAscension', color: '#3f7eea', image: require('../../assets/interface/gems/celeste-gem.png') },
  { level: 32, tierKey: 'celestialAscension', color: '#3f7eea', image: require('../../assets/achievements/level-32.png') },
  { level: 33, tierKey: 'celestialAscension', color: '#3f7eea', image: require('../../assets/achievements/level-33.png') },
  { level: 34, tierKey: 'celestialAscension', color: '#3f7eea', image: require('../../assets/achievements/level-34.png') },
  { level: 35, tierKey: 'celestialAscension', color: '#3f7eea', image: require('../../assets/achievements/level-35.png') },

  // Infernal Dominion (36-40)
  { level: 36, tierKey: 'infernalDominion', color: '#ff4500', image: require('../../assets/achievements/level-36.png') },
  { level: 37, tierKey: 'infernalDominion', color: '#ff4500', image: require('../../assets/achievements/level-37.png') },
  { level: 38, tierKey: 'infernalDominion', color: '#ff4500', image: require('../../assets/achievements/level-38.png') },
  { level: 39, tierKey: 'infernalDominion', color: '#ff4500', image: require('../../assets/achievements/level-39.png') },
  { level: 40, tierKey: 'infernalDominion', color: '#ff4500', image: require('../../assets/achievements/level-40.png') },
];

// =============================================================================
// FONCTIONS - TRADUCTIONS
// =============================================================================

/**
 * Récupère le titre traduit d'un achievement par son niveau.
 *
 * @param level - Numéro du niveau (1-30)
 * @returns Le titre traduit
 *
 * @example
 * const title = getAchievementTitle(1);
 * // Retourne: "Première Étape" (en français)
 */
export const getAchievementTitle = (level: number): string => {
  return i18n.t(`achievements.titles.level${level}`);
};

/**
 * Récupère le nom traduit d'un tier par sa clé.
 *
 * @param tierKey - Clé du tier (novice, risingHero, etc.)
 * @returns Le nom traduit du tier
 *
 * @example
 * const tierName = getTierNameFromKey('novice');
 * // Retourne: "Novice" (en français)
 */
export const getTierNameFromKey = (tierKey: string): string => {
  return i18n.t(`achievements.tiers.${tierKey}`);
};

// =============================================================================
// FONCTIONS - RÉCUPÉRATION DES ACHIEVEMENTS
// =============================================================================

/**
 * Récupère un achievement par son niveau avec traductions dynamiques.
 *
 * @param level - Numéro du niveau (1-30)
 * @returns L'achievement avec ses traductions ou undefined si non trouvé
 *
 * @example
 * const achievement = getAchievementByLevel(5);
 * console.log(achievement?.title); // "Habitude Ancrée"
 * console.log(achievement?.tier);  // "Novice"
 */
export const getAchievementByLevel = (level: number): Achievement | undefined => {
  const achievement = baseAchievementData.find((a) => a.level === level);
  if (!achievement) return undefined;

  return {
    level: achievement.level,
    get title() {
      return getAchievementTitle(achievement.level);
    },
    get tier() {
      return getTierNameFromKey(achievement.tierKey);
    },
    tierKey: achievement.tierKey,
    color: achievement.color,
    image: achievement.image,
  };
};

/**
 * Récupère le dégradé de couleurs pour un tier.
 *
 * @param tierName - Nom du tier
 * @param isCompleted - Si l'achievement est complété
 * @returns Tableau de couleurs pour le dégradé
 *
 * @example
 * const gradient = getTierGradient('Novice', true);
 * // Retourne les couleurs du dégradé novice
 */
export const getTierGradient = (tierName: string, isCompleted: boolean): string[] => {
  if (isCompleted) {
    const tiers = quartzGradients.tiers as Record<string, string[]>;
    return tiers[tierName] || ['#fbbf24', '#d97706', '#92400e'];
  }
  return quartzGradients.locked.card;
};

// =============================================================================
// EXPORTS - DONNÉES AVEC GETTERS POUR TRADUCTIONS
// =============================================================================

/**
 * Liste complète des achievements avec traductions dynamiques.
 * Utilise des getters pour que les traductions soient toujours à jour.
 */
export const achievementTitles: Achievement[] = baseAchievementData.map((base) => ({
  level: base.level,
  get title() {
    return getAchievementTitle(base.level);
  },
  get tier() {
    return getTierNameFromKey(base.tierKey);
  },
  tierKey: base.tierKey,
  color: base.color,
  image: base.image,
}));
