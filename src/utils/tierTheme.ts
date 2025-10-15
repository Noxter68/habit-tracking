// src/utils/tierTheme.ts
import { HabitTier } from '@/services/habitProgressionService';

// Habit Tier Themes (3 tiers for habits)
export const tierThemes: Record<
  HabitTier,
  {
    gradient: string[];
    texture: any;
    accent: string;
  }
> = {
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

// Achievement Tier Themes (6 tiers for achievements - gem-themed)
export type AchievementTierName = 'Novice' | 'Rising Hero' | 'Mastery Awakens' | 'Legendary Ascent' | 'Epic Mastery' | 'Mythic Glory';

export const achievementTierThemes: Record<
  AchievementTierName,
  {
    gradient: string[];
    accent: string;
    gemName: string;
    texture: any;
    streakImage: any;
    questImage: any;
    backgroundGradient: string[];
  }
> = {
  Novice: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    accent: '#3b82f6',
    gemName: 'Crystal',
    texture: require('../../assets/interface/progressBar/crystal.png'),
    streakImage: require('../../assets/interface/streak-crystal.png'),
    questImage: require('../../assets/interface/quest-crystal.png'),
    backgroundGradient: ['#eff6ff', '#dbeafe', '#bfdbfe'], // Light blue tones
  },
  'Rising Hero': {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    accent: '#dc2626',
    gemName: 'Ruby',
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    streakImage: require('../../assets/interface/streak-ruby.png'),
    questImage: require('../../assets/interface/quest-ruby.png'),
    backgroundGradient: ['#fef2f2', '#fee2e2', '#fecaca'], // Light red tones
  },
  'Mastery Awakens': {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    accent: '#7c3aed',
    gemName: 'Amethyst',
    texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
    streakImage: require('../../assets/interface/streak-amethyst.png'),
    questImage: require('../../assets/interface/quest-amethyst.png'),
    backgroundGradient: ['#faf5ff', '#f3e8ff', '#e9d5ff'], // Light purple tones
  },
  'Legendary Ascent': {
    gradient: ['#10b981', '#059669', '#047857'],
    accent: '#059669',
    gemName: 'Jade',
    texture: require('../../assets/interface/progressBar/jade-texture.png'),
    streakImage: require('../../assets/interface/streak-jade.png'),
    questImage: require('../../assets/interface/quest-jade.png'),
    backgroundGradient: ['#f0fdf4', '#dcfce7', '#bbf7d0'], // Light green tones
  },
  'Epic Mastery': {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    accent: '#f59e0b',
    gemName: 'Topaz',
    texture: require('../../assets/interface/progressBar/topaz-texture.png'),
    streakImage: require('../../assets/interface/streak-topaz.png'),
    questImage: require('../../assets/interface/quest-topaz.png'),
    backgroundGradient: ['#fffbeb', '#fef3c7', '#fde68a'], // Light amber/gold tones
  },
  'Mythic Glory': {
    gradient: ['#6366f1', '#4f46e5', '#4338ca'],
    accent: '#4f46e5',
    gemName: 'Obsidian',
    texture: require('../../assets/interface/progressBar/obsidian-texture.png'),
    streakImage: require('../../assets/interface/streak-obsidian.png'),
    questImage: require('../../assets/interface/quest-obsidian.png'),
    backgroundGradient: ['#eef2ff', '#e0e7ff', '#c7d2fe'], // Light indigo tones
  },
};

// Helper function to get achievement tier theme
export const getAchievementTierTheme = (tierName: AchievementTierName | string) => {
  if (tierName in achievementTierThemes) {
    return achievementTierThemes[tierName as AchievementTierName];
  }

  console.warn(`Unknown tier name: ${tierName}, defaulting to Novice`);
  return achievementTierThemes['Novice'];
};

// Helper function to get habit tier theme
export const getHabitTierTheme = (tierName: HabitTier) => {
  return tierThemes[tierName] || tierThemes.Crystal;
};

// NEW: Helper to create light tint gradients for backgrounds
export const getLightTintGradient = (baseGradient: string[], opacity = 0.1) => {
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

// NEW: Helper to get accent with opacity
export const getAccentWithOpacity = (accent: string, opacity: number) => {
  const hex = opacity * 255;
  return `${accent}${Math.round(hex).toString(16).padStart(2, '0')}`;
};
