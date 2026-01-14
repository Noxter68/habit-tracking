// src/screens/Dashboard.tsx
// Écran principal du tableau de bord avec suivi des habitudes,
// mode vacances, et sauvegarde de streaks

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { ScrollView, RefreshControl, View, Text, ActivityIndicator, Pressable, Alert, StatusBar, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Lock, Plus, Zap, PauseCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';
import tw from '../lib/tailwind';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { SwipeableDashboardCard } from '../components/dashboard/SwipeableDashboardCard';
import { HolidayModeDisplay } from '../components/dashboard/HolidayModeDisplay';
import { XPPopup } from '../components/dashboard/XPPopup';
import { DebugButton } from '@/components/debug/DebugButton';
import { StreakSaverBadge } from '@/components/streakSaver/StreakSaverBadge';
import { StreakSaverShopModal } from '@/components/streakSaver/StreakSaverShopModal';
import { StreakSaverSelectionModal } from '@/components/streakSaver/StreakSaverSelectionModal';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import TaskBadge from '@/components/TasksBadge';
import { UpdateModal } from '@/components/updateModal';
import { HabitsSectionHeader } from '@/components/dashboard/HabitsSectionHeader';
import { HabitCategoryBadge } from '@/components/dashboard/HabitCategoryBadge';
import { DailyMotivationModal } from '@/components/motivation/DailyMotivationModal';

// Contexts
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import { useStats } from '../context/StatsContext';
import { useLevelUp } from '@/context/LevelUpContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useQuestNotification } from '@/context/QuestNotificationContext';
import { useQuests } from '@/context/QuestContext';
import { useInventory } from '@/context/InventoryContext';

// Services
import { HolidayModeService } from '@/services/holidayModeService';
import { StreakSaverService } from '@/services/StreakSaverService';

// Utils
import { getAchievementByLevel, getAchievementTitle, achievementTitles } from '@/utils/achievements';
import { HapticFeedback } from '@/utils/haptics';
import Logger from '@/utils/logger';
import { getTodayString, isWeeklyHabitCompletedThisWeek, getWeeklyCompletedTasksCount } from '@/utils/dateHelpers';
import { versionManager } from '@/utils/versionManager';
import { getModalTexts, getUpdatesForVersion } from '@/utils/updateContent';
import { getAchievementTierTheme, tierThemes } from '@/utils/tierTheme';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { getTasksForCategory } from '@/utils/habitHelpers';

// Types & Config
import { HolidayPeriod } from '@/types/holiday.types';
import { Config } from '@/config';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useMultipleHabitMilestonesCount, useUnclaimedMilestones } from '@/hooks/useHabitMilestones';
import { useDailyMotivation } from '@/hooks/useDailyMotivation';

