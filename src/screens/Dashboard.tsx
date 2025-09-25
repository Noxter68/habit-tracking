// src/screens/Dashboard.tsx
import React, { useCallback, useRef, useEffect } from 'react';
import { ScrollView, RefreshControl, View, Text, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SwipeableHabitCard from '../components/SwipeableHabitCard';

// Contexts
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useStats } from '../context/StatsContext';

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { habits, loading: habitsLoading, toggleHabitDay, toggleTask, deleteHabit, refreshHabits } = useHabits();

  const { stats, loading: statsLoading, refreshStats } = useStats();

  const renderCount = useRef(0);
  renderCount.current++;
  useEffect(() => {
    console.log(`Dashboard render #${renderCount.current}`);
  });

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshStats(true), refreshHabits()]);
  }, [refreshStats, refreshHabits]);

  // Navigation handlers
  const handleHabitPress = useCallback(
    (habitId: string) => {
      navigation.navigate('HabitDetails' as never, { habitId } as never);
    },
    [navigation]
  );

  const handleCreateHabit = useCallback(() => {
    navigation.navigate('HabitWizard' as never);
  }, [navigation]);

  // Loading state (first load)
  if ((habitsLoading || statsLoading) && habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-white`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={tw.color('amber-600')} />
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
        refreshControl={<RefreshControl refreshing={habitsLoading || statsLoading} onRefresh={handleRefresh} tintColor={tw.color('amber-600')} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Header */}
        <DashboardHeader
          userTitle={stats?.title ?? 'Novice'}
          userLevel={stats?.level ?? 1}
          totalStreak={stats?.totalStreak ?? 0}
          activeHabits={stats?.activeHabits ?? 0}
          completedTasksToday={stats?.completedTasksToday ?? 0}
          totalTasksToday={stats?.totalTasksToday ?? 0}
          currentAchievement={stats?.currentAchievement}
          currentLevelXP={stats?.currentLevelXP ?? 0}
          xpForNextLevel={stats?.xpForNextLevel ?? 100}
          levelProgress={stats?.levelProgress ?? 0}
          onStatsRefresh={() => refreshStats(true)}
          onXPCollected={() => refreshStats(true)}
        />

        {/* Habits Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={tw`mt-6`}>
          {/* Section Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={tw`text-xl font-bold text-gray-900`}>Today&apos;s Habits</Text>
              <Text style={tw`text-sm text-gray-500 mt-0.5`}>
                {habits.length > 0 ? `${stats?.completedTasksToday ?? 0} of ${stats?.totalTasksToday ?? 0} tasks done` : 'Start building your first habit'}
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
              <LinearGradient colors={['rgba(254, 243, 199, 0.3)', 'rgba(253, 230, 138, 0.2)']} style={tw`rounded-2xl p-8 items-center border border-amber-200`}>
                <View style={tw`w-16 h-16 mb-4`}>
                  <LinearGradient colors={['#fbbf24', '#f59e0b']} style={tw`w-full h-full rounded-2xl items-center justify-center`}>
                    <Plus size={28} color="#ffffff" strokeWidth={2.5} />
                  </LinearGradient>
                </View>

                <Text style={tw`text-lg font-bold text-amber-900 mb-2`}>Create Your First Habit</Text>
                <Text style={tw`text-sm text-amber-700 text-center px-4`}>Start your journey to build better habits and earn achievements!</Text>

                <View style={tw`mt-4 px-6 py-2 bg-white rounded-full border border-amber-300`}>
                  <Text style={tw`text-sm font-semibold text-amber-800`}>Tap to Begin →</Text>
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
