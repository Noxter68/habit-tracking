// src/screens/AchievementScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, Pressable, ActivityIndicator, RefreshControl, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

// Contexts
import { useAchievements } from '../context/AchievementContext';
import { useStats } from '../context/StatsContext';

// Types
import { Achievement, FilterType, TIER_NAMES, TierName } from '../types/achievement.types';

// Components
import { CurrentLevelHero } from '../components/achievements/CurrentLevelHero';
import { FilterTabs } from '../components/achievements/FilterTabs';
import { TierSection } from '../components/achievements/TierSection';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { ZoomModal } from '../components/achievements/ZoomModal';

// Utils
import { achievementTitles } from '../utils/achievements';
import { getXPForNextLevel } from '@/utils/xpCalculations';
import { getAchievementTierTheme } from '../utils/tierTheme';
import { HapticFeedback } from '../utils/haptics';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();

  const { stats, refreshStats, loading: statsLoading } = useStats();
  const { achievements, totalCompletions, streak, perfectDays, totalHabits, loading: achievementsLoading, refreshAchievements } = useAchievements();

  const currentLevel = stats?.level || 1;
  const totalXP = stats?.totalXP || 0;
  const levelProgress = stats?.levelProgress || 0;
  const currentTitle = stats?.currentAchievement;
  const nextTitle = achievementTitles.find((title) => title.level > currentLevel);

  const currentTierTheme = currentTitle ? getAchievementTierTheme(currentTitle.tier as any) : getAchievementTierTheme('Novice');

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTier, setExpandedTier] = useState<TierName | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const tierRefs = useRef<{ [key: string]: View | null }>({});

  const requiredXpForNextLevel = getXPForNextLevel(currentLevel);

  // Determine text colors based on gem type
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

  const handleRefresh = async () => {
    HapticFeedback.light();
    setRefreshing(true);
    try {
      await Promise.all([refreshStats(true), refreshAchievements()]);
    } catch (error) {
      console.error('Error refreshing achievement data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGoBack = () => {
    HapticFeedback.light();
    navigation.goBack();
  };

  const handleZoomModalOpen = () => {
    HapticFeedback.light();
    setShowZoomModal(true);
  };

  const handleZoomModalClose = () => {
    HapticFeedback.light();
    setShowZoomModal(false);
  };

  const handleAchievementPress = (achievement: Achievement) => {
    HapticFeedback.light();
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const handleModalClose = () => {
    HapticFeedback.light();
    setShowModal(false);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    HapticFeedback.selection();
    setFilter(newFilter);
  };

  useEffect(() => {
    if (!stats) refreshStats(true);
    if (!achievements || achievements.length === 0) refreshAchievements();
  }, []);

  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    if (achievement.level <= currentLevel) return true;
    return achievements.some((ua) => ua?.title === achievement.title || ua?.achievementId === achievement.id);
  };

  const filteredAchievements = achievementTitles.filter((achievement) => {
    const isUnlocked = isAchievementUnlocked(achievement);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const unlockedCount = achievementTitles.filter((a) => isAchievementUnlocked(a)).length;
  const totalCount = achievementTitles.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  const handleTierToggle = (tierName: TierName) => {
    HapticFeedback.light();
    const newExpandedState = expandedTier === tierName ? null : tierName;
    setExpandedTier(newExpandedState);

    // Scroll to tier when opening
    if (newExpandedState && tierRefs.current[tierName]) {
      setTimeout(() => {
        tierRefs.current[tierName]?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 20),
              animated: true,
            });
          },
          () => console.log('measure failed')
        );
      }, 100);
    }
  };

  const isLoading = statsLoading || achievementsLoading;

  if (isLoading && !stats && !achievements) {
    return (
      <SafeAreaView style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color={currentTierTheme.accent} />
        <Text style={tw`text-sand-700 mt-3`}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-sand-50`}>
      {/* Header with Deep Tier Gradient */}
      <LinearGradient colors={[currentTierTheme.gradient[0], currentTierTheme.gradient[1], currentTierTheme.gradient[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`pb-4 shadow-xl`}>
        <View style={tw`px-5 pt-4 pb-4`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center mb-4`}>
            <Pressable onPress={handleGoBack} style={({ pressed }) => [tw`p-2 -ml-2 rounded-lg`, { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }]}>
              <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>

            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-base font-bold text-white`}>Achievements</Text>
              <Text style={tw`text-xs font-medium text-white/60 mt-0.5`}>{currentTierTheme.gemName} Tier</Text>
            </View>

            <View style={tw`w-10`} />
          </View>

          {/* Stats Grid - More spacious and minimal */}
          <View style={tw`flex-row gap-3`}>
            {/* Unlocked Progress */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>Unlocked</Text>
              <View style={tw`flex-row items-baseline gap-1`}>
                <Text style={tw`text-2xl font-bold text-white`}>{unlockedCount}</Text>
                <Text style={tw`text-sm font-semibold text-white/50`}>/{totalCount}</Text>
              </View>
            </View>

            {/* Current Streak */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>Best Streak</Text>
              <Text style={tw`text-2xl font-bold text-white`}>{streak}</Text>
            </View>

            {/* Total XP */}
            <View style={[tw`flex-1 rounded-xl p-3`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
              <Text style={tw`text-xs font-semibold text-white/60 mb-1`}>Total XP</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[currentTierTheme.accent]} tintColor={currentTierTheme.accent} />}
      >
        <View style={tw`px-4 pt-4`}>
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

        <FilterTabs filter={filter} setFilter={handleFilterChange} unlockedCount={unlockedCount} totalCount={totalCount} />

        <View style={tw`px-2.5`}>
          {TIER_NAMES.map((tierName, tierIndex) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            return (
              <View key={tierName} ref={(ref) => (tierRefs.current[tierName] = ref)} collapsable={false}>
                <TierSection
                  tierName={tierName}
                  tierIndex={tierIndex}
                  achievements={tierAchievements}
                  userAchievements={achievements}
                  isAchievementUnlocked={isAchievementUnlocked}
                  onAchievementPress={handleAchievementPress}
                  isExpanded={expandedTier === tierName}
                  onToggle={handleTierToggle}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AchievementDetailModal visible={showModal} onClose={handleModalClose} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={totalCompletions} />

      <ZoomModal visible={showZoomModal} onClose={handleZoomModalClose} currentLevel={currentLevel} currentTitle={currentTitle} />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
