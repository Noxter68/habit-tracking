import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { XPService } from '../services/xpService';
import { HabitService } from '../services/habitService';
import { AchievementService } from '../services/AchievementService';
import { achievementTitles, getAchievementByLevel } from '../utils/achievements';
import { Achievement } from '../types/achievement.types';
import Logger from '@/utils/logger';

interface AchievementContextType {
  achievements: Achievement[];
  totalCompletions: number;
  totalXP: number;
  currentLevel: number;
  levelProgress: number;
  streak: number;
  perfectDays: number;
  totalHabits: number;
  loading: boolean;

  // Computed titles
  currentTitle: Achievement | undefined;
  nextTitle: Achievement | undefined;

  // Methods
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch all achievement-related stats
  const refreshAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [xpStats, habitStats, userAchievements, habits] = await Promise.all([
        XPService.getUserXPStats(user.id),
        HabitService.getAggregatedStats(user.id),
        AchievementService.getUserAchievements(user.id),
        HabitService.fetchHabits(user.id),
      ]);

      const perfectDayCount = habitStats?.streakData?.filter((d: any) => d.value === 100).length || 0;

      setTotalCompletions(habitStats?.totalCompletions || 0);
      setTotalXP(xpStats?.total_xp || 0);
      setCurrentLevel(xpStats?.current_level || 1);
      setLevelProgress(xpStats?.level_progress || 0);
      setStreak(habitStats?.totalDaysTracked || 0);
      setPerfectDays(perfectDayCount);
      setTotalHabits(habits?.length || 0);

      setAchievements(userAchievements || []);

      // 🔑 Check if new achievements should be unlocked
      const newAchievements = await AchievementService.checkAndUnlockAchievements(user.id, {
        streak: habitStats?.totalDaysTracked || 0,
        totalCompletions: habitStats?.totalCompletions || 0,
        perfectDays: perfectDayCount,
        totalHabits: habits?.length || 0,
      });

      if (newAchievements?.length > 0) {
        const updatedAchievements = await AchievementService.getUserAchievements(user.id);
        setAchievements(updatedAchievements || []);
      }
    } catch (err) {
      Logger.error('Error refreshing achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Auto-load when user changes
  useEffect(() => {
    if (user?.id) {
      refreshAchievements();
    } else {
      setAchievements([]);
    }
  }, [user?.id, refreshAchievements]);

  const currentTitle = getAchievementByLevel(currentLevel);
  const nextTitle = getAchievementByLevel(currentLevel + 1);

  const value: AchievementContextType = {
    achievements,
    totalCompletions,
    totalXP,
    currentLevel,
    levelProgress,
    streak,
    perfectDays,
    totalHabits,
    loading,
    currentTitle,
    nextTitle,
    refreshAchievements,
  };

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
};

export const useAchievements = () => {
  const ctx = useContext(AchievementContext);
  if (!ctx) throw new Error('useAchievements must be used inside AchievementProvider');
  return ctx;
};
