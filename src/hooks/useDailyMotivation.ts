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

// Flag global pour tracker si le modal a déjà été affiché dans cette session
// Évite les re-affichages lors de la navigation entre écrans
let hasShownThisSession = false;

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

  /**
   * Check if the modal should be shown today and show it after delay
   * Runs only once on mount
   */
  useEffect(() => {
    // Si déjà affiché dans cette session, ne rien faire
    if (hasShownThisSession) {
      setIsLoading(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkAndShow = async () => {
      try {
        // Check if the feature is enabled (show every time)
        const enabledValue = await AsyncStorage.getItem(SETTING_KEY);

        // If no value stored yet, initialize with default (false = once per day)
        if (enabledValue === null) {
          await AsyncStorage.setItem(SETTING_KEY, 'false');
        }

        const showEveryTime = enabledValue === 'true';
        setIsEnabled(showEveryTime);

        let shouldShow = false;

        if (showEveryTime) {
          // Show every time the app opens (but only once per session)
          shouldShow = true;
        } else {
          // Show once per day (default behavior)
          const lastShownDate = await AsyncStorage.getItem(STORAGE_KEY);
          const todayDate = getTodayDateString();

          if (!lastShownDate || lastShownDate !== todayDate) {
            shouldShow = true;
            await AsyncStorage.setItem(STORAGE_KEY, todayDate);
          }
        }

        setIsLoading(false);

        // Show modal after delay if needed
        if (shouldShow && !hasShownThisSession) {
          timer = setTimeout(() => {
            hasShownThisSession = true;
            setShowModal(true);
            setIsTestMode(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking daily motivation:', error);
        setIsLoading(false);
      }
    };

    checkAndShow();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []); // Empty deps - run only once on mount

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
  };
};
