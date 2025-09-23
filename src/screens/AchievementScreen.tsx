import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Lock, Trophy, Award, TrendingUp, Star, Sparkles } from 'lucide-react-native';
import tw, { achievementGradients } from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';
import { achievementTitles, getAchievementByLevel, Achievement } from '../utils/achievements';
import { AchievementDetailModal } from '@/components/achievements/AchievementDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Achievement Badge Component
export const AchievementBadge: React.FC<{
  level: number;
  achievement: Achievement | undefined;
  isUnlocked: boolean;
  size?: number;
  showLock?: boolean;
}> = ({ achievement, isUnlocked, size = 60, showLock = true }) => {
  if (!achievement) return null;

  const imageSource = isUnlocked ? achievement.image : require('../../assets/achievements/locked.png');

  return (
    <View style={tw`relative`}>
      <Image
        source={imageSource}
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

// Main Screen Component
const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { totalCompletions } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const currentLevel = Math.min(30, Math.floor(totalCompletions / 10) + 1);
  const currentTitle = getAchievementByLevel(currentLevel);
  const nextTitle = getAchievementByLevel(currentLevel + 1);
  const levelProgress = ((totalCompletions % 10) / 10) * 100;

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const filteredAchievements = achievementTitles.filter((achievement) => {
    const isUnlocked = achievement.level <= currentLevel;
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const unlockedCount = achievementTitles.filter((a) => a.level <= currentLevel).length;
  const totalCount = achievementTitles.length;

  return (
    <SafeAreaView style={tw`flex-1 bg-achievement-amber-50`}>
      {/* Header */}
      <View style={tw`bg-gradient-to-b from-achievement-amber-50 to-achievement-amber-100 border-b border-achievement-amber-200`}>
        <View style={tw`px-5 py-4`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, pressed && tw`bg-achievement-amber-100`]}>
              <ChevronLeft size={30} color="#92400e" />
            </Pressable>
            <Image source={require('../../assets/achievements/achievements.png')} style={{ width: 200, height: 80 }} resizeMode="cover" />

            <View style={tw`w-10`} />
          </View>

          {/* Stats */}
          <View style={tw`flex-row justify-center gap-6`}>
            <View style={tw`items-center`}>
              <Image source={require('../../assets/achievements/unlocked.png')} style={{ width: 50, height: 50 }} resizeMode="cover" />
              <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>

            <View style={tw`items-center`}>
              <View style={tw`relative`}>
                <Image source={require('../../assets/achievements/achievement-panel-2.png')} style={{ width: 50, height: 50 }} resizeMode="cover" />
              </View>
              <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>{totalCompletions}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Current Level Hero Card */}
        <View style={tw`px-4 pt-4`}>
          <Pressable onPress={() => setShowZoomModal(true)} style={({ pressed }) => [tw`overflow-hidden rounded-3xl`, pressed && tw`scale-[0.98]`]}>
            <LinearGradient colors={achievementGradients.hero} style={tw`p-5 border-2 border-achievement-amber-300`}>
              <View style={tw`flex-row items-center gap-4`}>
                <View style={tw`relative`}>
                  <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={120} showLock={false} />
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-[10px] text-achievement-amber-700 uppercase tracking-wider mb-1`}>Current Achievement</Text>
                  <Text style={tw`text-base font-bold text-achievement-amber-900 mb-1`}>{currentTitle?.title}</Text>
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={tw`bg-achievement-amber-800 rounded-full px-2.5 py-1`}>
                      <Text style={tw`text-xs font-bold text-white`}>LVL {currentLevel}</Text>
                    </View>
                    <View style={tw`bg-achievement-amber-100 rounded-full px-2.5 py-1`}>
                      <Text style={tw`text-[11px] font-medium text-achievement-amber-700`}>{currentTitle?.tier}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {nextTitle && (
                <View style={tw`mt-4 pt-4 border-t border-achievement-amber-200`}>
                  <View style={tw`flex-row justify-between mb-1.5`}>
                    <Text style={tw`text-xs text-achievement-amber-700 font-medium`}>Next Level Progress</Text>
                    <Text style={tw`text-xs font-bold text-achievement-amber-800`}>{levelProgress.toFixed(0)}%</Text>
                  </View>

                  <View style={tw`h-2.5 bg-achievement-amber-100 rounded-full overflow-hidden mb-1.5`}>
                    <LinearGradient colors={achievementGradients.levelProgress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]} />
                  </View>

                  <Text style={tw`text-[12px] text-achievement-amber-800 text-center font-bold`}>
                    {10 - (totalCompletions % 10)} more to unlock "{nextTitle.title}"
                  </Text>
                </View>
              )}

              <Text style={tw`text-[10px] text-achievement-amber-600 text-center mt-3 font-medium`}>Tap to view full size</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Filter Pills */}
        <View style={tw`px-4 mt-4 mb-3`}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <Pressable
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={({ pressed }) => [
                  tw`px-4 py-2 rounded-full border`,
                  filter === filterType ? tw`bg-achievement-amber-700 border-achievement-amber-700` : tw`bg-achievement-amber-100 border-achievement-amber-300`,
                  pressed && tw`opacity-80`,
                ]}
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
          {['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'].map((tierName, tierIndex) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            const unlockedCount = tierAchievements.filter((a) => a.level <= currentLevel).length;
            const totalCount = tierAchievements.length;
            const progress = (unlockedCount / totalCount) * 100;
            const isCompleted = unlockedCount === totalCount;

            return (
              <Animated.View key={tierName} entering={FadeInDown.delay(tierIndex * 100).springify()} style={tw`mb-6`}>
                {/* Tier Header Card with Progress */}
                <LinearGradient
                  colors={isCompleted ? achievementGradients.tiers[tierName] : achievementGradients.locked.card}
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
                        {unlockedCount}/{totalCount}
                      </Text>
                      {isCompleted && (
                        <View style={tw`bg-achievement-amber-800 rounded-full px-2 py-0.5`}>
                          <Text style={tw`text-xs font-bold text-white`}>Complete</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={tw`h-1.5 bg-white/50 rounded-full overflow-hidden`}>
                    <LinearGradient colors={achievementGradients.tiers[tierName]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
                  </View>
                </LinearGradient>

                {/* Achievement Cards - 2 column layout */}
                <View style={tw`flex-row flex-wrap`}>
                  {tierAchievements.map((achievement, index) => {
                    const isUnlocked = achievement.level <= currentLevel;

                    return (
                      <Animated.View
                        key={achievement.level}
                        entering={FadeInDown.delay(index * 25)
                          .duration(300)
                          .springify()}
                        style={tw`w-1/2 p-1.5`}
                      >
                        <Pressable onPress={() => handleAchievementPress(achievement)} style={({ pressed }) => [tw`overflow-hidden rounded-2xl`, pressed && tw`scale-[0.97]`]}>
                          <LinearGradient
                            colors={isUnlocked ? achievementGradients.tiers[tierName] : achievementGradients.locked.card}
                            style={[tw`p-3 border relative`, { height: 180 }, isUnlocked ? tw`border-achievement-amber-300` : tw`border-gray-200`]}
                          >
                            {/* Background decoration for unlocked */}
                            {isUnlocked && (
                              <View style={tw`absolute inset-0`}>
                                <View style={tw`absolute -top-6 -right-6 w-20 h-20 bg-white/20 rounded-full`} />
                                <View style={tw`absolute -bottom-4 -left-4 w-16 h-16 bg-white/15 rounded-full`} />
                              </View>
                            )}

                            {/* Small lock indicator for locked achievements */}
                            {!isUnlocked && (
                              <View style={tw`absolute top-2 right-2 z-10`}>
                                <Image source={require('../../assets/achievements/locked.png')} style={{ width: 20, height: 20, opacity: 0.6 }} resizeMode="contain" />
                              </View>
                            )}

                            {/* Achievement Image */}
                            <View style={tw`flex-1 items-center justify-center mb-2`}>
                              <Image
                                source={achievement.image}
                                style={{
                                  width: 120,
                                  height: 120,
                                  opacity: isUnlocked ? 1 : 0.3,
                                }}
                                resizeMode="contain"
                              />

                              {isUnlocked && (
                                <View style={tw`absolute inset-0 items-center justify-center`}>
                                  <View style={tw`w-20 h-20 bg-achievement-amber-300/15 rounded-full absolute blur-lg`} />
                                </View>
                              )}
                            </View>

                            {/* Title */}
                            <Text style={[tw`text-xs font-bold text-center mb-1`, { minHeight: 32 }, isUnlocked ? tw`text-achievement-amber-900` : tw`text-gray-600`]} numberOfLines={2}>
                              {achievement.title}
                            </Text>

                            {/* Level Badge */}
                            <View style={tw`items-center`}>
                              <View style={tw`rounded-full px-3 py-1 ${isUnlocked ? 'bg-achievement-amber-800' : 'bg-gray-300'}`}>
                                <Text style={tw`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>LVL {achievement.level}</Text>
                              </View>
                            </View>
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
      <AchievementDetailModal visible={showModal} onClose={() => setShowModal(false)} achievement={selectedAchievement} currentLevel={currentLevel} totalCompletions={totalCompletions} />

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
                  <Text style={tw`text-achievement-amber-100 text-sm font-medium`}>{currentTitle?.tier}</Text>
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
