// src/screens/HabitDetails.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Calendar } from 'lucide-react-native';

// Utils & Services
import tw from '@/lib/tailwind';
import { getTodayString } from '@/utils/dateHelpers';
import { tierThemes } from '@/utils/tierTheme';

// Types
import { Habit, DailyTaskProgress } from '@/types';
import { RootStackParamList } from '@/navigation/types';

// Contexts & Hooks
import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';
import { useHabitDetails } from '@/hooks/useHabitDetails';
import { useStreakSaver } from '@/hooks/useStreakSaver';

// Components
import { HabitHero } from '@/components/habits/HabitHero';
import { TabSelector } from '@/components/habits/TabSelector';
import { TasksCard } from '@/components/habits/TasksCard';
import MilestonesCard from '@/components/habits/MilestoneCard';
import { TierCelebration } from '@/components/habits/TierCelebration';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import { DebugButton } from '@/components/debug/DebugButton';

// Services
import { HabitProgressionService } from '@/services/habitProgressionService';
import Logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;
type TabType = 'overview' | 'tiers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const HabitDetails: React.FC = () => {
  // ============================================================================
  // HOOKS & NAVIGATION
  // ============================================================================

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { user } = useAuth();
  const { habits, toggleTask, refreshHabits } = useHabits();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [prevTier, setPrevTier] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<any>(null);
  const [debugStreak, setDebugStreak] = useState<number | null>(null);
  const [isTogglingTask, setIsTogglingTask] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // Animation values
  const heroScale = useSharedValue(1);

  // Extract route params
  const { habitId } = route.params;
  const pausedTasks = route.params.pausedTasks || {};

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const habit = habits.find((h: Habit) => h.id === habitId);

  // Calculate current tier reactively
  const currentTierData = useMemo(() => {
    const streak = debugStreak !== null ? debugStreak : habit?.currentStreak || 0;
    const { tier, progress } = HabitProgressionService.calculateTierFromStreak(streak);
    return { tier, progress };
  }, [habit?.currentStreak, debugStreak]);

  const today = useMemo(() => getTodayString(), []);

  const todayTasks: DailyTaskProgress = habit?.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };

  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit?.tasks?.length || 0;

  // Fetch detailed habit progression data
  const { tierInfo, nextTier, milestoneStatus, performanceMetrics, refreshProgression, loading } = useHabitDetails(habit?.id || '', user?.id || '', habit?.currentStreak || 0, completedTasksToday);

  // ============================================================================
  // DERIVED VALUES
  // ============================================================================

  const tierMultiplier = tierInfo?.multiplier ?? 1.0;
  const totalXPEarned = performanceMetrics?.totalXPEarned || 0;
  const completionRate = performanceMetrics?.consistency || 0;

  // ============================================================================
  // STREAK SAVER INTEGRATION
  // ============================================================================

  const streakSaver = useStreakSaver({
    habitId: habitId,
    userId: user?.id || '',
    enabled: !!habit && !!user,
    onStreakRestored: (newStreak) => {
      Logger.debug('Streak restored to:', newStreak);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshHabits();

      // ✅ Notifie le Dashboard via navigation params
      navigation.setParams({
        refreshStreakSaver: Date.now(),
      } as any);

      setTimeout(() => navigation.goBack(), 2000);
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Detect tier upgrades
  useEffect(() => {
    if (prevTier && prevTier !== currentTierData.tier.name) {
      Logger.debug(`🎉 TIER UP! ${prevTier} → ${currentTierData.tier.name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrationTier(currentTierData.tier);
      setShowCelebration(true);
    }
    setPrevTier(currentTierData.tier.name);
  }, [currentTierData.tier.name, prevTier]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle task toggle - WITH DEBOUNCING to prevent rapid re-renders
   */
  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!habit || isTogglingTask) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsTogglingTask(true);
      setLoadingTaskId(taskId);

      try {
        // ✅ Attendre la fin du toggle AVANT de permettre d'autres actions
        await toggleTask(habit.id, today, taskId);

        // ✅ Petit délai pour éviter les re-renders trop rapides
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        Logger.error('❌ Task toggle failed:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsTogglingTask(false);
        setLoadingTaskId(null);
      }
    },
    [habit, today, toggleTask, isTogglingTask]
  );

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleTabChange = useCallback((tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  }, []);

  const handleCelebrationClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCelebration(false);
  }, []);

  const handleDebugStreakCycle = useCallback(() => {
    const testValues = [10, 49, 50, 100, 149, 150];
    const currentDebug = debugStreak !== null ? debugStreak : habit?.currentStreak || 0;
    const currentIndex = testValues.findIndex((v) => v >= currentDebug);
    const nextIndex = (currentIndex + 1) % testValues.length;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDebugStreak(testValues[nextIndex]);
  }, [debugStreak, habit?.currentStreak]);

  // ============================================================================
  // ANIMATED STYLES
  // ============================================================================

  const animatedGradientStyle = useAnimatedStyle(() => {
    const scale = 1 + heroScale.value * 0.1;
    return {
      transform: [{ scale }],
      opacity: 1 - heroScale.value * 0.1,
    };
  });

  // ============================================================================
  // EARLY RETURNS
  // ============================================================================

  if (!habit || !user) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <Text style={tw`text-sand-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={tw`flex-1 bg-stone-50`}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
        {/* ========== HERO SECTION ========== */}
        <Animated.View style={animatedGradientStyle}>
          <LinearGradient colors={tierThemes[currentTierData.tier.name].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`pb-10`}>
            <SafeAreaView edges={['top']}>
              {/* Navigation Header */}
              <View style={tw`px-8 py-5 flex-row items-center justify-between`}>
                <Pressable onPress={handleGoBack} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-sand/20`, pressed && tw`scale-95`]}>
                  <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
                </Pressable>

                <Text style={tw`text-lg font-black text-white`}>Habit Journey</Text>

                <View style={tw`w-11`}>
                  <DebugButton
                    onPress={handleDebugStreakCycle}
                    label={debugStreak !== null ? debugStreak.toString() : '🔧'}
                    variant="secondary"
                    customStyle={tw`w-11 h-11 rounded-2xl bg-sand/20 px-0 py-0 mb-0`}
                  />
                </View>
              </View>

              {/* Hero Card */}
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
                <View
                  style={[
                    tw`rounded-3xl overflow-hidden border`,
                    {
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderWidth: 1.5,
                    },
                  ]}
                >
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
                    completionRate={completionRate}
                  />
                </View>

                <StreakSaverModal
                  visible={streakSaver.showModal}
                  habitName={streakSaver.eligibility.habitName || habit?.name || 'Habit'}
                  previousStreak={streakSaver.eligibility.previousStreak || 0}
                  availableSavers={streakSaver.inventory.available}
                  loading={streakSaver.using}
                  success={streakSaver.success}
                  newStreak={streakSaver.newStreak}
                  onUse={streakSaver.useStreakSaver}
                  onClose={streakSaver.closeModal}
                />
              </Animated.View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* ========== TAB CONTENT SECTION ========== */}
        <ScrollView contentContainerStyle={[tw`pb-8 pt-5`]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5 mt-2`}>
            <TabSelector tier={currentTierData.tier.name} selected={selectedTab} onChange={handleTabChange} />
          </Animated.View>

          <View style={tw`px-5`}>
            {/* ========== OVERVIEW TAB ========== */}
            {selectedTab === 'overview' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {totalTasks > 0 && (
                  <TasksCard
                    tasks={habit.tasks || []}
                    todayTasks={todayTasks}
                    habitId={habit.id}
                    today={today}
                    onToggleTask={handleToggleTask}
                    tier={currentTierData.tier.name}
                    pausedTasks={pausedTasks}
                    isLoading={isTogglingTask}
                    loadingTaskId={loadingTaskId}
                    frequency={habit.frequency}
                  />
                )}
              </Animated.View>
            )}

            {/* ========== TIERS TAB ========== */}
            {selectedTab === 'tiers' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <MilestonesCard milestones={milestoneStatus?.all || []} currentStreak={debugStreak !== null ? debugStreak : habit.currentStreak} unlockedMilestones={milestoneStatus?.unlocked || []} />
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* ========== TIER CELEBRATION MODAL ========== */}
      {celebrationTier && <TierCelebration visible={showCelebration} newTier={celebrationTier} onClose={handleCelebrationClose} />}
    </View>
  );
};

export default HabitDetails;
