// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
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
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 16 }}>
      {/* Beautiful Amethyst gradient background */}
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE', '#FAF9F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          shadowColor: '#9333EA',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        }}
      >
        {/* Content Container */}
        <View style={{ padding: 24 }}>
          {/* Greeting and Level Section */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#9333EA', letterSpacing: 2 }}>{greeting.toUpperCase()}</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <View style={{ flex: 1, paddingRight: 80 }}>
                {/* User Title */}
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#1F2937', lineHeight: 32 }}>{userTitle}</Text>

                {/* Level & XP badges */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  {/* Level Badge - Amethyst */}
                  <LinearGradient
                    colors={['#9333EA', '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      shadowColor: '#9333EA',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>LEVEL {userLevel}</Text>
                  </LinearGradient>

                  {/* Total XP Display - Crystal Accent */}
                  <View
                    style={{
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(6, 182, 212, 0.2)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0891B2' }}>{totalXP.toLocaleString()} XP</Text>
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
          <View style={{ marginBottom: 20 }}>
            <LevelProgress currentLevel={userLevel} currentLevelXP={displayXP} xpForNextLevel={xpForNextLevel} levelProgress={displayProgress} />
          </View>

          {/* Stats Grid - Beautiful cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <StatsCard label="Streak" value={totalStreak} image="streak" subtitle="days" isStreak={true} streakValue={totalStreak} />
            <StatsCard label="Active" value={activeHabits} image="active" subtitle="Quests" />
          </View>

          {/* Daily Challenge */}
          {user?.id && (
            <View style={{ marginBottom: 16 }}>
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