// ============================================================================
// Main Component
// ============================================================================

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, username } = useAuth();
  const { habits, loading: habitsLoading, toggleTask, deleteHabit, refreshHabits } = useHabits();
  const { stats, loading: statsLoading, refreshStats } = useStats();
  const { triggerLevelUp } = useLevelUp();
  const { checkHabitLimit, habitCount, maxHabits, isPremium, refreshSubscription } = useSubscription();
  const { showQuestCompletion } = useQuestNotification();
  const { refreshQuests } = useQuests();
  const { activeBoost, toggleDebugBoost, refreshInventory } = useInventory();

  // Check if boost is active
  const hasActiveBoost = activeBoost && new Date(activeBoost.expires_at) > new Date();

  // State: Loading & UI
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [showStreakSaverSelection, setShowStreakSaverSelection] = useState(false);
  const [saveableHabits, setSaveableHabits] = useState<Array<{
    habitId: string;
    habitName: string;
    previousStreak: number;
    missedDate: string;
  }>>([]);
  const [streakSaverInventory, setStreakSaverInventory] = useState({ available: 0, totalUsed: 0 });

  // State: Streak Saver Modal (pour sauvegarder directement depuis le Dashboard)
  const [showStreakSaverModal, setShowStreakSaverModal] = useState(false);
  const [selectedHabitToSave, setSelectedHabitToSave] = useState<{
    habitId: string;
    habitName: string;
    previousStreak: number;
  } | null>(null);
  const [streakSaverLoading, setStreakSaverLoading] = useState(false);
  const [streakSaverSuccess, setStreakSaverSuccess] = useState(false);
  const [streakSaverError, setStreakSaverError] = useState<string | null>(null);
  const [newStreak, setNewStreak] = useState(0);

  // State: Holiday Mode
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayLoading, setHolidayLoading] = useState(true);
  const [frozenHabits, setFrozenHabits] = useState<Set<string>>(new Set());
  const [frozenTasksMap, setFrozenTasksMap] = useState<Map<string, Record<string, { pausedUntil: string }>>>(new Map());
  const [streakSaverRefreshTrigger, setStreakSaverRefreshTrigger] = useState(0);
  const { showModal, isChecking, handleClose } = useVersionCheck();

  // Daily Motivation Modal
  const {
    showModal: showMotivationModal,
    closeModal: closeMotivationModal,
    forceShow: forceShowMotivation,
    isTestMode: isMotivationTestMode,
  } = useDailyMotivation();

  const locale = getLocales()[0]?.languageCode ?? 'en';
  const currentVersion = versionManager.getCurrentVersion();

  const updates = useMemo(() => getUpdatesForVersion(currentVersion, locale), [currentVersion, locale]);
  const modalTexts = useMemo(() => getModalTexts(locale), [locale]);

  // Fonction pour réinitialiser et revoir la modal (utile pour tester)
  const handleResetVersion = async () => {
    await versionManager.clearLastSeenVersion();
    Alert.alert('Version reset! Restart the app to see the modal again.');
  };

  // Handle Update Modal close
  const handleUpdateModalClose = async () => {
    await handleClose();
  };

  // State: Debug
  const [testLevel, setTestLevel] = useState(1);
  const [debugForceUnclaimedMilestones, setDebugForceUnclaimedMilestones] = useState(false);
  const [debugFirstHabitMilestone, setDebugFirstHabitMilestone] = useState(false);

  // State: Scroll detection for pausing animations (only when scrolled past 80px)
  const [isScrolledPastHeader, setIsScrolledPastHeader] = useState(false);

  // State: XP Popup
  const [xpPopup, setXpPopup] = useState<{
    visible: boolean;
    taskName: string;
    xpAmount: number;
    accentColor: string;
    isBoosted: boolean;
  }>({ visible: false, taskName: '', xpAmount: 0, accentColor: '#3b82f6', isBoosted: false });

  // Refs
  const isFetchingHolidayRef = useRef(false);
  const lastLoadTime = useRef<number>(0);
  const MIN_RELOAD_INTERVAL = 1000; // 1 second
  // Ref to access habits without causing re-renders
  const habitsRef = useRef(habits);
  habitsRef.current = habits;

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

  // Separate habits by frequency (daily vs weekly)
  // Sort: completed habits go to the bottom, incomplete ones stay on top (stable order)
  const { dailyHabits, weeklyHabits } = useMemo(() => {
    const today = getTodayString();

    // Helper: check if a habit is fully completed today
    const isHabitCompleted = (habit: any) => {
      const todayTasks = habit.dailyTasks?.[today];
      const totalTasks = habit.tasks?.length || 0;
      const completedCount = todayTasks?.completedTasks?.length || 0;
      return totalTasks > 0 && completedCount >= totalTasks;
    };

    const daily = activeHabits.filter((habit) => habit.frequency !== 'weekly');
    const weekly = activeHabits.filter((habit) => habit.frequency === 'weekly');

    // Sort: incomplete habits first, then completed habits
    const sortByCompletion = (a: any, b: any) => {
      const aCompleted = isHabitCompleted(a);
      const bCompleted = isHabitCompleted(b);
      if (aCompleted === bCompleted) return 0; // Keep original order
      return aCompleted ? 1 : -1; // Completed goes to bottom
    };

    return {
      dailyHabits: [...daily].sort(sortByCompletion),
      weeklyHabits: [...weekly].sort(sortByCompletion)
    };
  }, [activeHabits]);

  // Load milestones counts for all habits
  const habitIds = useMemo(() => habits.map((h) => h.id), [habits]);
  const milestoneCounts = useMultipleHabitMilestonesCount(habitIds);

  // Detect unclaimed milestones for all habits
  const baseUnclaimedMilestones = useUnclaimedMilestones(habits, debugForceUnclaimedMilestones);

  // Override for debug: simulate first habit having unclaimed milestone
  const unclaimedMilestones = useMemo(() => {
    if (!debugFirstHabitMilestone || habits.length === 0) return baseUnclaimedMilestones;
    return {
      ...baseUnclaimedMilestones,
      [habits[0].id]: true,
    };
  }, [baseUnclaimedMilestones, debugFirstHabitMilestone, habits]);

  // Get user's current tier theme for motivation modal
  const userTierTheme = useMemo(() => {
    if (!stats?.level) return null;
    const currentTitle = achievementTitles.find((t) => stats.level >= t.level && stats.level < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));
    if (!currentTitle) return null;
    return getAchievementTierTheme(currentTitle.tierKey);
  }, [stats?.level]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleManualRefresh = useCallback(async () => {
    HapticFeedback.light();
    await Promise.all([refreshHabits(), refreshStats(), loadHolidayModeData(), refreshInventory()]);
  }, [refreshHabits, refreshStats, loadHolidayModeData, refreshInventory]);

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

  const handleTaskToggle = useCallback(async (habitId: string, date: string, taskId: string) => {
    HapticFeedback.success();

    // Utiliser la ref pour éviter de recréer ce callback à chaque changement de habits
    const habit = habitsRef.current.find(h => h.id === habitId);
    if (habit) {
      const today = getTodayString();
      const todayTasks = habit.dailyTasks?.[today];
      const isCompleting = !todayTasks?.completedTasks?.includes(taskId);

      // Afficher la popup seulement quand on complète (pas quand on décoche)
      if (isCompleting) {
        // Trouver le nom de la tâche
        const task = habit.tasks.find((t: any) =>
          (typeof t === 'string' ? t : t.id) === taskId
        );
        const taskName = typeof task === 'string' ? task : task?.name || taskId;

        // Récupérer les infos de traduction de la tâche
        const predefinedTasks = getTasksForCategory(habit.category, habit.type as any);
        const translatedTask = predefinedTasks.find(t => t.id === taskId);
        const displayName = translatedTask?.name || taskName;

        // Calculer le tier pour la couleur
        const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
        const theme = tierThemes[tier.name];

        // Calculer l'XP basé sur le numéro de la tâche complétée
        // 1ère tâche = 3 XP, 2ème = 7 XP, 3ème+ = 12 XP
        // On compte les tâches déjà complétées + 1 pour la tâche actuelle
        const completedCount = todayTasks?.completedTasks?.length || 0;
        const taskNumber = completedCount + 1;

        let baseXpAmount = 12; // Par défaut pour 3ème tâche et plus
        if (taskNumber === 1) baseXpAmount = 3;
        else if (taskNumber === 2) baseXpAmount = 7;

        // Apply boost multiplier for display
        const boostMultiplier = hasActiveBoost && activeBoost?.boost_percent
          ? 1 + activeBoost.boost_percent / 100
          : 1;
        const xpAmount = Math.ceil(baseXpAmount * boostMultiplier);

        setXpPopup({
          visible: true,
          taskName: displayName,
          xpAmount: xpAmount,
          accentColor: theme?.accent || '#3b82f6',
          isBoosted: !!hasActiveBoost,
        });
      }
      // Note: pas de popup XP quand on décoche une tâche
    }

    await toggleTask(habitId, date, taskId);
    // Refresh quests silently to detect newly completed quests
    // Small delay to ensure Supabase has processed the quest update
    setTimeout(() => {
      refreshQuests(true);
    }, 500);
  }, [toggleTask, refreshQuests, hasActiveBoost, activeBoost]);

  const handleTestLevelUp = () => {
    HapticFeedback.light();
    const newLevel = testLevel + 1;
    const achievement = getAchievementByLevel(newLevel);
    setTestLevel(newLevel);
    triggerLevelUp(newLevel, testLevel, achievement);
  };

  const handleTestQuestCompletion = () => {
    HapticFeedback.light();
    showQuestCompletion('quests.seven_sparks.name', {
      kind: 'XP',
      amount: 40
    });
  };

  const handleTestQuestBoost = () => {
    HapticFeedback.light();
    showQuestCompletion('quests.task_master.name', {
      kind: 'BOOST',
      boost: {
        percent: 10,
        durationHours: 24
      }
    });
  };

  const handleTestMultipleQuests = () => {
    HapticFeedback.light();
    // Show 3 different quest completions in sequence
    showQuestCompletion('quests.seven_sparks.name', {
      kind: 'XP',
      amount: 40
    });

    showQuestCompletion('quests.task_master.name', {
      kind: 'BOOST',
      boost: {
        percent: 10,
        durationHours: 24
      }
    });

    showQuestCompletion('quests.habit_builder.name', {
      kind: 'XP',
      amount: 60
    });
  };

  const handleStatsRefresh = useCallback(async () => {
    await refreshStats(true);
  }, [refreshStats]);

  // Handle scroll events to pause animations when scrolled past header threshold
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const threshold = 80;

    // Only update state if it changed to avoid unnecessary re-renders
    setIsScrolledPastHeader((prev) => {
      const shouldPause = scrollY > threshold;
      return prev !== shouldPause ? shouldPause : prev;
    });
  }, []);

  const realTimeTasksStats = useMemo(() => {
    const today = getTodayString();
    let completed = 0;
    let total = 0;

    habits.forEach((habit) => {
      const taskCount = habit.tasks?.length || 0;
      const isWeekly = habit.frequency === 'weekly';

      // Pour les habitudes weekly, vérifier si elles sont déjà complétées cette semaine calendaire (lundi-dimanche)
      if (isWeekly) {
        const weekCompleted = isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt);

        // Si l'habitude weekly est déjà complétée cette semaine, on la compte comme "completed"
        if (weekCompleted) {
          completed += taskCount;
          total += taskCount;
        } else {
          // Si pas encore complétée, on compte les tâches complétées cette semaine
          total += taskCount;
          completed += getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
        }
      } else {
        // Pour les habitudes daily, logique normale
        total += taskCount;
        const todayData = habit.dailyTasks?.[today];
        if (todayData?.completedTasks) {
          completed += todayData.completedTasks.length;
        }
      }
    });

    return { completed, total };
  }, [habits]);

  const handleStreakSaverPress = async () => {
    if (!user) return;

    HapticFeedback.light();

    try {
      const [habits, inventory] = await Promise.all([
        StreakSaverService.getSaveableHabits(user.id),
        StreakSaverService.getInventory(user.id),
      ]);

      Logger.debug('🎯 Saveable habits:', habits.length, 'Inventory:', inventory.available);

      if (habits.length === 0) {
        Logger.debug('No saveable habits found');
        return;
      }

      // Stocker l'inventaire pour l'utiliser dans les modals
      setStreakSaverInventory(inventory);

      // Si une seule habitude, ouvrir directement le modal de sauvegarde
      if (habits.length === 1) {
        const habit = habits[0];
        Logger.debug('🎯 Single habit, opening save modal directly:', habit.habitId);
        setSelectedHabitToSave({
          habitId: habit.habitId,
          habitName: habit.habitName,
          previousStreak: habit.previousStreak,
        });
        setStreakSaverSuccess(false);
        setStreakSaverError(null);
        setShowStreakSaverModal(true);
      } else {
        // Plusieurs habitudes : ouvrir le modal de sélection
        Logger.debug('🎯 Multiple habits, showing selection modal');
        setSaveableHabits(habits);
        setShowStreakSaverSelection(true);
      }
    } catch (error) {
      Logger.error('Error handling streak saver press:', error);
    }
  };

  const handleSelectHabitToSave = (habit: { habitId: string; habitName: string; previousStreak: number; missedDate: string }) => {
    Logger.debug('🎯 Selected habit to save:', habit.habitId);
    setShowStreakSaverSelection(false);

    // Préparer les données de l'habitude sélectionnée
    const habitData = {
      habitId: habit.habitId,
      habitName: habit.habitName,
      previousStreak: habit.previousStreak,
    };

    // Petit délai pour laisser le modal de sélection se fermer avant d'ouvrir le modal de sauvegarde
    setTimeout(() => {
      setSelectedHabitToSave(habitData);
      setStreakSaverSuccess(false);
      setStreakSaverError(null);
      setShowStreakSaverModal(true);
    }, 300);
  };

  const handleUseStreakSaver = async () => {
    if (!user || !selectedHabitToSave) return;

    setStreakSaverLoading(true);
    setStreakSaverError(null);

    try {
      const result = await StreakSaverService.useStreakSaver(selectedHabitToSave.habitId, user.id);

      if (result.success) {
        Logger.debug('✅ Streak saved successfully:', result.newStreak);
        setNewStreak(result.newStreak || selectedHabitToSave.previousStreak);
        setStreakSaverSuccess(true);

        // Rafraîchir les données après sauvegarde
        setStreakSaverRefreshTrigger((prev) => prev + 1);
        await Promise.all([refreshHabits(), refreshStats()]);
      } else {
        Logger.error('❌ Failed to save streak:', result.message);
        setStreakSaverError(result.message);
      }
    } catch (error: any) {
      Logger.error('❌ Error using streak saver:', error);
      setStreakSaverError(error.message || 'An error occurred');
    } finally {
      setStreakSaverLoading(false);
    }
  };

  const handleCloseStreakSaverModal = () => {
    setShowStreakSaverModal(false);
    setSelectedHabitToSave(null);
    setStreakSaverSuccess(false);
    setStreakSaverError(null);
  };

  // ============================================================================
  // Effects
  // ============================================================================

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      let isMounted = true;

      const loadData = async () => {
        if (!user?.id || !isMounted) return;

        const now = Date.now();
        if (now - lastLoadTime.current < MIN_RELOAD_INTERVAL) {
          return;
        }

        lastLoadTime.current = now;
        await Promise.all([loadHolidayModeData(), refreshSubscription(), refreshStats(true), refreshInventory()]);
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [user?.id, loadHolidayModeData, refreshSubscription, refreshStats, refreshInventory])
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
    <ImageBackground source={require('../../assets/interface/textures/texture-white.png')} style={tw`flex-1 bg-white`} imageStyle={{ opacity: 0.2 }} resizeMode="repeat">
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={tw`flex-1 bg-transparent`} edges={['top']}>

        <ScrollView
          style={tw`flex-1 px-5`}
          refreshControl={<RefreshControl refreshing={false} onRefresh={handleManualRefresh} tintColor="#3b82f6" />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-28`}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Debug: Level Up Test */}
          <DebugButton onPress={handleTestLevelUp} label={`Test Level ${testLevel} → ${testLevel + 1}`} icon={Zap} variant="secondary" />

          {/* Debug: Quest Completion Test */}
          {Config.debug.enabled && (
            <View style={tw`gap-2 mb-4`}>
              <DebugButton onPress={handleTestQuestCompletion} label="Test Quest Completion" icon={Zap} variant="primary" />
              <DebugButton onPress={handleTestQuestBoost} label="Test Quest Boost (Long Title)" icon={Zap} variant="primary" />
              <DebugButton onPress={handleTestMultipleQuests} label="Test Multiple Quests (x3)" icon={Zap} variant="primary" />
              <TouchableOpacity
                onPress={toggleDebugBoost}
                style={tw`${hasActiveBoost ? 'bg-violet-500' : 'bg-sage-500'} rounded-lg px-4 py-2.5 flex-row items-center justify-center`}
              >
                <Zap size={14} color="white" style={tw`mr-1.5`} />
                <Text style={tw`text-white font-semibold text-xs`}>
                  {hasActiveBoost ? 'Boost Mode ON' : 'Test Boost Mode'}
                </Text>
              </TouchableOpacity>
              <DebugButton
                onPress={() => setXpPopup({
                  visible: true,
                  taskName: 'Normal XP Test',
                  xpAmount: 20,
                  accentColor: userTierTheme?.accent || '#3b82f6',
                  isBoosted: false,
                })}
                label="Test XP Toast (Normal)"
                icon={Zap}
                variant="secondary"
              />
              <DebugButton
                onPress={() => setXpPopup({
                  visible: true,
                  taskName: 'Boosted XP Test',
                  xpAmount: 25,
                  accentColor: '#8b5cf6',
                  isBoosted: true,
                })}
                label="Test XP Toast (Boosted)"
                icon={Zap}
                variant="primary"
              />
            </View>
          )}

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
            habits={activeHabits}
            isScrolling={isScrolledPastHeader}
            onXPCollected={(amount, taskName) => {
              // Afficher la popup XP pour le daily challenge
              setXpPopup({
                visible: true,
                taskName: taskName || t('dashboard.dailyChallenge.title'),
                xpAmount: amount,
                accentColor: userTierTheme?.accent || '#9333EA',
                isBoosted: !!hasActiveBoost,
              });
            }}
          />

          {Config.debug.enabled && (
            <>
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

          {/* Streak Saver Shop Modal */}
          {!showPartialPauseMode && !hasTasksPaused && !showFullHolidayMode && (
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
          )}

          {/* Partial Holiday Mode Banner */}
          {(showPartialPauseMode || hasTasksPaused) && !showFullHolidayMode && (
            <View style={tw`mt-4 mb-2`}>
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
            </View>
          )}

          {/* Habits Section */}
          <View>
            {/* Section Header */}
            {!showFullHolidayMode && activeHabits.length > 0 ? (
              <View style={tw`mt-4`}>
                <TaskBadge completed={realTimeTasksStats.completed} total={realTimeTasksStats.total} username={username || user?.email?.split('@')[0]} />

                {/* Daily Motivation Button - below TaskBadge (DEBUG ONLY) */}
                {Config.debug.enabled && (
                  <Pressable
                    onPress={() => {
                      HapticFeedback.light();
                      forceShowMotivation();
                    }}
                    style={({ pressed }) => [
                      tw`mx-1 mt-3 rounded-2xl overflow-hidden`,
                      pressed && tw`opacity-80`,
                    ]}
                  >
                    <LinearGradient
                      colors={(userTierTheme?.gradient as any) || ['#8B5CF6', '#7C3AED', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={tw`px-4 py-3 flex-row items-center justify-center`}
                    >
                      <Zap size={16} color="#FFFFFF" strokeWidth={2.5} fill="rgba(255,255,255,0.3)" style={tw`mr-2`} />
                      <Text style={tw`text-white text-sm font-bold tracking-wide`}>
                        {t('dashboard.dailyMotivation', { defaultValue: 'Daily Motivation' })}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Free user habit limit indicator - below Daily Motivation Button */}
                {!isPremium && habitCount > 0 && (
                  <View
                    style={[
                      tw`mx-1 mt-3 px-4 py-3 rounded-2xl flex-row items-center justify-center`,
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

                {/* Streak Saver Badge - below habit limit indicator */}
                {!showPartialPauseMode && !hasTasksPaused && (
                  <View style={tw`mt-3`}>
                    <StreakSaverBadge
                      onPress={handleStreakSaverPress}
                      onShopPress={() => {
                        HapticFeedback.light();
                        setShowShop(true);
                      }}
                      refreshTrigger={streakSaverRefreshTrigger}
                    />
                  </View>
                )}

                <HabitsSectionHeader onAddPress={handleCreateHabit} habitCount={activeHabits.length} />
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
              /* Active Habits List - Separated by Daily/Weekly */
              <View style={tw`mt-2`}>
                {/* Daily Habits Section */}
                {dailyHabits.length > 0 && (
                  <>
                    <HabitCategoryBadge type="daily" count={dailyHabits.length} />
                    <View style={tw`gap-4`}>
                      {dailyHabits.map((habit, index) => (
                        <SwipeableDashboardCard
                          key={habit.id}
                          habit={habit}
                          onToggleTask={handleTaskToggle}
                          onDelete={handleDeleteHabit}
                          onNavigateToDetails={() => handleHabitPress(habit.id)}
                          index={index}
                          pausedTasks={frozenTasksMap.get(habit.id) || {}}
                          unlockedMilestonesCount={milestoneCounts[habit.id] || 0}
                          hasUnclaimedMilestone={unclaimedMilestones[habit.id] || false}
                        />
                      ))}
                    </View>
                  </>
                )}

                {/* Weekly Habits Section */}
                {weeklyHabits.length > 0 && (
                  <>
                    <HabitCategoryBadge type="weekly" count={weeklyHabits.length} />
                    <View style={tw`gap-4`}>
                      {weeklyHabits.map((habit, index) => (
                        <SwipeableDashboardCard
                          key={habit.id}
                          habit={habit}
                          onToggleTask={handleTaskToggle}
                          onDelete={handleDeleteHabit}
                          onNavigateToDetails={() => handleHabitPress(habit.id)}
                          index={dailyHabits.length + index}
                          pausedTasks={frozenTasksMap.get(habit.id) || {}}
                          unlockedMilestonesCount={milestoneCounts[habit.id] || 0}
                          hasUnclaimedMilestone={unclaimedMilestones[habit.id] || false}
                        />
                      ))}
                    </View>
                  </>
                )}
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
            {/* Boutons de debug - DEV ONLY */}
            {Config.debug.enabled && (
              <View style={tw`gap-3 mt-4`}>
                <TouchableOpacity onPress={handleResetVersion} style={tw`bg-slate-200 px-6 py-3 rounded-xl`}>
                  <Text style={tw`text-slate-700 font-medium`}>Reset Version (Debug Mode)</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={forceShowMotivation} style={tw`bg-purple-200 px-6 py-3 rounded-xl`}>
                  <Text style={tw`text-purple-700 font-medium`}>Show Daily Motivation (Debug)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDebugForceUnclaimedMilestones(!debugForceUnclaimedMilestones)}
                  style={[tw`px-6 py-3 rounded-xl`, { backgroundColor: debugForceUnclaimedMilestones ? '#fbbf24' : '#fef3c7' }]}
                >
                  <Text style={tw`text-amber-700 font-medium`}>
                    {debugForceUnclaimedMilestones ? '✨ ALL Glow ON' : '💎 Glow All Habits'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDebugFirstHabitMilestone(!debugFirstHabitMilestone)}
                  style={[tw`px-6 py-3 rounded-xl`, { backgroundColor: debugFirstHabitMilestone ? '#34d399' : '#d1fae5' }]}
                >
                  <Text style={tw`text-emerald-700 font-medium`}>
                    {debugFirstHabitMilestone ? '🎯 1st Habit Glow ON' : '🎯 Glow 1st Habit Only'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <UpdateModal visible={showModal} onClose={handleUpdateModalClose} version={currentVersion} updates={updates} texts={modalTexts} />
          </View>
        </ScrollView>

        {/* Daily Motivation Modal */}
        <DailyMotivationModal
          visible={showMotivationModal}
          onClose={closeMotivationModal}
          gradientColors={userTierTheme?.gradient || ['#8B5CF6', '#7C3AED', '#6D28D9']}
          username={username || user?.email?.split('@')[0]}
          random={isMotivationTestMode}
        />

        {/* Streak Saver Selection Modal */}
        <StreakSaverSelectionModal
          visible={showStreakSaverSelection}
          habits={saveableHabits}
          availableSavers={streakSaverInventory.available}
          onSelectHabit={handleSelectHabitToSave}
          onClose={() => setShowStreakSaverSelection(false)}
          onShopPress={() => {
            setShowStreakSaverSelection(false);
            setShowShop(true);
          }}
        />

        {/* XP Popup */}
        <XPPopup
          visible={xpPopup.visible}
          taskName={xpPopup.taskName}
          xpAmount={xpPopup.xpAmount}
          accentColor={xpPopup.accentColor}
          isBoosted={xpPopup.isBoosted}
          onHide={() => setXpPopup(prev => ({ ...prev, visible: false }))}
        />

        {/* Streak Saver Modal (sauvegarde directe depuis Dashboard) */}
        {selectedHabitToSave && (
          <StreakSaverModal
            visible={showStreakSaverModal}
            habitName={selectedHabitToSave.habitName}
            previousStreak={selectedHabitToSave.previousStreak}
            availableSavers={streakSaverInventory.available}
            loading={streakSaverLoading}
            success={streakSaverSuccess}
            error={streakSaverError}
            newStreak={newStreak}
            onUse={handleUseStreakSaver}
            onClose={handleCloseStreakSaverModal}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

export default Dashboard;
