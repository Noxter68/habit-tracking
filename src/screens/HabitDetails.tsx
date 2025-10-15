import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
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
import { TierCelebration } from '@/components/habits/TierCelebration';
import { DebugButton } from '@/components/debug/DebugButton';

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<any>(null);

  const [debugStreak, setDebugStreak] = useState<number | null>(null);

  const heroScale = useSharedValue(1);

  const habit = habits.find((h: Habit) => h.id === route.params.habitId);

  if (!habit || !user) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <Text style={tw`text-sand-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  // ✅ Calculate tier reactively based on current habit data
  const currentTierData = useMemo(() => {
    const streak = debugStreak !== null ? debugStreak : habit.currentStreak || 0;

    // ✅ USE 'streak' HERE, not 'habit.currentStreak'!
    const { tier, progress } = HabitProgressionService.calculateTierFromStreak(streak);
    return { tier, progress };
  }, [habit.currentStreak, debugStreak]);

  // ✅ Detect tier changes and trigger animations
  useEffect(() => {
    if (prevTier && prevTier !== currentTierData.tier.name) {
      console.log(`🎉 TIER UP! ${prevTier} → ${currentTierData.tier.name}`);

      // Show celebration modal
      setCelebrationTier(currentTierData.tier);
      setShowCelebration(true);
    }
    setPrevTier(currentTierData.tier.name);
  }, [currentTierData.tier.name]);

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

  const theme = tierThemes[currentTierData.tier.name];

  const animatedGradientStyle = useAnimatedStyle(() => {
    const scale = 1 + heroScale.value * 0.1;
    return {
      transform: [{ scale }],
      opacity: 1 - heroScale.value * 0.1,
    };
  });

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
  }));

  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      await toggleTask(habit.id, today, taskId);

      // ❌ DON'T call refreshProgression() here!
      // The context already updates the streak immediately
      // Calling refreshProgression fetches from DB which might have stale data

      // The useHabitDetails hook will automatically re-fetch when
      // completedTasksToday or habit.currentStreak changes
    },
    [habit.id, today, toggleTask]
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

  return (
    <View style={tw`flex-1 bg-stone-50`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
        <Animated.View style={animatedGradientStyle}>
          {/* Big gradient hero background */}
          <LinearGradient colors={tierThemes[currentTierData.tier.name].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`pb-10`}>
            <SafeAreaView edges={['top']}>
              {/* Navigation Header */}
              <View style={tw`px-8 py-5 flex-row items-center justify-between`}>
                <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-sand/20`, pressed && tw`scale-95`]}>
                  <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
                </Pressable>

                <Text style={tw`text-lg font-black text-white`}>Habit Journey</Text>

                <View style={tw`w-11`}>
                  <DebugButton
                    onPress={() => {
                      // Cycle through test values: 10 → 49 → 50 → 100 → 149 → 150 → reset
                      const testValues = [10, 49, 50, 100, 149, 150];
                      const currentDebug = debugStreak !== null ? debugStreak : habit.currentStreak || 0;
                      const currentIndex = testValues.findIndex((v) => v >= currentDebug);
                      const nextIndex = (currentIndex + 1) % testValues.length;
                      setDebugStreak(testValues[nextIndex]);
                    }}
                    label={debugStreak !== null ? debugStreak.toString() : '🔧'}
                    variant="secondary"
                    // Custom style for this specific button to make it fit in the header
                    customStyle={tw`w-11 h-11 rounded-2xl bg-sand/20 px-0 py-0 mb-0`}
                  />
                </View>
              </View>

              {/* Hero Card inside the big gradient block */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={[
                  tw`px-8 mt-6`,
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                  },
                ]}
              >
                <View style={[tw`rounded-3xl overflow-hidden border`, { borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1.5 }]}>
                  <HabitHero
                    habitName={habit.name}
                    habitType={habit.type}
                    category={habit.category}
                    currentStreak={performanceMetrics?.currentStreak ?? habit.currentStreak}
                    bestStreak={performanceMetrics?.bestStreak ?? habit.bestStreak}
                    tierInfo={currentTierData.tier}
                    nextTier={nextTier}
                    tierProgress={currentTierData.progress}
                    tierMultiplier={tierMultiplier}
                    totalXPEarned={totalXPEarned}
                    completionRate={completionRate ?? 0}
                  />
                </View>
              </Animated.View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        <ScrollView contentContainerStyle={[tw`pb-8 pt-5`]} showsVerticalScrollIndicator={false}>
          {/* Tab Selector */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5 mt-2`}>
            <TabSelector tier={currentTierData.tier.name} selected={selectedTab} onChange={setSelectedTab} />
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
                    onToggleTask={handleToggleTask}
                    processingTasks={processingTasks}
                    xpEarnedTasks={xpEarnedTasks}
                    tier={currentTierData.tier.name}
                  />
                )}

                {/* Achievement Status with Real Tier - DARKER AMBER */}
                <ImageBackground source={theme.texture} style={tw`rounded-3xl p-5 mb-4 overflow-hidden`} imageStyle={tw`rounded-3xl opacity-90`} resizeMode="cover">
                  <LinearGradient colors={theme.gradient.map((c) => c + 'cc')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0 rounded-3xl`} />
                  <TierCard tierInfo={currentTierData.tier} currentStreak={debugStreak !== null ? debugStreak : habit.currentStreak} nextMilestone={milestoneStatus.next} />
                </ImageBackground>

                {/* Overall Progress Card - IMPROVED COLORS */}
                <View style={tw`bg-sand rounded-3xl p-5 shadow-sm border border-stone-100`}>
                  <JourneyCard
                    overallProgress={overallProgress}
                    completedDays={habit.completedDays.length}
                    totalDays={habit.totalDays}
                    bestStreak={habit.bestStreak}
                    perfectDays={performanceMetrics?.perfectDayRate || 0}
                    consistency={completionRate}
                    tier={currentTierData.tier.name}
                  />
                </View>
              </Animated.View>
            )}

            {selectedTab === 'tiers' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Milestones from Backend - Using Component */}
                <MilestonesCard milestones={milestoneStatus?.all || []} currentStreak={debugStreak !== null ? debugStreak : habit.currentStreak} unlockedMilestones={milestoneStatus?.unlocked || []} />
              </Animated.View>
            )}

            {selectedTab === 'calendar' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <LinearGradient colors={['rgba(251, 191, 36, 0.05)', 'rgba(245, 158, 11, 0.02)']} style={tw`rounded-3xl p-8 border border-stone-200/20`}>
                  <View style={tw`items-center`}>
                    <View style={tw`w-20 h-20 bg-sand-100 rounded-full items-center justify-center mb-4`}>
                      <Calendar size={40} color="#d97706" strokeWidth={1.5} />
                    </View>
                    <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Calendar View</Text>
                    <Text style={tw`text-sm text-sand-500 text-center`}>Visual calendar tracking coming soon!</Text>
                    <Text style={tw`text-xs text-stone-300 mt-2 text-center`}>Track your daily progress with a beautiful calendar</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
      {/* Tier Celebration Modal */}
      {celebrationTier && <TierCelebration visible={showCelebration} newTier={celebrationTier} onClose={() => setShowCelebration(false)} />}
    </View>
  );
};

export default HabitDetails;
