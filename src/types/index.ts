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

// src/types/index.ts
export type HabitType = 'good' | 'bad';
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DailyTaskCompletion {
  [date: string]: {
    completedTasks: string[];
    allCompleted: boolean;
  };
}

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
