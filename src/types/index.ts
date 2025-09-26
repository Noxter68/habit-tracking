import { HabitTier } from '@/services/habitProgressionService';

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
  tasks: any[]; // Task IDs that need to be completed
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
