// src/navigation/types.ts (Add Paywall screen)
import { Habit } from '../types';

export type RootStackParamList = {
  // Auth Stack
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;

  // Main App Stack
  Dashboard: undefined;
  HabitWizard: undefined;
  HabitDetails: {
    habitId: string;
    pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  };
  LanguageSelector: undefined;

  // Settings & Profile
  Settings: undefined;
  Profile: undefined;
  NotificationSettings: undefined;
  NotificationManager: undefined;

  // Holidays
  HolidayMode: undefined;

  // Achievement & Stats
  Achievements: undefined;
  Statistics: undefined;

  // Premium & Subscription
  Paywall: {
    source?: 'habit_limit' | 'streak_saver' | 'settings' | 'stats';
  };

  // Debug
  Debug: undefined;

  // Calendar View
  Calendar: {
    habitId?: string;
  };

  // Edit Habit
  EditHabit: {
    habitId: string;
    habit?: Habit;
  };
};

export type ScreenName = keyof RootStackParamList;

export type TabParamList = {
  Home: undefined;
  Habits: undefined;
  Stats: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  HabitWizard: undefined;
  HabitDetails: {
    habitId: string;
    habit?: Habit;
  };
  Settings: undefined;
  Achievements: undefined;
  HolidayMode: undefined;
  Paywall: {
    source?: string;
  };
};
