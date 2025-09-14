// src/screens/AchievementsScreen.tsx
import React, { useState, useEffect, createElement } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Lock, CheckCircle2, X, Award, Sparkles, TrendingUp, Target, Zap, Crown, Medal, Shield, Rocket, Heart, Flame } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';

interface AchievementCardProps {
  achievement: any;
  isUnlocked: boolean;
  unlockedDate?: Date;
  onPress: () => void;
  index: number;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isUnlocked, unlockedDate, onPress, index }) => {
  const scaleAnimation = useSharedValue(1);
  const rotateAnimation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }, { rotate: `${rotateAnimation.value}deg` }],
    opacity: interpolate(scaleAnimation.value, [0.95, 1], [0.8, 1], Extrapolate.CLAMP),
  }));

  const handlePressIn = () => {
    scaleAnimation.value = withSpring(0.95);
    if (isUnlocked) {
      rotateAnimation.value = withSpring(5);
    }
  };

  const handlePressOut = () => {
    scaleAnimation.value = withSpring(1);
    rotateAnimation.value = withSpring(0);
  };

  const getRequirementText = () => {
    switch (achievement.requirement.type) {
      case 'streak':
        return `${achievement.requirement.value} day streak`;
      case 'completions':
        return `${achievement.requirement.value} completions`;
      case 'perfect_days':
        return `${achievement.requirement.value} perfect days`;
      case 'habits_count':
        return `${achievement.requirement.value} habits`;
      default:
        return '';
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)} style={[animatedStyle, tw`mb-3`]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [tw`bg-white rounded-2xl overflow-hidden border-2`, isUnlocked ? tw`border-indigo-200` : tw`border-gray-100`, pressed && tw`opacity-90`]}
      >
        {isUnlocked && <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute top-0 left-0 right-0 h-1`} />}

        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center`}>
            {/* Icon Container */}
            <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center mr-4`, isUnlocked ? { backgroundColor: achievement.color + '20' } : tw`bg-gray-100`]}>
              {isUnlocked ? <Text style={tw`text-3xl`}>{achievement.icon}</Text> : <Lock size={24} color="#9ca3af" strokeWidth={2} />}
            </View>

            {/* Achievement Info */}
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center`}>
                <Text style={[tw`text-lg font-bold`, isUnlocked ? tw`text-gray-900` : tw`text-gray-400`]}>{achievement.title}</Text>
                {isUnlocked && (
                  <View style={tw`ml-2`}>
                    <CheckCircle2 size={18} color="#10b981" strokeWidth={2.5} />
                  </View>
                )}
              </View>

              <Text style={[tw`text-sm mt-0.5`, isUnlocked ? tw`text-gray-600` : tw`text-gray-400`]}>{achievement.description}</Text>

              <View style={tw`flex-row items-center mt-2`}>
                <View style={[tw`px-2 py-1 rounded-lg`, isUnlocked ? tw`bg-indigo-100` : tw`bg-gray-100`]}>
                  <Text style={[tw`text-xs font-medium`, isUnlocked ? tw`text-indigo-700` : tw`text-gray-500`]}>{getRequirementText()}</Text>
                </View>

                {isUnlocked && unlockedDate && <Text style={tw`text-xs text-gray-500 ml-2`}>Unlocked {unlockedDate.toLocaleDateString()}</Text>}
              </View>
            </View>

            {/* Level Badge */}
            <View style={[tw`w-10 h-10 rounded-xl items-center justify-center ml-2`, isUnlocked ? { backgroundColor: achievement.color + '15' } : tw`bg-gray-50`]}>
              <Text style={[tw`text-xs font-bold`, isUnlocked ? { color: achievement.color } : tw`text-gray-400`]}>Lv.{achievement.level}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { achievements, userAchievements, userTitle, totalCompletions, streak, loading, refreshAchievements } = useAchievements();

  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    refreshAchievements();
  }, []);

  const unlockedIds = userAchievements.map((ua) => ua.achievementId);

  const filteredAchievements = achievements.filter((achievement) => {
    const isUnlocked = unlockedIds.includes(achievement.id);
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  const progressPercentage = achievements.length > 0 ? Math.round((userAchievements.length / achievements.length) * 100) : 0;

  const handleAchievementPress = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const getNextAchievement = () => {
    const locked = achievements.filter((a) => !unlockedIds.includes(a.id));
    return locked.sort((a, b) => a.level - b.level)[0];
  };

  const nextAchievement = getNextAchievement();

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-5 py-4 border-b border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={tw`text-2xl font-bold text-gray-900`}>Achievements</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>
              {userAchievements.length} of {achievements.length} unlocked
            </Text>
          </View>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-10 h-10 rounded-xl bg-gray-100 items-center justify-center`, pressed && tw`bg-gray-200`]}>
            <X size={20} color="#6b7280" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-6`}>
        {/* Progress Card */}
        <View style={tw`px-5 pt-5`}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-5`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View>
                <Text style={tw`text-white/80 text-sm`}>Current Title</Text>
                <Text style={tw`text-2xl font-bold text-white mt-1`}>{userTitle}</Text>
              </View>
              <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center`}>
                <Trophy size={32} color="#ffffff" strokeWidth={2} />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row justify-between mb-2`}>
                <Text style={tw`text-white/80 text-xs`}>Overall Progress</Text>
                <Text style={tw`text-white font-bold text-sm`}>{progressPercentage}%</Text>
              </View>
              <View style={tw`h-3 bg-white/20 rounded-full overflow-hidden`}>
                <Animated.View entering={FadeIn.delay(200).duration(600)} style={[tw`h-full bg-white rounded-full`, { width: `${progressPercentage}%` }]} />
              </View>
            </View>

            {/* Stats */}
            <View style={tw`flex-row justify-around pt-3 border-t border-white/20`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-white`}>{streak}</Text>
                <Text style={tw`text-xs text-white/80 mt-1`}>Current Streak</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-white`}>{totalCompletions}</Text>
                <Text style={tw`text-xs text-white/80 mt-1`}>Completions</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-bold text-white`}>{Math.floor(totalCompletions / 10) + 1}</Text>
                <Text style={tw`text-xs text-white/80 mt-1`}>Level</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Next Achievement Card */}
        {nextAchievement && (
          <View style={tw`px-5 pt-5`}>
            <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-3`}>Next Achievement</Text>
            <Pressable
              onPress={() => handleAchievementPress(nextAchievement)}
              style={({ pressed }) => [tw`bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200`, pressed && tw`opacity-90`]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-12 h-12 bg-amber-100 rounded-xl items-center justify-center mr-3`}>
                  <Target size={24} color="#f59e0b" strokeWidth={2} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-bold text-gray-900`}>{nextAchievement.title}</Text>
                  <Text style={tw`text-sm text-gray-600 mt-0.5`}>{nextAchievement.description}</Text>
                </View>
                <Sparkles size={20} color="#f59e0b" />
              </View>
            </Pressable>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={tw`px-5 pt-5`}>
          <View style={tw`flex-row gap-2`}>
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <Pressable
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={({ pressed }) => [tw`flex-1 py-2.5 rounded-xl border`, filter === filterType ? tw`bg-indigo-50 border-indigo-300` : tw`bg-white border-gray-200`, pressed && tw`opacity-80`]}
              >
                <Text style={[tw`text-center text-sm font-semibold capitalize`, filter === filterType ? tw`text-indigo-700` : tw`text-gray-600`]}>{filterType}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Achievements List */}
        <View style={tw`px-5 pt-5`}>
          <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-3`}>All Achievements</Text>

          {filteredAchievements.map((achievement, index) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const userAchievement = userAchievements.find((ua) => ua.achievementId === achievement.id);

            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                unlockedDate={userAchievement ? new Date(userAchievement.unlockedAt) : undefined}
                onPress={() => handleAchievementPress(achievement)}
                index={index}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={tw`flex-1 bg-black/50 items-center justify-center px-5`} onPress={() => setShowModal(false)}>
          <Animated.View entering={FadeIn.duration(200)} style={tw`bg-white rounded-3xl p-6 w-full max-w-sm`}>
            {selectedAchievement && (
              <>
                {/* Icon */}
                <View style={tw`items-center mb-4`}>
                  <View
                    style={[
                      tw`w-24 h-24 rounded-3xl items-center justify-center`,
                      unlockedIds.includes(selectedAchievement.id) ? { backgroundColor: selectedAchievement.color + '20' } : tw`bg-gray-100`,
                    ]}
                  >
                    {unlockedIds.includes(selectedAchievement.id) ? <Text style={tw`text-5xl`}>{selectedAchievement.icon}</Text> : <Lock size={40} color="#9ca3af" strokeWidth={1.5} />}
                  </View>
                </View>

                {/* Title & Description */}
                <Text style={tw`text-2xl font-bold text-gray-900 text-center mb-2`}>{selectedAchievement.title}</Text>
                <Text style={tw`text-base text-gray-600 text-center mb-4 leading-relaxed`}>{selectedAchievement.description}</Text>

                {/* Requirement */}
                <View style={tw`bg-gray-50 rounded-2xl p-4 mb-4`}>
                  <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center`}>Requirement</Text>
                  <View style={tw`flex-row items-center justify-center`}>
                    <View style={[tw`px-3 py-1.5 rounded-lg`, unlockedIds.includes(selectedAchievement.id) ? tw`bg-green-100` : tw`bg-gray-200`]}>
                      <Text style={[tw`text-sm font-semibold`, unlockedIds.includes(selectedAchievement.id) ? tw`text-green-700` : tw`text-gray-600`]}>
                        {(() => {
                          switch (selectedAchievement.requirement.type) {
                            case 'streak':
                              return `Maintain ${selectedAchievement.requirement.value} day streak`;
                            case 'completions':
                              return `Complete ${selectedAchievement.requirement.value} total days`;
                            case 'perfect_days':
                              return `Have ${selectedAchievement.requirement.value} perfect days`;
                            case 'habits_count':
                              return `Track ${selectedAchievement.requirement.value} habits`;
                            default:
                              return '';
                          }
                        })()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Level & Status */}
                <View style={tw`flex-row items-center justify-center gap-4 mb-6`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-xs text-gray-500`}>Level</Text>
                    <Text style={tw`text-lg font-bold text-gray-900`}>{selectedAchievement.level}</Text>
                  </View>
                  <View style={tw`w-px h-8 bg-gray-200`} />
                  <View style={tw`items-center`}>
                    <Text style={tw`text-xs text-gray-500`}>Status</Text>
                    <Text style={[tw`text-lg font-bold`, unlockedIds.includes(selectedAchievement.id) ? tw`text-green-600` : tw`text-gray-400`]}>
                      {unlockedIds.includes(selectedAchievement.id) ? 'Unlocked' : 'Locked'}
                    </Text>
                  </View>
                </View>

                {/* Close Button */}
                <Pressable onPress={() => setShowModal(false)} style={({ pressed }) => [tw`bg-indigo-600 py-3 rounded-2xl`, pressed && tw`bg-indigo-700`]}>
                  <Text style={tw`text-white font-semibold text-center`}>Close</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default AchievementsScreen;
