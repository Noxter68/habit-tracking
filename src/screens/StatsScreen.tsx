// src/screens/StatsScreen.tsx
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut, Layout, SlideInRight, useAnimatedStyle, withSpring, withTiming, useSharedValue, interpolate, Easing } from 'react-native-reanimated';
import tw from '../lib/tailwind';

// Contexts
import { useHabits } from '../context/HabitContext';
import { useAuth } from '../context/AuthContext';

// Services
import { HabitService } from '../services/habitService';

// Utils
import { calculateStats, getDateRangeForPeriod, formatPercentage } from '../utils/statsUtils';

// Components
import PeriodSelector from '../components/stats/PeriodSelector';
import ChampionHabitCard from '../components/stats/ChampionHabitCard';
import StatCard from '../components/stats/StatCard'; // Fixed: uppercase 'S'
import ConsistencyChart from '../components/stats/ConsistencyChart';

// Icons
import { StatsIcons } from '../components/icons/StatsIcons';

const AnimatedStatCard = Animated.createAnimatedComponent(View);

const StatsScreen: React.FC = () => {
  const { habits } = useHabits();
  const { user } = useAuth();
  const [aggregatedStats, setAggregatedStats] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const contentOpacity = useSharedValue(1);

  useEffect(() => {
    if (user) {
      loadAggregatedStats();
    }
  }, [user, habits]);

  const loadAggregatedStats = async () => {
    if (!user) return;

    try {
      const stats = await HabitService.getAggregatedStats(user.id);
      setAggregatedStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAggregatedStats();
    setTimeout(() => setRefreshing(false), 800);
  }, [user]);

  const handlePeriodChange = useCallback((period: 'week' | 'month' | 'all') => {
    // Simple fade animation without state change to prevent jumps
    contentOpacity.value = withTiming(0.3, { duration: 150 }, () => {
      contentOpacity.value = withTiming(1, { duration: 150 });
    });

    // Change period immediately to prevent layout jumps
    setSelectedPeriod(period);
  }, []);

  // Calculate comprehensive statistics based on selected period
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return calculateStats([], selectedPeriod);
    }

    const dateRange = getDateRangeForPeriod(selectedPeriod);
    const filteredHabits = habits.map((habit) => {
      const filteredCompletedDays =
        selectedPeriod === 'all'
          ? habit.completedDays
          : habit.completedDays.filter((date) => {
              const completedDate = new Date(date);
              return completedDate >= dateRange.start && completedDate <= dateRange.end;
            });

      return {
        ...habit,
        completedDays: filteredCompletedDays,
      };
    });

    return calculateStats(filteredHabits, selectedPeriod);
  }, [habits, selectedPeriod]);

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-6`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} progressBackgroundColor="#ffffff" />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`px-5 pt-4 pb-3`}>
          <Text style={tw`text-2xl font-bold text-slate-900`}>Statistics</Text>
          <Text style={tw`text-sm text-slate-500 mt-1`}>Track your progress and achievements</Text>
        </Animated.View>

        {/* Period Selector */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} style={tw`px-5 pb-4`}>
          <PeriodSelector selectedPeriod={selectedPeriod} onSelectPeriod={handlePeriodChange} />
        </Animated.View>

        {/* Animated Content Container */}
        <Animated.View style={animatedContentStyle}>
          {/* Primary Stats Grid */}
          <View style={tw`px-5 pb-4`}>
            <View style={tw`flex-row flex-wrap -mx-2`}>
              <Animated.View key={`streak-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`w-1/2 px-2 pb-4`}>
                <StatCard icon={<StatsIcons.Flame />} value={stats.currentMaxStreak} label="Current Streak" color="orange" bgColor="bg-orange-50" />
              </Animated.View>

              <Animated.View key={`best-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`w-1/2 px-2 pb-4`}>
                <StatCard icon={<StatsIcons.Trophy />} value={stats.bestOverallStreak} label="Best Streak" color="amber" bgColor="bg-amber-50" />
              </Animated.View>

              <Animated.View key={`completions-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`w-1/2 px-2 pb-4`}>
                <StatCard icon={<StatsIcons.CheckCircle />} value={stats.totalCompletions} label="Completions" color="emerald" bgColor="bg-emerald-50" />
              </Animated.View>

              <Animated.View key={`perfect-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`w-1/2 px-2 pb-4`}>
                <StatCard icon={<StatsIcons.Diamond />} value={stats.perfectDays} label="Perfect Days" color="violet" bgColor="bg-violet-50" />
              </Animated.View>
            </View>
          </View>

          {/* Consistency Score */}
          <Animated.View key={`consistency-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`px-5 pb-4`}>
            <ConsistencyChart consistency={stats.consistency} period={selectedPeriod} />
          </Animated.View>

          {/* Today's Progress */}
          <Animated.View key={`today-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`px-5 pb-4`}>
            <Text style={tw`text-sm font-semibold text-slate-700 mb-3`}>Today's Progress</Text>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-slate-100`}>
                  <View style={tw`w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mb-3`}>
                    <StatsIcons.Activity />
                  </View>
                  <Text style={tw`text-2xl font-bold text-slate-900`}>
                    {stats.todayCompleted}/{stats.totalActiveHabits}
                  </Text>
                  <Text style={tw`text-xs text-slate-500 mt-1`}>Completed Today</Text>
                </View>
              </View>

              <View style={tw`flex-1`}>
                <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-slate-100`}>
                  <View style={tw`w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mb-3`}>
                    <StatsIcons.Target />
                  </View>
                  <Text style={tw`text-2xl font-bold text-slate-900`}>{formatPercentage(stats.weeklyAverage)}</Text>
                  <Text style={tw`text-xs text-slate-500 mt-1`}>Weekly Average</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Habit Types */}
          <Animated.View key={`types-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`px-5 pb-4`}>
            <Text style={tw`text-sm font-semibold text-slate-700 mb-3`}>Habit Types</Text>
            <View style={tw`flex-row gap-3`}>
              <View style={tw`flex-1`}>
                <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View>
                      <Text style={tw`text-2xl font-bold text-white`}>{stats.buildingHabits}</Text>
                      <Text style={tw`text-xs text-white/80 mt-1`}>Building</Text>
                    </View>
                    <View style={tw`w-10 h-10 bg-white/20 rounded-xl items-center justify-center`}>
                      <StatsIcons.TrendUp color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              <View style={tw`flex-1`}>
                <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View>
                      <Text style={tw`text-2xl font-bold text-white`}>{stats.quittingHabits}</Text>
                      <Text style={tw`text-xs text-white/80 mt-1`}>Quitting</Text>
                    </View>
                    <View style={tw`w-10 h-10 bg-white/20 rounded-xl items-center justify-center`}>
                      <StatsIcons.TrendDown color="#ffffff" />
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </Animated.View>

          {/* Champion Habit */}
          {stats.longestHabit && (
            <Animated.View key={`champion-${selectedPeriod}`} entering={FadeIn.duration(300)} style={tw`px-5 pb-4`}>
              <ChampionHabitCard habit={stats.longestHabit} />
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
