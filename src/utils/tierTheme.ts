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
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'], // blue tones
    texture: require('../../assets/interface/progressBar/crystal.png'),
    accent: '#3b82f6',
  },
  Ruby: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'], // red tones
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    accent: '#dc2626',
  },
  Amethyst: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'], // purple tones
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
  }
> = {
  Novice: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'], // Crystal - Blue (clarity & fresh start)
    accent: '#3b82f6',
    gemName: 'Crystal',
  },
  'Rising Hero': {
    gradient: ['#ef4444', '#dc2626', '#991b1b'], // Ruby - Red (passion & growth)
    accent: '#dc2626',
    gemName: 'Ruby',
  },
  'Mastery Awakens': {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'], // Amethyst - Purple (wisdom awakening)
    accent: '#7c3aed',
    gemName: 'Amethyst',
  },
  'Legendary Ascent': {
    gradient: ['#10b981', '#059669', '#047857'], // Jade - Green (legendary balance)
    accent: '#059669',
    gemName: 'Jade',
  },
  'Epic Mastery': {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'], // Topaz - Gold (epic achievement)
    accent: '#f59e0b',
    gemName: 'Topaz',
  },
  'Mythic Glory': {
    gradient: ['#6366f1', '#4f46e5', '#4338ca'], // Obsidian - Deep indigo (ultimate power)
    accent: '#4f46e5',
    gemName: 'Obsidian',
  },
};

// Extended Gem Palette for future use
export const gemPalette = {
  // Core 3 (Habit Tiers)
  crystal: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    accent: '#3b82f6',
    name: 'Crystal',
  },
  ruby: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    accent: '#dc2626',
    name: 'Ruby',
  },
  amethyst: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    accent: '#7c3aed',
    name: 'Amethyst',
  },

  // Additional gems
  topaz: {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    accent: '#f59e0b',
    name: 'Topaz',
  },
  emerald: {
    gradient: ['#10b981', '#059669', '#047857'],
    accent: '#059669',
    name: 'Emerald',
  },
  jade: {
    gradient: ['#10b981', '#059669', '#047857'],
    accent: '#059669',
    name: 'Jade',
  },
  sapphire: {
    gradient: ['#60a5fa', '#3b82f6', '#2563eb'],
    accent: '#3b82f6',
    name: 'Sapphire',
  },
  diamond: {
    gradient: ['#e0e7ff', '#c7d2fe', '#a5b4fc'],
    accent: '#818cf8',
    name: 'Diamond',
  },
  obsidian: {
    gradient: ['#6366f1', '#4f46e5', '#4338ca'],
    accent: '#4f46e5',
    name: 'Obsidian',
  },
  pearl: {
    gradient: ['#f5f5f4', '#e7e5e4', '#d6d3d1'],
    accent: '#a8a29e',
    name: 'Pearl',
  },
  garnet: {
    gradient: ['#dc2626', '#b91c1c', '#991b1b'],
    accent: '#b91c1c',
    name: 'Garnet',
  },
  aquamarine: {
    gradient: ['#06b6d4', '#0891b2', '#0e7490'],
    accent: '#0891b2',
    name: 'Aquamarine',
  },
  citrine: {
    gradient: ['#fde047', '#facc15', '#eab308'],
    accent: '#facc15',
    name: 'Citrine',
  },
  moonstone: {
    gradient: ['#ddd6fe', '#c4b5fd', '#a78bfa'],
    accent: '#a78bfa',
    name: 'Moonstone',
  },
  onyx: {
    gradient: ['#18181b', '#09090b', '#000000'],
    accent: '#18181b',
    name: 'Onyx',
  },
};

// Helper function to get achievement tier theme
export const getAchievementTierTheme = (tierName: AchievementTierName | string) => {
  // Default to Novice if tier name doesn't match
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
