// src/screens/HabitDetails.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, withSpring, useSharedValue, interpolate, Extrapolate, useAnimatedScrollHandler, withTiming } from 'react-native-reanimated';
import { ArrowLeft, Trophy, Flame, TrendingUp, Calendar, Target, Award, Sparkles, Star, Clock, CheckCircle2, Circle, BarChart3, Activity, Zap, Shield, Crown, Medal } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';
import { RootStackParamList } from '@/navigation/types';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { Habit, Task, DailyTaskProgress } from '@/types';

// Import services for backend integration
import { HabitProgressionService, TierInfo, HabitMilestone } from '@/services/habitProgressionService';
import { HabitService } from '@/services/habitService';
import { useStats } from '@/context/StatsContext';
import { getTierGradient } from '@/utils/achievements';
import { ImageBackground } from 'expo-image';
import { GameProgressBar } from '@/components/GameProgressBar';
import ProgressBar from '@/components/ui/ProgressBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'overview' | 'calendar' | 'stats';

const HabitDetails: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habits, toggleTask, toggleHabitDay, processingTasks, xpEarnedTasks, checkTaskXPStatus } = useHabits();
  const { user } = useAuth();
  const { refreshStats } = useStats();

  const [selectedTab, setSelectedTab] = useState<TabType>('overview');

  // Backend data states
  const [habitProgression, setHabitProgression] = useState<any>(null);
  const [currentTierInfo, setCurrentTierInfo] = useState<TierInfo | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState<{
    unlocked: HabitMilestone[];
    next: HabitMilestone | null;
    upcoming: HabitMilestone[];
  }>({ unlocked: [], next: null, upcoming: [] });
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoadingXPStatus, setIsLoadingXPStatus] = useState(false);

  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(280);

  const habit = habits.find((h: Habit) => h.id === route.params.habitId);

  // Fetch progression data from backend
  useEffect(() => {
    const fetchProgressionData = async () => {
      if (!habit || !user) return;

      try {
        setLoading(true);

        // Get or create progression record
        const progression = await HabitProgressionService.getOrCreateProgression(habit.id, user.id);

        if (progression) {
          setHabitProgression(progression);

          // Calculate current tier info from streak
          const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
          setCurrentTierInfo(tier);

          // Get milestone status
          const status = HabitProgressionService.getMilestoneStatus(habit.currentStreak, progression.milestones_unlocked || []);
          setMilestoneStatus(status);

          // Get performance metrics
          const metrics = await HabitProgressionService.getPerformanceMetrics(habit.id, user.id);
          setPerformanceMetrics(metrics);

          // Calculate consistency score
          await HabitProgressionService.calculateConsistencyScore(habit.id, user.id);
        }
      } catch (error) {
        console.error('Error fetching progression data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressionData();
  }, [habit?.id, habit?.currentStreak, user?.id]);

  // Refresh progression after task completion
  const refreshProgression = useCallback(async () => {
    if (!habit || !user) return;

    const progression = await HabitProgressionService.getOrCreateProgression(habit.id, user.id);

    if (progression) {
      setHabitProgression(progression);

      const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
      setCurrentTierInfo(tier);

      const status = HabitProgressionService.getMilestoneStatus(habit.currentStreak, progression.milestones_unlocked || []);
      setMilestoneStatus(status);
    }
  }, [habit, user]);

  if (!habit) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  const categoryData = getCategoryIcon(habit.category, habit.type);
  const CategoryIcon = categoryData.icon;

  // Calculations using backend data
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTasks: DailyTaskProgress = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;
  const overallProgress = (habit.completedDays.length / habit.totalDays) * 100;

  // Use backend tier info for display
  const tierInfo = currentTierInfo || HabitProgressionService.TIERS[0];
  const tierProgress = HabitProgressionService.calculateTierFromStreak(habit.currentStreak).progress;
  const tierMultiplier = currentTierInfo?.multiplier ?? 1.0;

  // Get next tier for progress display
  const currentTierIndex = HabitProgressionService.TIERS.findIndex((t) => t.name === tierInfo.name);
  const nextTier = currentTierIndex < HabitProgressionService.TIERS.length - 1 ? HabitProgressionService.TIERS[currentTierIndex + 1] : null;

  // Stats from backend
  const totalXPEarned = performanceMetrics?.totalXPEarned || 0;
  const completionRate = performanceMetrics?.consistency || 0;
  const perfectDayRate = performanceMetrics?.perfectDayRate || 0;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -100], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 150], [1, 0], Extrapolate.CLAMP),
  }));

  const renderTask = useCallback(
    (task: { id: string; name?: string; duration?: string } | string, index: number) => {
      const taskId = typeof task === 'string' ? task : task.id;
      const taskName = typeof task === 'string' ? `Task ${index + 1}` : task.name || `Task ${index + 1}`;
      const taskDuration = typeof task === 'object' ? task.duration : undefined;
      const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

      const taskKey = `${habit.id}-${today}-${taskId}`;
      const isProcessing = processingTasks.has(taskKey);
      const hasEarnedXP = xpEarnedTasks.has(taskKey);

      return (
        <Animated.View key={`detail-task-${habit.id}-${taskId}`} entering={FadeInDown.delay(index * 50).springify()}>
          <Pressable
            onPress={async () => {
              if (!isProcessing && !isCompleted) {
                await toggleTask(habit.id, today, taskId);

                // 🔥 Optimistic UI already handled by HabitContext
                // Now refresh stats for Dashboard consistency
                refreshStats(true);

                // And refresh progression for local screen consistency
                refreshProgression();
              }
            }}
            disabled={isProcessing || isCompleted}
            style={({ pressed }) => [
              tw`flex-row items-center p-4 rounded-2xl mb-2.5 transition-all`,
              isCompleted ? tw`bg-gray-50/50 border border-gray-200/30` : tw`bg-white border border-gray-100`,
              pressed && !isProcessing && !isCompleted && tw`scale-[0.98]`,
              (isProcessing || isCompleted) && tw`opacity-60`,
            ]}
          >
            <View style={tw`w-6 h-6 mr-3.5`}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#d97706" />
              ) : isCompleted ? (
                <View style={tw`opacity-50`}>
                  <CheckCircle2 size={24} color="#9ca3af" strokeWidth={2.5} />
                </View>
              ) : (
                <Circle size={24} color="#d1d5db" strokeWidth={2} />
              )}
            </View>

            <Text style={[tw`text-sm flex-1 font-medium`, isCompleted ? tw`text-gray-400 line-through` : tw`text-gray-800`]}>{taskName}</Text>

            {/* XP Status Indicator - Always visible for completed tasks */}
            {isCompleted && hasEarnedXP && (
              <View style={tw`bg-gradient-to-r from-amber-50 to-amber-100 px-2.5 py-1.5 rounded-lg mr-2 border border-amber-200/30`}>
                <View style={tw`flex-row items-center gap-1`}>
                  <CheckCircle2 size={12} color="#d97706" strokeWidth={2.5} />
                  <Text style={tw`text-xs font-bold text-amber-700`}>XP</Text>
                </View>
              </View>
            )}

            {/* Pending XP indicator for completed but not earned */}
            {isCompleted && !hasEarnedXP && (
              <View style={tw`bg-gray-100 px-2.5 py-1.5 rounded-lg mr-2`}>
                <Text style={tw`text-xs font-medium text-gray-500`}>XP Pending</Text>
              </View>
            )}

            {taskDuration && (
              <View style={tw`flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl ${isCompleted ? 'opacity-50' : ''}`}>
                <Clock size={13} color="#9ca3af" />
                <Text style={tw`text-xs text-gray-500 font-semibold`}>{taskDuration}</Text>
              </View>
            )}

            {!isCompleted && <Sparkles size={18} color="#fbbf24" />}
          </Pressable>
        </Animated.View>
      );
    },
    [habit.id, today, todayTasks.completedTasks, toggleTask, refreshProgression, processingTasks, xpEarnedTasks]
  );

  // Also add this new section after the Today's Tasks header to show completion state
  // This goes inside the 'overview' tab content, right after the "Today's Tasks" header

  {
    totalTasks > 0 && (
      <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100`}>
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View style={tw`flex-row items-center gap-2`}>
            <Target size={18} color="#d97706" />
            <Text style={tw`text-base font-bold text-gray-900`}>Today's Tasks</Text>
          </View>
          <View style={tw`bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 rounded-xl border border-amber-200/30`}>
            <Text style={tw`text-xs font-black text-amber-800`}>
              {completedTasksToday}/{totalTasks}
            </Text>
          </View>
        </View>

        {/* Show special state when all tasks are completed */}
        {completedTasksToday === totalTasks && totalTasks > 0 && (
          <Animated.View entering={FadeInDown.springify()} style={tw`mb-4`}>
            <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} style={tw`rounded-2xl p-4`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={tw`w-10 h-10 bg-white/20 rounded-xl items-center justify-center`}>
                    <Trophy size={24} color="#ffffff" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={tw`text-base font-black text-white`}>All Tasks Complete! 🎉</Text>
                    <Text style={tw`text-xs text-white/80 mt-0.5`}>Perfect execution today</Text>
                  </View>
                </View>
                <View style={tw`bg-white/25 px-3 py-2 rounded-xl`}>
                  <Text style={tw`text-sm font-bold text-white`}>100%</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden mb-4`}>
          <LinearGradient
            colors={taskProgress === 100 ? ['#f59e0b', '#d97706', '#b45309'] : ['#fde68a', '#fcd34d', '#fbbf24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[tw`h-full`, { width: `${Math.max(taskProgress, 5)}%` }]}
          />
        </View>

        {habit.tasks?.map((task, idx) => renderTask(task, idx))}
      </View>
    );
  }

  useEffect(() => {
    const loadTaskXPStatus = async () => {
      if (!habit || !user || isLoadingXPStatus) return;

      setIsLoadingXPStatus(true);
      try {
        // Use Promise.all for parallel execution
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
  }, [habit?.id, user?.id]);

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />

      {/* Hero Header with Backend Tier Data */}
      <Animated.View style={[headerAnimatedStyle, tw`absolute top-0 left-0 right-0 z-10`]}>
        <LinearGradient
          // ✅ use dynamic gradient instead of hardcoded amber tones
          colors={getTierGradient(tierInfo?.name || 'Novice', true)}
          style={[tw`pb-10`, { height: headerHeight.value }]}
        >
          <SafeAreaView edges={['top']}>
            {/* Navigation Header */}
            <View style={tw`px-5 py-3 flex-row items-center justify-between`}>
              <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-white/90 shadow-sm`, pressed && tw`scale-95`]}>
                <ArrowLeft size={22} color="#1f2937" strokeWidth={2.5} />
              </Pressable>
              <Text style={tw`text-lg font-black text-gray-900`}>Habit Journey</Text>
              <View style={tw`w-11`} />
            </View>

            {/* Hero Card with Real Tier Data */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={tw`px-5 mt-[-30]`}>
              <LinearGradient colors={[tierInfo.color, tierInfo.color + '99']} style={tw`rounded-3xl p-5 relative overflow-hidden`}>
                <View style={tw`absolute inset-0 opacity-10`}>
                  <LinearGradient colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-full h-full`} />
                </View>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 pr-4`}>
                    <Text style={tw`text-white/80 text-xs font-bold uppercase tracking-wider`}>{habit.type === 'good' ? 'Building' : 'Breaking'}</Text>
                    <Text style={tw`text-white text-2xl font-black mt-1`} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={tw`flex-row items-center gap-2 mt-2.5`}>
                      <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                        <Text style={tw`text-white text-xs font-bold`}>
                          {tierInfo.icon} {tierInfo.name}
                        </Text>
                      </View>
                      <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                        <Text style={tw`text-white text-xs font-bold`}>{habit.category}</Text>
                      </View>
                      {tierMultiplier > 1 && (
                        <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                          <Text style={tw`text-white text-xs font-bold`}>×{tierMultiplier.toFixed(1)} XP</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={tw`absolute -right-8 top-1/2 transform -translate-y-1/2`}>
                    <View style={tw`w-32 h-32 rounded-full bg-white/10 items-center justify-center`}>
                      <View style={tw`w-28 h-28 rounded-full bg-white/20 items-center justify-center`}>
                        <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} style={tw`w-24 h-24 rounded-full items-center justify-center`}>
                          {CategoryIcon && <CategoryIcon size={48} color={tierInfo.color} strokeWidth={2} />}
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Progress to next tier from backend */}
                {nextTier && (
                  <View style={tw`mt-4`}>
                    <View style={tw`flex-row justify-between mb-1.5`}>
                      <Text style={tw`text-white/80 text-xs font-semibold`}>Progress to {nextTier.name}</Text>
                      <Text style={tw`text-white font-bold text-xs`}>{Math.round(tierProgress)}%</Text>
                    </View>

                    {/* Container with safe max width (avoid overlap with CategoryIcon) */}
                    <View style={tw``}>
                      <ProgressBar progress={tierProgress} overlay="crackle" theme="potion" height={20} width={200} />
                    </View>
                  </View>
                )}

                {/* Key Stats Row with Backend Data */}
                <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-white/20`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Streak</Text>
                    <Text style={tw`text-white font-black text-xl`}>{habit.currentStreak}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Best</Text>
                    <Text style={tw`text-white font-black text-xl`}>{habit.bestStreak}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Total XP</Text>
                    <Text style={tw`text-white font-black text-xl`}>{totalXPEarned}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Consistency</Text>
                    <Text style={tw`text-white font-black text-xl`}>{completionRate}%</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={[tw`pb-8`, { paddingTop: 280 }]} showsVerticalScrollIndicator={false}>
        {/* Tab Selector */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5`}>
          <View style={tw`bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100`}>
            <View style={tw`flex-row`}>
              {(['overview', 'stats', 'calendar'] as const).map((tab) => (
                <Pressable key={tab} onPress={() => setSelectedTab(tab)} style={tw`flex-1`}>
                  {selectedTab === tab ? (
                    <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} style={tw`py-3 rounded-xl`}>
                      <Text style={tw`text-center font-bold text-white text-sm`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={tw`py-3`}>
                      <Text style={tw`text-center font-semibold text-gray-500 text-sm`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Tab Content */}
        <View style={tw`px-5`}>
          {selectedTab === 'overview' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Today's Tasks Card */}
              {totalTasks > 0 && (
                <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100`}>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Target size={18} color="#d97706" />
                      <Text style={tw`text-base font-bold text-gray-900`}>Today's Tasks</Text>
                    </View>
                    <View style={tw`bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 rounded-xl border border-amber-200/30`}>
                      <Text style={tw`text-xs font-black text-amber-800`}>
                        {completedTasksToday}/{totalTasks}
                      </Text>
                    </View>
                  </View>

                  <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden mb-4`}>
                    <LinearGradient
                      colors={taskProgress === 100 ? ['#f59e0b', '#d97706', '#b45309'] : ['#fde68a', '#fcd34d', '#fbbf24']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[tw`h-full`, { width: `${Math.max(taskProgress, 5)}%` }]}
                    />
                  </View>

                  {habit.tasks?.map((task, idx) => renderTask(task, idx))}
                </View>
              )}

              {/* Achievement Status with Real Tier */}
              <LinearGradient colors={[tierInfo.color, tierInfo.color + '99', tierInfo.color + '66']} style={tw`rounded-3xl p-5 mb-4`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View>
                    <Text style={tw`text-white/90 text-xs font-bold uppercase tracking-wider`}>Current Tier</Text>
                    <Text style={tw`text-white font-black text-2xl mt-1`}>
                      {tierInfo.icon} {tierInfo.name}
                    </Text>
                    <Text style={tw`text-white/80 text-xs mt-1`}>{tierInfo.description}</Text>
                  </View>
                  <View style={tw`bg-white/25 rounded-2xl px-4 py-3`}>
                    <Text style={tw`text-white font-black text-2xl`}>{habit.currentStreak}</Text>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>days</Text>
                  </View>
                </View>

                {/* Next Milestone from Backend */}
                {milestoneStatus.next && (
                  <View style={tw`bg-white/20 rounded-xl p-3`}>
                    <Text style={tw`text-white/90 text-sm`}>
                      {milestoneStatus.next.days - habit.currentStreak} days until {milestoneStatus.next.title}
                    </Text>
                    <Text style={tw`text-white font-bold text-xs mt-1`}>
                      Reward: +{milestoneStatus.next.xpReward} XP {milestoneStatus.next.badge}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              {/* Overall Progress Card */}
              <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
                <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Journey Progress</Text>

                <View style={tw`mb-4`}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-sm text-gray-600`}>Overall Completion</Text>
                    <Text style={tw`text-sm font-bold text-amber-700`}>{Math.round(overallProgress)}%</Text>
                  </View>
                  <View style={tw`h-4 bg-gray-100 rounded-full overflow-hidden`}>
                    <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full`, { width: `${overallProgress}%` }]} />
                  </View>
                  <Text style={tw`text-xs text-gray-500 mt-1`}>
                    {habit.completedDays.length} of {habit.totalDays} days
                  </Text>
                </View>

                <View style={tw`flex-row justify-between pt-4 border-t border-gray-100`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{habit.bestStreak}</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Best Streak</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{habitProgression?.perfect_days || 0}</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Perfect Days</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{completionRate}%</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Consistency</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {selectedTab === 'stats' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Stats Cards Grid with Backend Data */}
              <View style={tw`flex-row flex-wrap justify-between mb-4`}>
                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 mb-3 border border-amber-200/20`}>
                  <Trophy size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{totalXPEarned}</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Total XP</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 mb-3 border border-amber-200/20`}>
                  <Activity size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{completionRate}%</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Consistency</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 border border-amber-200/20`}>
                  <Flame size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{habit.currentStreak}</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Current Streak</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 border border-amber-200/20`}>
                  <Star size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{Math.round(perfectDayRate)}%</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Perfect Days</Text>
                </LinearGradient>
              </View>

              {/* Milestones from Backend */}
              <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
                <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Milestones</Text>

                {HabitProgressionService.MILESTONES.map((milestone, idx) => {
                  const isUnlocked = milestoneStatus.unlocked.some((m) => m.title === milestone.title);
                  const isAchieved = habit.currentStreak >= milestone.days || isUnlocked;

                  return (
                    <Animated.View key={milestone.days} entering={FadeInDown.delay(idx * 50).springify()}>
                      <View style={tw`flex-row items-center justify-between py-3.5 border-b border-gray-50`}>
                        <View style={tw`flex-row items-center gap-3`}>
                          <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, isAchieved ? tw`bg-amber-100` : tw`bg-gray-100`]}>
                            <Text style={tw`text-xl`}>{milestone.badge}</Text>
                          </View>
                          <View>
                            <Text style={[tw`text-sm font-bold`, isAchieved ? tw`text-gray-900` : tw`text-gray-400`]}>{milestone.title}</Text>
                            <Text style={tw`text-xs text-gray-500 mt-0.5`}>{isAchieved ? `Achieved! +${milestone.xpReward} XP` : `${milestone.days - habit.currentStreak} days away`}</Text>
                          </View>
                        </View>
                        {isAchieved && (
                          <View style={tw`bg-amber-50 rounded-full p-2`}>
                            <CheckCircle2 size={20} color="#d97706" strokeWidth={2.5} />
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
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
      </Animated.ScrollView>
    </View>
  );
};

export default HabitDetails;
