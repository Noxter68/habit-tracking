// src/screens/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SwipeableHabitCard from '../components/SwipeableHabitCard';

// Services & Context
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { HabitService } from '../services/habitService';
import { XPService } from '../services/xpService';
import { getAchievementByLevel } from '../utils/achievements';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { habits, loading: habitsLoading, toggleHabitDay, toggleTask, deleteHabit, refreshHabits } = useHabits();

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
    try {
      await Promise.all([fetchUserStats(), refreshHabits()]);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setRefreshing(false);
    }
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

  const handleHabitPress = (habitId: string) => {
    // Navigate to HabitDetails screen
    navigation.navigate('HabitDetails' as never, { habitId } as never);
  };

  const handleCreateHabit = () => {
    navigation.navigate('HabitWizard' as never);
  };

  if (habitsLoading && habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={tw.color('achievement-amber-600')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Gradient Background */}
      <LinearGradient colors={['rgba(254, 243, 199, 0.4)', 'rgba(253, 230, 138, 0.2)', 'transparent']} style={tw`absolute top-0 left-0 right-0 h-120`} pointerEvents="none" />

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`px-4 pt-5 pb-24`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={tw.color('achievement-amber-600')} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Header */}
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

        {/* Habits Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={tw`mt-6`}>
          {/* Section Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={tw`text-xl font-bold text-gray-900`}>Today's Habits</Text>
              <Text style={tw`text-sm text-gray-500 mt-0.5`}>
                {habits.length > 0 ? `${userStats.completedTasksToday} of ${userStats.totalTasksToday} tasks done` : 'Start building your first habit'}
              </Text>
            </View>

            {habits.length > 0 && (
              <Pressable onPress={handleCreateHabit} style={({ pressed }) => [tw`w-10 h-10 rounded-xl items-center justify-center`, pressed && tw`scale-95`]}>
                <LinearGradient colors={['#fbbf24', '#f59e0b']} style={tw`w-full h-full rounded-xl items-center justify-center`}>
                  <Plus size={20} color="#ffffff" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {/* Habit Cards or Empty State */}
          {habits.length > 0 ? (
            <View style={tw`gap-3`}>
              {habits.map((habit, index) => (
                <SwipeableHabitCard
                  key={habit.id}
                  habit={habit}
                  onToggleDay={toggleHabitDay}
                  onToggleTask={toggleTask}
                  onDelete={deleteHabit}
                  onPress={() => handleHabitPress(habit.id)}
                  index={index}
                />
              ))}
            </View>
          ) : (
            // Empty State
            <Pressable onPress={handleCreateHabit} style={({ pressed }) => [pressed && tw`scale-[0.98]`]}>
              <LinearGradient colors={['rgba(254, 243, 199, 0.3)', 'rgba(253, 230, 138, 0.2)']} style={tw`rounded-2xl p-8 items-center border border-achievement-amber-200`}>
                <View style={tw`w-16 h-16 mb-4`}>
                  <LinearGradient colors={['#fbbf24', '#f59e0b']} style={tw`w-full h-full rounded-2xl items-center justify-center`}>
                    <Plus size={28} color="#ffffff" strokeWidth={2.5} />
                  </LinearGradient>
                </View>

                <Text style={tw`text-lg font-bold text-achievement-amber-900 mb-2`}>Create Your First Habit</Text>
                <Text style={tw`text-sm text-achievement-amber-700 text-center px-4`}>Start your journey to build better habits and earn achievements!</Text>

                <View style={tw`mt-4 px-6 py-2 bg-white rounded-full border border-achievement-amber-300`}>
                  <Text style={tw`text-sm font-semibold text-achievement-amber-800`}>Tap to Begin →</Text>
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
