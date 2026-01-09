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

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StatusBar, ActivityIndicator, ImageBackground, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Zap, Trophy, Settings2, X, Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { HabitHero } from '@/components/habits/HabitHero';
import MilestonesCard from '@/components/habits/MilestoneCard';
import { TierCelebration } from '@/components/habits/TierCelebration';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import { EpicMilestoneUnlockModal } from '@/components/habits/EpicMilestoneUnlockModal';
import { MilestoneRecapModal, MilestoneWithIndex } from '@/components/habits/MilestoneRecapModal';
import { DebugButton } from '@/components/debug/DebugButton';
import TaskCategoryPicker from '@/components/tasks/TaskCategoryPicker';
import TaskItem from '@/components/tasks/TaskItem';

import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useCelebrationQueue } from '@/context/CelebrationQueueContext';

import { useHabitDetails } from '@/hooks/useHabitDetails';
import { useStreakSaver } from '@/hooks/useStreakSaver';

import { HabitProgressionService } from '@/services/habitProgressionService';

import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import Logger from '@/utils/logger';

import { Habit } from '@/types';
import { RootStackParamList } from '@/navigation/types';
import { Config } from '@/config';

// ============================================================================
// TYPES
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;


// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Retourne le nom traduit de l'habitude
 * Si le nom correspond à un habitName prédéfini, utilise la traduction
 * Sinon retourne le nom tel quel (custom)
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }
  return habit.name;
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const HabitDetails: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { user } = useAuth();
  const { habits, refreshHabits } = useHabits();
  const { updateStatsOptimistically } = useStats();
  const { queueMilestoneSingle, queueMilestoneMultiple } = useCelebrationQueue();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [prevTier, setPrevTier] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTier, setCelebrationTier] = useState<any>(null);
  const [debugStreak, setDebugStreak] = useState<number | null>(null);

  // État pour le modal de test en mode développeur
  const [showTestModal, setShowTestModal] = useState(false);
  const [testModalLoading, setTestModalLoading] = useState(false);
  const [testModalSuccess, setTestModalSuccess] = useState(false);
  const [testNewStreak, setTestNewStreak] = useState(0);

  // Note: Les modals de milestone sont maintenant gérés via CelebrationQueueContext
  // et affichés via CelebrationRenderer (global dans App.tsx)

  // Ref pour éviter d'afficher le modal de milestone plusieurs fois
  // Stocke le JSON des titres de milestones déjà affichés pour cette session
  const shownMilestoneTitlesRef = useRef<Set<string>>(new Set());

  // État pour les modals de test milestone en mode développeur
  const [showTestMilestoneModal, setShowTestMilestoneModal] = useState(false);
  const [showTestMilestoneRecapModal, setShowTestMilestoneRecapModal] = useState(false);

  // État pour le modal de gestion des tâches
  const [showTaskManageModal, setShowTaskManageModal] = useState(false);
  const [showTaskCategoryPicker, setShowTaskCategoryPicker] = useState(false);

  // ============================================================================
  // HOOKS - Refs & Shared Values
  // ============================================================================

  const heroScale = useSharedValue(1);
  const statsUpdatedRef = useRef(false);

  // ============================================================================
  // VARIABLES DERIVEES - Paramètres de route
  // ============================================================================

  const { habitId } = route.params;

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

  // ============================================================================
  // HOOKS - Données de progression
  // ============================================================================

  const { tierInfo, nextTier, milestoneStatus, newlyUnlockedMilestones, milestoneXpAwarded, performanceMetrics, clearNewlyUnlockedMilestones, loading } = useHabitDetails(habit?.id || '', user?.id || '', habit?.currentStreak || 0, habit?.currentTierLevel, habit?.createdAt);

  // ============================================================================
  // VARIABLES DERIVEES - Métriques
  // ============================================================================

  const tierMultiplier = tierInfo?.multiplier ?? 1.0;
  const totalXPEarned = performanceMetrics?.totalXPEarned || 0;
  const completionRate = performanceMetrics?.consistency || 0;

  /**
   * Memoize HabitHero props to prevent re-renders during animations
   * This ensures AnimatedNumber and ProgressBar animations complete smoothly
   */
  const habitHeroProps = useMemo(() => {
    if (!habit) return null;

    return {
      habitName: getTranslatedHabitName(habit, t),
      habitType: habit.type,
      category: habit.category,
      currentStreak: performanceMetrics?.currentStreak ?? habit.currentStreak,
      bestStreak: performanceMetrics?.bestStreak ?? habit.bestStreak,
      tierInfo: currentTierData.tier,
      nextTier: nextTier,
      tierProgress: currentTierData.progress,
      tierMultiplier: tierMultiplier,
      totalXPEarned: totalXPEarned,
      completionRate: completionRate,
      unlockedMilestonesCount: milestoneStatus?.unlocked?.length || 0,
    };
  }, [
    habit?.name,
    habit?.type,
    habit?.category,
    habit?.currentStreak,
    habit?.bestStreak,
    performanceMetrics?.currentStreak,
    performanceMetrics?.bestStreak,
    currentTierData.tier.name,
    currentTierData.progress,
    nextTier?.name,
    tierMultiplier,
    totalXPEarned,
    completionRate,
    milestoneStatus?.unlocked?.length,
    t,
  ]);

  // ============================================================================
  // HOOKS - Streak Saver
  // ============================================================================

  const streakSaver = useStreakSaver({
    type: 'personal',
    habitId: habitId,
    habitFrequency: habit?.frequency,
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
   * Retourne à l'écran précédent
   */
  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

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

  // Note: handleMilestoneModalClose et handleMilestoneRecapModalClose supprimés
  // Les modals de milestone sont maintenant gérés via CelebrationQueueContext

  /**
   * Affiche le modal de test milestone (single)
   */
  const handleTestMilestoneModal = useCallback(() => {
    setShowTestMilestoneModal(true);
  }, []);

  /**
   * Ferme le modal de test milestone (single)
   */
  const handleTestMilestoneModalClose = useCallback(() => {
    setShowTestMilestoneModal(false);
  }, []);

  /**
   * Affiche le modal de test milestone récap (multiple)
   */
  const handleTestMilestoneRecapModal = useCallback(() => {
    setShowTestMilestoneRecapModal(true);
  }, []);

  /**
   * Ferme le modal de test milestone récap (multiple)
   */
  const handleTestMilestoneRecapModalClose = useCallback(() => {
    setShowTestMilestoneRecapModal(false);
  }, []);

  /**
   * Ouvre le modal de gestion des tâches
   */
  const handleOpenTaskManager = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowTaskManageModal(true);
  }, []);

  /**
   * Ferme le modal de gestion des tâches
   */
  const handleCloseTaskManager = useCallback(() => {
    setShowTaskManageModal(false);
  }, []);

  /**
   * Ouvre le picker de catégorie de tâche (pour ajouter une nouvelle tâche)
   */
  const handleAddTaskPress = useCallback(() => {
    setShowTaskManageModal(false);
    setTimeout(() => setShowTaskCategoryPicker(true), 300);
  }, []);

  /**
   * Callback quand les tâches sont mises à jour
   */
  const handleTasksUpdated = useCallback(async () => {
    setShowTaskCategoryPicker(false);
    setShowTaskManageModal(false);
    await refreshHabits();
  }, [refreshHabits]);

  /**
   * Callback quand une tâche est supprimée
   */
  const handleTaskDeleted = useCallback(async () => {
    await refreshHabits();
  }, [refreshHabits]);

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  /**
   * Affiche les milestones nouvellement débloqués via la CelebrationQueue
   * Clear immédiatement après avoir ajouté à la queue pour éviter les re-triggers
   */
  useEffect(() => {
    if (!habit || !newlyUnlockedMilestones || newlyUnlockedMilestones.length === 0) {
      return;
    }

    // Filtrer les milestones déjà affichés dans cette session
    const newMilestones = newlyUnlockedMilestones.filter(
      (m) => !shownMilestoneTitlesRef.current.has(m.title)
    );

    if (newMilestones.length === 0) {
      // Tous les milestones ont déjà été affichés, juste nettoyer
      clearNewlyUnlockedMilestones();
      return;
    }

    const allMilestones = milestoneStatus?.all || [];

    // Convertir en MilestoneWithIndex pour les modals
    const milestonesWithIndex: MilestoneWithIndex[] = newMilestones.map((milestone) => {
      const index = allMilestones.findIndex((m) => m.title === milestone.title);
      return { milestone, index: index >= 0 ? index : 0 };
    });

    // Marquer les milestones comme affichés AVANT d'ouvrir le modal
    newMilestones.forEach((m) => shownMilestoneTitlesRef.current.add(m.title));

    if (milestonesWithIndex.length === 1) {
      // Un seul milestone → queue modal epic via CelebrationQueue (centralisé)
      const { milestone, index } = milestonesWithIndex[0];
      queueMilestoneSingle(milestone, index);
    } else {
      // Plusieurs milestones → queue modal récap via CelebrationQueue (centralisé)
      queueMilestoneMultiple(milestonesWithIndex);
    }

    // Clear immédiatement pour éviter que le modal se ré-affiche lors des refreshProgression()
    clearNewlyUnlockedMilestones();

    // Rafraîchir les habitudes en arrière-plan pour mettre à jour currentTierLevel
    // Ceci permet de retirer le glow du Dashboard sans bloquer l'UI
    setTimeout(() => refreshHabits(), 500);
  }, [habit?.id, newlyUnlockedMilestones, milestoneStatus?.all, clearNewlyUnlockedMilestones, queueMilestoneSingle, queueMilestoneMultiple, refreshHabits]);

  /**
   * Détecte les montées de tier
   */
  useEffect(() => {
    if (prevTier && prevTier !== currentTierData.tier.name) {
      Logger.debug(`TIER UP detected! ${prevTier} -> ${currentTierData.tier.name}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrationTier(currentTierData.tier);
      setShowCelebration(true);
    }
    setPrevTier(currentTierData.tier.name);
  }, [currentTierData.tier.name, prevTier]);

  // Met à jour les stats globales quand l'XP des milestones est octroyée (une seule fois)
  useEffect(() => {
    if (milestoneXpAwarded > 0 && !statsUpdatedRef.current) {
      statsUpdatedRef.current = true;
      Logger.debug('Updating global stats with milestone XP:', milestoneXpAwarded);
      updateStatsOptimistically(milestoneXpAwarded);
    }
  }, [milestoneXpAwarded]);

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

  // Affiche un loader tant que les milestones ne sont pas chargés
  if (loading) {
    return (
      <View style={tw`flex-1 bg-stone-50`}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient colors={tierThemes[currentTierData.tier.name].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#ffffff" />
        </LinearGradient>
      </View>
    );
  }

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <ImageBackground
      source={require('../../assets/interface/textures/texture-white.png')}
      style={tw`flex-1`}
      imageStyle={{ opacity: 0.6 }}
      resizeMode="cover"
    >
      <View style={tw`flex-1 bg-stone-50/80`}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ScrollView contentContainerStyle={tw`pb-8`} showsVerticalScrollIndicator={false}>
        {/* En-tête avec dégradé du tier */}
        <Animated.View style={animatedGradientStyle}>
          <LinearGradient colors={tierThemes[currentTierData.tier.name].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`pb-10`}>
            <SafeAreaView edges={['top']}>
              {/* Barre de navigation */}
              <View style={tw`px-8 pt-5 pb-4 flex-row items-center justify-between`}>
                <Pressable onPress={handleGoBack} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-sand/20`, pressed && tw`scale-95`]}>
                  <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
                </Pressable>

                <Text style={tw`text-lg font-black text-white`}>{t('habitDetails.title')}</Text>

                <View style={tw`flex-row items-center gap-2`}>
                  {Config.debug.enabled && (
                    <DebugButton
                      onPress={handleDebugStreakCycle}
                      label={debugStreak !== null ? debugStreak.toString() : ''}
                      variant="secondary"
                      customStyle={tw`w-11 h-11 rounded-2xl bg-sand/20 px-0 py-0 mb-0`}
                    />
                  )}
                  <Pressable
                    onPress={handleOpenTaskManager}
                    style={({ pressed }) => [
                      tw`w-11 h-11 rounded-2xl items-center justify-center bg-sand/20`,
                      pressed && tw`scale-95`,
                    ]}
                  >
                    <Settings2 size={22} color="#fff" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              {/* Boutons de test en mode développeur */}
              {Config.debug.enabled && (
                <View style={tw`px-8 mb-4 gap-2`}>
                  <Pressable onPress={() => setShowTestModal(true)} style={({ pressed }) => [tw`bg-purple-500 rounded-2xl py-3 px-4 flex-row items-center justify-center`, pressed && tw`opacity-80`]}>
                    <Zap size={18} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black text-sm`}>Test Streak Saver Modal</Text>
                  </Pressable>
                  <Pressable onPress={handleTestMilestoneModal} style={({ pressed }) => [tw`bg-amber-500 rounded-2xl py-3 px-4 flex-row items-center justify-center`, pressed && tw`opacity-80`]}>
                    <Trophy size={18} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black text-sm`}>Test Milestone Modal (Single)</Text>
                  </Pressable>
                  <Pressable onPress={handleTestMilestoneRecapModal} style={({ pressed }) => [tw`bg-amber-600 rounded-2xl py-3 px-4 flex-row items-center justify-center`, pressed && tw`opacity-80`]}>
                    <Trophy size={18} color="white" fill="white" style={tw`mr-2`} />
                    <Text style={tw`text-white font-black text-sm`}>Test Milestone Recap (Multiple)</Text>
                  </Pressable>
                </View>
              )}

              {/* Carte héros */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={[
                  tw`px-8 mt-2`,
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
                  {habitHeroProps && <HabitHero {...habitHeroProps} />}
                </View>

                {/* Modal Streak Saver réel */}
                <StreakSaverModal
                  visible={streakSaver.showModal}
                  habitName={habit ? getTranslatedHabitName(habit, t) : 'Habit'}
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
                    habitName={habit ? getTranslatedHabitName(habit, t) : 'Morning Workout'}
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

        {/* Milestones - Affichés directement sans tabs */}
        <View style={tw`px-5 pt-8 pb-8`}>
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <MilestonesCard
              milestones={milestoneStatus?.all || []}
              habitAge={Math.floor((new Date().getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24)) + 1}
              unlockedMilestones={milestoneStatus?.unlocked || []}
            />
          </Animated.View>
        </View>
      </ScrollView>

        {/* Animation de célébration de tier */}
        {celebrationTier && <TierCelebration visible={showCelebration} newTier={celebrationTier} onClose={handleCelebrationClose} />}

        {/* Note: Les modals de milestone (EpicMilestoneUnlockModal, MilestoneRecapModal) sont
            maintenant affichés via CelebrationRenderer dans App.tsx pour éviter les doublons */}

        {/* Modals de test milestone en mode développeur */}
        {Config.debug.enabled && (
          <>
            <EpicMilestoneUnlockModal
              visible={showTestMilestoneModal}
              milestone={{
                id: 'test-milestone',
                days: 21,
                title: 'Habit Former',
                description: '21 days to form a habit',
                xpReward: 150,
                badge: '🏆',
              }}
              milestoneIndex={3}
              onClose={handleTestMilestoneModalClose}
            />
            <MilestoneRecapModal
              visible={showTestMilestoneRecapModal}
              milestones={[
                { milestone: { id: 'm1', days: 3, title: 'First Steps', description: '', xpReward: 50, badge: '🌱' }, index: 0 },
                { milestone: { id: 'm2', days: 7, title: 'Week Warrior', description: '', xpReward: 75, badge: '⚔️' }, index: 1 },
                { milestone: { id: 'm3', days: 14, title: 'Fortnight Fighter', description: '', xpReward: 100, badge: '🛡️' }, index: 2 },
              ]}
              onClose={handleTestMilestoneRecapModalClose}
            />
          </>
        )}

        {/* Modal de gestion des tâches */}
        <Modal visible={showTaskManageModal} animationType="slide" transparent onRequestClose={handleCloseTaskManager}>
          <View style={tw`flex-1 bg-black/50`}>
            <ImageBackground
              source={require('../../assets/interface/textures/texture-white.png')}
              style={{
                flex: 1,
                marginTop: 80,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: 'hidden',
              }}
              imageStyle={{
                opacity: 0.6,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              resizeMode="cover"
            >
              <View style={tw`flex-1 bg-white/80`}>
                {/* Header */}
                <View style={tw`px-6 py-5 border-b border-stone-200`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-stone-900 text-2xl font-bold`}>{t('taskManager.manageTitle')}</Text>
                      <Text style={tw`text-stone-500 text-sm mt-1`}>{t('taskManager.maxTasks')}</Text>
                    </View>

                    <Pressable onPress={handleCloseTaskManager} style={tw`w-10 h-10 items-center justify-center rounded-xl bg-stone-100`}>
                      <X size={20} color="#57534e" />
                    </Pressable>
                  </View>
                </View>

                {/* Task List */}
                <FlatList
                  data={habit.tasks || []}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={tw`p-5`}
                  ListEmptyComponent={
                    <View style={tw`items-center justify-center py-16`}>
                      <View style={tw`w-20 h-20 rounded-full bg-stone-100 items-center justify-center mb-4`}>
                        <Trash2 size={32} color="#a8a29e" />
                      </View>
                      <Text style={tw`text-stone-900 font-bold text-lg mb-2`}>{t('taskManager.noTasksTitle')}</Text>
                      <Text style={tw`text-stone-500 text-center px-8`}>{t('taskManager.noTasks')}</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TaskItem
                      task={item}
                      habitId={habitId}
                      habitCategory={habit.category}
                      habitType={habit.type}
                      onTaskDeleted={handleTaskDeleted}
                      tierColor={tierThemes[currentTierData.tier.name].accent}
                    />
                  )}
                  ItemSeparatorComponent={() => <View style={tw`h-3`} />}
                />

                {/* Add Task Button */}
                <View style={tw`p-6 border-t border-stone-200`}>
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      shadowColor: tierThemes[currentTierData.tier.name].accent,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <LinearGradient colors={tierThemes[currentTierData.tier.name].gradient as unknown as readonly [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Pressable onPress={handleAddTaskPress} style={tw`flex-row items-center justify-center py-4`}>
                        <Plus size={22} color="white" strokeWidth={2.5} />
                        <Text style={tw`text-white font-bold text-base ml-2`}>{t('taskManager.addNewTask')}</Text>
                      </Pressable>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        </Modal>

        {/* Task Category Picker Modal */}
        <TaskCategoryPicker
          visible={showTaskCategoryPicker}
          habitId={habitId}
          habitCategory={habit.category}
          habitType={habit.type}
          currentTaskCount={habit.tasks?.length || 0}
          currentTier={currentTierData.tier.name as 'Crystal' | 'Ruby' | 'Amethyst'}
          tierColor={tierThemes[currentTierData.tier.name].accent}
          existingTaskIds={(habit.tasks || []).map((t) => t.id)}
          onClose={() => setShowTaskCategoryPicker(false)}
          onTasksUpdated={handleTasksUpdated}
        />
      </View>
    </ImageBackground>
  );
};

export default HabitDetails;
