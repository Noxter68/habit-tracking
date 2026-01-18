/**
 * @file tierTheme.ts
 * @description Thèmes visuels pour les tiers d'habitudes et d'achievements.
 * Définit les couleurs, dégradés et textures pour chaque niveau de progression.
 */

import { HabitTier } from '@/services/habitProgressionService';
import Logger from './logger';
import type { TierKey } from '@/types/achievement.types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Type alias pour les noms de tiers d'achievements.
 * Utilisé pour la compatibilité avec les composants existants.
 */
export type AchievementTierName = TierKey;

/**
 * Configuration du thème pour un tier d'habitude.
 */
interface HabitTierTheme {
  /** Couleurs du dégradé */
  gradient: string[];
  /** Texture de fond */
  texture: any;
  /** Couleur d'accent */
  accent: string;
}

/**
 * Configuration complète du thème pour un tier d'achievement.
 */
interface AchievementTierTheme {
  /** Couleurs du dégradé principal */
  gradient: string[];
  /** Couleur d'accent */
  accent: string;
  /** Nom de la gemme associée */
  gemName: string;
  /** Texture de fond */
  texture: any;
  /** Image pour les streaks */
  streakImage: any;
  /** Image pour les quêtes */
  questImage: any;
  /** Dégradé pour les arrière-plans */
  backgroundGradient: string[];
}

// =============================================================================
// CONSTANTES - THÈMES DES TIERS D'HABITUDES
// =============================================================================

/**
 * Thèmes pour les 3 tiers d'habitudes (Crystal, Ruby, Amethyst).
 */
export const tierThemes: Record<HabitTier, HabitTierTheme> = {
  Crystal: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    texture: require('../../assets/interface/progressBar/crystal.png'),
    accent: '#3b82f6',
  },
  Ruby: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    accent: '#dc2626',
  },
  Amethyst: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
    accent: '#7c3aed',
  },
};

// =============================================================================
// CONSTANTES - THÈMES DES TIERS D'ACHIEVEMENTS
// =============================================================================

/**
 * Thèmes complets pour les 6 tiers d'achievements.
 * Chaque tier est associé à une gemme et un ensemble de couleurs.
 */
export const achievementTierThemes: Record<TierKey, AchievementTierTheme> = {
  novice: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    accent: '#3b82f6',
    gemName: 'Crystal',
    texture: require('../../assets/interface/progressBar/crystal.png'),
    streakImage: require('../../assets/interface/streak-crystal.png'),
    questImage: require('../../assets/interface/quest-crystal.png'),
    backgroundGradient: ['#eff6ff', '#dbeafe', '#bfdbfe'],
  },
  risingHero: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    accent: '#dc2626',
    gemName: 'Ruby',
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    streakImage: require('../../assets/interface/streak-ruby.png'),
    questImage: require('../../assets/interface/quest-ruby.png'),
    backgroundGradient: ['#fef2f2', '#fee2e2', '#fecaca'],
  },
  masteryAwakens: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    accent: '#7c3aed',
    gemName: 'Amethyst',
    texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
    streakImage: require('../../assets/interface/streak-amethyst.png'),
    questImage: require('../../assets/interface/quest-amethyst.png'),
    backgroundGradient: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
  },
  legendaryAscent: {
    gradient: ['#10b981', '#059669', '#047857'],
    accent: '#059669',
    gemName: 'Jade',
    texture: require('../../assets/interface/progressBar/jade-texture.png'),
    streakImage: require('../../assets/interface/streak-jade.png'),
    questImage: require('../../assets/interface/quest-jade.png'),
    backgroundGradient: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
  },
  epicMastery: {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    accent: '#f59e0b',
    gemName: 'Topaz',
    texture: require('../../assets/interface/progressBar/topaz-texture.png'),
    streakImage: require('../../assets/interface/streak-topaz.png'),
    questImage: require('../../assets/interface/quest-topaz.png'),
    backgroundGradient: ['#fffbeb', '#fef3c7', '#fde68a'],
  },
  mythicGlory: {
    gradient: ['#1a1625', '#2d1b3d', '#4338ca', '#6366f1'],
    accent: '#8b5cf6',
    gemName: 'Obsidian',
    texture: require('../../assets/interface/progressBar/obsidian-texture.png'),
    streakImage: require('../../assets/interface/streak-obsidian.png'),
    questImage: require('../../assets/interface/quest-obsidian.png'),
    backgroundGradient: ['#0f0a1a', '#1a1625', '#2d1b3d'],
  },
  celestialAscension: {
    gradient: ['#8ec5ff', '#3f7eea', '#122c88'],
    accent: '#3f7eea',
    gemName: 'Celeste',
    texture: require('../../assets/interface/progressBar/celeste-texture.png'),
    streakImage: require('../../assets/interface/gems/celeste-gem.png'),
    questImage: require('../../assets/interface/gems/celeste-gem.png'),
    backgroundGradient: ['#e0f2ff', '#bae6fd', '#7dd3fc'],
  },
  infernalDominion: {
    gradient: ['#ff6b35', '#ff4500', '#8b0000'],
    accent: '#ff4500',
    gemName: 'Inferno',
    texture: require('../../assets/interface/texture-fire.png'),
    streakImage: require('../../assets/achievements/level-36.png'),
    questImage: require('../../assets/achievements/level-36.png'),
    backgroundGradient: ['#1a0000', '#2d0a0a', '#4a1010'],
  },
};

