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

// Task Type - moved from habitHelpers.ts
export interface Task {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  duration?: string;
  category?: string;
}

// Daily Task Progress - properly defined
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

// Stats Types
export interface HabitStats {
  completionRate: number;
  averageTasksCompleted: number;
  longestStreak: number;
  totalCompletions: number;
}

// Achievement Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
}

// XP and Level Types
export interface UserLevel {
  level: number;
  currentXP: number;
  xpForNextLevel: number;
  totalXP: number;
}

// Calendar Types
export interface CalendarDay {
  date: string;
  isCompleted: boolean;
  tasksCompleted: number;
  totalTasks: number;
}

// Notification Types
export interface NotificationSettings {
  enabled: boolean;
  time?: string;
  days?: string[];
  message?: string;
}
