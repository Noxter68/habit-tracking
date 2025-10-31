// src/context/StatsContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { XPService } from '../services/xpService';
import { HabitService } from '../services/habitService';
import { getAchievementByLevel } from '../utils/achievements';
import { getXPForNextLevel } from '../utils/xpCalculations';
import Logger from '@/utils/logger';

interface Stats {
  title: string;
  level: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
  totalStreak: number;
  activeHabits: number;
  completedTasksToday: number;
  totalTasksToday: number;
  currentAchievement: any;
  totalXP: number;
}

interface StatsContextType {
  stats: Stats | null;
  loading: boolean;
  refreshStats: (forceRefresh?: boolean) => Promise<void>;
  updateStatsOptimistically: (xpAmount: number) => { leveledUp: boolean; newLevel: number } | null;
  lastUpdated: number;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const lastUpdatedRef = useRef(0);

  const refreshStats = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!user?.id) {
        Logger.debug('StatsContext: No user, clearing stats');
        setStats(null);
        return;
      }

      // Skip debounce if force refresh (pull-to-refresh)
      if (!forceRefresh) {
        const now = Date.now();
        if (lastUpdatedRef.current && now - lastUpdatedRef.current < 1000) {
          Logger.debug('StatsContext: Skipping refresh (debounced)');
          return;
        }
      }

      try {
        setLoading(true);
        Logger.debug('StatsContext: Fetching fresh data from backend...');

        // Fetch all data from existing services
        const [xpStats, habitStats, activeHabitsCount, todayStats] = await Promise.all([
          XPService.getUserXPStats(user.id),
          HabitService.getAggregatedStats(user.id),
          HabitService.getActiveHabitsCount(user.id),
          HabitService.getTodayStats(user.id),
        ]);

        Logger.debug('StatsContext: Raw XP data from backend:', {
          total_xp: xpStats?.total_xp,
          current_level: xpStats?.current_level,
          current_level_xp: xpStats?.current_level_xp,
          xp_for_next_level: xpStats?.xp_for_next_level,
        });

        // Use data from the database/view directly
        const totalXP = xpStats?.total_xp || 0;
        const level = xpStats?.current_level || 1;

        // Use current_level_xp from the view (which maps from level_progress)
        const currentLevelXP = xpStats?.current_level_xp || 0;

        // Use xp_for_next_level from the view (calculated by DB function)
        const nextLevelXP = xpStats?.xp_for_next_level || getXPForNextLevel(level);

        // Calculate progress percentage
        const adjustedCurrentXP = Math.max(0, currentLevelXP);
        const progress = nextLevelXP > 0 ? Math.min((adjustedCurrentXP / nextLevelXP) * 100, 100) : 0;

        Logger.debug('StatsContext: Calculated values:', {
          level,
          currentLevelXP: adjustedCurrentXP,
          xpForNextLevel: nextLevelXP,
          progress: `${progress.toFixed(1)}%`,
        });

        // Get achievement for current level
        const currentAchievement = getAchievementByLevel(level);

        const newStats: Stats = {
          title: currentAchievement?.title || 'Novice',
          level,
          currentLevelXP: adjustedCurrentXP,
          xpForNextLevel: nextLevelXP,
          levelProgress: progress,
          totalStreak: habitStats?.totalDaysTracked || 0,
          activeHabits: activeHabitsCount || 0,
          completedTasksToday: todayStats?.completed || todayStats?.completedTasks || 0,
          totalTasksToday: todayStats?.total || todayStats?.totalTasks || 0,
          currentAchievement: currentAchievement || { level: 1, title: 'Novice' },
          totalXP,
        };

        Logger.debug('StatsContext: Final stats object:', newStats);
        setStats(newStats);
        lastUpdatedRef.current = Date.now();
      } catch (err) {
        Logger.error('StatsContext: Error refreshing stats:', err);
        // Don't clear stats on error, keep last known good state
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Optimistic update method - updates UI immediately without backend call
  const updateStatsOptimistically = useCallback(
    (xpAmount: number) => {
      if (!stats) {
        Logger.warn('StatsContext: Cannot update optimistically, no stats available');
        return null;
      }

      Logger.debug('StatsContext: Optimistic update', {
        currentXP: stats.currentLevelXP,
        xpAmount,
        xpForNextLevel: stats.xpForNextLevel,
      });

      const newCurrentLevelXP = stats.currentLevelXP + xpAmount;
      let newLevel = stats.level;
      let newXPForNextLevel = stats.xpForNextLevel;
      let adjustedCurrentXP = newCurrentLevelXP;

      // Check if leveled up
      if (newCurrentLevelXP >= stats.xpForNextLevel) {
        newLevel = stats.level + 1;
        adjustedCurrentXP = newCurrentLevelXP - stats.xpForNextLevel;
        newXPForNextLevel = getXPForNextLevel(newLevel);

        Logger.debug('StatsContext: LEVEL UP!', {
          previousLevel: stats.level,
          newLevel,
          overflow: adjustedCurrentXP,
        });
      }

      const newProgress = newXPForNextLevel > 0 ? Math.min((adjustedCurrentXP / newXPForNextLevel) * 100, 100) : 0;

      const currentAchievement = getAchievementByLevel(newLevel);

      // Update stats optimistically without backend call
      const updatedStats: Stats = {
        ...stats,
        level: newLevel,
        currentLevelXP: adjustedCurrentXP,
        xpForNextLevel: newXPForNextLevel,
        levelProgress: newProgress,
        totalXP: stats.totalXP + xpAmount,
        currentAchievement: currentAchievement || stats.currentAchievement,
        title: currentAchievement?.title || stats.title,
      };

      setStats(updatedStats);

      Logger.debug('StatsContext: Optimistic update complete', {
        newLevel,
        newCurrentLevelXP: adjustedCurrentXP,
        newProgress: `${newProgress.toFixed(1)}%`,
      });

      // Return whether user leveled up
      return {
        leveledUp: newLevel > stats.level,
        newLevel,
      };
    },
    [stats]
  );

  // Initial load when user changes
  useEffect(() => {
    if (user?.id) {
      Logger.debug('StatsContext: User detected, loading initial stats');
      refreshStats(true); // Force refresh on user change
    } else {
      setStats(null);
      lastUpdatedRef.current = 0;
    }
  }, [user?.id, refreshStats]);

  return (
    <StatsContext.Provider
      value={{
        stats,
        loading,
        refreshStats,
        updateStatsOptimistically,
        lastUpdated: lastUpdatedRef.current,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
};
