/**
 * ============================================================================
 * AchievementScreen.tsx
 * ============================================================================
 *
 * Ecran des accomplissements affichant les badges, niveaux et récompenses
 * de l'utilisateur. Organisé par tiers avec filtrage et détails interactifs.
 *
 * Fonctionnalités principales:
 * - Affichage du niveau actuel et progression
 * - Grille des accomplissements par tier
 * - Filtrage (tous, débloqués, verrouillés)
 * - Modal de détails pour chaque accomplissement
 * - Modal de zoom sur le badge actuel
 * - Statistiques globales (XP, séries, jours parfaits)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ScrollView, Pressable, ActivityIndicator, RefreshControl, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { CurrentLevelHero } from '../components/achievements/CurrentLevelHero';
import { FilterTabs } from '../components/achievements/FilterTabs';
import { TierSection } from '../components/achievements/TierSection';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { ZoomModal } from '../components/achievements/ZoomModal';

import { useAchievements } from '../context/AchievementContext';
import { useStats } from '../context/StatsContext';

import tw from '../lib/tailwind';
import { achievementTitles, getAchievementByLevel, getTierNameFromKey } from '../utils/achievements';
import { getXPForNextLevel } from '@/utils/xpCalculations';
import { getAchievementTierTheme } from '../utils/tierTheme';
import { HapticFeedback } from '../utils/haptics';
import Logger from '@/utils/logger';

import { Achievement, FilterType, TIER_KEYS, TierKey } from '../types/achievement.types';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

const AchievementsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { stats, refreshStats, loading: statsLoading } = useStats();
  const {
    achievements,
    totalCompletions,
    streak,
    perfectDays,
    totalHabits,
    loading: achievementsLoading,
    refreshAchievements
  } = useAchievements();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTier, setExpandedTier] = useState<TierKey | null>(null);

  // ============================================================================
  // HOOKS - Refs
  // ============================================================================

  const scrollViewRef = useRef<ScrollView>(null);
  const tierRefs = useRef<{ [key: string]: View | null }>({});

  // ============================================================================
  // HOOKS - useMemo
  // ============================================================================

  const currentLevel = stats?.level || 1;
  const totalXP = stats?.totalXP || 0;
  const levelProgress = stats?.levelProgress || 0;

  /**
   * Récupère le titre de l'accomplissement actuel traduit
   */
  const currentTitle = useMemo(
    () => getAchievementByLevel(currentLevel),
    [currentLevel]
  );

  /**
   * Récupère le titre du prochain accomplissement
   */
  const nextTitle = useMemo(
    () => getAchievementByLevel(currentLevel + 1),
    [currentLevel]
  );

  /**
   * Récupère le thème du tier actuel
   */
  const currentTierTheme = currentTitle
    ? getAchievementTierTheme(currentTitle.tierKey)
    : getAchievementTierTheme('novice');

  const requiredXpForNextLevel = getXPForNextLevel(currentLevel);

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  /**
   * Détermine les couleurs de texte en fonction du type de gemme
   */
  const getTextColors = (gemName: string) => {
    if (['Crystal', 'Topaz'].includes(gemName)) {
      return {
        primary: 'text-stone-800',
        secondary: 'text-stone-700',
        iconColor: '#292524',
      };
    }
    return {
      primary: 'text-white',
      secondary: 'text-white/90',
      iconColor: '#ffffff',
    };
  };

  const textColors = getTextColors(currentTierTheme.gemName);

  /**
   * Vérifie si un accomplissement est débloqué
   */
  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    if (achievement.level <= currentLevel) return true;
    return achievements.some(
      (ua) => ua?.title === achievement.title || ua?.achievementId === achievement.id
    );
  };

  /**
   * Filtre les accomplissements selon le filtre actif
   */
  const filteredAchievements = achievementTitles.filter((achievement) => {
    const isUnlocked = isAchievementUnlocked(achievement);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const unlockedCount = achievementTitles.filter((a) => isAchievementUnlocked(a)).length;
  const totalCount = achievementTitles.length;

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  useEffect(() => {
    if (!stats) refreshStats(true);
    if (!achievements || achievements.length === 0) refreshAchievements();
  }, []);

  // ============================================================================
  // GESTIONNAIRES D'EVENEMENTS
  // ============================================================================

  /**
   * Rafraîchit les données des statistiques et accomplissements
   */
  const handleRefresh = async () => {
    HapticFeedback.light();
    setRefreshing(true);
    try {
      await Promise.all([refreshStats(true), refreshAchievements()]);
    } catch (error) {
      Logger.error('Error refreshing achievement data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Retourne à l'écran précédent
   */
  const handleGoBack = () => {
    HapticFeedback.light();
    navigation.goBack();
  };

  /**
   * Ouvre le modal de zoom sur le badge actuel
   */
  const handleZoomModalOpen = () => {
    HapticFeedback.light();
    setShowZoomModal(true);
  };

  /**
   * Ferme le modal de zoom
   */
  const handleZoomModalClose = () => {
    HapticFeedback.light();
    setShowZoomModal(false);
  };

  /**
   * Ouvre le modal de détails d'un accomplissement
   */
  const handleAchievementPress = (achievement: Achievement) => {
    HapticFeedback.light();
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  /**
   * Ferme le modal de détails
   */
  const handleModalClose = () => {
    HapticFeedback.light();
    setShowModal(false);
  };

  /**
   * Change le filtre actif
   */
  const handleFilterChange = (newFilter: FilterType) => {
    HapticFeedback.selection();
    setFilter(newFilter);
  };

  /**
   * Gère l'expansion/réduction d'une section de tier
   */
  const handleTierToggle = (tierKey: TierKey) => {
    HapticFeedback.light();
    const newExpandedState = expandedTier === tierKey ? null : tierKey;
    setExpandedTier(newExpandedState);

    // Scroll vers le tier lors de l'ouverture
    if (newExpandedState && tierRefs.current[tierKey]) {
      setTimeout(() => {
        tierRefs.current[tierKey]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 20),
              animated: true,
            });
          },
          () => Logger.debug('measure failed')
        );
      }, 100);
    }
  };

  // ============================================================================
  // RENDU - État de chargement
  // ============================================================================

  const isLoading = statsLoading || achievementsLoading;

  if (isLoading && !stats && !achievements) {
    return (
      <SafeAreaView style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color={currentTierTheme.accent} />
        <Text style={tw`text-sand-700 mt-3`}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <SafeAreaView style={tw`flex-1 bg-sand-50`}>
      {/* En-tête avec dégradé du tier */}
      <LinearGradient
        colors={[
          currentTierTheme.gradient[0],
          currentTierTheme.gradient[1],
          currentTierTheme.gradient[2]
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`pb-4 shadow-xl`}
      >
        <View style={tw`px-5 pt-4 pb-4`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center mb-4`}>
            <Pressable
              onPress={handleGoBack}
              style={({ pressed }) => [
                tw`p-2 -ml-2 rounded-lg`,
                { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }
              ]}
            >
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-base font-bold text-white`}>{t('achievements.screenTitle')}</Text>
              <Text style={tw`text-xs font-medium text-white/60 mt-0.5`}>
                {currentTierTheme.gemName} {t('common.tier')}
              </Text>
            </View>

            <View style={tw`w-10`} />
          </View>

          {/* Grille de statistiques */}
          <View style={tw`flex-row gap-3`}>
            {/* Débloqués */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>
                {t('achievements.unlocked')}
              </Text>
              <View style={tw`flex-row items-baseline gap-1`}>
                <Text style={tw`text-2xl font-bold text-white`}>{unlockedCount}</Text>
                <Text style={tw`text-sm font-semibold text-white/50`}>/{totalCount}</Text>
              </View>
            </View>

            {/* Meilleure série */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>
                {t('achievements.bestStreak')}
              </Text>
              <Text style={tw`text-2xl font-bold text-white`}>{streak}</Text>
            </View>

            {/* XP total */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>
                {t('achievements.totalXP')}
              </Text>
              <Text style={tw`text-2xl font-bold text-white`} adjustsFontSizeToFit numberOfLines={1}>
                {totalXP > 999 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentTierTheme.accent]}
            tintColor={currentTierTheme.accent}
          />
        }
      >
        {/* Héros du niveau actuel */}
        <View style={tw`px-4 pt-4 mb-4`}>
          <CurrentLevelHero
            currentLevel={currentLevel}
            currentTitle={currentTitle}
            nextTitle={nextTitle}
            levelProgress={levelProgress}
            requiredXp={requiredXpForNextLevel}
            currentStreak={streak}
            perfectDays={perfectDays}
            totalHabits={totalHabits}
            onPress={handleZoomModalOpen}
          />
        </View>

        {/* Onglets de filtrage */}
        <FilterTabs
          filter={filter}
          setFilter={handleFilterChange}
          unlockedCount={unlockedCount}
          totalCount={totalCount}
        />

        {/* Sections par tier */}
        <View style={tw`px-2.5`}>
          {TIER_KEYS.map((tierKey, tierIndex) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tierKey === tierKey);
            if (tierAchievements.length === 0) return null;

            const tierDisplayName = getTierNameFromKey(tierKey);

            return (
              <View
                key={tierKey}
                ref={(ref) => (tierRefs.current[tierKey] = ref)}
                collapsable={false}
              >
                <TierSection
                  tierName={tierDisplayName}
                  tierKey={tierKey}
                  tierIndex={tierIndex}
                  achievements={tierAchievements}
                  userAchievements={achievements}
                  isAchievementUnlocked={isAchievementUnlocked}
                  onAchievementPress={handleAchievementPress}
                  isExpanded={expandedTier === tierKey}
                  onToggle={() => handleTierToggle(tierKey)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal de détails d'accomplissement */}
      <AchievementDetailModal
        visible={showModal}
        onClose={handleModalClose}
        achievement={selectedAchievement}
        currentLevel={currentLevel}
        totalCompletions={totalCompletions}
      />

      {/* Modal de zoom sur le badge */}
      <ZoomModal
        visible={showZoomModal}
        onClose={handleZoomModalClose}
        currentLevel={currentLevel}
        currentTitle={currentTitle}
      />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
