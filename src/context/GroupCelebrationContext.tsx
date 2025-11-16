// src/context/GroupCelebrationContext.tsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
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

  // ✨ NOUVEAU: API simple qui prend l'ancien ET le nouveau niveau
  celebrateLevelChange: (oldLevel: number, newLevel: number) => void;
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
   * ✨ NOUVELLE API: Simple et claire - prend l'ancien et le nouveau niveau
   */
  const celebrateLevelChange = useCallback((oldLevel: number, newLevel: number) => {
    // Validation
    if (!newLevel || newLevel < 1 || !oldLevel || oldLevel < 1) {
      Logger.debug('GroupCelebration: Invalid levels', { oldLevel, newLevel });
      return;
    }

    // Pas de changement
    if (newLevel === oldLevel) {
      return;
    }

    // Level decreased (shouldn't happen)
    if (newLevel < oldLevel) {
      Logger.debug('GroupCelebration: Level decreased, ignoring', { oldLevel, newLevel });
      return;
    }

    Logger.debug(`GroupCelebration: Level change detected ${oldLevel} → ${newLevel}`);

    const previousTier = calculateGroupTierFromLevel(oldLevel);
    const currentTier = calculateGroupTierFromLevel(newLevel);

    Logger.debug(`GroupCelebration: Tier check ${previousTier} → ${currentTier}`);

    // TIER CHANGED = TIER UP MODAL (prioritaire)
    if (currentTier > previousTier && !hasShownTierForLevel.current.has(newLevel)) {
      Logger.debug('🎉 TIER UP DETECTED!');

      const newTierConfig = getGroupTierConfig(currentTier);

      setTierUpData({
        newTier: currentTier,
        previousTier,
        newLevel: newLevel,
        tierConfig: newTierConfig,
      });

      setShowTierUpModal(true);
      hasShownTierForLevel.current.add(newLevel);
      hasShownLevelForLevel.current.add(newLevel); // Skip level modal too
    }
    // SAME TIER, JUST LEVEL UP = LEVEL UP MODAL
    else if (!hasShownLevelForLevel.current.has(newLevel)) {
      Logger.debug('📈 LEVEL UP DETECTED!');

      setLevelUpData({
        newLevel,
        previousLevel: oldLevel,
        currentTier,
      });

      setShowLevelUpModal(true);
      hasShownLevelForLevel.current.add(newLevel);
    }
  }, []);

  /**
   * Manual trigger for Tier Up (testing)
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
   * Manual trigger for Level Up (testing)
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
        celebrateLevelChange, // ✨ Nouvelle API simple
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
