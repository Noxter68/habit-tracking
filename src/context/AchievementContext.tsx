// src/context/AchievementContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { XPService, UserXPStats, XPBreakdown } from '../services/xpService';
import { achievementTitles, getAchievementByLevel } from '../utils/achievements';
import { HabitService } from '@/services/habitService';

interface AchievementContextType {
  // XP Stats
  totalXP: number;
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
  totalCompletions: number;

  // User Info
  userTitle: string;
  currentAchievement: any;
  nextAchievement: any;

  // Daily Challenge
  dailyTasksCompleted: number;
  dailyTasksTotal: number;
  dailyChallengeCollected: boolean;

  // Methods - Enhanced versions
  collectDailyChallenge: () => Promise<boolean>;
  awardHabitXP: (
    habitId: string,
    habitType: 'good' | 'bad',
    tasksCompleted: number,
    totalTasks: number,
    streak: number,
    tierMultiplier?: number
  ) => Promise<{ xpEarned: number; breakdown: XPBreakdown }>;
  refreshXPStats: () => Promise<void>;
  checkAchievements: () => Promise<void>;
  getXPPreview: (habitType: 'good' | 'bad', tasksToComplete: number, totalTasks: number, currentStreak: number, wouldCompleteDay: boolean, tierMultiplier?: number) => number;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // XP Stats
  const [totalXP, setTotalXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentLevelXP, setCurrentLevelXP] = useState(0);
  const [xpForNextLevel, setXpForNextLevel] = useState(100);
  const [levelProgress, setLevelProgress] = useState(0);

  // User Info
  const [userTitle, setUserTitle] = useState('Beginner');
  const [currentAchievement, setCurrentAchievement] = useState<any>(null);
  const [nextAchievement, setNextAchievement] = useState<any>(null);

  // Daily Challenge
  const [dailyTasksCompleted, setDailyTasksCompleted] = useState(0);
  const [dailyTasksTotal, setDailyTasksTotal] = useState(0);
  const [dailyChallengeCollected, setDailyChallengeCollected] = useState(false);
  const [totalCompletions, setTotalCompletions] = useState(0);

  // Load XP stats on mount and user change
  useEffect(() => {
    if (user) {
      loadXPStats();
      subscribeToUpdates();
    }
  }, [user]);

  // Update achievement titles when level changes
  useEffect(() => {
    const achievement = getAchievementByLevel(currentLevel);
    const next = getAchievementByLevel(currentLevel + 1);

    setCurrentAchievement(achievement);
    setNextAchievement(next);
    setUserTitle(achievement?.title || 'Beginner');
  }, [currentLevel]);

  const loadXPStats = async () => {
    if (!user) return;

    const [stats, habitStats] = await Promise.all([XPService.getUserXPStats(user.id), HabitService.getAggregatedStats(user.id)]);

    if (stats) {
      setTotalXP(stats.total_xp);
      setCurrentLevel(stats.current_level);
      setCurrentLevelXP(stats.current_level_xp);
      setXpForNextLevel(stats.xp_for_next_level);
      setLevelProgress(stats.level_progress);
      setDailyTasksCompleted(stats.daily_tasks_completed || 0);
      setDailyTasksTotal(stats.daily_tasks_total || 0);
      setDailyChallengeCollected(stats.daily_challenge_collected || false);
      setTotalCompletions(habitStats?.totalCompletions || 0);
    }

    // Load or create daily challenge
    const challenge = await XPService.getOrCreateDailyChallenge(user.id);
    if (challenge) {
      setDailyTasksCompleted(challenge.completed_tasks);
      setDailyTasksTotal(challenge.total_tasks);
      setDailyChallengeCollected(challenge.xp_collected);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    return XPService.subscribeToXPUpdates(user.id, (stats) => {
      setTotalXP(stats.total_xp);
      setCurrentLevel(stats.current_level);
      setCurrentLevelXP(stats.current_level_xp);
      setXpForNextLevel(stats.xp_for_next_level);
      setLevelProgress(stats.level_progress);
      setDailyTasksCompleted(stats.daily_tasks_completed || dailyTasksCompleted);
      setDailyTasksTotal(stats.daily_tasks_total || dailyTasksTotal);
      setDailyChallengeCollected(stats.daily_challenge_collected || dailyChallengeCollected);
    });
  };

  const collectDailyChallenge = async (): Promise<boolean> => {
    if (!user) return false;

    const success = await XPService.collectDailyChallenge(user.id);
    if (success) {
      setDailyChallengeCollected(true);
      // Refresh stats to show new XP
      await loadXPStats();

      // Check for level up
      const newLevel = XPService.calculateLevelFromXP(totalXP + 20);
      if (newLevel > currentLevel) {
        // Trigger level up animation/notification
        // This could trigger a toast or modal in your UI
        console.log(`Level up! You're now level ${newLevel}!`);
      }
    }
    return success;
  };

  const awardHabitXP = async (
    habitId: string,
    habitType: 'good' | 'bad',
    tasksCompleted: number,
    totalTasks: number,
    streak: number,
    tierMultiplier: number = 1.0
  ): Promise<{ xpEarned: number; breakdown: XPBreakdown }> => {
    if (!user) return { xpEarned: 0, breakdown: { base: 0, tasks: 0, streak: 0, tier: 0, milestone: 0, total: 0 } };

    const result = await XPService.completeHabitWithBreakdown(user.id, habitId, habitType, tasksCompleted, totalTasks, streak, tierMultiplier);

    if (result.xpEarned > 0) {
      // Update daily progress is now handled in HabitContext
      // Just refresh our stats
      await loadXPStats();

      // Check for level up
      const previousLevel = currentLevel;
      const newLevel = XPService.calculateLevelFromXP(totalXP + result.xpEarned);

      if (newLevel > previousLevel) {
        console.log(`Level up! You're now level ${newLevel}!`);
        // You could emit an event here for UI components to listen to
      }
    }

    return result;
  };

  const getXPPreview = (habitType: 'good' | 'bad', tasksToComplete: number, totalTasks: number, currentStreak: number, wouldCompleteDay: boolean, tierMultiplier: number = 1.0): number => {
    return XPService.getXPPreview(habitType, tasksToComplete, totalTasks, currentStreak, wouldCompleteDay, tierMultiplier);
  };

  const refreshXPStats = async () => {
    await loadXPStats();
  };

  const checkAchievements = async () => {
    // This can be extended to check for special achievements
    // For now, just refresh stats
    await loadXPStats();
  };

  const value: AchievementContextType = {
    // XP Stats
    totalXP,
    currentLevel,
    currentLevelXP,
    xpForNextLevel,
    levelProgress,
    totalCompletions,

    // User Info
    userTitle,
    currentAchievement,
    nextAchievement,

    // Daily Challenge
    dailyTasksCompleted,
    dailyTasksTotal,
    dailyChallengeCollected,

    // Methods
    collectDailyChallenge,
    awardHabitXP,
    refreshXPStats,
    checkAchievements,
    getXPPreview,
  };

  return <AchievementContext.Provider value={value}>{children}</AchievementContext.Provider>;
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
