// src/types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  reminderTime?: string;
  motivationalQuotes: boolean;
}

export type NavigationScreen = 'Welcome' | 'CreateHabit' | 'Dashboard' | 'Settings';

// Habit Types
export type HabitType = 'good' | 'bad';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

// Task Type
export interface Task {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  duration?: string;
  category?: string;
}

// Daily Task Progress
export interface DailyTaskProgress {
  completedTasks: string[];
  allCompleted: boolean;
}

// Daily Task Completion - maps dates to progress
export interface DailyTaskCompletion {
  [date: string]: DailyTaskProgress;
}

// Main Habit Interface
export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  category: string;
  tasks: string[]; // Task IDs that need to be completed
  dailyTasks: DailyTaskCompletion; // Track which tasks are completed each day
  frequency: Frequency;
  customDays?: string[];
  notifications: boolean;
  notificationTime?: string;
  hasEndGoal: boolean;
  endGoalDays?: number;
  totalDays: number;
  currentStreak: number;
  bestStreak: number;
  completedDays: string[]; // Days where ALL tasks were completed
  createdAt: Date;
}

// ===== NEW TYPES FOR HABIT PROGRESSION =====

// Habit Tier System
export type HabitTier = 'Beginner' | 'Novice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';

export interface HabitTierInfo {
  name: HabitTier;
  minDays: number;
  maxDays?: number;
  gradient: string[];
  icon: string;
  color: string;
  xpMultiplier: number;
}

// Habit Progression
export interface HabitProgression {
  id: string;
  habitId: string;
  userId: string;
  currentTier: HabitTier;
  habitXP: number;
  milestonesUnlocked: string[];
  lastMilestoneDate?: Date;
  performanceMetrics: HabitPerformanceMetrics;
  createdAt: Date;
  updatedAt: Date;
}

// Performance Metrics
export interface HabitPerformanceMetrics {
  completionRate: number; // Percentage of days completed
  averageTasksPerDay: number;
  consistencyScore: number; // 0-100 based on regularity
  bestWeeklyStreak: number;
  totalTasksCompleted: number;
  perfectDays: number; // Days with all tasks completed
}

// Milestone System
export interface HabitMilestone {
  id: string;
  days: number;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  tier: HabitTier;
}

// XP Transaction for tracking (matches your DB)
export interface XPTransaction {
  id?: string;
  userId: string;
  amount: number;
  sourceType: 'habit_completion' | 'task_completion' | 'streak_bonus' | 'daily_challenge' | 'weekly_quest' | 'achievement_unlock' | 'special_event';
  sourceId?: string;
  description?: string;
  habitId?: string; // NEW: Added with migration
  createdAt?: Date;
}

// Task Completion Record (matches your DB table)
export interface TaskCompletionRecord {
  id?: string;
  habitId: string;
  userId: string;
  date: string;
  completedTasks: string[];
  allCompleted: boolean;
  xpEarned: number; // Already in your DB
  streakAtCompletion?: number; // NEW: Added with migration
  createdAt?: Date;
  updatedAt?: Date;
}

// Stats Types
export interface HabitStats {
  completionRate: number;
  averageTasksCompleted: number;
  longestStreak: number;
  totalCompletions: number;
  currentTier: HabitTier;
  habitXP: number;
  nextTierProgress: number;
}

// Achievement Types (matches your achievements table)
export interface Achievement {
  id: string;
  title: string; // Note: your DB uses 'title' not 'name'
  description: string;
  icon: string;
  color?: string;
  requirementType: 'streak' | 'completions' | 'perfect_days' | 'habits_count';
  requirementValue: number;
  level: number;
  xpReward: number;
  requiredXp?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Achievement Record
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  createdAt?: Date;
}

// User Profile (matches your profiles table)
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  totalXP: number;
  currentLevel: number;
  levelProgress: number;
  xpCollectedToday: boolean;
  lastXpCollectedDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User XP Stats - NOT NEEDED (using profiles table instead)
// Keeping for reference but you don't need this
// export interface UserXPStats { ... }

// Daily Challenge (matches your daily_challenges table)
export interface DailyChallenge {
  id: string;
  userId: string;
  date: string;
  totalTasks: number;
  completedTasks: number;
  xpCollected: boolean;
  collectedAt?: Date;
  createdAt: Date;
}

