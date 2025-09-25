import React, { useState } from 'react';
import { ScrollView, Pressable, ActivityIndicator, RefreshControl, View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

// Context
import { useAchievements } from '../context/AchievementContext';

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

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { achievements, totalCompletions, totalXP, currentLevel, levelProgress, streak, perfectDays, totalHabits, loading, currentTitle, nextTitle, refreshAchievements } = useAchievements();

  // Local UI state
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  // Helpers
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

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-achievement-amber-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#d97706" />
        <Text style={tw`text-achievement-amber-700 mt-3`}>Loading achievements...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-achievement-amber-50`}>
      {/* Header */}
      <View style={tw`from-achievement-amber-50 to-achievement-amber-100 border-b border-achievement-amber-200`}>
        <View style={tw`px-5 py-4`}>
          {/* Navigation */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, pressed && tw`bg-achievement-amber-100`]}>
              <ChevronLeft size={30} color="#92400e" />
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
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshAchievements} colors={['#d97706']} tintColor="#d97706" />}
      >
        {/* Current Level Hero */}
        <View style={tw`px-4 pt-4`}>
          <CurrentLevelHero
            currentLevel={currentLevel}
            currentTitle={currentTitle}
            nextTitle={nextTitle}
            levelProgress={levelProgress}
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
