// src/context/LevelUpContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useStats } from './StatsContext';
import { getAchievementByLevel } from '../utils/achievements';

interface LevelUpData {
  newLevel: number;
  previousLevel: number;
  achievement: any;
}

interface LevelUpContextType {
  showLevelUpModal: boolean;
  levelUpData: LevelUpData | null;
  triggerLevelUp: (newLevel: number, previousLevel: number) => void;
  closeLevelUpModal: () => void;
  checkForLevelUp: () => void;
}

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

export const LevelUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { stats } = useStats();
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);
  const previousLevelRef = useRef<number | null>(null);
  const hasShownForLevel = useRef<Set<number>>(new Set());

  // Check for level changes
  const checkForLevelUp = useCallback(() => {
    if (!stats?.level) return;

    // Initialize previous level on first load
    if (previousLevelRef.current === null) {
      previousLevelRef.current = stats.level;
      console.log('LevelUpContext: Initial level set:', stats.level);
      return;
    }

    // Check if level increased and we haven't shown modal for this level yet
    if (stats.level > previousLevelRef.current && !hasShownForLevel.current.has(stats.level)) {
      console.log(`LevelUpContext: LEVEL UP DETECTED! ${previousLevelRef.current} → ${stats.level}`);

      const newAchievement = getAchievementByLevel(stats.level);

      setLevelUpData({
        newLevel: stats.level,
        previousLevel: previousLevelRef.current,
        achievement: newAchievement,
      });

      setShowLevelUpModal(true);
      hasShownForLevel.current.add(stats.level);
      previousLevelRef.current = stats.level;
    } else if (stats.level !== previousLevelRef.current) {
      // Update reference if level changed (even if decreased, though this shouldn't happen)
      previousLevelRef.current = stats.level;
    }
  }, [stats?.level]);

  // Manual trigger for testing or special cases
  const triggerLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    const achievement = getAchievementByLevel(newLevel);

    setLevelUpData({
      newLevel,
      previousLevel,
      achievement,
    });

    setShowLevelUpModal(true);
  }, []);

  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
    // Don't clear levelUpData immediately to prevent flicker
    setTimeout(() => {
      setLevelUpData(null);
    }, 300);
  }, []);

  // Monitor stats changes
  useEffect(() => {
    checkForLevelUp();
  }, [stats?.level, checkForLevelUp]);

  // Reset tracked levels on user change
  useEffect(() => {
    if (!stats) {
      previousLevelRef.current = null;
      hasShownForLevel.current.clear();
    }
  }, [stats]);

  return (
    <LevelUpContext.Provider
      value={{
        showLevelUpModal,
        levelUpData,
        triggerLevelUp,
        closeLevelUpModal,
        checkForLevelUp,
      }}
    >
      {children}
    </LevelUpContext.Provider>
  );
};

export const useLevelUp = () => {
  const context = useContext(LevelUpContext);
  if (!context) {
    throw new Error('useLevelUp must be used within LevelUpProvider');
  }
  return context;
};
