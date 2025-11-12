// src/screens/Dashboard.tsx
// Main dashboard screen with habit tracking, holiday mode, and streak savers

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { ScrollView, RefreshControl, View, Text, ActivityIndicator, Pressable, Alert, StatusBar, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Lock, Plus, Zap, PauseCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import SwipeableHabitCard from '../components/SwipeableHabitCard';
import { HolidayModeDisplay } from '../components/dashboard/HolidayModeDisplay';
import { DebugButton } from '@/components/debug/DebugButton';
import { StreakSaverBadge } from '@/components/streakSaver/StreakSaverBadge';
import { StreakSaverShopModal } from '@/components/streakSaver/StreakSaverShopModal';

// Contexts & Services
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useStats } from '../context/StatsContext';
import { useLevelUp } from '@/context/LevelUpContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { HolidayModeService } from '@/services/holidayModeService';
import { getAchievementByLevel, getAchievementTitle } from '@/utils/achievements';
import { HapticFeedback } from '@/utils/haptics';
import Logger from '@/utils/logger';
import { HolidayPeriod } from '@/types/holiday.types';
import { StreakSaverService } from '@/services/StreakSaverService';
import { getTodayString } from '@/utils/dateHelpers';
import TaskBadge from '@/components/TasksBadge';
import AddHabitButton from '@/components/dashboard/AddHabitButton';
import i18n from '@/i18n';
import { UpdateModal } from '@/components/updateModal';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { versionManager } from '@/utils/versionManager';
import { getLocales } from 'expo-localization';
import { getModalTexts, getUpdatesForVersion } from '@/utils/updateContent';
import { Config } from '@/config';

