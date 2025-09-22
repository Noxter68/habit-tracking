// src/screens/AchievementScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Lock, Trophy, Flame, Target, Zap, Shield, Award } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';
import { achievementTitles } from '@/utils/achievements';
import { AchievementBadge } from '@/components/icons/AchievementsIcon';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { totalCompletions, streak } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Calculate current level based on completions (adjust formula as needed)
  const currentLevel = Math.min(30, Math.floor(totalCompletions / 10) + 1);
  const currentTitle = achievementTitles.find((t) => t.level === currentLevel);
  const nextTitle = achievementTitles.find((t) => t.level === currentLevel + 1);

  // Calculate progress to next level
  const levelProgress = ((totalCompletions % 10) / 10) * 100;

  const handleAchievementPress = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const filteredAchievements = achievementTitles.filter((achievement) => {
    const isUnlocked = achievement.level <= currentLevel;
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'locked') return !isUnlocked;
    return true;
  });

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      {/* Compact Minimalist Header */}
      <View style={tw`bg-white border-b border-gray-100`}>
        <View style={tw`px-5 py-3`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`mr-3`}>
                <AchievementBadge level={currentLevel} isUnlocked={true} />
              </View>
              <View>
                <Text style={tw`text-lg font-bold text-gray-900`}>Achievements</Text>
                <Text style={tw`text-xs text-gray-500`}>
                  Level {currentLevel} • {currentTitle?.title}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-8 h-8 rounded-lg bg-gray-50 items-center justify-center`, pressed && tw`bg-gray-100`]}>
              <X size={18} color="#6b7280" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Compact Progress Bar */}
        <View style={tw`px-5 pb-3`}>
          <View style={tw`flex-row items-center justify-between mb-1`}>
            <Text style={tw`text-xs text-gray-500`}>Progress to Level {currentLevel + 1}</Text>
            <Text style={tw`text-xs font-semibold text-gray-700`}>{Math.round(levelProgress)}%</Text>
          </View>
          <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
            <LinearGradient
              colors={currentTitle ? [currentTitle.color, currentTitle.color + 'dd'] : ['#6366f1', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]}
            />
          </View>
        </View>

        {/* Compact Stats */}
        <View style={tw`px-5 pb-3 flex-row justify-around`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>{currentLevel}/30</Text>
            <Text style={tw`text-xs text-gray-500`}>Level</Text>
          </View>
          <View style={tw`w-px bg-gray-200`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>{streak}</Text>
            <Text style={tw`text-xs text-gray-500`}>Streak</Text>
          </View>
          <View style={tw`w-px bg-gray-200`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-lg font-bold text-gray-900`}>{totalCompletions}</Text>
            <Text style={tw`text-xs text-gray-500`}>Total</Text>
          </View>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={tw`px-5 pt-4 pb-2`}>
          <View style={tw`flex-row gap-2`}>
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <Pressable
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={({ pressed }) => [tw`flex-1 py-2 rounded-lg`, filter === filterType ? tw`bg-gray-900` : tw`bg-white border border-gray-200`, pressed && tw`opacity-80`]}
              >
                <Text style={[tw`text-center text-xs font-semibold capitalize`, filter === filterType ? tw`text-white` : tw`text-gray-600`]}>{filterType}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={tw`px-5 pb-6`}>
          {/* Group by tier */}
          {['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'].map((tierName) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            return (
              <View key={tierName} style={tw`mb-6`}>
                <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-3`}>{tierName}</Text>
                <View style={tw`flex-row flex-wrap -mx-1`}>
                  {tierAchievements.map((achievement, index) => {
                    const isUnlocked = achievement.level <= currentLevel;
                    return (
                      <Animated.View key={achievement.level} entering={FadeInDown.delay(index * 30).duration(300)} style={tw`w-1/3 px-1 mb-3`}>
                        <Pressable
                          onPress={() => handleAchievementPress(achievement)}
                          style={({ pressed }) => [tw`bg-white rounded-xl p-3 items-center border`, isUnlocked ? tw`border-gray-200` : tw`border-gray-100 opacity-60`, pressed && tw`scale-95`]}
                        >
                          <AchievementBadge level={achievement.level} isUnlocked={isUnlocked} />
                          <Text style={[tw`text-xs font-semibold text-center mt-2`, isUnlocked ? tw`text-gray-900` : tw`text-gray-400`]} numberOfLines={2}>
                            {achievement.title}
                          </Text>
                          <Text style={[tw`text-xs mt-1`, isUnlocked ? tw`text-gray-600` : tw`text-gray-400`]}>Lv.{achievement.level}</Text>
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={tw`flex-1 bg-black/50 items-center justify-center px-5`} onPress={() => setShowModal(false)}>
          <Animated.View entering={FadeIn.duration(200)} style={tw`bg-white rounded-2xl p-6 w-full max-w-sm`}>
            {selectedAchievement && (
              <>
                <View style={tw`items-center mb-4`}>
                  <AchievementBadge level={selectedAchievement.level} isUnlocked={selectedAchievement.level <= currentLevel} />
                </View>
                <Text style={tw`text-xl font-bold text-gray-900 text-center mb-2`}>{selectedAchievement.title}</Text>
                <View style={tw`bg-gray-50 rounded-xl px-3 py-2 self-center mb-4`}>
                  <Text style={tw`text-xs font-semibold text-gray-600`}>
                    {selectedAchievement.tier} • Level {selectedAchievement.level}
                  </Text>
                </View>
                <Text style={tw`text-sm text-gray-600 text-center mb-4`}>
                  {selectedAchievement.level <= currentLevel
                    ? `Unlocked at ${(selectedAchievement.level - 1) * 10} completions`
                    : `Requires ${(selectedAchievement.level - 1) * 10} completions to unlock`}
                </Text>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={({ pressed }) => [tw`py-3 rounded-xl`, selectedAchievement.level <= currentLevel ? tw`bg-gray-900` : tw`bg-gray-300`, pressed && tw`opacity-80`]}
                >
                  <Text style={tw`text-white font-semibold text-center`}>{selectedAchievement.level <= currentLevel ? 'Unlocked' : 'Locked'}</Text>
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
