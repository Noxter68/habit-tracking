// src/screens/AchievementScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';
import { achievementTitles } from '@/utils/achievements';
import { AchievementBadge } from '@/components/icons/AchievementsIcon';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { totalCompletions } = useAchievements();
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  // Calculate current level based on completions
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
      {/* Clean Header */}
      <View style={tw`bg-white border-b border-gray-100`}>
        <View style={tw`px-5 py-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`p-2 -ml-2 rounded-xl`, pressed && tw`bg-gray-50`]}>
              <ChevronLeft size={24} color="#111827" />
            </Pressable>

            <Text style={tw`text-lg font-semibold text-gray-900`}>Achievements</Text>

            <View style={tw`w-10`} />
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Current Level Card */}
        <View style={tw`px-5 pt-5`}>
          <LinearGradient colors={['#fafafa', '#ffffff']} style={tw`rounded-2xl border border-gray-100 p-5 mb-5`}>
            <View style={tw`items-center`}>
              {/* Current Badge */}
              <View style={tw`mb-4`}>
                <AchievementBadge level={currentLevel} isUnlocked={true} size={80} />
              </View>

              {/* Title and Level */}
              <Text style={tw`text-2xl font-bold text-gray-900 mb-1`}>{currentTitle?.title}</Text>
              <View style={tw`bg-gray-100 rounded-full px-3 py-1 mb-4`}>
                <Text style={tw`text-xs font-semibold text-gray-600`}>Level {currentLevel}</Text>
              </View>

              {/* Progress to Next Level */}
              {nextTitle && (
                <View style={tw`w-full`}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-xs text-gray-500`}>{totalCompletions} completions</Text>
                    <Text style={tw`text-xs text-gray-500`}>Next: Level {currentLevel + 1}</Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
                    <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]} />
                  </View>

                  <Text style={tw`text-xs text-gray-400 text-center mt-2`}>
                    {10 - (totalCompletions % 10)} more to unlock {nextTitle.title}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Filter Tabs */}
        <View style={tw`px-5 mb-4`}>
          <View style={tw`flex-row bg-gray-100 rounded-xl p-1`}>
            {(['all', 'unlocked', 'locked'] as const).map((filterType) => (
              <Pressable
                key={filterType}
                onPress={() => setFilter(filterType)}
                style={({ pressed }) => [tw`flex-1 py-2 px-3 rounded-lg`, filter === filterType && tw`bg-white shadow-sm`, pressed && tw`opacity-80`]}
              >
                <Text style={[tw`text-center text-xs font-semibold capitalize`, filter === filterType ? tw`text-gray-900` : tw`text-gray-500`]}>{filterType}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={tw`px-5`}>
          {['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'].map((tierName) => {
            const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
            if (tierAchievements.length === 0) return null;

            return (
              <View key={tierName} style={tw`mb-6`}>
                <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1`}>{tierName}</Text>

                {/* Fixed Grid Layout */}
                <View style={tw`flex-row flex-wrap -mx-1.5`}>
                  {tierAchievements.map((achievement, index) => {
                    const isUnlocked = achievement.level <= currentLevel;
                    return (
                      <View key={achievement.level} style={tw`w-1/3 px-1.5 mb-3`}>
                        <Animated.View entering={FadeInDown.delay(index * 30).duration(300)}>
                          <Pressable
                            onPress={() => handleAchievementPress(achievement)}
                            style={({ pressed }) => [tw`bg-white rounded-2xl p-4 items-center border`, isUnlocked ? tw`border-gray-100` : tw`border-gray-50 opacity-50`, pressed && tw`scale-95`]}
                          >
                            {/* Fixed size container for badge */}
                            <View style={tw`h-12 w-12 items-center justify-center mb-2`}>
                              <AchievementBadge level={achievement.level} isUnlocked={isUnlocked} size={48} />
                            </View>

                            <Text style={[tw`text-xs font-semibold text-center`, isUnlocked ? tw`text-gray-900` : tw`text-gray-400`]} numberOfLines={2}>
                              {achievement.title}
                            </Text>

                            <Text style={[tw`text-xs mt-1`, isUnlocked ? tw`text-gray-500` : tw`text-gray-400`]}>Lv.{achievement.level}</Text>
                          </Pressable>
                        </Animated.View>
                      </View>
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
          <Animated.View entering={FadeIn.duration(200)} style={tw`bg-white rounded-3xl p-6 w-full max-w-sm`}>
            {selectedAchievement && (
              <>
                <View style={tw`items-center mb-4`}>
                  <View style={tw`h-20 w-20 items-center justify-center`}>
                    <AchievementBadge level={selectedAchievement.level} isUnlocked={selectedAchievement.level <= currentLevel} size={80} />
                  </View>
                </View>

                <Text style={tw`text-xl font-bold text-gray-900 text-center mb-2`}>{selectedAchievement.title}</Text>

                <View style={tw`bg-gray-50 rounded-xl px-3 py-2 self-center mb-4`}>
                  <Text style={tw`text-xs font-semibold text-gray-600`}>
                    {selectedAchievement.tier} • Level {selectedAchievement.level}
                  </Text>
                </View>

                <Text style={tw`text-sm text-gray-600 text-center mb-6 leading-5`}>
                  {selectedAchievement.level <= currentLevel ? `Unlocked at ${(selectedAchievement.level - 1) * 10} completions` : `Requires ${(selectedAchievement.level - 1) * 10} completions`}
                </Text>

                <Pressable
                  onPress={() => setShowModal(false)}
                  style={({ pressed }) => [tw`py-3 rounded-2xl`, selectedAchievement.level <= currentLevel ? tw`bg-gray-900` : tw`bg-gray-200`, pressed && tw`opacity-80`]}
                >
                  <Text style={tw`text-white font-semibold text-center`}>{selectedAchievement.level <= currentLevel ? 'Unlocked ✓' : 'Locked'}</Text>
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
