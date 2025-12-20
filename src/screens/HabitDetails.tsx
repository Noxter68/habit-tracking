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
import { View, Text, ScrollView, Pressable, StatusBar, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Zap, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { HabitHero } from '@/components/habits/HabitHero';
import MilestonesCard from '@/components/habits/MilestoneCard';
import { TierCelebration } from '@/components/habits/TierCelebration';
import { StreakSaverModal } from '@/components/streakSaver/StreakSaverModal';
import { EpicMilestoneUnlockModal } from '@/components/habits/EpicMilestoneUnlockModal';
import { MilestoneRecapModal, MilestoneWithIndex } from '@/components/habits/MilestoneRecapModal';
import { DebugButton } from '@/components/debug/DebugButton';

import { useHabits } from '@/context/HabitContext';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useCelebrationQueue } from '@/context/CelebrationQueueContext';

import { useHabitDetails } from '@/hooks/useHabitDetails';
import { useStreakSaver } from '@/hooks/useStreakSaver';

import { HabitProgressionService, HabitMilestone } from '@/services/habitProgressionService';

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

  // État pour le modal de célébration de milestone (1 seul nouveau)
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<HabitMilestone | null>(null);
  const [celebrationMilestoneIndex, setCelebrationMilestoneIndex] = useState(0);

  // État pour le modal récap de milestones (plusieurs à rattraper)
  const [showMilestoneRecapModal, setShowMilestoneRecapModal] = useState(false);
  const [recapMilestones, setRecapMilestones] = useState<MilestoneWithIndex[]>([]);

  // État pour les modals de test milestone en mode développeur
  const [showTestMilestoneModal, setShowTestMilestoneModal] = useState(false);
  const [showTestMilestoneRecapModal, setShowTestMilestoneRecapModal] = useState(false);

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

  /**
   * Ferme le modal de célébration de milestone (1 seul nouveau)
   * Note: L'XP a déjà été octroyé dans xp_transactions, donc pas besoin de sauvegarder localement
   */
  const handleMilestoneModalClose = useCallback(() => {
    setShowMilestoneModal(false);
  }, []);

  /**
   * Ferme le modal récap de milestones (plusieurs à rattraper)
   * Note: L'XP a déjà été octroyé dans xp_transactions, donc pas besoin de sauvegarder localement
   */
  const handleMilestoneRecapModalClose = useCallback(() => {
    setShowMilestoneRecapModal(false);
  }, []);

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

    const allMilestones = milestoneStatus?.all || [];

    // Convertir en MilestoneWithIndex pour les modals
    const milestonesWithIndex: MilestoneWithIndex[] = newlyUnlockedMilestones.map((milestone) => {
      const index = allMilestones.findIndex((m) => m.title === milestone.title);
      return { milestone, index: index >= 0 ? index : 0 };
    });

    Logger.debug('Queueing milestone celebration:', milestonesWithIndex.length);

    if (milestonesWithIndex.length === 1) {
      // Un seul milestone → queue modal epic
      const { milestone, index } = milestonesWithIndex[0];
      queueMilestoneSingle(milestone, index);
      // Keep local state for backwards compatibility
      setCelebrationMilestone(milestone);
      setCelebrationMilestoneIndex(index);
      setShowMilestoneModal(true);
    } else {
      // Plusieurs milestones → queue modal récap
      queueMilestoneMultiple(milestonesWithIndex);
      // Keep local state for backwards compatibility
      setRecapMilestones(milestonesWithIndex);
      setShowMilestoneRecapModal(true);
    }

    // Clear immédiatement pour éviter que le modal se ré-affiche lors des refreshProgression()
    clearNewlyUnlockedMilestones();
  }, [habit?.id, newlyUnlockedMilestones, milestoneStatus?.all, clearNewlyUnlockedMilestones, queueMilestoneSingle, queueMilestoneMultiple]);

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

                <View style={tw`w-11`}>
                  <DebugButton
                    onPress={handleDebugStreakCycle}
                    label={debugStreak !== null ? debugStreak.toString() : ''}
                    variant="secondary"
                    customStyle={tw`w-11 h-11 rounded-2xl bg-sand/20 px-0 py-0 mb-0`}
                  />
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

        {/* Modal de célébration de milestone */}
        <EpicMilestoneUnlockModal
          visible={showMilestoneModal}
          milestone={celebrationMilestone}
          milestoneIndex={celebrationMilestoneIndex}
          onClose={handleMilestoneModalClose}
        />

        {/* Modal récap de milestones (plusieurs à rattraper) */}
        <MilestoneRecapModal
          visible={showMilestoneRecapModal}
          milestones={recapMilestones}
          onClose={handleMilestoneRecapModalClose}
        />

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
      </View>
    </ImageBackground>
  );
};

export default HabitDetails;
