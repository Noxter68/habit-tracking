// src/components/dashboard/DashboardHeader.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { Flame, Target } from 'lucide-react-native';
import tw from '../../lib/tailwind';

// Components
import AchievementBadge from './AchievementBadge';
import DailyChallenge from './DailyChallenge';
import LevelProgress from './LevelProgress';
import StatsCard from './statsCard';
import NextAchievement from './NextAchievement';

// Utils & Services
import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import { useAuth } from '../../context/AuthContext';
import { useStats } from '@/context/StatsContext';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  activeHabits: number;
  completedTasksToday?: number;
  totalTasksToday?: number;
  onXPCollected?: (amount: number) => void;
  refreshTrigger?: number;
  currentAchievement?: any;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  levelProgress?: number;
  onStatsRefresh?: () => void;
  totalXP?: number; // Add this prop
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTitle,
  userLevel,
  totalStreak,
  activeHabits,
  completedTasksToday = 0,
  totalTasksToday = 0,
  onXPCollected,
  refreshTrigger = 0,
  currentAchievement,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  levelProgress = 0,
  onStatsRefresh,
  totalXP = 0, // Add default value
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { refreshStats } = useStats();
  const greeting = getGreeting();

  const handleAchievementPress = () => {
    navigation.navigate('Achievements' as never);
  };

  const handleXPCollect = async (amount: number) => {
    if (onXPCollected) {
      onXPCollected(amount);
    }

    // Small delay to ensure DB transaction completes
    setTimeout(async () => {
      await refreshStats(true);
      if (onStatsRefresh) {
        onStatsRefresh();
      }
    }, 200);
  };

  const handleLevelUp = async () => {
    // Force refresh stats when level up occurs
    await refreshStats(true);
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  };

  // Calculate next achievement
  const nextTitle = achievementTitles.find((title) => title.level > userLevel);
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  // Display values
  const displayXP = currentLevelXP > xpForNextLevel ? currentLevelXP % xpForNextLevel : currentLevelXP;
  const displayProgress = xpForNextLevel > 0 ? (displayXP / xpForNextLevel) * 100 : 0;

  return (
    <Animated.View entering={FadeIn} style={tw`relative`}>
      {/* Quartz Texture Background - Single instance, not repeated */}
      <ImageBackground
        source={require('../../../assets/interface/quartz-texture-2.png')}
        style={tw`absolute inset-0 rounded-3xl`}
        imageStyle={{
          opacity: 0.5,
          borderRadius: 24,
          resizeMode: 'cover',
        }}
        resizeMode="cover"
      >
        {/* Gradient overlay for better text readability */}
        <View style={tw`absolute inset-0 bg-gradient-to-b from-quartz-50/80 to-transparent rounded-3xl`} />
      </ImageBackground>

      {/* Content Container with padding for texture visibility */}
      <View style={tw`p-4 rounded-3xl`}>
        {/* Greeting and Level with Achievement Icon */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-medium text-quartz-500`}>{greeting}</Text>
          <View style={tw`flex-row items-center justify-between mt-1`}>
            <View>
              <Text style={tw`text-2xl font-black text-quartz-700`}>{userTitle}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                <View style={tw`bg-quartz-600 rounded-full px-2 py-0.5 mr-2`}>
                  <Text style={tw`text-xs font-bold text-white`}>LEVEL {userLevel}</Text>
                </View>
                <Text style={tw`text-xs text-quartz-400`}>{totalXP} Total XP</Text>
              </View>
            </View>
            <AchievementBadge achievement={currentAchievement} onPress={handleAchievementPress} />
          </View>
        </View>

        {/* Level Progress Bar */}
        <LevelProgress currentLevel={userLevel} currentLevelXP={displayXP} xpForNextLevel={xpForNextLevel} levelProgress={displayProgress} />

        {/* Stats Grid */}
        <View style={tw`flex-row gap-3 mb-4`}>
          <StatsCard label="Streak" value={totalStreak} image="streak" subtitle="days" isStreak={true} streakValue={totalStreak} />
          <StatsCard label="Active" value={activeHabits} image="active" subtitle="Quests" />
        </View>

        {/* Daily Challenge - Outside of texture background */}
        <View style={tw`mt-2`}>
          {user?.id && (
            <DailyChallenge
              completedToday={completedTasksToday}
              totalTasksToday={totalTasksToday}
              onCollect={handleXPCollect}
              userId={user.id}
              currentLevelXP={currentLevelXP}
              xpForNextLevel={xpForNextLevel}
              onLevelUp={handleLevelUp}
              debugMode={__DEV__}
            />
          )}
        </View>

        {/* Next Achievement Preview */}
        <NextAchievement nextTitle={nextTitle} xpToNextLevel={xpToNextLevel} />
      </View>
    </Animated.View>
  );
};

export default DashboardHeader;
