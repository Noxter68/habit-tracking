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
  const { user, username } = useAuth();
  const { refreshStats, updateStatsOptimistically } = useStats();
  const greeting = getGreeting();

  // Get tier theme based on current level
  const getCurrentTier = (): AchievementTierName => {
    const title = achievementTitles.find((t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));

    return (title?.tier as AchievementTierName) || 'Novice';
  };

  const currentTier = getCurrentTier();
  const tierTheme = getAchievementTierTheme(currentTier);

  // Create light variants for the background gradient
  const getLightGradient = () => {
    const baseColors = tierTheme.gradient;
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
    console.log('DashboardHeader: XP collected, updating optimistically', { amount });

    // ✅ Update stats optimistically (instant UI update, no backend call)
    const result = updateStatsOptimistically(amount);

    // Notify parent if needed (optional)
    if (onXPCollected) {
      onXPCollected(amount);
    }

    // ✅ NO REFRESH! Let optimistic update handle everything
    // The backend already updated via XPService.collectDailyChallenge()
    // If you need eventual consistency, do it much later (5+ seconds)

    // Handle level up if it occurred
    if (result?.leveledUp) {
      console.log('DashboardHeader: Level up detected!', { newLevel: result.newLevel });

      // Small delay to let the XP animation finish
      setTimeout(() => {
        if (onStatsRefresh) {
          onStatsRefresh();
        }
      }, 1500);
    }
  };

  const handleLevelUp = async () => {
    console.log('DashboardHeader: Level up callback triggered');

    // No immediate refresh needed since we updated optimistically
    // Just notify parent for any additional actions (like showing level-up modal)
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  };
  console.log('USER DATA', user);
  const nextTitle = achievementTitles.find((title) => title.level > userLevel);
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  const displayXP = currentLevelXP > xpForNextLevel ? currentLevelXP % xpForNextLevel : currentLevelXP;
  const displayProgress = xpForNextLevel > 0 ? Math.min((displayXP / xpForNextLevel) * 100, 100) : 0;

  return (
    <Animated.View entering={FadeIn} style={{ marginBottom: 20 }}>
      <LinearGradient
        colors={getLightGradient()}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View>
          {/* Greeting */}
          <View style={{ marginBottom: 20 }}>
            {/* Greeting */}
            <Text
              style={{
                fontSize: 18,
                color: '#64748B',
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                textShadowColor: 'rgba(0, 0, 0, 0.08)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}
            >
              {greeting}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                {/* Username with Tier Indicator */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: tierTheme.accent,
                      shadowColor: tierTheme.accent,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.4,
                      shadowRadius: 4,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#0F172A',
                      letterSpacing: 0.2,
                    }}
                  >
                    {username}
                  </Text>
                </View>

                {/* Title */}
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '900',
                    color: '#0A0A0A',
                    letterSpacing: -0.5,
                    lineHeight: 30,
                  }}
                >
                  {userTitle}
                </Text>
              </View>

              {/* Achievement Badge */}
              <View style={{ marginLeft: 16 }}>
                <AchievementBadge achievement={currentAchievement} onPress={handleAchievementPress} tierTheme={tierTheme} size={80} />
              </View>
            </View>
          </View>

          {/* Level Progress Bar - Only show if level < 30 */}
          {userLevel < 30 && (
            <View style={{ marginBottom: 20 }}>
              <LevelProgress currentLevel={userLevel} currentLevelXP={displayXP} xpForNextLevel={xpForNextLevel} levelProgress={displayProgress} tierTheme={tierTheme} />
            </View>
          )}

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <StatsCard label="Streak" value={totalStreak} image="streak" subtitle="days" isStreak={true} streakValue={totalStreak} tierTheme={tierTheme} />
            <StatsCard label="Active" value={activeHabits} image="active" subtitle="Quests" tierTheme={tierTheme} />
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
