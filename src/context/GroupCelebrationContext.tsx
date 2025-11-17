// src/context/GroupCelebrationContext.tsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateGroupTierFromLevel, getGroupTierConfig } from '@/utils/groups/groupConstants';
import Logger from '@/utils/logger';

interface TierUpData {
  newTier: number;
  previousTier: number;
  newLevel: number;
  tierConfig: any;
}

interface LevelUpData {
  newLevel: number;
  previousLevel: number;
  currentTier: number;
}

interface GroupCelebrationContextType {
  // Tier Up Modal
  showTierUpModal: boolean;
  tierUpData: TierUpData | null;
  closeTierUpModal: () => void;

  // Level Up Modal
  showLevelUpModal: boolean;
  levelUpData: LevelUpData | null;
  closeLevelUpModal: () => void;

  // Manual triggers (for testing)
  triggerTierUp: (newLevel: number, previousLevel: number) => void;
  triggerLevelUp: (newLevel: number, previousLevel: number) => void;

  // Celebration API
  celebrateLevelChange: (oldLevel: number, newLevel: number) => void;
  checkPendingCelebrations: (groupId: string, currentLevel: number) => Promise<void>;
  saveLastKnownLevel: (groupId: string, level: number) => Promise<void>;
}

const GroupCelebrationContext = createContext<GroupCelebrationContextType | undefined>(undefined);

export const GroupCelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTierUpModal, setShowTierUpModal] = useState(false);
  const [tierUpData, setTierUpData] = useState<TierUpData | null>(null);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  const hasShownTierForLevel = useRef<Set<number>>(new Set());
  const hasShownLevelForLevel = useRef<Set<number>>(new Set());

  /**
   * Save the last known level to AsyncStorage (without triggering celebration)
   */
  const saveLastKnownLevel = useCallback(async (groupId: string, level: number) => {
    try {
      await AsyncStorage.setItem(`group_last_level_${groupId}`, String(level));
      Logger.debug(`[GroupCelebration] Saved last known level for ${groupId}: ${level}`);
    } catch (error) {
      Logger.error('[GroupCelebration] Failed to save last known level:', error);
    }
  }, []);

  /**
   * Get the last known level from AsyncStorage
   */
  const getLastKnownLevel = async (groupId: string): Promise<number | null> => {
    try {
      const saved = await AsyncStorage.getItem(`group_last_level_${groupId}`);
      return saved ? parseInt(saved, 10) : null;
    } catch (error) {
      Logger.error('[GroupCelebration] Failed to get last known level:', error);
      return null;
    }
  };

  /**
   * Check if level changed while user was away (used on initial load)
   */
  const checkPendingCelebrations = useCallback(async (groupId: string, currentLevel: number) => {
    const lastKnownLevel = await getLastKnownLevel(groupId);

    if (!lastKnownLevel || lastKnownLevel === currentLevel) {
      await saveLastKnownLevel(groupId, currentLevel);
      return;
    }

    if (currentLevel > lastKnownLevel) {
      Logger.info(`[GroupCelebration] Level changed while user was away: ${lastKnownLevel} → ${currentLevel}`);
      celebrateLevelChange(lastKnownLevel, currentLevel);
    }

    await saveLastKnownLevel(groupId, currentLevel);
  }, []);

  /**
   * Main celebration logic: detects tier changes and level ups
   */
  const celebrateLevelChange = useCallback((oldLevel: number, newLevel: number) => {
    // Validation
    if (!newLevel || newLevel < 1 || !oldLevel || oldLevel < 1) {
      Logger.debug('[GroupCelebration] Invalid levels', { oldLevel, newLevel });
      return;
    }

    if (newLevel === oldLevel) {
      return;
    }

    if (newLevel < oldLevel) {
      Logger.warn('[GroupCelebration] Level decreased, ignoring', { oldLevel, newLevel });
      return;
    }

    const previousTier = calculateGroupTierFromLevel(oldLevel);
    const currentTier = calculateGroupTierFromLevel(newLevel);

    Logger.info(`[GroupCelebration] Level change: ${oldLevel} → ${newLevel} (Tier ${previousTier} → ${currentTier})`);

    // Tier changed = show Tier Up modal (priority)
    if (currentTier > previousTier && !hasShownTierForLevel.current.has(newLevel)) {
      Logger.info('[GroupCelebration] Tier up detected, showing modal');

      const newTierConfig = getGroupTierConfig(currentTier);

      setTierUpData({
        newTier: currentTier,
        previousTier,
        newLevel: newLevel,
        tierConfig: newTierConfig,
      });

      setShowTierUpModal(true);
      hasShownTierForLevel.current.add(newLevel);
      hasShownLevelForLevel.current.add(newLevel); // Skip level modal
    }
    // Same tier, just level up = show Level Up modal
    else if (!hasShownLevelForLevel.current.has(newLevel)) {
      Logger.info('[GroupCelebration] Level up detected, showing modal');

      setLevelUpData({
        newLevel,
        previousLevel: oldLevel,
        currentTier,
      });

      setShowLevelUpModal(true);
      hasShownLevelForLevel.current.add(newLevel);
    } else {
      Logger.debug('[GroupCelebration] Celebration already shown for this level');
    }
  }, []);

  /**
   * Manual trigger for Tier Up (testing only)
   */
  const triggerTierUp = useCallback((newLevel: number, previousLevel: number) => {
    const newTier = calculateGroupTierFromLevel(newLevel);
    const previousTier = calculateGroupTierFromLevel(previousLevel);
    const tierConfig = getGroupTierConfig(newTier);

    setTierUpData({
      newTier,
      previousTier,
      newLevel,
      tierConfig,
    });

    setShowTierUpModal(true);
  }, []);

  /**
   * Manual trigger for Level Up (testing only)
   */
  const triggerLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    const currentTier = calculateGroupTierFromLevel(newLevel);

    setLevelUpData({
      newLevel,
      previousLevel,
      currentTier,
    });

    setShowLevelUpModal(true);
  }, []);

  const closeTierUpModal = useCallback(() => {
    setShowTierUpModal(false);
    setTimeout(() => setTierUpData(null), 300);
  }, []);

  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
    setTimeout(() => setLevelUpData(null), 300);
  }, []);

  return (
    <GroupCelebrationContext.Provider
      value={{
        showTierUpModal,
        tierUpData,
        closeTierUpModal,
        showLevelUpModal,
        levelUpData,
        closeLevelUpModal,
        triggerTierUp,
        triggerLevelUp,
        celebrateLevelChange,
        checkPendingCelebrations,
        saveLastKnownLevel,
      }}
    >
      {children}
    </GroupCelebrationContext.Provider>
  );
};

export const useGroupCelebration = () => {
  const context = useContext(GroupCelebrationContext);
  if (!context) {
    throw new Error('useGroupCelebration must be used within GroupCelebrationProvider');
  }
  return context;
};
