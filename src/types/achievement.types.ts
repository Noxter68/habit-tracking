// Achievement Types with proper typing
export const TIER_NAMES = ['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'] as const;
export type TierName = (typeof TIER_NAMES)[number];

export interface Achievement {
  id: string;
  title: string;
  level: number;
  tier: TierName;
  image: any; // React Native image source
  description?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  unlockedAt: Date;
}

export interface BackendData {
  totalCompletions: number;
  totalXP: number;
  userAchievements: UserAchievement[];
  currentStreak: number;
  perfectDays: number;
  totalHabits: number;
}

export type FilterType = 'all' | 'unlocked' | 'locked';
