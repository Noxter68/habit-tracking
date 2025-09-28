// src/context/StatsContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { XPService } from '../services/xpService';
import { HabitService } from '../services/habitService';
import { getAchievementByLevel } from '../utils/achievements';
import { getXPForNextLevel } from '../utils/xpCalculations';

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
        console.log('StatsContext: No user, clearing stats');
        setStats(null);
        return;
      }

      // Skip debounce if force refresh (pull-to-refresh)
      if (!forceRefresh) {
        const now = Date.now();
        if (lastUpdatedRef.current && now - lastUpdatedRef.current < 1000) {
          console.log('StatsContext: Skipping refresh (debounced)');
          return;
        }
      }

      try {
        setLoading(true);
        console.log('StatsContext: Fetching fresh data from backend...');

        // Fetch all data from existing services
        const [xpStats, habitStats, activeHabitsCount, todayStats] = await Promise.all([
          XPService.getUserXPStats(user.id),
          HabitService.getAggregatedStats(user.id),
          HabitService.getActiveHabitsCount(user.id),
          HabitService.getTodayStats(user.id),
        ]);

        console.log('StatsContext: Raw data from backend:', {
          xpStats,
          habitStats,
          activeHabitsCount,
          todayStats,
        });

        // Calculate level and XP using existing data
        const totalXP = xpStats?.total_xp || 0;
        const level = xpStats?.current_level || 1;
        const currentLevelXP = xpStats?.current_level_xp || 0;
        const nextLevelXP = getXPForNextLevel(level);

        // Calculate progress percentage
        const adjustedCurrentXP = Math.max(0, currentLevelXP);
        const progress = nextLevelXP > 0 ? (adjustedCurrentXP / nextLevelXP) * 100 : 0;

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

        console.log('StatsContext: Calculated stats:', newStats);
        setStats(newStats);
        lastUpdatedRef.current = Date.now();
      } catch (err) {
        console.error('StatsContext: Error refreshing stats:', err);
        // Don't clear stats on error, keep last known good state
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // Initial load when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('StatsContext: User detected, loading initial stats');
      refreshStats(true); // Force refresh on user change
    } else {
      setStats(null);
      lastUpdatedRef.current = 0;
    }
  }, [user?.id]);

  return (
    <StatsContext.Provider
      value={{
        stats,
        loading,
        refreshStats,
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