// Weekly Quest (matches your weekly_quests table)
export interface WeeklyQuest {
  id: string;
  userId: string;
  weekStart: string;
  questType: 'perfect_week' | 'seven_day_streak' | 'try_new_category' | 'morning_routine' | 'weekend_warrior';
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
  collected: boolean;
  collectedAt?: Date;
  createdAt: Date;
}

// Streak History (matches your streak_history table)
export interface StreakHistory {
  id: string;
  habitId?: string;
  userId?: string;
  date: string;
  streakValue: number;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  createdAt: Date;
}

// ===== CONSTANTS =====

export const HABIT_TIERS: HabitTierInfo[] = [
  {
    name: 'Beginner',
    minDays: 0,
    maxDays: 6,
    gradient: ['#fbbf24', '#f59e0b'],
    icon: '🌱',
    color: '#fbbf24',
    xpMultiplier: 1.0,
  },
  {
    name: 'Novice',
    minDays: 7,
    maxDays: 13,
    gradient: ['#f59e0b', '#d97706'],
    icon: '✨',
    color: '#f59e0b',
    xpMultiplier: 1.1,
  },
  {
    name: 'Adept',
    minDays: 14,
    maxDays: 29,
    gradient: ['#d97706', '#b45309'],
    icon: '🔥',
    color: '#d97706',
    xpMultiplier: 1.25,
  },
  {
    name: 'Expert',
    minDays: 30,
    maxDays: 49,
    gradient: ['#b45309', '#92400e'],
    icon: '⭐',
    color: '#b45309',
    xpMultiplier: 1.5,
  },
  {
    name: 'Master',
    minDays: 50,
    maxDays: 99,
    gradient: ['#92400e', '#78350f'],
    icon: '🏆',
    color: '#92400e',
    xpMultiplier: 1.75,
  },
  {
    name: 'Legendary',
    minDays: 100,
    gradient: ['#78350f', '#451a03'],
    icon: '👑',
    color: '#78350f',
    xpMultiplier: 2.0,
  },
];

export const HABIT_MILESTONES: HabitMilestone[] = [
  // Beginner milestones
  { id: 'first_task', days: 1, title: 'First Step', description: 'Complete your first task', icon: '🎯', xpReward: 25, tier: 'Beginner' },
  { id: 'three_days', days: 3, title: 'Momentum Builder', description: 'Keep it going for 3 days', icon: '🚀', xpReward: 50, tier: 'Beginner' },

  // Novice milestones
  { id: 'week_warrior', days: 7, title: 'Week Warrior', description: 'One week strong!', icon: '⚔️', xpReward: 100, tier: 'Novice' },
  { id: 'ten_days', days: 10, title: 'Double Digits', description: 'Reached 10 days!', icon: '🔟', xpReward: 150, tier: 'Novice' },

  // Adept milestones
  { id: 'fortnight', days: 14, title: 'Fortnight Fighter', description: 'Two weeks of dedication', icon: '🛡️', xpReward: 250, tier: 'Adept' },
  { id: 'three_weeks', days: 21, title: 'Habit Former', description: 'Science says habits form in 21 days!', icon: '🧠', xpReward: 350, tier: 'Adept' },

  // Expert milestones
  { id: 'monthly_master', days: 30, title: 'Monthly Master', description: 'One month achieved!', icon: '📅', xpReward: 500, tier: 'Expert' },
  { id: 'forty_days', days: 40, title: 'Committed', description: '40 days of excellence', icon: '💪', xpReward: 650, tier: 'Expert' },

  // Master milestones
  { id: 'fifty_days', days: 50, title: 'Half Century', description: '50 days milestone!', icon: '5️⃣0️⃣', xpReward: 800, tier: 'Master' },
  { id: 'seventy_five', days: 75, title: 'Diamond Dedication', description: '75 days of consistency', icon: '💎', xpReward: 1000, tier: 'Master' },

  // Legendary milestones
  { id: 'century', days: 100, title: 'Century Legend', description: '100 days - You are legendary!', icon: '👑', xpReward: 2000, tier: 'Legendary' },
  { id: 'year_master', days: 365, title: 'Year Master', description: 'One full year!', icon: '🏅', xpReward: 10000, tier: 'Legendary' },
];
