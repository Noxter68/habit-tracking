// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import tw, { quartzGradients } from '../../lib/tailwind';

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
  totalXP?: number;
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
  totalXP = 0,
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
    <Animated.View entering={FadeIn} style={tw`relative mb-4`}>
      {/* Beautiful gradient background */}
      <LinearGradient
        colors={quartzGradients.calmMorning} // Stone to sand blend
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tw`rounded-3xl overflow-hidden shadow-lg`}
      >
        {/* Content Container */}
        <View style={tw`p-6`}>
          {/* Greeting and Level Section */}
          <View style={tw`mb-5`}>
            <Text style={tw`text-sm font-semibold text-sand-600 uppercase tracking-wider`}>{greeting}</Text>

            <View style={tw`flex-row items-center justify-between mt-2`}>
              <View style={tw`flex-1 pr-20`}>
                {/* User Title */}
                <Text style={tw`text-2xl font-black text-stone-800 leading-tight`}>{userTitle}</Text>

                {/* Level & XP badges */}
                <View style={tw`flex-row items-center gap-2 mt-2`}>
                  {/* Level Badge */}
                  <LinearGradient colors={quartzGradients.primary} style={tw`rounded-full px-3 py-1`}>
                    <Text style={tw`text-xs font-bold text-white`}>LEVEL {userLevel}</Text>
                  </LinearGradient>

                  {/* Total XP Display */}
                  <View style={tw`bg-white/70 rounded-full px-3 py-1 border border-sand-200`}>
                    <Text style={tw`text-xs font-semibold text-stone-700`}>{totalXP.toLocaleString()} XP</Text>
                  </View>
                </View>
              </View>

              {/* Achievement Badge - Top Right */}
              <View style={{ position: 'absolute', right: 0, top: 0 }}>
                <AchievementBadge achievement={currentAchievement} onPress={handleAchievementPress} />
              </View>
            </View>
          </View>

          {/* Level Progress Bar */}
          <View style={tw`mb-5`}>
            <LevelProgress currentLevel={userLevel} currentLevelXP={displayXP} xpForNextLevel={xpForNextLevel} levelProgress={displayProgress} />
          </View>

          {/* Stats Grid - Beautiful cards */}
          <View style={tw`flex-row gap-3 mb-5`}>
            <StatsCard label="Streak" value={totalStreak} image="streak" subtitle="days" isStreak={true} streakValue={totalStreak} />
            <StatsCard label="Active" value={activeHabits} image="active" subtitle="Quests" />
          </View>

          {/* Daily Challenge */}
          {user?.id && (
            <View style={tw`mb-4`}>
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
            </View>
          )}

          {/* Next Achievement Preview */}
          {nextTitle && <NextAchievement nextTitle={nextTitle} xpToNextLevel={xpToNextLevel} />}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default DashboardHeader;
