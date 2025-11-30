/**
 * useDailyMotivation.ts
 *
 * Hook to manage daily motivation modal display
 * Shows the modal once per day when the user opens the app
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@daily_motivation_last_shown';
const SETTING_KEY = '@daily_motivation_enabled';

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useDailyMotivation = () => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false); // Default: once per day (false = not every time)
  const [shouldShowToday, setShouldShowToday] = useState(false);

  /**
   * Check if the modal should be shown today
   */
  const checkShouldShow = useCallback(async () => {
    try {
      // Check if the feature is enabled (show every time)
      const enabledValue = await AsyncStorage.getItem(SETTING_KEY);

      // If no value stored yet, initialize with default (false = once per day)
      if (enabledValue === null) {
        await AsyncStorage.setItem(SETTING_KEY, 'false');
      }

      const showEveryTime = enabledValue === 'true'; // Default to false (once per day)
      setIsEnabled(showEveryTime);

      if (showEveryTime) {
        // Show every time the app opens
        setShouldShowToday(true);
        setIsLoading(false);
        return;
      }

      // Show once per day (default behavior)
      const lastShownDate = await AsyncStorage.getItem(STORAGE_KEY);
      const todayDate = getTodayDateString();

      // If never shown or last shown date is different from today, mark as should show
      if (!lastShownDate || lastShownDate !== todayDate) {
        setShouldShowToday(true);
        // Save today's date
        await AsyncStorage.setItem(STORAGE_KEY, todayDate);
      }
    } catch (error) {
      console.error('Error checking daily motivation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize check on mount
   */
  useEffect(() => {
    checkShouldShow();
  }, [checkShouldShow]);

  /**
   * Auto-show the modal when shouldShowToday becomes true
   * This triggers after a delay to let other modals (like What's New) show first
   */
  useEffect(() => {
    if (shouldShowToday && !isLoading && !showModal) {
      const timer = setTimeout(() => {
        setShowModal(true);
        setIsTestMode(false);
        // Reset shouldShowToday to prevent showing again on re-navigation
        setShouldShowToday(false);
      }, 2000); // 2 second delay to let other modals show first

      return () => clearTimeout(timer);
    }
  }, [shouldShowToday, isLoading, showModal]);

  /**
   * Trigger the modal to show (can be called after other modals are closed)
   */
  const triggerShow = useCallback(() => {
    if (shouldShowToday) {
      setShowModal(true);
      setIsTestMode(false);
    }
  }, [shouldShowToday]);

  /**
   * Close the modal
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsTestMode(false);
  }, []);

  /**
   * Force show the modal (useful for testing)
   */
  const forceShow = useCallback(async () => {
    setShowModal(true);
    setIsTestMode(true);
  }, []);

  /**
   * Reset the storage (useful for testing)
   */
  const resetStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting daily motivation storage:', error);
    }
  }, []);

  /**
   * Toggle the daily motivation setting
   */
  const toggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(SETTING_KEY, enabled.toString());
      setIsEnabled(enabled);

      // If disabling, close the modal if it's open
      if (!enabled && showModal) {
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error toggling daily motivation:', error);
    }
  }, [showModal]);

  return {
    showModal,
    closeModal,
    isLoading,
    forceShow,
    resetStorage,
    isTestMode,
    isEnabled,
    toggleEnabled,
    triggerShow,
    shouldShowToday,
  };
};
