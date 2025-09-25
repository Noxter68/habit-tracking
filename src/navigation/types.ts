// src/navigation/types.ts
import { Habit } from '../types';

/**
 * RootStackParamList defines all the screens in your navigation stack
 * and their parameters (if any).
 *
 * This ensures type safety when navigating between screens.
 */
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
    habit?: Habit; // Optional: pass the habit object directly
  };

  // Settings & Profile
  Settings: undefined;
  Profile: undefined;
  NotificationSettings: undefined;

  // Achievement & Stats
  Achievements: undefined;
  Statistics: undefined;

  // Debug (if applicable)
  Debug: undefined;

  // Calendar View
  Calendar: {
    habitId?: string; // Optional: focus on a specific habit
  };

  // Edit Habit
  EditHabit: {
    habitId: string;
    habit?: Habit;
  };
};

/**
 * Type helpers for navigation
 */
export type ScreenName = keyof RootStackParamList;

/**
 * Tab Navigator Param List (if using bottom tabs)
 */
export type TabParamList = {
  Home: undefined;
  Habits: undefined;
  Stats: undefined;
  Profile: undefined;
};

/**
 * Auth Stack Param List
 */
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

/**
 * Main Stack Param List (after authentication)
 */
export type MainStackParamList = {
  Dashboard: undefined;
  HabitWizard: undefined;
  HabitDetails: {
    habitId: string;
    habit?: Habit;
  };
  Settings: undefined;
  Achievements: undefined;
};
