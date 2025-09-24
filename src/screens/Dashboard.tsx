// src/screens/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';

// Services & Context
import { useAuth } from '../context/AuthContext';
import { HabitService } from '../services/habitService';
import { XPService } from '../services/xpService';
import { achievementTitles, getAchievementByLevel } from '../utils/achievements';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // User stats
  const [userStats, setUserStats] = useState({
    title: 'Novice',
    level: 1,
    currentLevelXP: 0,
    xpForNextLevel: 100,
    levelProgress: 0,
    totalStreak: 0,
    activeHabits: 0,
    completedTasksToday: 0,
    totalTasksToday: 0,
    currentAchievement: null,
  });

  useEffect(() => {
    fetchUserStats();
  }, [user?.id, refreshTrigger]);

  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      // Fetch XP stats
      const xpStats = await XPService.getUserXPStats(user.id);
      const level = xpStats?.current_level || 1;
      const currentXP = xpStats?.current_level_xp || 0;
      const nextLevelXP = xpStats?.xp_for_next_level || 100;

      // Fetch habit stats
      const habitStats = await HabitService.getAggregatedStats(user.id);
      const activeHabitsCount = await HabitService.getActiveHabitsCount(user.id);
      const todayStats = await HabitService.getTodayStats(user.id);

      // Calculate level progress
      const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 0;

      // Get user title and achievement from achievementTitles
      const currentAchievement = getAchievementByLevel(level);
      const title = currentAchievement?.title || 'Novice';

      console.log('Current achievement:', currentAchievement); // Debug log

      setUserStats({
        title,
        level,
        currentLevelXP: currentXP,
        xpForNextLevel: nextLevelXP,
        levelProgress: progress,
        totalStreak: habitStats?.totalDaysTracked || 0,
        activeHabits: activeHabitsCount || 0,
        completedTasksToday: todayStats?.completed || 0,
        totalTasksToday: todayStats?.total || 0,
        currentAchievement: currentAchievement || { level, title },
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  const handleXPCollected = (amount: number) => {
    // Update local state optimistically
    setUserStats((prev) => {
      const newXP = prev.currentLevelXP + amount;
      const newProgress = prev.xpForNextLevel > 0 ? (newXP / prev.xpForNextLevel) * 100 : 0;

      return {
        ...prev,
        currentLevelXP: newXP,
        levelProgress: newProgress,
      };
    });

    // Refresh stats
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-amber-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tw.color('amber-600')} />}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader
          userTitle={userStats.title}
          userLevel={userStats.level}
          totalStreak={userStats.totalStreak}
          activeHabits={userStats.activeHabits}
          completedTasksToday={userStats.completedTasksToday}
          totalTasksToday={userStats.totalTasksToday}
          onXPCollected={handleXPCollected}
          refreshTrigger={refreshTrigger}
          currentAchievement={userStats.currentAchievement}
          currentLevelXP={userStats.currentLevelXP}
          xpForNextLevel={userStats.xpForNextLevel}
          levelProgress={userStats.levelProgress}
        />

        {/* Add other dashboard sections here if needed */}
        <View style={tw`mt-6`}>{/* Additional dashboard content */}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