// ============================================================================
// Main Component
// ============================================================================

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { habits, loading: habitsLoading, toggleHabitDay, toggleTask, deleteHabit, refreshHabits } = useHabits();
  const { stats, loading: statsLoading, refreshStats } = useStats();
  const { triggerLevelUp } = useLevelUp();
  const { checkHabitLimit, habitCount, maxHabits, isPremium, refreshSubscription } = useSubscription();

  // State: Loading & UI
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showShop, setShowShop] = useState(false);

  // State: Holiday Mode
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [frozenHabits, setFrozenHabits] = useState<Set<string>>(new Set());
  const [frozenTasksMap, setFrozenTasksMap] = useState<Map<string, Record<string, { pausedUntil: string }>>>(new Map());
  const [streakSaverRefreshTrigger, setStreakSaverRefreshTrigger] = useState(0);
  const { showModal, isChecking, handleClose } = useVersionCheck();

  const locale = getLocales()[0]?.languageCode ?? 'en';
  const currentVersion = versionManager.getCurrentVersion();

  const updates = useMemo(() => getUpdatesForVersion(currentVersion, locale), [currentVersion, locale]);
  const modalTexts = useMemo(() => getModalTexts(locale), [locale]);

  // Fonction pour réinitialiser et revoir la modal (utile pour tester)
  const handleResetVersion = async () => {
    await versionManager.clearLastSeenVersion();
    Alert.alert('Version reset! Restart the app to see the modal again.');
  };

  // State: Debug
  const [testLevel, setTestLevel] = useState(1);

  // Refs
  const isFetchingHolidayRef = useRef(false);
  const lastLoadTime = useRef<number>(0);
  const MIN_RELOAD_INTERVAL = 1000; // 1 second

  // ============================================================================
  // LOADING STATE MANAGEMENT
  // ============================================================================

  const hasMinimumData = useMemo(() => {
    return !habitsLoading && !statsLoading && !holidayLoading && stats !== null && habits !== undefined;
  }, [habitsLoading, statsLoading, holidayLoading, stats, habits]);

  useEffect(() => {
    if (hasMinimumData && isInitialLoad) {
      setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
    }
  }, [hasMinimumData, isInitialLoad]);

  // ============================================================================
  // Holiday Mode Management
  // ============================================================================

  const loadHolidayModeData = useCallback(async () => {
    if (!user?.id || isFetchingHolidayRef.current) return;

    isFetchingHolidayRef.current = true;
    setHolidayLoading(true);

    try {
      const holiday = await HolidayModeService.getActiveHoliday(user.id);
      setActiveHoliday(holiday);

      if (!holiday) {
        setFrozenHabits(new Set());
        setFrozenTasksMap(new Map());
        return;
      }

      if (holiday.appliesToAll) {
        setFrozenHabits(new Set(habits.map((h) => h.id)));
        setFrozenTasksMap(new Map());
        return;
      }

      if (holiday.frozenHabits?.length) {
        setFrozenHabits(new Set(holiday.frozenHabits));
      } else {
        setFrozenHabits(new Set());
      }

      if (holiday.frozenTasks?.length) {
        const tasksMap = new Map<string, Record<string, { pausedUntil: string }>>();

        holiday.frozenTasks.forEach((frozenTask: any) => {
          const { habitId, taskIds } = frozenTask;
          if (!habitId || !Array.isArray(taskIds)) return;

          const habitFrozenTasks: Record<string, { pausedUntil: string }> = {};
          taskIds.forEach((taskId: string) => {
            habitFrozenTasks[taskId] = { pausedUntil: holiday.endDate };
          });

          tasksMap.set(habitId, habitFrozenTasks);
        });

        setFrozenTasksMap(tasksMap);
      } else {
        setFrozenTasksMap(new Map());
      }
    } catch (error) {
      Logger.error('Error loading holiday mode:', error);
      setActiveHoliday(null);
      setFrozenHabits(new Set());
      setFrozenTasksMap(new Map());
    } finally {
      setHolidayLoading(false);
      setIsInitialLoad(false);
      isFetchingHolidayRef.current = false;
    }
  }, [user?.id, habits]);

  const handleEndHoliday = async () => {
    if (!activeHoliday || !user) return;

    HapticFeedback.medium();

    setFrozenHabits(new Set());
    setFrozenTasksMap(new Map());
    setActiveHoliday(null);

    try {
      const result = await HolidayModeService.cancelHoliday(activeHoliday.id, user.id);

      if (result.success) {
        await refreshHabits();
      } else {
        await loadHolidayModeData();
        Alert.alert(t('common.error'), result.error || t('dashboard.holidayEndError'));
      }
    } catch (error) {
      Logger.error('Error ending holiday:', error);
      await loadHolidayModeData();
      Alert.alert(t('common.error'), t('dashboard.holidayEndError'));
    }
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

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
  const isHabitLimitReached = !isPremium && habitCount >= maxHabits;

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleManualRefresh = useCallback(async () => {
    HapticFeedback.light();
    await Promise.all([refreshHabits(), refreshStats(), loadHolidayModeData()]);
  }, [refreshHabits, refreshStats, loadHolidayModeData]);

  const handleCreateHabit = async () => {
    HapticFeedback.light();

    if (isHabitLimitReached) {
      navigation.navigate('Paywall', { source: 'habit_limit' });
      return;
    }

    const canCreate = await checkHabitLimit();
    if (canCreate) {
      navigation.navigate('HabitWizard');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId);
    await refreshSubscription();
  };

  const handleHabitPress = (habitId: string) => {
    HapticFeedback.light();
    const habitFrozenTasks = frozenTasksMap.get(habitId) || {};
    navigation.navigate('HabitDetails', {
      habitId: habitId,
      pausedTasks: habitFrozenTasks,
    });
  };

  const handleTaskToggle = (habitId: string, date: string, taskId: string) => {
    HapticFeedback.success();
    toggleTask(habitId, date, taskId);
  };

  const handleDayToggle = (habitId: string, date: string) => {
    HapticFeedback.success();
    toggleHabitDay(habitId, date);
  };

  const handleTestLevelUp = () => {
    HapticFeedback.light();
    const newLevel = testLevel + 1;
    const achievement = getAchievementByLevel(newLevel);
    setTestLevel(newLevel);
    triggerLevelUp(newLevel, testLevel, achievement);
  };

  const handleStatsRefresh = useCallback(async () => {
    await refreshStats(true);
  }, [refreshStats]);

  const realTimeTasksStats = useMemo(() => {
    const today = getTodayString();
    let completed = 0;
    let total = 0;

    habits.forEach((habit) => {
      const taskCount = habit.tasks?.length || 0;
      total += taskCount;

      const todayData = habit.dailyTasks?.[today];
      if (todayData?.completedTasks) {
        completed += todayData.completedTasks.length;
      }
    });

    return { completed, total };
  }, [habits]);

  const handleStreakSaverPress = async () => {
    if (!user) return;

    HapticFeedback.light();

    try {
      const saveableHabits = await StreakSaverService.getSaveableHabits(user.id);

      if (saveableHabits.length === 0) {
        Logger.debug('No saveable habits found');
        return;
      }

      if (saveableHabits.length === 1) {
        const habit = saveableHabits[0];
        Logger.debug('🎯 Navigating to habit:', habit.habitId);
        navigation.navigate('HabitDetails', {
          habitId: habit.habitId,
          pausedTasks: frozenTasksMap.get(habit.habitId) || {},
        });
      } else {
        const firstHabit = saveableHabits[0];
        Logger.debug('🎯 Multiple saveable habits, navigating to first:', firstHabit.habitId);
        navigation.navigate('HabitDetails', {
          habitId: firstHabit.habitId,
          pausedTasks: frozenTasksMap.get(firstHabit.habitId) || {},
        });
      }
    } catch (error) {
      Logger.error('Error handling streak saver press:', error);
    }
  };

  // ============================================================================
  // Effects
  // ============================================================================

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        if (!user?.id || !isMounted) return;

        const now = Date.now();
        if (now - lastLoadTime.current < MIN_RELOAD_INTERVAL) {
          return;
        }

        lastLoadTime.current = now;
        await Promise.all([loadHolidayModeData(), refreshSubscription()]);
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [user?.id, loadHolidayModeData, refreshSubscription])
  );

  useFocusEffect(
    useCallback(() => {
      setStreakSaverRefreshTrigger((prev) => prev + 1);
    }, [])
  );

  // ============================================================================
  // Render: Loading State
  // ============================================================================

  if (isInitialLoad && (habitsLoading || statsLoading || holidayLoading)) {
    return (
      <ImageBackground source={require('../../assets/interface/textures/texture-white.png')} style={tw`flex-1`} imageStyle={{ opacity: 0.15 }}>
        <SafeAreaView style={tw`flex-1 bg-transparent`}>
          <View style={tw`flex-1 items-center justify-center`}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ============================================================================
  // Render: Main UI
  // ============================================================================

  return (
    <ImageBackground source={require('../../assets/interface/textures/texture-white.png')} style={tw`flex-1`} imageStyle={{ opacity: 0.2 }} resizeMode="repeat">
      <SafeAreaView style={tw`flex-1 bg-transparent `} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        <ScrollView
          style={tw`flex-1 px-5`}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleManualRefresh} tintColor="#3b82f6" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-28`}
        >
          {/* Debug: Level Up Test */}
          <DebugButton onPress={handleTestLevelUp} label={`Test Level ${testLevel} → ${testLevel + 1}`} icon={Zap} variant="secondary" />

          {/* Header with stats & progress */}
          <DashboardHeader
            userTitle={stats?.currentAchievement ? getAchievementTitle(stats.level) : t('achievements.tiers.novice')}
            userLevel={stats?.level ?? 1}
            totalStreak={stats?.totalStreak ?? 0}
            activeHabits={stats?.activeHabits ?? 0}
            completedTasksToday={stats?.completedTasksToday ?? 0}
            totalTasksToday={stats?.totalTasksToday ?? 0}
            currentAchievement={stats?.currentAchievement}
            currentLevelXP={stats?.currentLevelXP ?? 0}
            xpForNextLevel={stats?.xpForNextLevel ?? 100}
            levelProgress={stats?.levelProgress ?? 0}
            onStatsRefresh={handleStatsRefresh}
            totalXP={stats?.totalXP ?? 0}
            habits={habits}
          />

          {/* Streak Saver Badge */}
          {!showPartialPauseMode && !hasTasksPaused && !showFullHolidayMode && (
            <>
              <StreakSaverBadge
                onPress={handleStreakSaverPress}
                onShopPress={() => {
                  HapticFeedback.light();
                  setShowShop(true);
                }}
                refreshTrigger={streakSaverRefreshTrigger}
              />
              <StreakSaverShopModal
                visible={showShop}
                onClose={() => {
                  HapticFeedback.light();
                  setShowShop(false);
                }}
                onPurchaseSuccess={() => {
                  setShowShop(false);
                  setStreakSaverRefreshTrigger((prev) => prev + 1);
                }}
              />
            </>
          )}

          {/* Partial Holiday Mode Banner */}
          {(showPartialPauseMode || hasTasksPaused) && !showFullHolidayMode && (
            <Animated.View entering={FadeInUp.delay(100)} style={tw`mt-4 mb-2`}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[tw`mx-1 px-4 py-3.5 rounded-2xl flex-row items-center gap-3`, { borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' }]}
              >
                <View style={tw`w-9 h-9 bg-blue-100 rounded-xl items-center justify-center`}>
                  <PauseCircle size={18} color="#2563EB" strokeWidth={2.5} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-blue-700`}>{t('dashboard.holidayModeActive')}</Text>
                  <Text style={tw`text-xs text-blue-600 mt-0.5`}>
                    {pausedHabitsCount > 0 && t('dashboard.habitsPaused', { count: pausedHabitsCount })}
                    {pausedHabitsCount > 0 && hasTasksPaused && ' • '}
                    {hasTasksPaused && t('dashboard.tasksPaused', { count: frozenTasksMap.size })}
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Habits Section */}
          <Animated.View entering={FadeInUp.delay(200)} style={tw`mt-8`}>
            {/* Free user habit limit indicator */}
            {!isPremium && habitCount > 0 && (
              <View
                style={[
                  tw`mx-1 mb-3 px-4 py-3 rounded-2xl flex-row items-center justify-center`,
                  {
                    backgroundColor: isHabitLimitReached ? 'rgba(251, 146, 60, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                    borderWidth: 1,
                    borderColor: isHabitLimitReached ? 'rgba(251, 146, 60, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  },
                ]}
              >
                {isHabitLimitReached ? (
                  <>
                    <Lock size={14} color="#EA580C" strokeWidth={2.5} style={tw`mr-2`} />
                    <Text style={tw`text-xs font-bold text-orange-700 tracking-wide flex-shrink`}>{t('dashboard.habitLimitReached')}</Text>
                  </>
                ) : (
                  <Text style={tw`text-xs font-bold text-blue-700 tracking-wide`}>{t('dashboard.habitCount', { count: habitCount, max: maxHabits })}</Text>
                )}
              </View>
            )}
            {/* Section Header */}
            {!showFullHolidayMode && activeHabits.length > 0 ? (
              <View style={tw`mb-0`}>
                <TaskBadge completed={realTimeTasksStats.completed} total={realTimeTasksStats.total} onAddPress={handleCreateHabit} showAddButton={habits.length > 0} />
                <AddHabitButton onPress={handleCreateHabit} />
              </View>
            ) : showFullHolidayMode ? (
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View>
                  <Text style={tw`text-xl font-bold text-stone-700`}>{t('dashboard.onHoliday')}</Text>
                  <Text style={tw`text-sm text-stone-500 mt-0.5`}>{t('dashboard.allHabitsPaused')}</Text>
                </View>
              </View>
            ) : (
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View>
                  <Text style={tw`text-xl font-bold text-stone-700`}>{t('dashboard.getStarted')}</Text>
                  <Text style={tw`text-sm text-stone-500 mt-0.5`}>{t('dashboard.startBuilding')}</Text>
                </View>
              </View>
            )}
            {/* Full Holiday Mode Display */}
            {showFullHolidayMode ? (
              activeHoliday ? (
                <HolidayModeDisplay endDate={activeHoliday.endDate} reason={activeHoliday.reason} onEndEarly={handleEndHoliday} />
              ) : (
                <View style={tw`px-5`}>
                  <LinearGradient colors={['rgba(59, 130, 246, 0.08)', 'rgba(37, 99, 235, 0.05)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`rounded-3xl p-8 border border-blue-200/20`}>
                    <View style={tw`items-center`}>
                      <View style={tw`w-20 h-20 bg-blue-100 rounded-2xl items-center justify-center mb-5`}>
                        <PauseCircle size={40} color="#2563EB" strokeWidth={2} />
                      </View>
                      <Text style={tw`text-2xl font-bold text-blue-800 mb-2`}>{t('dashboard.allHabitsPausedTitle')}</Text>
                      <Text style={tw`text-sm text-blue-600 text-center px-4`}>{t('dashboard.allHabitsPausedMessage')}</Text>
                    </View>
                  </LinearGradient>
                </View>
              )
            ) : activeHabits.length > 0 ? (
              /* Active Habits List */
              <View style={tw`gap-3`}>
                {activeHabits.map((habit, index) => (
                  <SwipeableHabitCard
                    key={habit.id}
                    habit={habit}
                    onToggleDay={handleDayToggle}
                    onToggleTask={handleTaskToggle}
                    onDelete={handleDeleteHabit}
                    onPress={() => handleHabitPress(habit.id)}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              /* Empty State - Create First Habit */
              <View style={tw`px-5`}>
                <Pressable onPress={handleCreateHabit} style={({ pressed }) => [pressed && tw`scale-[0.98]`]}>
                  <LinearGradient colors={['rgba(243, 244, 246, 0.5)', 'rgba(229, 231, 235, 0.3)']} style={tw`rounded-2xl p-8 items-center border border-stone-200`}>
                    <View style={tw`w-16 h-16 mb-4`}>
                      <LinearGradient colors={['#9CA3AF', '#6B7280']} style={tw`w-full h-full rounded-2xl items-center justify-center shadow-lg`}>
                        <Plus size={28} color="#ffffff" strokeWidth={2.5} />
                      </LinearGradient>
                    </View>

                    <Text style={tw`text-lg font-bold text-stone-700 mb-2`}>{t('dashboard.createFirstHabit')}</Text>
                    <Text style={tw`text-sm text-stone-500 text-center px-4`}>{t('dashboard.startJourney')}</Text>

                    <View style={tw`mt-4 px-6 py-2 bg-sand rounded-full border border-stone-300 shadow-sm`}>
                      <Text style={tw`text-sm font-semibold text-stone-600`}>{t('dashboard.tapToBegin')}</Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            )}
            {/* Bouton pour tester la modal - DEV ONLY */}
            {Config.debug.enabled && (
              <TouchableOpacity onPress={handleResetVersion} style={tw`bg-slate-200 px-6 py-3 rounded-xl`}>
                <Text style={tw`text-slate-700 font-medium`}>Reset Version (Debug Mode)</Text>
              </TouchableOpacity>
            )}
            <UpdateModal visible={showModal} onClose={handleClose} version={currentVersion} updates={updates} texts={modalTexts} />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Dashboard;
