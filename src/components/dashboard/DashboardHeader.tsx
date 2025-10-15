// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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
import { getAchievementTierTheme } from '@/utils/tierTheme';
import type { AchievementTierName } from '@/utils/tierTheme';

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

  // Get tier theme based on current level
  const getCurrentTier = (): AchievementTierName => {
    const title = achievementTitles.find((t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));

    // FIX: Use title.tier instead of title.name
    return (title?.tier as AchievementTierName) || 'Novice';
  };

  const currentTier = getCurrentTier();
  const tierTheme = getAchievementTierTheme(currentTier);

  // Create light variants for the background gradient
  const getLightGradient = () => {
    const baseColors = tierTheme.gradient;
    // Convert hex to lighter tints for background
    return [
      `${baseColors[0]}15`, // 15% opacity of primary
      `${baseColors[1]}10`, // 10% opacity of secondary
      '#FAF9F7', // Warm white base
    ];
  };

  const handleAchievementPress = () => {
    navigation.navigate('Achievements' as never);
  };

  const handleXPCollect = async (amount: number) => {
    if (onXPCollected) {
      onXPCollected(amount);
    }

    setTimeout(async () => {
      await refreshStats(true);
      if (onStatsRefresh) {
        onStatsRefresh();
      }
    }, 200);
  };

  const handleLevelUp = async () => {
    await refreshStats(true);
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  };

  const nextTitle = achievementTitles.find((title) => title.level > userLevel);
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  const displayXP = currentLevelXP > xpForNextLevel ? currentLevelXP % xpForNextLevel : currentLevelXP;
  const displayProgress = xpForNextLevel > 0 ? (displayXP / xpForNextLevel) * 100 : 0;

  return (
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 16 }}>
      <LinearGradient
        colors={getLightGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: `${tierTheme.accent}20`,
          shadowColor: tierTheme.accent,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        }}
      >
        <View style={{ padding: 24, paddingBottom: 0 }}>
          {/* Greeting and Level Section */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: tierTheme.accent,
                letterSpacing: 2,
              }}
            >
              {greeting.toUpperCase()}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
              }}
            >
              <View style={{ flex: 1, paddingRight: 80 }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: '#1F2937',
                    lineHeight: 32,
                  }}
                >
                  {userTitle}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {/* Level Badge - Tier colored */}
                  <LinearGradient
                    colors={tierTheme.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      shadowColor: tierTheme.accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: '#FFFFFF',
                        letterSpacing: 0.5,
                      }}
                    >
                      LEVEL {userLevel}
                    </Text>
                  </LinearGradient>

                  {/* Total XP Display */}
                  <View
                    style={{
                      backgroundColor: `${tierTheme.accent}15`,
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: `${tierTheme.accent}30`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: tierTheme.accent,
                      }}
                    >
                      {totalXP.toLocaleString()} XP
                    </Text>
                  </View>
                </View>
              </View>

              {/* Achievement Badge */}
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -20, // Moves it higher, overlapping the card edge
                  zIndex: 20,
                }}
              >
                <AchievementBadge
                  achievement={currentAchievement}
                  onPress={handleAchievementPress}
                  tierTheme={tierTheme}
                  size={80} // Make it bigger since there's no border
                />
              </View>
            </View>
          </View>

          {/* Level Progress Bar */}
          <View style={{ marginBottom: 20 }}>
            <LevelProgress currentLevel={userLevel} currentLevelXP={displayXP} xpForNextLevel={xpForNextLevel} levelProgress={displayProgress} tierTheme={tierTheme} />
          </View>

          {/* Stats Grid */}
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
                tierTheme={tierTheme}
              />
            </View>
          )}

          {/* Next Achievement Preview */}
          {/* {nextTitle && <NextAchievement nextTitle={nextTitle} xpToNextLevel={xpToNextLevel} tierTheme={tierTheme} />} */}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default DashboardHeader;
