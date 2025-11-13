import { quartzGradients } from '@/lib/tailwind';
import i18n from '@/i18n';
import type { Achievement, TierKey } from '@/types/achievement.types';

// Helper function to get translated title
export const getAchievementTitle = (level: number): string => {
  return i18n.t(`achievements.titles.level${level}`);
};

// Helper function to get translated tier name from key
export const getTierNameFromKey = (tierKey: string): string => {
  return i18n.t(`achievements.tiers.${tierKey}`);
};

// Base data structure - using i18n keys (camelCase)
const baseAchievementData = [
  // Novice (1-5)
  { level: 1, tierKey: 'novice' as TierKey, color: '#92400e', image: require('../../assets/achievements/level-1.png') },
  { level: 2, tierKey: 'novice' as TierKey, color: '#92400e', image: require('../../assets/achievements/level-2.png') },
  { level: 3, tierKey: 'novice' as TierKey, color: '#92400e', image: require('../../assets/achievements/level-3.png') },
  { level: 4, tierKey: 'novice' as TierKey, color: '#92400e', image: require('../../assets/achievements/level-4.png') },
  { level: 5, tierKey: 'novice' as TierKey, color: '#92400e', image: require('../../assets/achievements/level-5.png') },

  // Rising Hero (6-10)
  { level: 6, tierKey: 'risingHero' as TierKey, color: '#64748b', image: require('../../assets/achievements/level-6.png') },
  { level: 7, tierKey: 'risingHero' as TierKey, color: '#64748b', image: require('../../assets/achievements/level-7.png') },
  { level: 8, tierKey: 'risingHero' as TierKey, color: '#64748b', image: require('../../assets/achievements/level-8.png') },
  { level: 9, tierKey: 'risingHero' as TierKey, color: '#64748b', image: require('../../assets/achievements/level-9.png') },
  { level: 10, tierKey: 'risingHero' as TierKey, color: '#64748b', image: require('../../assets/achievements/level-10.png') },

  // Mastery Awakens (11-15)
  { level: 11, tierKey: 'masteryAwakens' as TierKey, color: '#f59e0b', image: require('../../assets/achievements/level-11.png') },
  { level: 12, tierKey: 'masteryAwakens' as TierKey, color: '#f59e0b', image: require('../../assets/achievements/level-12.png') },
  { level: 13, tierKey: 'masteryAwakens' as TierKey, color: '#f59e0b', image: require('../../assets/achievements/level-13.png') },
  { level: 14, tierKey: 'masteryAwakens' as TierKey, color: '#f59e0b', image: require('../../assets/achievements/level-14.png') },
  { level: 15, tierKey: 'masteryAwakens' as TierKey, color: '#f59e0b', image: require('../../assets/achievements/level-15.png') },

  // Legendary Ascent (16-20)
  { level: 16, tierKey: 'legendaryAscent' as TierKey, color: '#6366f1', image: require('../../assets/achievements/level-16.png') },
  { level: 17, tierKey: 'legendaryAscent' as TierKey, color: '#6366f1', image: require('../../assets/achievements/level-17.png') },
  { level: 18, tierKey: 'legendaryAscent' as TierKey, color: '#6366f1', image: require('../../assets/achievements/level-18.png') },
  { level: 19, tierKey: 'legendaryAscent' as TierKey, color: '#6366f1', image: require('../../assets/achievements/level-19.png') },
  { level: 20, tierKey: 'legendaryAscent' as TierKey, color: '#6366f1', image: require('../../assets/achievements/level-20.png') },

  // Epic Mastery (21-25)
  { level: 21, tierKey: 'epicMastery' as TierKey, color: '#dc2626', image: require('../../assets/achievements/level-21.png') },
  { level: 22, tierKey: 'epicMastery' as TierKey, color: '#dc2626', image: require('../../assets/achievements/level-22.png') },
  { level: 23, tierKey: 'epicMastery' as TierKey, color: '#dc2626', image: require('../../assets/achievements/level-23.png') },
  { level: 24, tierKey: 'epicMastery' as TierKey, color: '#dc2626', image: require('../../assets/achievements/level-24.png') },
  { level: 25, tierKey: 'epicMastery' as TierKey, color: '#dc2626', image: require('../../assets/achievements/level-25.png') },

  // Mythic Glory (26-30)
  { level: 26, tierKey: 'mythicGlory' as TierKey, color: '#8b5cf6', image: require('../../assets/achievements/level-26.png') },
  { level: 27, tierKey: 'mythicGlory' as TierKey, color: '#8b5cf6', image: require('../../assets/achievements/level-27.png') },
  { level: 28, tierKey: 'mythicGlory' as TierKey, color: '#8b5cf6', image: require('../../assets/achievements/level-28.png') },
  { level: 29, tierKey: 'mythicGlory' as TierKey, color: '#8b5cf6', image: require('../../assets/achievements/level-29.png') },
  { level: 30, tierKey: 'mythicGlory' as TierKey, color: '#8b5cf6', image: require('../../assets/achievements/level-30.png') },
];

// ✅ Export with getters for translations + tierKey exposed
export const achievementTitles: Achievement[] = baseAchievementData.map((base) => ({
  level: base.level,
  get title() {
    return getAchievementTitle(base.level);
  },
  get tier() {
    return getTierNameFromKey(base.tierKey);
  },
  tierKey: base.tierKey, // ✅ Expose the key
  color: base.color,
  image: base.image,
}));

export const getTierGradient = (tierName: string, isCompleted: boolean): string[] => {
  if (isCompleted) {
    return quartzGradients.tiers[tierName] || ['#fbbf24', '#d97706', '#92400e'];
  }
  return quartzGradients.locked.card;
};

// Locked badge image
export const LOCKED_BADGE_IMAGE = require('../../assets/achievements/locked.png');

// Helper function to get achievement by level (always fresh translation)
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
    tierKey: achievement.tierKey, // ✅ Expose the key
    color: achievement.color,
    image: achievement.image,
  };
};
