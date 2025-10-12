// src/screens/AchievementScreen.tsx
// SAFE VERSION - No useFocusEffect, just manual refresh

import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, ActivityIndicator, RefreshControl, View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

// Contexts
import { useAchievements } from '../context/AchievementContext';
import { useStats } from '../context/StatsContext'; // Use stats for level/XP

// Types
import { Achievement, FilterType, TIER_NAMES } from '../types/achievement.types';

// Components
import { AchievementStats } from '../components/achievements/AchievementStats';
import { CurrentLevelHero } from '../components/achievements/CurrentLevelHero';
import { FilterTabs } from '../components/achievements/FilterTabs';
import { TierSection } from '../components/achievements/TierSection';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { ZoomModal } from '../components/achievements/ZoomModal';

// Utils
import { achievementTitles } from '../utils/achievements';
import { getXPForNextLevel } from '@/utils/xpCalculations';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();

  // Get level/XP from StatsContext (single source of truth)
  const { stats, refreshStats, loading: statsLoading } = useStats();

  // Get achievement-specific data from AchievementContext
  const { achievements, totalCompletions, streak, perfectDays, totalHabits, loading: achievementsLoading, refreshAchievements } = useAchievements();

  // Use stats from StatsContext
  const currentLevel = stats?.level || 1;
  const totalXP = stats?.totalXP || 0;
  const levelProgress = stats?.levelProgress || 0;
  const currentTitle = stats?.currentAchievement;
  const nextTitle = achievementTitles.find((title) => title.level > currentLevel);

  // Local UI state
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const requiredXpForNextLevel = getXPForNextLevel(currentLevel);

  // Manual refresh handler (pull-to-refresh)
  const handleRefresh = async () => {
    console.log('AchievementScreen: Manual refresh triggered');
    setRefreshing(true);

    try {
      // Refresh both contexts
      await Promise.all([
        refreshStats(true), // Force refresh
        refreshAchievements(),
      ]);
    } catch (error) {
      console.error('Error refreshing achievement data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load effect (only runs once when component mounts)
  useEffect(() => {
    console.log('AchievementScreen: Initial mount, checking if refresh needed');

    // Only refresh if we don't have stats data
    // This prevents unnecessary refreshes but ensures we have data
    if (!stats) {
      console.log('AchievementScreen: No stats data, refreshing...');
      refreshStats(true);
    }

    // Only refresh achievements if empty
    if (!achievements || achievements.length === 0) {
      console.log('AchievementScreen: No achievements data, refreshing...');
      refreshAchievements();
    }
  }, []); // Empty dependency array = only runs once on mount

  // Debug logging (safe, no side effects)
  useEffect(() => {
    console.log('AchievementScreen - Current Data:', {
      level: currentLevel,
      xp: totalXP,
      title: currentTitle?.title,
      achievementsCount: achievements?.length || 0,
    });
  }, [currentLevel, totalXP, currentTitle, achievements]);

  // Helper functions
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

  // Combined loading state
  const isLoading = statsLoading || achievementsLoading;

  // Show loading screen only on initial load
  if (isLoading && !stats && !achievements) {
    return (
      <SafeAreaView style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#9CA3AF" /> {/* Stone-300 */}
        <Text style={tw`text-sand-700 mt-3`}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-sand-50`}>
      {/* Header */}
      <View style={tw`from-sand-50 to-stone-100 border-b border-sand-200`}>
        <View style={tw`px-5 py-4`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, pressed && tw`bg-sand-100`]}>
              <ChevronLeft size={30} color="#6B7280" />
            </Pressable>
            <Image source={require('../../assets/achievements/achievements.png')} style={{ width: 200, height: 80 }} resizeMode="cover" />
            <View style={tw`w-10`} />
          </View>

          {/* Stats */}
          <AchievementStats unlockedCount={unlockedCount} totalCount={totalCount} totalCompletions={totalCompletions} totalXP={totalXP} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#9CA3AF']} tintColor="#9CA3AF" />}
      >
        {/* Current Level Hero */}
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
            onPress={() => setShowZoomModal(true)}
          />
        </View>

        {/* Filter Tabs */}
        <FilterTabs filter={filter} setFilter={setFilter} unlockedCount={unlockedCount} totalCount={totalCount} />

        {/* Achievement Tiers */}
        <View style={tw`px-2.5`}>
          {TIER_NAMES.map((tierName, tierIndex) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            return (
              <TierSection
                key={tierName}
                tierName={tierName}
                tierIndex={tierIndex}
                achievements={tierAchievements}
                userAchievements={achievements}
                isAchievementUnlocked={isAchievementUnlocked}
                onAchievementPress={(ach) => {
                  setSelectedAchievement(ach);
                  setShowModal(true);
                }}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Modals */}
      <AchievementDetailModal visible={showModal} onClose={() => setShowModal(false)} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={totalCompletions} />

      <ZoomModal visible={showZoomModal} onClose={() => setShowZoomModal(false)} currentLevel={currentLevel} currentTitle={currentTitle} />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
