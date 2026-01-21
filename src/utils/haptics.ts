/**
 * @file haptics.ts
 * @description Centralized utilities for haptic feedback.
 * Based on Apple Human Interface guidelines for consistent UX.
 */

import * as Haptics from 'expo-haptics';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Available haptic feedback types.
 */
type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// =============================================================================
// CONSTANTS - HAPTIC FEEDBACK
// =============================================================================

/**
 * Haptic feedback utilities for different types of interactions.
 * Each method corresponds to a specific use case according to Apple guidelines.
 */
export const HapticFeedback = {
  /**
   * Light impact - Used for:
   * - Standard buttons
   * - List selections
   * - Switches/toggles
   * - Minor interactions
   */
  light: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Medium impact - Used for:
   * - Important actions (Logout, Delete)
   * - Navigation transitions
   * - Opening/closing modals
   * - Significant state changes
   */
  medium: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Heavy impact - Used for:
   * - Critical actions
   * - Major task completions
   * - Level up
   * - Achievement unlocks
   */
  heavy: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Success notification - Used for:
   * - Successful completions
   * - Habit tasks completed
   * - XP collection
   * - Streak milestones
   */
  success: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Warning notification - Used for:
   * - Caution messages
   * - Streak warnings
   * - Premium limits reached
   */
  warning: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Error notification - Used for:
   * - Failed actions
   * - Validation errors
   * - Critical errors
   */
  error: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Selection change - Used for:
   * - Picker value changes
   * - Segmented control changes
   * - Tab changes
   */
  selection: (): void => {
    Haptics.selectionAsync();
  },

  /**
   * Celebration bell - Used for:
   * - Daily challenge collection
   * - Special rewards
   * - Celebration events
   * Duolingo-style sequence: intense burst at start then decreasing
   */
  celebrationBell: (): void => {
    // Initial intense burst (3x rapid heavy) then decreasing
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 50);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 170);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 240);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 320);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);
  },
};

// =============================================================================
// FUNCTIONS - HAPTIC WRAPPERS
// =============================================================================

/**
 * Wraps a callback with haptic feedback.
 * Useful for adding haptic feedback to any pressable component.
 *
 * @param callback - The function to execute after feedback
 * @param feedbackType - Type of haptic feedback (default: 'light')
 * @returns A function with integrated haptic feedback
 *
 * @example
 * <TouchableOpacity onPress={withHaptic(handlePress, 'light')}>
 *   <Text>Press</Text>
 * </TouchableOpacity>
 */
export const withHaptic = (
  callback: () => void,
  feedbackType: HapticFeedbackType = 'light'
): (() => void) => {
  return () => {
    HapticFeedback[feedbackType]();
    callback();
  };
};

/**
 * Async version of withHaptic for async callbacks.
 *
 * @param callback - The async function to execute after feedback
 * @param feedbackType - Type of haptic feedback (default: 'light')
 * @returns An async function with integrated haptic feedback
 *
 * @example
 * <TouchableOpacity onPress={withHapticAsync(handleAsyncPress, 'success')}>
 *   <Text>Save</Text>
 * </TouchableOpacity>
 */
export const withHapticAsync = (
  callback: () => Promise<void>,
  feedbackType: HapticFeedbackType = 'light'
): (() => Promise<void>) => {
  return async () => {
    HapticFeedback[feedbackType]();
    await callback();
  };
};
