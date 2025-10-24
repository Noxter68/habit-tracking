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

  // Optimistic update state
  const [optimisticXP, setOptimisticXP] = React.useState(currentLevelXP);
  const [optimisticTotalXP, setOptimisticTotalXP] = React.useState(totalXP);

  // Update optimistic state when props change
  React.useEffect(() => {
    setOptimisticXP(currentLevelXP);
    setOptimisticTotalXP(totalXP);
  }, [currentLevelXP, totalXP]);

  // Get tier theme based on current level
  const getCurrentTier = (): AchievementTierName => {
    const title = achievementTitles.find((t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));
    return (title?.tier as AchievementTierName) || 'Novice';
  };

  const currentTier = getCurrentTier();
  const tierTheme = getAchievementTierTheme(currentTier);

  // Determine text colors based on gem type (matching CurrentLevelHero logic)
  const getTextColors = (gemName: string) => {
    // Lighter gems need darker text for contrast
    if (['Crystal', 'Topaz'].includes(gemName)) {
      return {
        primary: '#FFFFFF', // White title for all
        secondary: '#374151', // stone-700
        greeting: '#FFFFFF', // White greeting for all
        levelBadgeText: '#1F2937', // Dark text on light badge
        xpText: '#374151', // Dark text
        levelBadgeBg: 'rgba(255, 255, 255, 0.85)', // More opaque for better contrast
        xpBadgeBg: 'rgba(255, 255, 255, 0.75)',
      };
    }

    // Darker gems need lighter text
    return {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.95)',
      greeting: '#FFFFFF',
      levelBadgeText: '#FFFFFF',
      xpText: '#FFFFFF',
      levelBadgeBg: 'rgba(255, 255, 255, 0.3)',
      xpBadgeBg: 'rgba(255, 255, 255, 0.25)',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  const handleAchievementPress = () => {
    navigation.navigate('Achievements' as never);
  };

  const handleXPCollect = async (amount: number) => {
    // Optimistic update - update UI immediately
    setOptimisticXP((prev) => prev + amount);
    setOptimisticTotalXP((prev) => prev + amount);

    // Call parent callback if provided
    if (onXPCollected) {
      onXPCollected(amount);
    }

    // Background refresh without blocking UI (delayed to avoid race condition)
    setTimeout(async () => {
      // await refreshStats(true);
      if (onStatsRefresh) {
        onStatsRefresh();
      }
    }, 1000); // Increased delay to ensure DB is updated
  };

  const handleLevelUp = async () => {
    // For level up, we do need to refresh to get new level data
    await refreshStats(true);
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  };

  const nextTitle = achievementTitles.find((title) => title.level > userLevel);
  const xpToNextLevel = xpForNextLevel - optimisticXP;

  const displayXP = optimisticXP > xpForNextLevel ? optimisticXP % xpForNextLevel : optimisticXP;
  const displayProgress = xpForNextLevel > 0 ? (displayXP / xpForNextLevel) * 100 : 0;

  return (
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 16 }}>
      <LinearGradient
        colors={tierTheme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }}
      >
        {/* Subtle texture overlay for depth */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          }}
        />

        <View style={{ padding: 20, paddingBottom: 0 }}>
          {/* Greeting and Level Section */}
          <View style={{ marginBottom: 16 }}>
            {/* Greeting with username - Always white with strong shadow */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: 2,
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                marginBottom: 2,
              }}
            >
              {greeting.toUpperCase()}
              {user?.username && `, ${user.username.toUpperCase()}`}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 6,
              }}
            >
              <View style={{ flex: 1, paddingRight: 75 }}>
                {/* Title - Always white with strong shadow */}
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 30,
                    textShadowColor: 'rgba(0, 0, 0, 0.6)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 8,
                  }}
                >
                  {userTitle}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {/* Level Badge - Dynamic background based on gem type */}
                  <LinearGradient
                    colors={[textColors.levelBadgeBg, textColors.levelBadgeBg]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: textColors.levelBadgeText === '#1F2937' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.4)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: textColors.levelBadgeText,
                        letterSpacing: 0.5,
                        textShadowColor: textColors.levelBadgeText === '#FFFFFF' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      LEVEL {userLevel}
                    </Text>
                  </LinearGradient>

                  {/* Total XP Display */}
                  <View
                    style={{
                      backgroundColor: textColors.xpBadgeBg,
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: textColors.xpText === '#374151' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.3)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: textColors.xpText,
                        textShadowColor: textColors.xpText === '#FFFFFF' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      }}
                    >
                      {optimisticTotalXP.toLocaleString()} XP
                    </Text>
                  </View>
                </View>
              </View>

              {/* Achievement Badge */}
              <View
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -16,
                  zIndex: 20,
                }}
              >
                <AchievementBadge achievement={currentAchievement} onPress={handleAchievementPress} tierTheme={tierTheme} size={70} />
              </View>
            </View>
          </View>

          {/* Level Progress Bar - Only show if level < 30 */}
          {userLevel < 30 && (
            <View style={{ marginBottom: 16 }}>
              <LevelProgress
                currentLevel={userLevel}
                currentLevelXP={displayXP}
                xpForNextLevel={xpForNextLevel}
                levelProgress={displayProgress}
                tierTheme={tierTheme}
                textColor={textColors.secondary}
              />
            </View>
          )}

          {/* Stats Grid - NOW WITH DARKER THEME */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <StatsCard label="Streak" value={totalStreak} image="streak" subtitle="days" isStreak={true} streakValue={totalStreak} tierTheme={tierTheme} textColor={textColors.secondary} />
            <StatsCard label="Active" value={activeHabits} image="active" subtitle="Quests" tierTheme={tierTheme} textColor={textColors.secondary} />
          </View>

          {/* Daily Challenge */}
          {user?.id && (
            <View style={{ marginBottom: 12 }}>
              <DailyChallenge
                completedToday={completedTasksToday}
                totalTasksToday={totalTasksToday}
                onCollect={handleXPCollect}
                userId={user.id}
                currentLevelXP={optimisticXP}
                xpForNextLevel={xpForNextLevel}
                onLevelUp={handleLevelUp}
                debugMode={__DEV__}
                tierTheme={tierTheme}
                textColor={textColors.secondary}
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default DashboardHeader;
