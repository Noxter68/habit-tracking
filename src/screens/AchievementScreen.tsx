import React, { useState, useEffect } from 'react';
import { ScrollView, Pressable, ActivityIndicator, RefreshControl, View, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

// Context & Services
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import { AchievementService } from '../services/AchievementService';
import { HabitService } from '../services/habitService';
import { XPService } from '../services/xpService';

// Types
import { Achievement, BackendData, FilterType, TIER_NAMES } from '../types/achievement.types';

// Components
import { AchievementStats } from '../components/achievements/AchievementStats';
import { CurrentLevelHero } from '../components/achievements/CurrentLevelHero';
import { FilterTabs } from '../components/achievements/FilterTabs';
import { TierSection } from '../components/achievements/TierSection';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { ZoomModal } from '../components/achievements/ZoomModal';

// Utils
import { achievementTitles, getAchievementByLevel } from '../utils/achievements';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const achievementsContext = useAchievements();
  const contextCompletions = achievementsContext?.totalCompletions || 0;

  // State
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backendData, setBackendData] = useState<BackendData>({
    totalCompletions: 0,
    totalXP: 0,
    userAchievements: [],
    currentStreak: 0,
    perfectDays: 0,
    totalHabits: 0,
    currentLevel: 1,
    levelProgress: 0,
  });

  // Effects
  useEffect(() => {
    fetchAchievementData();
  }, [user?.id]);

  // Data fetching
  const fetchAchievementData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [xpStats, habitStats, userAchievements, habits] = await Promise.all([
        XPService.getUserXPStats(user.id),
        HabitService.getAggregatedStats(user.id),
        AchievementService.getUserAchievements(user.id),
        HabitService.fetchHabits(user.id),
      ]);

      const perfectDays = habitStats.streakData?.filter((day: any) => day.value === 100).length || 0;

      setBackendData({
        totalCompletions: habitStats.totalCompletions || contextCompletions,
        totalXP: xpStats?.total_xp || 0,
        userAchievements: userAchievements || [],
        currentStreak: habitStats.totalDaysTracked || 0,
        perfectDays,
        totalHabits: habits.length,
        levelProgress: xpStats?.level_progress || 0,
        currentLevel: xpStats?.current_level || achievementsContext.currentLevel,
      });

      await checkAndUnlockNewAchievements({
        streak: habitStats.totalDaysTracked || 0,
        totalCompletions: habitStats.totalCompletions || 0,
        perfectDays,
        totalHabits: habits.length,
      });
    } catch (error) {
      console.error('Error fetching achievement data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockNewAchievements = async (stats: any) => {
    if (!user?.id) return;

    try {
      const newAchievements = await AchievementService.checkAndUnlockAchievements(user.id, stats);

      if (newAchievements && newAchievements.length > 0) {
        console.log('New achievements unlocked:', newAchievements);
        const updatedAchievements = await AchievementService.getUserAchievements(user.id);
        setBackendData((prev) => ({
          ...prev,
          userAchievements: updatedAchievements || [],
        }));
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAchievementData();
    setRefreshing(false);
  };

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  // Calculations
  const currentLevel = achievementsContext.currentLevel;
  const currentTitle = getAchievementByLevel(currentLevel);
  const nextTitle = getAchievementByLevel(currentLevel + 1);
  const levelProgress = backendData.levelProgress || 0;

  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    if (achievement.level <= currentLevel) return true;
    if (!Array.isArray(backendData.userAchievements)) return false;
    return backendData.userAchievements.some((ua) => ua?.title === achievement.title || ua?.achievementId === achievement.id);
  };

  const filteredAchievements = Array.isArray(achievementTitles)
    ? achievementTitles.filter((achievement) => {
        const isUnlocked = isAchievementUnlocked(achievement);
        if (filter === 'unlocked') return isUnlocked;
        if (filter === 'locked') return !isUnlocked;
        return true;
      })
    : [];

  const unlockedCount = Array.isArray(achievementTitles) ? achievementTitles.filter((a) => isAchievementUnlocked(a)).length : 0;
  const totalCount = Array.isArray(achievementTitles) ? achievementTitles.length : 0;

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
      <View style={tw`bg-gradient-to-b from-achievement-amber-50 to-achievement-amber-100 border-b border-achievement-amber-200`}>
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
          <AchievementStats unlockedCount={unlockedCount} totalCount={totalCount} totalCompletions={backendData.totalCompletions} totalXP={backendData.totalXP} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#d97706']} tintColor="#d97706" />}
      >
        {/* Current Level Hero */}
        <View style={tw`px-4 pt-4`}>
          <CurrentLevelHero
            currentLevel={currentLevel}
            currentTitle={currentTitle}
            nextTitle={nextTitle}
            levelProgress={levelProgress}
            currentStreak={backendData.currentStreak}
            perfectDays={backendData.perfectDays}
            totalHabits={backendData.totalHabits}
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
                userAchievements={backendData.userAchievements}
                isAchievementUnlocked={isAchievementUnlocked}
                onAchievementPress={handleAchievementPress}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Modals */}
      <AchievementDetailModal visible={showModal} onClose={() => setShowModal(false)} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={backendData.totalCompletions} />

      <ZoomModal visible={showZoomModal} onClose={() => setShowZoomModal(false)} currentLevel={currentLevel} currentTitle={currentTitle} />
    </SafeAreaView>
  );
};

export default AchievementsScreen;
