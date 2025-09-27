// src/screens/HabitDetails.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Target, Sparkles, Clock, CheckCircle2, Circle, Trophy, Star, Activity, Calendar } from 'lucide-react-native';

import tw from '@/lib/tailwind';
import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Habit, DailyTaskProgress } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { useStats } from '@/context/StatsContext';
import { getTierGradient } from '@/utils/achievements';
import ProgressBar from '@/components/ui/ProgressBar';
import MilestonesCard from '@/components/habits/MilestoneCard';
import { HabitHeroBackground } from '@/components/habits/HabitHeroBackground';
import { useHabitDetails } from '@/hooks/useHabitDetails';
import { HabitHero } from '@/components/habits/HabitHero';
import { TabSelector } from '@/components/habits/TabSelector';
import { TasksCard } from '@/components/habits/TasksCard';
import { TierCard } from '@/components/habits/TierCard';
import { JourneyCard } from '@/components/habits/JourneyCard';
import { tierThemes } from '@/utils/tierTheme';
import { ImageBackground } from 'expo-image';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
type TabType = 'overview' | 'calendar' | 'tiers';

const HabitDetails: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habits, toggleTask, processingTasks, xpEarnedTasks, checkTaskXPStatus, refreshHabits } = useHabits();
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [isLoadingXPStatus, setIsLoadingXPStatus] = useState(false);
  const [prevTier, setPrevTier] = useState<string | null>(null);

  const habit = habits.find((h: Habit) => h.id === route.params.habitId);

  if (!habit || !user) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTasks: DailyTaskProgress = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;

  // The hook will re-fetch when these values change
  const { tierInfo, tierProgress, nextTier, milestoneStatus, performanceMetrics, refreshProgression, loading } = useHabitDetails(habit.id, user.id, habit.currentStreak, completedTasksToday);

  // Safe tier info with fallback
  const safeTierInfo = tierInfo ?? HabitProgressionService.TIERS[0];

  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;
  const overallProgress = (habit.completedDays.length / habit.totalDays) * 100;

  const tierMultiplier = tierInfo?.multiplier ?? 1.0;
  const totalXPEarned = performanceMetrics?.totalXPEarned || 0;
  const completionRate = performanceMetrics?.consistency || 0;

  const theme = tierThemes[tierInfo?.name || 'Crystal'];

  // ✅ Simple wrapper that just calls the existing toggleTask with the right params
  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      const result = await toggleTask(habit.id, today, taskId);

      // The context already updates the habit state
      // We just need to trigger a refresh of the progression data
      if (result?.success) {
        await refreshProgression();
      }

      // Don't return anything - TasksCard expects Promise<void>
    },
    [habit.id, today, toggleTask, refreshProgression]
  );

  useEffect(() => {
    const loadTaskXPStatus = async () => {
      if (!habit || !user || isLoadingXPStatus) return;

      setIsLoadingXPStatus(true);
      try {
        const promises = (habit.tasks || []).map((task) => {
          const taskId = typeof task === 'string' ? task : (task as any).id;
          return checkTaskXPStatus(habit.id, today, taskId);
        });
        await Promise.all(promises);
      } finally {
        setIsLoadingXPStatus(false);
      }
    };

    loadTaskXPStatus();
  }, [habit?.id, user?.id, completedTasksToday]);

  // ✅ Calculate tier reactively based on current habit data
  const currentTierData = useMemo(() => {
    const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak || 0);
    return { tier, progress };
  }, [habit.currentStreak]);

  // ✅ Detect tier changes and trigger animations
  useEffect(() => {
    if (prevTier && prevTier !== currentTierData.tier.name) {
      // Tier changed! Trigger celebration animation
      console.log(`🎉 TIER UP! ${prevTier} → ${currentTierData.tier.name}`);

      // Trigger a bounce animation
      tierTransition.value = withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(0, {
          damping: 3,
          stiffness: 200,
          mass: 0.5,
        })
      );

      // Optional: Show a celebration modal or toast
      // You could add a celebration component here
    }
    setPrevTier(currentTierData.tier.name);
  }, [currentTierData.tier.name]);
  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
        {/* Big gradient hero background */}
        <LinearGradient colors={tierThemes[safeTierInfo.name].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`pb-10`}>
          <SafeAreaView edges={['top']}>
            {/* Navigation Header */}
            <View style={tw`px-5 py-3 flex-row items-center justify-between`}>
              <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-white/20`, pressed && tw`scale-95`]}>
                <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
              </Pressable>

              <Text style={tw`text-lg font-black text-white`}>Habit Journey</Text>

              <View style={tw`w-11`} />
            </View>

            {/* Hero Card inside the big gradient block */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              style={[
                tw`px-5 mt-6`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6, // Android
                },
              ]}
            >
              <View style={[tw`rounded-3xl overflow-hidden border`, { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5 }]}>
                <HabitHero
                  habitName={habit.name}
                  habitType={habit.type}
                  category={habit.category}
                  currentStreak={performanceMetrics?.currentStreak ?? habit.currentStreak} // ✅ Use metrics first, fallback to habit
                  bestStreak={performanceMetrics?.bestStreak ?? habit.bestStreak}
                  tierInfo={safeTierInfo}
                  nextTier={nextTier}
                  tierProgress={Number.isFinite(tierProgress) ? tierProgress : 0}
                  tierMultiplier={tierMultiplier}
                  totalXPEarned={totalXPEarned}
                  completionRate={completionRate ?? 0}
                />
              </View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={[tw`pb-8 pt-5`]} showsVerticalScrollIndicator={false}>
          {/* Tab Selector */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5`}>
            <TabSelector tier={tierInfo?.name || 'Crystal'} selected={selectedTab} onChange={setSelectedTab} />
          </Animated.View>

          {/* Tab Content */}
          <View style={tw`px-5`}>
            {selectedTab === 'overview' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Today's Tasks Card */}
                {totalTasks > 0 && (
                  <TasksCard
                    tasks={habit.tasks || []}
                    todayTasks={todayTasks}
                    habitId={habit.id}
                    today={today}
                    onToggleTask={handleToggleTask} // ✅ Simple wrapper
                    processingTasks={processingTasks}
                    xpEarnedTasks={xpEarnedTasks}
                    tier={tierInfo?.name || 'Crystal'}
                  />
                )}

                {/* Achievement Status with Real Tier - DARKER AMBER */}
                <ImageBackground source={theme.texture} style={tw`rounded-3xl p-5 mb-4 overflow-hidden`} imageStyle={tw`rounded-3xl opacity-90`} resizeMode="cover">
                  <LinearGradient
                    colors={theme.gradient.map((c) => c + 'cc')} // semi-transparent overlay
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`absolute inset-0 rounded-3xl`}
                  />
                  <TierCard tierInfo={tierInfo} currentStreak={habit.currentStreak} nextMilestone={milestoneStatus.next} />
                </ImageBackground>

                {/* Overall Progress Card - IMPROVED COLORS */}
                <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
                  <JourneyCard
                    overallProgress={overallProgress}
                    completedDays={habit.completedDays.length}
                    totalDays={habit.totalDays}
                    bestStreak={habit.bestStreak}
                    perfectDays={performanceMetrics?.perfectDayRate || 0}
                    consistency={completionRate}
                    tier={tierInfo?.name || 'Crystal'} // 🔹 Pass the current tier
                  />
                </View>
              </Animated.View>
            )}

            {selectedTab === 'tiers' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Milestones from Backend - Using Component */}
                <MilestonesCard milestones={milestoneStatus?.all || []} currentStreak={habit.currentStreak} unlockedMilestones={milestoneStatus?.unlocked || []} />
              </Animated.View>
            )}

            {selectedTab === 'calendar' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <LinearGradient colors={['rgba(251, 191, 36, 0.05)', 'rgba(245, 158, 11, 0.02)']} style={tw`rounded-3xl p-8 border border-amber-200/20`}>
                  <View style={tw`items-center`}>
                    <View style={tw`w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-4`}>
                      <Calendar size={40} color="#d97706" strokeWidth={1.5} />
                    </View>
                    <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Calendar View</Text>
                    <Text style={tw`text-sm text-gray-500 text-center`}>Visual calendar tracking coming soon!</Text>
                    <Text style={tw`text-xs text-gray-400 mt-2 text-center`}>Track your daily progress with a beautiful calendar</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

export default HabitDetails;
