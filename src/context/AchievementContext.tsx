// src/context/AchievementContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { XPService, UserXPStats } from '../services/xpService';
import { achievementTitles, getAchievementByLevel } from '../utils/achievements';

interface AchievementContextType {
  // XP Stats
  totalXP: number;
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;

  // User Info
  userTitle: string;
  currentAchievement: any;
  nextAchievement: any;

  // Daily Challenge
  dailyTasksCompleted: number;
  dailyTasksTotal: number;
  dailyChallengeCollected: boolean;

  // Methods
  collectDailyChallenge: () => Promise<boolean>;
  awardHabitXP: (habitId: string, habitType: 'good' | 'bad', tasksCompleted: number, streak: number) => Promise<number>;
  refreshXPStats: () => Promise<void>;
  checkAchievements: () => Promise<void>;
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

    const stats = await XPService.getUserXPStats(user.id);
    if (stats) {
      setTotalXP(stats.total_xp);
      setCurrentLevel(stats.current_level);
      setCurrentLevelXP(stats.current_level_xp);
      setXpForNextLevel(stats.xp_for_next_level);
      setLevelProgress(stats.level_progress);
      setDailyTasksCompleted(stats.daily_tasks_completed || 0);
      setDailyTasksTotal(stats.daily_tasks_total || 0);
      setDailyChallengeCollected(stats.daily_challenge_collected || false);
    }

    // Load daily challenge
    const challenge = await XPService.getDailyChallenge(user.id);
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
    });
  };

  const collectDailyChallenge = async (): Promise<boolean> => {
    if (!user) return false;

    const success = await XPService.collectDailyChallenge(user.id);
    if (success) {
      setDailyChallengeCollected(true);
      // Refresh stats to show new XP
      await loadXPStats();

      // Show level up notification if needed
      const newLevel = XPService.calculateLevelFromXP(totalXP + 20);
      if (newLevel > currentLevel) {
        // Trigger level up animation/notification
        console.log('LEVEL UP! You are now level', newLevel);
      }
    }
    return success;
  };

  const awardHabitXP = async (habitId: string, habitType: 'good' | 'bad', tasksCompleted: number, streak: number): Promise<number> => {
    if (!user) return 0;

    const xpEarned = await XPService.completeHabit(user.id, habitId, habitType, tasksCompleted, streak);

    if (xpEarned > 0) {
      // Update daily progress
      await XPService.updateDailyProgress(user.id, dailyTasksCompleted + (tasksCompleted || 1), dailyTasksTotal);

      // Refresh stats
      await loadXPStats();
    }

    return xpEarned;
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
