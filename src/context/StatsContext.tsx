// src/context/StatsContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { XPService } from '@/services/xpService';
import { HabitService } from '@/services/habitService';
import { getAchievementByLevel } from '@/utils/achievements';

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
}

interface StatsContextType {
  stats: Stats | null;
  loading: boolean;
  refreshStats: (force?: boolean) => Promise<void>;
  lastUpdated: number;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const lastUpdatedRef = useRef(0);

  const refreshStats = useCallback(
    async (force: boolean = false) => {
      if (!user?.id) return;

      const now = Date.now();
      if (!force && now - lastUpdatedRef.current < 30_000) {
        console.log('⏭ Skipping stats fetch - cache still fresh');
        return;
      }

      setLoading(true);
      try {
        // fetch from Supabase services
        const xpStats = await XPService.getUserXPStats(user.id);
        const level = xpStats?.current_level || 1;
        const currentXP = xpStats?.current_level_xp || 0;
        const nextLevelXP = xpStats?.xp_for_next_level || 100;
        const adjustedCurrentXP = currentXP % nextLevelXP;

        const habitStats = await HabitService.getAggregatedStats(user.id);
        const activeHabitsCount = await HabitService.getActiveHabitsCount(user.id);
        const todayStats = await HabitService.getTodayStats(user.id);

        const progress = nextLevelXP > 0 ? (adjustedCurrentXP / nextLevelXP) * 100 : 0;
        const currentAchievement = getAchievementByLevel(level);

        setStats({
          title: currentAchievement?.title || 'Novice',
          level,
          currentLevelXP: adjustedCurrentXP,
          xpForNextLevel: nextLevelXP,
          levelProgress: progress,
          totalStreak: habitStats?.totalDaysTracked || 0,
          activeHabits: activeHabitsCount || 0,
          completedTasksToday: todayStats?.completed || 0,
          totalTasksToday: todayStats?.total || 0,
          currentAchievement: currentAchievement || { level, title: 'Novice' },
        });

        lastUpdatedRef.current = Date.now();
      } catch (err) {
        console.error('Error refreshing stats:', err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  // initial load
  useEffect(() => {
    if (user?.id) {
      refreshStats(true);
    } else {
      setStats(null);
    }
  }, [user?.id, refreshStats]);

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
