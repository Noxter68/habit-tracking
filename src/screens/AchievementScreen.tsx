// src/screens/AchievementScreen.tsx - Key fixes
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image, Dimensions, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock, Trophy, Award, TrendingUp, Star, Sparkles, Zap } from 'lucide-react-native';
import tw, { achievementGradients } from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';
import { achievementTitles, getAchievementByLevel, Achievement } from '../utils/achievements';
import { AchievementDetailModal } from '../components/achievements/AchievementDetailModal';
import { AchievementService, UserAchievement } from '../services/AchievementService';
import { HabitService } from '../services/habitService';
import { XPService } from '../services/xpService';
import { useAuth } from '../context/AuthContext';
import { ImageBackground } from 'expo-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define tier names as a constant to avoid typos
const TIER_NAMES = ['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'] as const;
type TierName = (typeof TIER_NAMES)[number];

// Safe gradient getter with fallback
export const getTierGradient = (tierName: string, isCompleted: boolean): string[] => {
  if (isCompleted) {
    return achievementGradients.tiers[tierName] || ['#fbbf24', '#d97706', '#92400e']; // amber-300 → amber-700 → amber-900
  }
  return achievementGradients.locked.card;
};

// Achievement Badge Component
export const AchievementBadge: React.FC<{
  level: number;
  achievement: Achievement | undefined;
  isUnlocked: boolean;
  size?: number;
  showLock?: boolean;
}> = ({ achievement, isUnlocked, size = 60, showLock = true }) => {
  if (!achievement) return null;

  return (
    <View style={tw`relative`}>
      <Image
        source={isUnlocked ? achievement.image : require('../../assets/achievements/locked.png')}
        style={{
          width: size,
          height: size,
          opacity: isUnlocked ? 1 : 0.6,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

// Main Screen Component with Backend Integration
const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const achievementsContext = useAchievements();
  const contextCompletions = achievementsContext?.totalCompletions || 0;

  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time data from backend
  const [backendData, setBackendData] = useState({
    totalCompletions: 0,
    totalXP: 0,
    userAchievements: [] as UserAchievement[],
    currentStreak: 0,
    perfectDays: 0,
    totalHabits: 0,
  });

  useEffect(() => {
    fetchAchievementData();
  }, [user?.id]);

  const fetchAchievementData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch all necessary data in parallel
      const [xpStats, habitStats, userAchievements, habits] = await Promise.all([
        XPService.getUserXPStats(user.id),
        HabitService.getAggregatedStats(user.id),
        AchievementService.getUserAchievements(user.id),
        HabitService.fetchHabits(user.id),
      ]);

      // Calculate perfect days (days with 100% completion)
      const perfectDays = habitStats.streakData?.filter((day) => day.value === 100).length || 0;

      setBackendData({
        totalCompletions: habitStats.totalCompletions || contextCompletions,
        totalXP: xpStats?.total_xp || 0,
        userAchievements: userAchievements || [],
        currentStreak: habitStats.totalDaysTracked || 0,
        perfectDays,
        totalHabits: habits.length,
      });

      // Check for new achievements
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
        // Show notification for new achievements
        // You can add a toast or modal here to celebrate new achievements
        console.log('New achievements unlocked:', newAchievements);

        // Refresh the achievements list
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

  // Calculate current level and progress
  const currentLevel = achievementsContext.currentLevel;
  const currentTitle = getAchievementByLevel(currentLevel);
  const nextTitle = getAchievementByLevel(currentLevel + 1);
  const levelProgress = ((backendData.totalCompletions % 10) / 10) * 100;

  // Check if achievement is unlocked based on backend data
  const isAchievementUnlocked = (achievement: Achievement): boolean => {
    // Check if it's unlocked by level
    if (achievement.level <= currentLevel) return true;

    // Check if it's in the user's unlocked achievements from backend
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
          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, pressed && tw`bg-achievement-amber-100`]}>
              <ChevronLeft size={30} color="#92400e" />
            </Pressable>
            <Image source={require('../../assets/achievements/achievements.png')} style={{ width: 200, height: 80 }} resizeMode="cover" />

            <View style={tw`w-10`} />
          </View>

          {/* Stats */}
          <View style={tw`flex-row justify-center gap-8`}>
            {/* Unlocked */}
            <View style={tw`items-center w-20`}>
              <Image source={require('../../assets/achievements/achievement-panel.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
              <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>

            {/* Completions */}
            <View style={tw`items-center w-20`}>
              <Image source={require('../../assets/achievements/achievement-panel-2.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
              <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>{backendData.totalCompletions}</Text>
            </View>

            {/* XP */}
            <View style={tw`items-center w-20`}>
              <Image source={require('../../assets/achievements/xp.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
              <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>{backendData.totalXP} XP</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#d97706']} tintColor="#d97706" />}
      >
        {/* Current Level Hero Card */}
        <View style={tw`px-4 pt-4`}>
          <Pressable onPress={() => setShowZoomModal(true)}>
            <LinearGradient colors={getTierGradient(currentTitle?.tier || 'Novice', true)} style={tw`rounded-3xl p-5 mb-4`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-achievement-amber-600 text-xs font-semibold uppercase tracking-wider`}>Current Achievement</Text>
                  <Text style={tw`text-achievement-amber-800 text-2xl font-black mt-1`}>{currentTitle?.title || 'Newcomer'}</Text>
                  <View style={tw`flex-row items-center gap-2 mt-2`}>
                    <View style={tw`bg-white/20 rounded-full px-2 py-0.5`}>
                      <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>Level {currentLevel}</Text>
                    </View>
                    <View style={tw`bg-white/20 rounded-full px-2 py-0.5`}>
                      <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>{currentTitle?.tier || 'Novice'}</Text>
                    </View>
                  </View>
                </View>
                <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={80} showLock={false} />
              </View>

              {/* Progress to next level */}
              {nextTitle && (
                <View style={tw`mt-2`}>
                  <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-amber-800/80 text-xs`}>Progress to {nextTitle.title}</Text>
                    <Text style={tw`text-amber-800 font-bold text-xs`}>{Math.round(levelProgress)}%</Text>
                  </View>

                  <View style={tw`h-5 rounded-full overflow-hidden`}>
                    <ImageBackground source={require('../../assets/interface/rope.png')} style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]} />
                  </View>
                </View>
              )}

              {/* Backend Stats */}
              <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-amber-400`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Streak</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{backendData.currentStreak}</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Perfect Days</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{backendData.perfectDays}</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Active Habits</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{backendData.totalHabits}</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Filter Tabs */}
        <View style={tw`px-4 mb-4`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 px-4`}>
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <Pressable
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={({ pressed }) => [tw`px-4 py-2 rounded-full mr-2`, filter === filterType ? tw`bg-achievement-amber-700` : tw`bg-achievement-amber-100`, pressed && tw`opacity-80`]}
              >
                <Text style={[tw`text-xs font-semibold capitalize`, filter === filterType ? tw`text-white` : tw`text-achievement-amber-800`]}>
                  {filterType}
                  {filterType !== 'all' && ` (${filterType === 'unlocked' ? unlockedCount : totalCount - unlockedCount})`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Achievements Grid */}
        <View style={tw`px-2.5`}>
          {TIER_NAMES.map((tierName, tierIndex) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            const tierUnlockedCount = tierAchievements.filter((a) => isAchievementUnlocked(a)).length;
            const tierTotalCount = tierAchievements.length;
            const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
            const isCompleted = tierUnlockedCount === tierTotalCount;

            return (
              <Animated.View key={tierName} entering={FadeInDown.delay(tierIndex * 100).springify()} style={tw`mb-6`}>
                {/* Tier Header Card with Progress */}
                <LinearGradient
                  colors={getTierGradient(tierName, isCompleted)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tw`mx-2 rounded-2xl p-4 mb-3 border ${isCompleted ? 'border-achievement-amber-300' : 'border-gray-200'}`}
                >
                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      {isCompleted && <Sparkles size={18} color="#92400e" />}
                      <Text style={tw`text-base font-bold ${isCompleted ? 'text-achievement-amber-900' : 'text-gray-700'}`}>{tierName}</Text>
                    </View>

                    <View style={tw`flex-row items-center gap-2`}>
                      <Text style={tw`text-sm font-semibold ${isCompleted ? 'text-achievement-amber-800' : 'text-gray-600'}`}>
                        {tierUnlockedCount}/{tierTotalCount}
                      </Text>
                      {isCompleted && <Trophy size={16} color="#d97706" />}
                    </View>
                  </View>

                  {/* Tier Progress Bar */}
                  <View style={tw`h-1.5 bg-black/10 rounded-full overflow-hidden`}>
                    <View style={[tw`h-full ${isCompleted ? 'bg-white' : 'bg-gray-400'} rounded-full`, { width: `${progress}%` }]} />
                  </View>
                </LinearGradient>

                {/* Achievement Cards */}
                <View style={tw`flex-row flex-wrap justify-between px-2`}>
                  {tierAchievements.map((achievement, index) => {
                    const isUnlocked = isAchievementUnlocked(achievement);
                    const isFromBackend = Array.isArray(backendData.userAchievements) && backendData.userAchievements.some((ua) => ua?.title === achievement.title);

                    return (
                      <Animated.View key={achievement.title} entering={FadeIn.delay(index * 50)} style={tw`w-[31%] mb-3`}>
                        <Pressable onPress={() => handleAchievementPress(achievement)} style={({ pressed }) => pressed && tw`scale-[0.95]`}>
                          <LinearGradient
                            colors={isUnlocked ? achievementGradients?.unlocked?.card || ['#fef3c7', '#fde68a'] : achievementGradients?.locked?.card || ['#e5e5e5', '#d4d4d4']}
                            style={tw`rounded-2xl p-3 items-center border ${isUnlocked ? 'border-achievement-amber-200' : 'border-gray-200'} ${isFromBackend ? 'shadow-lg' : ''}`}
                          >
                            {/* Achievement Badge */}
                            <AchievementBadge level={achievement.level} achievement={achievement} isUnlocked={isUnlocked} size={50} />

                            {/* Title */}
                            <Text style={[tw`text-xs font-semibold text-center mt-2`, isUnlocked ? tw`text-achievement-amber-900` : tw`text-gray-600`]} numberOfLines={2}>
                              {achievement.title}
                            </Text>

                            {/* Level Badge */}
                            <View style={tw`items-center mt-1`}>
                              <View style={tw`rounded-full px-2 py-0.5 ${isUnlocked ? 'bg-achievement-amber-800' : 'bg-gray-300'}`}>
                                <Text style={tw`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>LVL {achievement.level}</Text>
                              </View>
                            </View>

                            {/* Backend indicator */}
                            {isFromBackend && (
                              <View style={tw`absolute top-1 right-1`}>
                                <View style={tw`w-2 h-2 bg-green-500 rounded-full`} />
                              </View>
                            )}
                          </LinearGradient>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <AchievementDetailModal visible={showModal} onClose={() => setShowModal(false)} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={backendData.totalCompletions} />

      {/* Zoom Modal */}
      <Modal visible={showZoomModal} transparent animationType="fade" onRequestClose={() => setShowZoomModal(false)}>
        <Pressable style={tw`flex-1 bg-black/90 items-center justify-center`} onPress={() => setShowZoomModal(false)}>
          <View style={tw`w-full px-8`}>
            <View style={tw`items-center`}>
              <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={SCREEN_WIDTH - 64} showLock={false} />
              <Text style={tw`text-achievement-amber-100 text-xl font-bold mt-6 text-center`}>{currentTitle?.title}</Text>
              <View style={tw`flex-row gap-3 mt-3`}>
                <View style={tw`bg-achievement-amber-900/30 rounded-full px-3 py-1.5`}>
                  <Text style={tw`text-achievement-amber-100 text-sm font-medium`}>Level {currentLevel}</Text>
                </View>
                <View style={tw`bg-achievement-amber-900/30 rounded-full px-3 py-1.5`}>
                  <Text style={tw`text-achievement-amber-100 text-sm font-medium`}>{currentTitle?.tier || 'Novice'}</Text>
                </View>
              </View>
              <Text style={tw`text-achievement-amber-200/50 text-xs mt-4`}>Tap anywhere to close</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default AchievementsScreen;
