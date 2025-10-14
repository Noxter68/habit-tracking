// src/screens/AchievementScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { Achievement, FilterType, TIER_NAMES } from '../types/achievement.types';

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
    setRefreshing(true);
    try {
      await Promise.all([refreshStats(true), refreshAchievements()]);
    } catch (error) {
      console.error('Error refreshing achievement data:', error);
    } finally {
      setRefreshing(false);
    }
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
      <LinearGradient colors={[currentTierTheme.gradient[0], currentTierTheme.gradient[1], currentTierTheme.gradient[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`pb-6 shadow-xl`}>
        <View style={tw`px-5 pt-4 pb-3`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)' }]}
            >
              <ChevronLeft size={24} color={textColors.iconColor} />
            </Pressable>

            <View style={tw`items-center flex-1`}>
              <Text style={[tw`text-xl font-black tracking-tight`, tw`${textColors.primary}`]}>Achievements</Text>
              <View style={tw`flex-row items-center gap-1.5 mt-0.5`}>
                <View style={[tw`h-1.5 w-1.5 rounded-full`, { backgroundColor: currentTierTheme.accent }]} />
                <Text style={[tw`text-[10px] font-bold uppercase tracking-wider`, tw`${textColors.secondary}`]}>{currentTierTheme.gemName} Tier</Text>
              </View>
            </View>

            <View style={tw`w-10`} />
          </View>

          {/* Compact Stats */}
          <View style={tw`gap-2`}>
            {/* Compact Progress Bar First */}
            <View style={[tw`rounded-xl p-2.5`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
              <View style={tw`flex-row items-center justify-between mb-1.5`}>
                <Text style={[tw`text-[9px] font-bold uppercase tracking-wide`, tw`${textColors.secondary}`]}>Progress</Text>
                <Text style={[tw`text-xs font-black`, tw`${textColors.primary}`]}>{completionPercent}%</Text>
              </View>
              <View style={[tw`h-2 rounded-full overflow-hidden`, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${completionPercent}%`,
                      backgroundColor: currentTierTheme.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Three Equal Cards Row */}
            <View style={tw`flex-row gap-2`}>
              {/* Unlocked Card */}
              <View style={[tw`flex-1 rounded-xl p-2.5`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={[tw`text-[9px] font-bold uppercase tracking-wide mb-0.5`, tw`${textColors.secondary}`]} numberOfLines={1}>
                  Unlocked
                </Text>
                <View style={tw`flex-row items-baseline gap-0.5`}>
                  <Text style={[tw`text-lg font-black`, tw`${textColors.primary}`]} numberOfLines={1}>
                    {unlockedCount}
                  </Text>
                  <Text style={[tw`text-xs font-bold`, tw`${textColors.secondary}`]} numberOfLines={1}>
                    /{totalCount}
                  </Text>
                </View>
              </View>

              {/* Completions Card */}
              <View style={[tw`flex-1 rounded-xl p-2.5`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={[tw`text-[9px] font-bold uppercase tracking-wide mb-0.5`, tw`${textColors.secondary}`]} numberOfLines={1}>
                  Completions
                </Text>
                <Text style={[tw`text-lg font-black`, tw`${textColors.primary}`]} numberOfLines={1}>
                  {totalCompletions}
                </Text>
              </View>

              {/* Total XP Card */}
              <View style={[tw`flex-1 rounded-xl p-2.5`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={[tw`text-[9px] font-bold uppercase tracking-wide mb-0.5`, tw`${textColors.secondary}`]} numberOfLines={1}>
                  Total XP
                </Text>
                <Text style={[tw`text-lg font-black`, tw`${textColors.primary}`]} adjustsFontSizeToFit numberOfLines={1}>
                  {totalXP.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
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
            onPress={() => setShowZoomModal(true)}
          />
        </View>

        <FilterTabs filter={filter} setFilter={setFilter} unlockedCount={unlockedCount} totalCount={totalCount} />

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

      <AchievementDetailModal visible={showModal} onClose={() => setShowModal(false)} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={totalCompletions} />

      <ZoomModal visible={showZoomModal} onClose={() => setShowZoomModal(false)} currentLevel={currentLevel} currentTitle={currentTitle} />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
