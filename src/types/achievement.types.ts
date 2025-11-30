// src/types/achievement.types.ts

// Tier names for display
export const TIER_NAMES = ['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory', 'Celestial Ascension'] as const;
export type TierName = (typeof TIER_NAMES)[number];

// Tier keys for i18n (camelCase)
export const TIER_KEYS = ['novice', 'risingHero', 'masteryAwakens', 'legendaryAscent', 'epicMastery', 'mythicGlory', 'celestialAscension'] as const;
export type TierKey = (typeof TIER_KEYS)[number];

// ✅ Achievement interface with both tier (translated) and tierKey (i18n key)
export interface Achievement {
  level: number;
  title: string; // Translated title (from getter)
  tier: string; // Translated tier name (from getter)
  tierKey: TierKey; // i18n key for tier (novice, masteryAwakens, etc.)
  color: string;
  image: any; // React Native image source
  description?: string;
}

// User achievement from database
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  unlockedAt: Date;
}

// Backend data structure
export interface BackendData {
  totalCompletions: number;
  totalXP: number;
  userAchievements: UserAchievement[];
  currentStreak: number;
  perfectDays: number;
  totalHabits: number;
  levelProgress: number;
  currentLevel: number;
}

export type FilterType = 'all' | 'unlocked' | 'locked';
