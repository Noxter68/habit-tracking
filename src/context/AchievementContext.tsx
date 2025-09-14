// src/context/AchievementContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import { useHabits } from './HabitContext';
import { AchievementService, Achievement, UserAchievement } from '../services/AchievementService';

interface AchievementContextType {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  userTitle: string;
  streak: number;
  totalCompletions: number;
  loading: boolean;
  checkAchievements: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userTitle, setUserTitle] = useState<string>('Newcomer');
  const [streak, setStreak] = useState(0);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { habits } = useHabits();

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  useEffect(() => {
    if (user && habits.length > 0) {
      checkAchievements();
    }
  }, [habits]);

  const loadAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load all achievements
      const allAchievements = await AchievementService.getAllAchievements();
      setAchievements(allAchievements);

      // Load user achievements
      const userAchs = await AchievementService.getUserAchievements(user.id);
      setUserAchievements(userAchs);

      // Set current title
      if (userAchs.length > 0) {
        const latestAchievement = userAchs.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())[0];
        setUserTitle(latestAchievement.title);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAchievements = async () => {
    if (!user || !habits || habits.length === 0) return;

    try {
      // Calculate user stats
      const maxStreak = Math.max(...habits.map((h) => h.currentStreak || 0), 0);
      const completions = habits.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0);
      const perfectDays = calculatePerfectDays();
      const totalHabits = habits.length;

      setStreak(maxStreak);
      setTotalCompletions(completions);

      // Check for new achievements
      const newAchievements = await AchievementService.checkAndUnlockAchievements(user.id, {
        streak: maxStreak,
        totalCompletions: completions,
        perfectDays,
        totalHabits,
      });

      if (newAchievements.length > 0) {
        // Show notification for each new achievement
        newAchievements.forEach((achievement) => {
          Alert.alert('🎉 Achievement Unlocked!', `You've earned the title: ${achievement.title}\n${achievement.description}`, [{ text: 'Awesome!', style: 'default' }]);
        });

        // Update user title to the latest achievement
        const latestTitle = newAchievements[newAchievements.length - 1].title;
        setUserTitle(latestTitle);

        // Reload achievements
        await loadAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const calculatePerfectDays = () => {
    if (habits.length === 0) return 0;

    const allDates = new Set<string>();
    habits.forEach((habit) => {
      habit.completedDays?.forEach((date) => allDates.add(date));
    });

    return Array.from(allDates).filter((date) => habits.every((habit) => habit.completedDays?.includes(date))).length;
  };

  const refreshAchievements = async () => {
    await loadAchievements();
    await checkAchievements();
  };

  return (
    <AchievementContext.Provider
      value={{
        achievements,
        userAchievements,
        userTitle,
        streak,
        totalCompletions,
        loading,
        checkAchievements,
        refreshAchievements,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