// =============================================================================
// FONCTIONS - RÉCUPÉRATION DES THÈMES
// =============================================================================

/**
 * Récupère le thème d'un tier d'achievement par sa clé.
 *
 * @param tierKey - Clé du tier (novice, risingHero, etc.)
 * @returns Le thème complet du tier
 *
 * @example
 * const theme = getAchievementTierTheme('novice');
 * console.log(theme.gemName); // "Crystal"
 * console.log(theme.accent);  // "#3b82f6"
 */
export const getAchievementTierTheme = (tierKey: TierKey | string): AchievementTierTheme => {
  // Recherche directe par clé
  if (tierKey in achievementTierThemes) {
    return achievementTierThemes[tierKey as TierKey];
  }

  Logger.warn(`Clé de tier inconnue: "${tierKey}", utilisation de novice par défaut`);
  return achievementTierThemes.novice;
};

/**
 * Récupère le thème d'un tier d'habitude par son nom.
 *
 * @param tierName - Nom du tier (Crystal, Ruby, Amethyst)
 * @returns Le thème du tier d'habitude
 *
 * @example
 * const theme = getHabitTierTheme('Ruby');
 * console.log(theme.accent); // "#dc2626"
 */
export const getHabitTierTheme = (tierName: HabitTier): HabitTierTheme => {
  return tierThemes[tierName] || tierThemes.Crystal;
};

// =============================================================================
// FONCTIONS - UTILITAIRES DE COULEURS
// =============================================================================

/**
 * Crée un dégradé léger pour les arrière-plans à partir d'un dégradé de base.
 *
 * @param baseGradient - Tableau de couleurs du dégradé de base
 * @param opacity - Opacité souhaitée (0-1)
 * @returns Tableau de couleurs avec opacité appliquée
 *
 * @example
 * const lightGradient = getLightTintGradient(['#3b82f6', '#1d4ed8'], 0.1);
 */
export const getLightTintGradient = (baseGradient: string[], opacity = 0.1): string[] => {
  return [
    `${baseGradient[0]}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`,
    `${baseGradient[1]}${Math.round(opacity * 0.8 * 255)
      .toString(16)
      .padStart(2, '0')}`,
    '#FAF9F7',
  ];
};

/**
 * Ajoute une opacité à une couleur d'accent.
 *
 * @param accent - Couleur hexadécimale
 * @param opacity - Opacité souhaitée (0-1)
 * @returns Couleur avec opacité au format hex
 *
 * @example
 * const transparentAccent = getAccentWithOpacity('#3b82f6', 0.5);
 * // Retourne: "#3b82f680"
 */
export const getAccentWithOpacity = (accent: string, opacity: number): string => {
  const hex = opacity * 255;
  return `${accent}${Math.round(hex).toString(16).padStart(2, '0')}`;
};
