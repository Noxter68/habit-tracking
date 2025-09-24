import { achievementGradients } from '../lib/tailwind';

export interface Achievement {
  level: number;
  title: string;
  tier: string;
  color: string;
  image: number;
}

// Achievement titles data with images
export const achievementTitles: Achievement[] = [
  // Novice (1-5)
  {
    level: 1,
    title: 'The First Stepper',
    tier: 'Novice',
    color: '#92400e',
    image: require('../../assets/achievements/level-1.png'),
  },
  {
    level: 2,
    title: 'Pathfinder',
    tier: 'Novice',
    color: '#92400e',
    image: require('../../assets/achievements/level-2.png'),
  },
  {
    level: 3,
    title: 'Apprentice of Discipline',
    tier: 'Novice',
    color: '#92400e',
    image: require('../../assets/achievements/level-3.png'),
  },
  {
    level: 4,
    title: 'Seeker of Resolve',
    tier: 'Novice',
    color: '#92400e',
    image: require('../../assets/achievements/level-4.png'),
  },
  {
    level: 5,
    title: 'Bearer of the Flame',
    tier: 'Novice',
    color: '#92400e',
    image: require('../../assets/achievements/level-5.png'),
  },
  // Rising Hero (6-10)
  {
    level: 6,
    title: 'Squire of Habits',
    tier: 'Rising Hero',
    color: '#64748b',
    image: require('../../assets/achievements/level-6.png'),
  },
  {
    level: 7,
    title: 'The Steadfast',
    tier: 'Rising Hero',
    color: '#64748b',
    image: require('../../assets/achievements/level-7.png'),
  },
  {
    level: 8,
    title: 'Guardian of Routine',
    tier: 'Rising Hero',
    color: '#64748b',
    image: require('../../assets/achievements/level-8.png'),
  },
  {
    level: 9,
    title: 'Keeper of the Path',
    tier: 'Rising Hero',
    color: '#64748b',
    image: require('../../assets/achievements/level-9.png'),
  },
  {
    level: 10,
    title: 'Knight of Consistency',
    tier: 'Rising Hero',
    color: '#64748b',
    image: require('../../assets/achievements/level-10.png'),
  },
  // Mastery (11-15)
  {
    level: 11,
    title: 'Champion of Focus',
    tier: 'Mastery Awakens',
    color: '#f59e0b',
    image: require('../../assets/achievements/level-11.png'),
  },
  {
    level: 12,
    title: 'Breaker of Limits',
    tier: 'Mastery Awakens',
    color: '#f59e0b',
    image: require('../../assets/achievements/level-12.png'),
  },
  {
    level: 13,
    title: 'The Unyielding',
    tier: 'Mastery Awakens',
    color: '#f59e0b',
    image: require('../../assets/achievements/level-13.png'),
  },
  {
    level: 14,
    title: 'Warden of Progress',
    tier: 'Mastery Awakens',
    color: '#f59e0b',
    image: require('../../assets/achievements/level-14.png'),
  },
  {
    level: 15,
    title: 'Hero of Momentum',
    tier: 'Mastery Awakens',
    color: '#f59e0b',
    image: require('../../assets/achievements/level-15.png'),
  },
  // Legendary (16-20)
  {
    level: 16,
    title: 'Blade of Resolve',
    tier: 'Legendary Ascent',
    color: '#6366f1',
    image: require('../../assets/achievements/level-16.png'),
  },
  {
    level: 17,
    title: 'Defender of Discipline',
    tier: 'Legendary Ascent',
    color: '#6366f1',
    image: require('../../assets/achievements/level-17.png'),
  },
  {
    level: 18,
    title: 'The Iron Willed',
    tier: 'Legendary Ascent',
    color: '#6366f1',
    image: require('../../assets/achievements/level-18.png'),
  },
  {
    level: 19,
    title: 'Master of the Grind',
    tier: 'Legendary Ascent',
    color: '#6366f1',
    image: require('../../assets/achievements/level-19.png'),
  },
  // {
  //   level: 20,
  //   title: 'The Golden Victor',
  //   tier: 'Legendary Ascent',
  //   color: '#6366f1',
  //   image: require('../../assets/achievements/level-20.png'),
  // },
  // // Epic (21-25)
  // {
  //   level: 21,
  //   title: 'The Relentless',
  //   tier: 'Epic Mastery',
  //   color: '#dc2626',
  //   image: require('../../assets/achievements/level-21.png'),
  // },
  // {
  //   level: 22,
  //   title: 'Stormbringer of Habits',
  //   tier: 'Epic Mastery',
  //   color: '#dc2626',
  //   image: require('../../assets/achievements/level-22.png'),
  // },
  // {
  //   level: 23,
  //   title: 'The Phoenix Riser',
  //   tier: 'Epic Mastery',
  //   color: '#dc2626',
  //   image: require('../../assets/achievements/level-23.png'),
  // },
  // {
  //   level: 24,
  //   title: 'Champion of Time',
  //   tier: 'Epic Mastery',
  //   color: '#dc2626',
  //   image: require('../../assets/achievements/level-24.png'),
  // },
  // {
  //   level: 25,
  //   title: 'The Crowned Conqueror',
  //   tier: 'Epic Mastery',
  //   color: '#dc2626',
  //   image: require('../../assets/achievements/level-25.png'),
  // },
  // // Mythic (26-30)
  // {
  //   level: 26,
  //   title: 'The Eternal Flame',
  //   tier: 'Mythic Glory',
  //   color: '#8b5cf6',
  //   image: require('../../assets/achievements/level-26.png'),
  // },
  // {
  //   level: 27,
  //   title: 'Titan of Consistency',
  //   tier: 'Mythic Glory',
  //   color: '#8b5cf6',
  //   image: require('../../assets/achievements/level-27.png'),
  // },
  // {
  //   level: 28,
  //   title: 'The Invincible',
  //   tier: 'Mythic Glory',
  //   color: '#8b5cf6',
  //   image: require('../../assets/achievements/level-28.png'),
  // },
  // {
  //   level: 29,
  //   title: 'Legend of the Grind',
  //   tier: 'Mythic Glory',
  //   color: '#8b5cf6',
  //   image: require('../../assets/achievements/level-29.png'),
  // },
  // {
  //   level: 30,
  //   title: 'Ascended One',
  //   tier: 'Mythic Glory',
  //   color: '#8b5cf6',
  //   image: require('../../assets/achievements/level-30.png'),
  // },
];

export const getTierGradient = (tierName: string, isCompleted: boolean): string[] => {
  if (isCompleted) {
    return achievementGradients.tiers[tierName] || ['#fbbf24', '#d97706', '#92400e'];
  }
  return achievementGradients.locked.card;
};

// Locked badge image
export const LOCKED_BADGE_IMAGE = require('../../assets/achievements/locked.png');

// Helper function to get achievement by level
export const getAchievementByLevel = (level: number): Achievement | undefined => {
  const currentLevel = achievementTitles.find((a) => a.level === level);
  return currentLevel;
};
