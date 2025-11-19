/**
 * ============================================================================
 * HabitDetails.tsx
 * ============================================================================
 *
 * Ecran de détails d'une habitude affichant la progression, les tiers,
 * les tâches quotidiennes et les jalons. Permet de gérer les tâches
 * et de visualiser la progression de l'utilisateur.
 *
 * Fonctionnalités principales:
 * - Affichage du héros avec informations de tier et XP
 * - Gestion des tâches quotidiennes avec toggle
 * - Visualisation des jalons et progression
 * - Célébration de montée de tier
 * - Intégration du Streak Saver
 * - Support des habitudes hebdomadaires
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Zap } from 'lucide-react-native';

import { HabitHero } from '@/components/habits/HabitHero';
import { TabSelector } from '@/components/habits/TabSelector';
import { TasksCard } from '@/components/habits/TasksCard';
import MilestonesCard from '@/components/habits/MilestoneCard';
import { TierCelebration } from '@/components/habits/TierCelebration';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import { DebugButton } from '@/components/debug/DebugButton';
import TaskManager from '@/components/tasks/TaskManager';

import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';

import { useHabitDetails } from '@/hooks/useHabitDetails';
import { useStreakSaver } from '@/hooks/useStreakSaver';

import { HabitProgressionService } from '@/services/habitProgressionService';

import tw from '@/lib/tailwind';
import { getTodayString, getLocalDateString } from '@/utils/dateHelpers';
import { tierThemes } from '@/utils/tierTheme';
import Logger from '@/utils/logger';

import { Habit, DailyTaskProgress } from '@/types';
import { RootStackParamList } from '@/navigation/types';
import { Config } from '@/config';

// ============================================================================
// TYPES
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;
type TabType = 'overview' | 'tiers';

// ============================================================================
// CONSTANTES
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const HabitDetails: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { user } = useAuth();
  const { habits, toggleTask, refreshHabits } = useHabits();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [selectedTab, setSelectedTab] = useState<TabType>('overview');
  const [prevTier, setPrevTier] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<any>(null);
  const [debugStreak, setDebugStreak] = useState<number | null>(null);
  const [isTogglingTask, setIsTogglingTask] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // État pour le modal de test en mode développeur
  const [showTestModal, setShowTestModal] = useState(false);
  const [testModalLoading, setTestModalLoading] = useState(false);
  const [testModalSuccess, setTestModalSuccess] = useState(false);
  const [testNewStreak, setTestNewStreak] = useState(0);

  // ============================================================================
  // HOOKS - Refs & Shared Values
  // ============================================================================

  const heroScale = useSharedValue(1);

  // ============================================================================
  // VARIABLES DERIVEES - Paramètres de route
  // ============================================================================

  const { habitId } = route.params;
  const pausedTasks = route.params.pausedTasks || {};

  // ============================================================================
  // VARIABLES DERIVEES - Données d'habitude
  // ============================================================================

  const habit = habits.find((h: Habit) => h.id === habitId);

  /**
   * Calcule les données du tier actuel de manière réactive
   */
  const currentTierData = useMemo(() => {
    const streak = debugStreak !== null ? debugStreak : habit?.currentStreak || 0;
    const { tier, progress } = HabitProgressionService.calculateTierFromStreak(streak);
    return { tier, progress };
  }, [habit?.currentStreak, debugStreak]);

  /**
   * Récupère la couleur du tier depuis le thème
   */
  const tierColor = useMemo(() => {
    return tierThemes[currentTierData.tier.name]?.accent || '#3b82f6';
  }, [currentTierData.tier.name]);

  const today = useMemo(() => getTodayString(), []);

  const todayTasks: DailyTaskProgress = habit?.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };

  /**
   * Vérifie si la semaine est complétée pour les habitudes hebdomadaires
   */
  const isWeekCompleted = useMemo(() => {
    if (habit?.frequency !== 'weekly') return false;

    const created = new Date(habit.createdAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const weekStart = Math.floor(daysSince / 7) * 7;

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(created);
      checkDate.setDate(created.getDate() + weekStart + i);
      const dateStr = getLocalDateString(checkDate);
      const dayData = habit.dailyTasks?.[dateStr];

      if (dayData?.allCompleted) {
        return true;
      }
    }

    return false;
  }, [habit]);

  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit?.tasks?.length || 0;

  // ============================================================================
  // HOOKS - Données de progression
  // ============================================================================

  const {
    tierInfo,
    nextTier,
    milestoneStatus,
    performanceMetrics,
    refreshProgression,
    loading
  } = useHabitDetails(
    habit?.id || '',
    user?.id || '',
    habit?.currentStreak || 0,
    completedTasksToday
  );

  // ============================================================================
  // VARIABLES DERIVEES - Métriques
  // ============================================================================

  const tierMultiplier = tierInfo?.multiplier ?? 1.0;
  const totalXPEarned = performanceMetrics?.totalXPEarned || 0;
  const completionRate = performanceMetrics?.consistency || 0;

  // ============================================================================
  // HOOKS - Streak Saver
  // ============================================================================

  const streakSaver = useStreakSaver({
    type: 'personal',
    habitId: habitId,
    userId: user?.id || '',
    enabled: !!habit && !!user,
    onStreakRestored: (newStreak) => {
      Logger.debug('Streak restored to:', newStreak);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refreshHabits();
      navigation.setParams({ refreshStreakSaver: Date.now() } as any);
      setTimeout(() => navigation.goBack(), 2000);
    },
  });

  // ============================================================================
  // HOOKS - useCallback
  // ============================================================================

  /**
   * Gère le toggle d'une tâche avec retour haptique
   */
  const handleToggleTask = useCallback(
    async (taskId: string): Promise<void> => {
      if (!habit || isTogglingTask) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsTogglingTask(true);
      setLoadingTaskId(taskId);

      try {
        await toggleTask(habit.id, today, taskId);
        await new Promise((resolve) => setTimeout(resolve, 150));
      } catch (error) {
        Logger.error('Task toggle failed:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsTogglingTask(false);
        setLoadingTaskId(null);
      }
    },
    [habit, today, toggleTask, isTogglingTask]
  );

  /**
   * Rafraîchit les habitudes après mise à jour des tâches
   */
  const handleTasksUpdated = useCallback(async () => {
    try {
      await refreshHabits();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Logger.debug('Tasks updated, habits refreshed');
    } catch (error) {
      Logger.error('Failed to refresh habits after task update:', error);
    }
  }, [refreshHabits]);

  /**
   * Retourne à l'écran précédent
   */
  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  /**
   * Change d'onglet avec retour haptique
   */
  const handleTabChange = useCallback((tab: TabType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTab(tab);
  }, []);

  /**
   * Ferme la célébration de tier
   */
  const handleCelebrationClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCelebration(false);
  }, []);

  /**
   * Cycle à travers les valeurs de test pour le debug
   */
  const handleDebugStreakCycle = useCallback(() => {
    const testValues = [10, 49, 50, 100, 149, 150];
    const currentDebug = debugStreak !== null ? debugStreak : habit?.currentStreak || 0;
    const currentIndex = testValues.findIndex((v) => v >= currentDebug);
    const nextIndex = (currentIndex + 1) % testValues.length;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDebugStreak(testValues[nextIndex]);
  }, [debugStreak, habit?.currentStreak]);

  /**
   * Simule l'utilisation du Streak Saver pour le test
   */
  const handleTestUseStreakSaver = () => {
    setTestModalLoading(true);
    setTimeout(() => {
      setTestModalLoading(false);
      setTestModalSuccess(true);
      setTestNewStreak(15);
    }, 2000);
  };

  /**
   * Ferme le modal de test
   */
  const handleTestCloseModal = () => {
    setShowTestModal(false);
    setTestModalLoading(false);
    setTestModalSuccess(false);
    setTestNewStreak(0);
  };

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  // Détecte et célèbre les montées de tier
  useEffect(() => {
    if (prevTier && prevTier !== currentTierData.tier.name) {
      Logger.debug(`TIER UP! ${prevTier} -> ${currentTierData.tier.name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrationTier(currentTierData.tier);
      setShowCelebration(true);
    }
    setPrevTier(currentTierData.tier.name);
  }, [currentTierData.tier.name, prevTier]);

  // ============================================================================
  // HOOKS - Styles animés
  // ============================================================================

  const animatedGradientStyle = useAnimatedStyle(() => {
    const scale = 1 + heroScale.value * 0.1;
    return {
      transform: [{ scale }],
      opacity: 1 - heroScale.value * 0.1,
    };
  });

  // ============================================================================
  // RENDU - États spéciaux
  // ============================================================================

  if (!habit || !user) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <Text style={tw`text-sand-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <View style={tw`flex-1 bg-stone-50`}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
        {/* En-tête avec dégradé du tier */}
        <Animated.View style={animatedGradientStyle}>
          <LinearGradient
            colors={tierThemes[currentTierData.tier.name].gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`pb-10`}
          >
            <SafeAreaView edges={['top']}>
              {/* Barre de navigation */}
              <View style={tw`px-8 py-5 flex-row items-center justify-between`}>
                <Pressable
                  onPress={handleGoBack}
                  style={({ pressed }) => [
                    tw`w-11 h-11 rounded-2xl items-center justify-center bg-sand/20`,
                    pressed && tw`scale-95`
                  ]}
                >
                  <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
                </Pressable>

                <Text style={tw`text-lg font-black text-white`}>Habit Journey</Text>

                <View style={tw`w-11`}>
                  <DebugButton
                    onPress={handleDebugStreakCycle}
                    label={debugStreak !== null ? debugStreak.toString() : ''}
                    variant="secondary"
                    customStyle={tw`w-11 h-11 rounded-2xl bg-sand/20 px-0 py-0 mb-0`}
                  />
                </View>
              </View>

              {/* Bouton de test en mode développeur */}
              {Config.debug.enabled && (
                <View style={tw`px-8 mb-4`}>
                  <Pressable
                    onPress={() => setShowTestModal(true)}
                    style={({ pressed }) => [
                      tw`bg-purple-500 rounded-2xl py-3 px-4 flex-row items-center justify-center`,
                      pressed && tw`opacity-80`
                    ]}
                  >
                    <Zap size={18} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black text-sm`}>Test Streak Saver Modal</Text>
                  </Pressable>
                </View>
              )}

              {/* Carte héros */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={[
                  tw`px-8 mt-6`,
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
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

                {/* Modal Streak Saver réel */}
                <StreakSaverModal
                  visible={streakSaver.showModal}
                  habitName={streakSaver.eligibility.habitName || habit?.name || 'Habit'}
                  previousStreak={streakSaver.eligibility.previousStreak || 0}
                  availableSavers={streakSaver.inventory.available}
                  loading={streakSaver.using}
                  success={streakSaver.success}
                  error={streakSaver.error}
                  newStreak={streakSaver.newStreak}
                  onUse={streakSaver.useStreakSaver}
                  onClose={streakSaver.closeModal}
                />

                {/* Modal de test en mode développeur */}
                {Config.debug.enabled && (
                  <StreakSaverModal
                    visible={showTestModal}
                    habitName={habit?.name || 'Morning Workout'}
                    previousStreak={15}
                    availableSavers={3}
                    loading={testModalLoading}
                    success={testModalSuccess}
                    newStreak={testNewStreak}
                    onUse={handleTestUseStreakSaver}
                    onClose={handleTestCloseModal}
                  />
                )}
              </Animated.View>
            </SafeAreaView>
          </LinearGradient>
        </Animated.View>

        {/* Contenu des onglets */}
        <ScrollView
          contentContainerStyle={[tw`pb-8 pt-5`]}
          showsVerticalScrollIndicator={false}
        >
          {/* Sélecteur d'onglets */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5 mt-2`}>
            <TabSelector
              tier={currentTierData.tier.name}
              selected={selectedTab}
              onChange={handleTabChange}
            />
          </Animated.View>

          <View style={tw`px-5`}>
            {/* Onglet Vue d'ensemble */}
            {selectedTab === 'overview' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                {/* Gestionnaire de tâches */}
                <TaskManager
                  habitId={habit.id}
                  habitCategory={habit.category}
                  habitType={habit.type}
                  currentTier={currentTierData.tier.name}
                  tasks={habit.tasks || []}
                  onTasksUpdated={handleTasksUpdated}
                  tierColor={tierColor}
                />

                {/* Carte des tâches */}
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
                    isWeekCompleted={isWeekCompleted}
                  />
                )}
              </Animated.View>
            )}

            {/* Onglet Tiers */}
            {selectedTab === 'tiers' && (
              <Animated.View entering={FadeInDown.duration(300)}>
                <MilestonesCard
                  milestones={milestoneStatus?.all || []}
                  currentStreak={debugStreak !== null ? debugStreak : habit.currentStreak}
                  unlockedMilestones={milestoneStatus?.unlocked || []}
                />
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </ScrollView>

      {/* Animation de célébration de tier */}
      {celebrationTier && (
        <TierCelebration
          visible={showCelebration}
          newTier={celebrationTier}
          onClose={handleCelebrationClose}
        />
      )}
    </View>
  );
};

export default HabitDetails;
