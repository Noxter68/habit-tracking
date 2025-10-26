// src/screens/Dashboard.tsx
// ✅ COMPLETE SOLUTION: Auto-refresh holiday mode + NO UI FLICKER

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { ScrollView, RefreshControl, View, Text, ActivityIndicator, Pressable, ImageBackground, Dimensions, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Lock, Plus, TrendingUp, TrendingUpIcon, Zap, PauseCircle } from 'lucide-react-native';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SwipeableHabitCard from '../components/SwipeableHabitCard';
import { HolidayModeDisplay } from '../components/dashboard/HolidayModeDisplay';

// Contexts
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useStats } from '../context/StatsContext';
import { getAchievementByLevel } from '@/utils/achievements';

import { useLevelUp } from '@/context/LevelUpContext';
import { DebugButton } from '@/components/debug/DebugButton';
import { useSubscription } from '@/context/SubscriptionContext';
import { StreakSaverBadge } from '@/components/streakSaver/StreakSaverBadge';
import { StreakSaverService } from '@/services/StreakSaverService';
import { StreakSaverShopModal } from '@/components/streakSaver/StreakSaverShopModal';
import { Image } from 'react-native';
import { HolidayModeService, HolidayPeriod } from '@/services/holidayModeService';

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { habits, loading: habitsLoading, toggleHabitDay, toggleTask, deleteHabit, refreshHabits } = useHabits();

  const { stats, loading: statsLoading, refreshStats } = useStats();
  const previousLevelRef = useRef<number | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    newLevel: number;
    previousLevel: number;
    achievement: any;
  } | null>(null);
  const [badgeRefresh, setBadgeRefresh] = useState(0);
  const [showShop, setShowShop] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Holiday Mode State
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const isFetchingHolidayRef = useRef(false);
  const [frozenHabits, setFrozenHabits] = useState<Set<string>>(new Set());
  const [frozenTasksMap, setFrozenTasksMap] = useState<Map<string, Record<string, { pausedUntil: string }>>>(new Map());

  const [testLevel, setTestLevel] = useState(1);
  const { triggerLevelUp } = useLevelUp();

  const { checkHabitLimit, habitCount, maxHabits, isPremium } = useSubscription();

  const renderCount = useRef(0);

  renderCount.current++;
  useEffect(() => {
    console.log(`Dashboard render #${renderCount.current}`);
  });

  // ============================================================================
  // ✅ REUSABLE HOLIDAY MODE LOADER
  // ============================================================================
  const loadHolidayModeData = useCallback(async () => {
    if (!user?.id || isFetchingHolidayRef.current) return;

    isFetchingHolidayRef.current = true;
    setHolidayLoading(true);

    try {
      const holiday = await HolidayModeService.getActiveHoliday(user.id);
      setActiveHoliday(holiday);

      if (!holiday) {
        console.log('📅 No active holiday');
        setFrozenHabits(new Set());
        setFrozenTasksMap(new Map());
        return;
      }

      console.log('✅ Active holiday found:', {
        id: holiday.id,
        appliesToAll: holiday.appliesToAll,
        frozenHabits: holiday.frozenHabits,
        frozenTasks: holiday.frozenTasks,
        endDate: holiday.endDate,
      });

      // SCENARIO 1: All habits frozen
      if (holiday.appliesToAll) {
        console.log('🔒 All habits frozen (applies_to_all)');
        setFrozenHabits(new Set(habits.map((h) => h.id)));
        setFrozenTasksMap(new Map());
        return;
      }

      // SCENARIO 2: Specific habits frozen
      if (holiday.frozenHabits && Array.isArray(holiday.frozenHabits) && holiday.frozenHabits.length > 0) {
        console.log('🔒 Frozen habits:', holiday.frozenHabits);
        setFrozenHabits(new Set(holiday.frozenHabits));
      } else {
        setFrozenHabits(new Set());
      }

      // SCENARIO 3: Specific tasks frozen
      if (holiday.frozenTasks && Array.isArray(holiday.frozenTasks) && holiday.frozenTasks.length > 0) {
        console.log('✅ Active holiday with frozen tasks:', holiday.frozenTasks);

        const tasksMap = new Map<string, Record<string, { pausedUntil: string }>>();

        holiday.frozenTasks.forEach((frozenTask: any) => {
          const { habitId, taskIds } = frozenTask;

          if (!habitId || !taskIds || !Array.isArray(taskIds)) {
            console.warn('⚠️ Invalid frozen task structure:', frozenTask);
            return;
          }

          const habitFrozenTasks: Record<string, { pausedUntil: string }> = {};

          taskIds.forEach((taskId: string) => {
            habitFrozenTasks[taskId] = {
              pausedUntil: holiday.endDate,
            };
          });

          tasksMap.set(habitId, habitFrozenTasks);
          console.log(`🔒 Habit ${habitId} has ${taskIds.length} frozen tasks until ${holiday.endDate}`);
        });

        setFrozenTasksMap(tasksMap);
        console.log('📊 Frozen tasks map created:', {
          totalHabitsAffected: tasksMap.size,
          habitIds: Array.from(tasksMap.keys()),
        });
      } else {
        setFrozenTasksMap(new Map());
      }
    } catch (error) {
      console.error('❌ Error loading holiday mode:', error);
      setActiveHoliday(null);
      setFrozenHabits(new Set());
      setFrozenTasksMap(new Map());
    } finally {
      setHolidayLoading(false);
      setIsInitialLoad(false);
      isFetchingHolidayRef.current = false;
    }
  }, [user?.id, habits]);

  // ============================================================================
  // ✅ INITIAL LOAD: Load holiday mode when component mounts
  // ============================================================================
  useEffect(() => {
    loadHolidayModeData();
  }, [user?.id, habits.length]);

  // ============================================================================
  // ✅ AUTO-REFRESH: Reload holiday mode when returning to Dashboard
  // ============================================================================
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Dashboard focused - checking for holiday updates');
      loadHolidayModeData();
    }, [loadHolidayModeData])
  );

  // ✅ Filter habits based on frozen status
  const { activeHabits, pausedHabitsCount, hasPartialPause } = useMemo(() => {
    const active = habits.filter((habit) => !frozenHabits.has(habit.id));
    const pausedCount = habits.length - active.length;
    const partial = pausedCount > 0 && pausedCount < habits.length;

    return {
      activeHabits: active,
      pausedHabitsCount: pausedCount,
      hasPartialPause: partial,
    };
  }, [habits, frozenHabits]);

  const hasTasksPaused = frozenTasksMap.size > 0;
  const showFullHolidayMode = activeHabits.length === 0 && habits.length > 0;
  const showPartialPauseMode = hasPartialPause && !showFullHolidayMode;

  const handleManualRefresh = useCallback(async () => {
    await Promise.all([refreshHabits(), refreshStats(), loadHolidayModeData()]);
  }, [refreshHabits, refreshStats, loadHolidayModeData]);

  const handleTestLevelUp = () => {
    const currentLevel = testLevel;
    const newLevel = currentLevel + 1;
    const achievement = getAchievementByLevel(newLevel);

    setTestLevel(newLevel);
    triggerLevelUp(newLevel, currentLevel, achievement);
  };

  const handleStreakSaverPress = async () => {
    if (!user) return;
    const { count } = await StreakSaverService.getStreakSavers(user.id);

    if (count > 0) {
      Alert.alert('Streak Savers', `You have ${count} Streak ${count === 1 ? 'Saver' : 'Savers'} available. They'll automatically protect your streaks if you miss a day.`, [
        { text: 'Got it', style: 'cancel' },
      ]);
    } else {
      setShowShop(true);
    }
  };

  const handleOptimisticEndHoliday = async () => {
    if (!activeHoliday || !user) return;

    setFrozenHabits(new Set());
    setFrozenTasksMap(new Map());
    setActiveHoliday(null);

    try {
      await HolidayModeService.endHoliday(activeHoliday.id, user.id);
      await refreshHabits();
    } catch (error) {
      console.error('Error ending holiday:', error);
      await loadHolidayModeData();
    }
  };

  const handleCreateHabit = async () => {
    const canCreate = await checkHabitLimit();
    if (canCreate) {
      navigation.navigate('HabitWizard');
    }
  };

  if (isInitialLoad && (habitsLoading || statsLoading || holidayLoading)) {
    return (
      <SafeAreaView style={tw`flex-1 bg-sand`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-sand`} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={tw`flex-1 px-5`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleManualRefresh} tintColor="#3b82f6" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tw`pb-28`}
      >
        {/* DEV MODE: Test Button */}
        <DebugButton onPress={handleTestLevelUp} label={`Test Level ${testLevel} → ${testLevel + 1}`} icon={Zap} variant="secondary" />

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
          onStatsRefresh={() => {}}
          totalXP={stats?.totalXP ?? 0}
        />

        {!showPartialPauseMode && !hasTasksPaused && !showFullHolidayMode && (
          <>
            <StreakSaverBadge onPress={handleStreakSaverPress} onShopPress={() => setShowShop(true)} refreshTrigger={badgeRefresh} />

            <StreakSaverShopModal
              visible={showShop}
              onClose={() => setShowShop(false)}
              onPurchaseSuccess={() => {
                setBadgeRefresh((prev) => prev + 1);
              }}
            />
          </>
        )}

        {/* ✅ HOLIDAY MODE BANNER - Show when habits or tasks are paused */}
        {(showPartialPauseMode || hasTasksPaused) && !showFullHolidayMode && (
          <Animated.View entering={FadeInUp.delay(100)} style={tw`mt-4 mb-2`}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                tw`mx-1 px-4 py-3.5 rounded-2xl flex-row items-center gap-3`,
                {
                  borderWidth: 1,
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                },
              ]}
            >
              <View style={tw`w-9 h-9 bg-blue-100 rounded-xl items-center justify-center`}>
                <PauseCircle size={18} color="#2563EB" strokeWidth={2.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-bold text-blue-700`}>Holiday Mode Active</Text>
                <Text style={tw`text-xs text-blue-600 mt-0.5`}>
                  {pausedHabitsCount > 0 && `${pausedHabitsCount} ${pausedHabitsCount === 1 ? 'habit' : 'habits'} paused`}
                  {pausedHabitsCount > 0 && hasTasksPaused && ' • '}
                  {hasTasksPaused && `${frozenTasksMap.size} ${frozenTasksMap.size === 1 ? 'habit has' : 'habits have'} paused tasks`}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Habits Section */}
        <Animated.View entering={FadeInUp.delay(200)} style={tw`mt-6`}>
          <View>
            {!isPremium && habitCount > 0 && (
              <View
                style={[
                  tw`mx-6 mb-3 px-4 py-3.5 rounded-2xl flex-row items-center justify-center gap-2.5`,
                  {
                    backgroundColor: habitCount >= maxHabits ? 'rgba(251, 146, 60, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 1,
                    borderColor: habitCount >= maxHabits ? 'rgba(251, 146, 60, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  },
                ]}
              >
                {habitCount >= maxHabits ? (
                  <>
                    <Lock size={14} color="#EA580C" strokeWidth={2.5} />
                    <Text style={tw`text-xs font-bold text-orange-700 tracking-wide`}>Habit limit reached • Upgrade for unlimited</Text>
                  </>
                ) : (
                  <>
                    <TrendingUpIcon size={14} color="#2563EB" strokeWidth={2.5} />
                    <Text style={tw`text-xs font-bold text-blue-700 tracking-wide`}>
                      {habitCount} of {maxHabits} free habits
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Section Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View>
              <Text style={tw`text-xl font-bold text-quartz-700`}>{showFullHolidayMode ? 'On Holiday' : activeHabits.length > 0 ? "Today's Habits" : 'Get Started'}</Text>
              <Text style={tw`text-sm text-quartz-500 mt-0.5`}>
                {showFullHolidayMode
                  ? 'All habits are paused'
                  : activeHabits.length > 0
                  ? `${stats?.completedTasksToday ?? 0} of ${stats?.totalTasksToday ?? 0} tasks done`
                  : 'Start building your first habit'}
              </Text>
            </View>

            {habits.length > 0 && !showFullHolidayMode && (
              <Pressable onPress={handleCreateHabit} style={({ pressed }) => [tw`w-10 h-10 rounded-xl items-center justify-center`, pressed && tw`scale-95`]}>
                <Image source={require('../../assets/interface/add-habit-button.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
              </Pressable>
            )}
          </View>

          {/* ✅ FULL HOLIDAY MODE - All habits paused */}
          {showFullHolidayMode ? (
            activeHoliday ? (
              <HolidayModeDisplay endDate={activeHoliday.endDate} reason={activeHoliday.reason} onEndEarly={handleOptimisticEndHoliday} />
            ) : (
              <View style={tw`px-5`}>
                <LinearGradient colors={['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`rounded-3xl p-8 border border-blue-200/20`}>
                  <View style={tw`items-center`}>
                    <View style={tw`w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-5`}>
                      <PauseCircle size={40} color="#2563EB" strokeWidth={2} />
                    </View>
                    <Text style={tw`text-2xl font-bold text-blue-800 mb-2`}>All Habits Paused</Text>
                    <Text style={tw`text-sm text-blue-600 text-center px-4`}>All your habits are currently paused. They'll automatically resume when their pause periods end.</Text>
                  </View>
                </LinearGradient>
              </View>
            )
          ) : activeHabits.length > 0 ? (
            <View style={tw`gap-3`}>
              {activeHabits.map((habit, index) => (
                <SwipeableHabitCard
                  key={habit.id}
                  habit={habit}
                  onToggleDay={toggleHabitDay}
                  onToggleTask={toggleTask}
                  onDelete={deleteHabit}
                  onPress={() => {
                    const habitFrozenTasks = frozenTasksMap.get(habit.id) || {};
                    navigation.navigate('HabitDetails', {
                      habitId: habit.id,
                      pausedTasks: habitFrozenTasks,
                    });
                  }}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <View style={tw`px-5`}>
              <Pressable onPress={handleCreateHabit} style={({ pressed }) => [pressed && tw`scale-[0.98]`]}>
                <LinearGradient colors={['rgba(243, 244, 246, 0.5)', 'rgba(229, 231, 235, 0.3)']} style={tw`rounded-2xl p-8 items-center border border-quartz-200`}>
                  <View style={tw`w-16 h-16 mb-4`}>
                    <LinearGradient colors={['#9CA3AF', '#6B7280']} style={tw`w-full h-full rounded-2xl items-center justify-center shadow-lg`}>
                      <Plus size={28} color="#ffffff" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>

                  <Text style={tw`text-lg font-bold text-quartz-700 mb-2`}>Create Your First Habit</Text>
                  <Text style={tw`text-sm text-quartz-500 text-center px-4`}>Start your journey to build better habits and earn achievements!</Text>

                  <View style={tw`mt-4 px-6 py-2 bg-sand rounded-full border border-quartz-300 shadow-sm`}>
                    <Text style={tw`text-sm font-semibold text-quartz-600`}>Tap to Begin →</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
