// src/utils/haptics.ts
// Centralized haptic feedback utility for consistent UX

import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback utilities for different interaction types
 * Based on Apple's Human Interface Guidelines for haptic feedback
 */
export const HapticFeedback = {
  /**
   * Light impact - Used for:
   * - Standard buttons
   * - List item selections
   * - Toggle switches
   * - Minor interactions
   */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - Used for:
   * - Important actions (Sign out, Delete)
   * - Navigation transitions
   * - Modal opens/closes
   * - Significant state changes
   */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - Used for:
   * - Critical actions
   * - Completion of major tasks
   * - Level ups
   * - Achievement unlocks
   */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success notification - Used for:
   * - Successful completions
   * - Habit task completions
   * - XP collection
   * - Streak milestones
   */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning notification - Used for:
   * - Caution messages
   * - Streak warnings
   * - Premium limits reached
   */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error notification - Used for:
   * - Failed actions
   * - Validation errors
   * - Critical errors
   */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection change - Used for:
   * - Picker value changes
   * - Segmented control changes
   * - Tab switches
   */
  selection: () => {
    Haptics.selectionAsync();
  },
};

/**
 * Higher-order component to add haptic feedback to any pressable component
 *
 * Usage:
 * <TouchableOpacity onPress={withHaptic(handlePress, 'light')}>
 */
export const withHaptic = (callback: () => void, feedbackType: keyof typeof HapticFeedback = 'light') => {
  return () => {
    HapticFeedback[feedbackType]();
    callback();
  };
};

/**
 * Async version for async callbacks
 */
export const withHapticAsync = (callback: () => Promise<void>, feedbackType: keyof typeof HapticFeedback = 'light') => {
  return async () => {
    HapticFeedback[feedbackType]();
    await callback();
  };
};
