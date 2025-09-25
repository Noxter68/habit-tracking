// src/screens/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';

// Services & Context
import { useAuth } from '../context/AuthContext';
import { HabitService } from '../services/habitService';
import { XPService } from '../services/xpService';
import { getAchievementByLevel } from '../utils/achievements';

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
    currentAchievement: null as any,
  });

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Fetch XP stats from backend
      const xpStats = await XPService.getUserXPStats(user.id);
      const level = xpStats?.current_level || 1;
      const currentXP = xpStats?.current_level_xp || 0;
      const nextLevelXP = xpStats?.xp_for_next_level || 100;

      // Ensure XP doesn't exceed the level requirement (handle overflow)
      const adjustedCurrentXP = currentXP % nextLevelXP;

      // Fetch habit stats
      const habitStats = await HabitService.getAggregatedStats(user.id);
      const activeHabitsCount = await HabitService.getActiveHabitsCount(user.id);
      const todayStats = await HabitService.getTodayStats(user.id);

      // Calculate level progress (as percentage)
      const progress = nextLevelXP > 0 ? (adjustedCurrentXP / nextLevelXP) * 100 : 0;

      // Get user title and achievement
      const currentAchievement = getAchievementByLevel(level);
      const title = currentAchievement?.title || 'Novice';

      setUserStats({
        title,
        level,
        currentLevelXP: adjustedCurrentXP,
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
  }, [user?.id]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats, refreshTrigger]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserStats();
    setRefreshTrigger((prev) => prev + 1);
    setRefreshing(false);
  };

  const handleStatsRefresh = useCallback(() => {
    // Just fetch fresh data from backend
    fetchUserStats();
    setRefreshTrigger((prev) => prev + 1);
  }, [fetchUserStats]);

  const handleXPCollected = useCallback(
    (amount: number) => {
      handleStatsRefresh();
    },
    [handleStatsRefresh]
  );

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
          onStatsRefresh={handleStatsRefresh}
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
