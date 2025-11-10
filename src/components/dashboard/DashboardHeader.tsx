// src/components/dashboard/DashboardHeader.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, ImageBackground } from 'react-native';
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
import { HapticFeedback } from '@/utils/haptics';
import { getTodayString } from '@/utils/dateHelpers';
import { Habit } from '@/types';

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
  habits: Habit[];
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
  habits,
}) => {
  const navigation = useNavigation();
  const { user, username } = useAuth();
  const { refreshStats } = useStats();

  // ✅ Memoize greeting to prevent recalculation
  const greeting = useMemo(() => getGreeting(), []);

  // Optimistic update state
  const [optimisticXP, setOptimisticXP] = React.useState(currentLevelXP);
  const [optimisticTotalXP, setOptimisticTotalXP] = React.useState(totalXP);

  const isOptimisticUpdate = React.useRef(false);

  // Update optimistic state when props change
  React.useEffect(() => {
    // Don't overwrite during optimistic updates
    if (isOptimisticUpdate.current) {
      return;
    }

    setOptimisticXP(currentLevelXP);
    setOptimisticTotalXP(totalXP);
  }, [currentLevelXP, totalXP]);

  // ✅ Memoize tier calculation
  const currentTier = useMemo((): AchievementTierName => {
    const title = achievementTitles.find((t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));
    return (title?.tier as AchievementTierName) || 'Novice';
  }, [userLevel]);

  // ✅ Memoize tier theme
  const tierTheme = useMemo(() => getAchievementTierTheme(currentTier), [currentTier]);

  // ✅ Memoize isObsidian check
  const isObsidian = useMemo(() => tierTheme.gemName === 'Obsidian', [tierTheme.gemName]);

  // ✅ Memoize text colors
  const textColors = useMemo(() => {
    // Lighter gems need darker text for contrast
    if (['Crystal', 'Topaz'].includes(tierTheme.gemName)) {
      return {
        primary: '#FFFFFF',
        secondary: '#374151',
        greeting: '#FFFFFF',
        levelBadgeText: '#1F2937',
        xpText: '#374151',
        levelBadgeBg: 'rgba(255, 255, 255, 0.85)',
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
  }, [tierTheme.gemName]);

  // ✅ Stabilize callbacks with useCallback
  const handleAchievementPress = useCallback(() => {
    navigation.navigate('Achievements' as never);
  }, [navigation]);

  const handleXPCollect = async (amount: number) => {
    // ✅ Mark that we're doing an optimistic update
    isOptimisticUpdate.current = true;

    setOptimisticXP((prev) => prev + amount);
    setOptimisticTotalXP((prev) => prev + amount);

    if (onXPCollected) {
      onXPCollected(amount);
    }

    // ✅ After backend updates, allow real data to come through
    setTimeout(async () => {
      if (onStatsRefresh) {
        onStatsRefresh();
      }

      // Re-enable updates after refresh completes
      setTimeout(() => {
        isOptimisticUpdate.current = false;
      }, 500);
    }, 1000);
  };

  const handleLevelUp = useCallback(async () => {
    await refreshStats(true);
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  }, [refreshStats, onStatsRefresh]);

  // ✅ Memoize next title
  const nextTitle = useMemo(() => achievementTitles.find((title) => title.level > userLevel), [userLevel]);

  // ✅ Memoize display calculations
  const { displayXP, displayProgress } = useMemo(() => {
    const xpToShow = optimisticXP > xpForNextLevel ? optimisticXP % xpForNextLevel : optimisticXP;
    const progressPercent = xpForNextLevel > 0 ? (xpToShow / xpForNextLevel) * 100 : 0;

    return {
      displayXP: xpToShow,
      displayProgress: progressPercent,
    };
  }, [optimisticXP, xpForNextLevel]);

  // Dans Dashboard.tsx ou DashboardHeader.tsx

  const calculateTaskStats = (habits: Habit[]) => {
    const today = getTodayString();

    let totalTasks = 0;
    let completedTasks = 0;
    let dailyTasksTotal = 0;
    let dailyTasksCompleted = 0;
    let hasWeekly = false;
    let hasMonthly = false;

    habits.forEach((habit) => {
      const taskCount = habit.tasks?.length || 0;
      const todayData = habit.dailyTasks?.[today];
      const completedCount = todayData?.completedTasks?.length || 0;

      // Compter TOUTES les tâches
      totalTasks += taskCount;
      completedTasks += completedCount;

      // Compter seulement les tâches DAILY
      if (habit.frequency === 'daily') {
        dailyTasksTotal += taskCount;
        dailyTasksCompleted += completedCount;
      }

      // Détecter weekly/monthly
      if (habit.frequency === 'weekly') hasWeekly = true;
      if (habit.frequency === 'monthly') hasMonthly = true;
    });

    return {
      totalTasks,
      completedTasks,
      dailyTasksTotal,
      dailyTasksCompleted,
      hasWeekly,
      hasMonthly,
    };
  };

  // Utilisation
  const taskStats = calculateTaskStats(habits);

  // ✅ Memoize GradientContainer component
  const GradientContainer = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => {
      const textureSource = tierTheme.texture;

      return (
        <LinearGradient
          colors={tierTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: isObsidian ? 2 : 1.5,
            borderColor: isObsidian ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            shadowColor: isObsidian ? '#8b5cf6' : '#000',
            shadowOffset: { width: 0, height: isObsidian ? 12 : 8 },
            shadowOpacity: isObsidian ? 0.6 : 0.3,
            shadowRadius: isObsidian ? 24 : 20,
          }}
        >
          {textureSource ? (
            <ImageBackground source={textureSource} resizeMode="cover" imageStyle={{ opacity: 0.2 }}>
              {/* Epic purple glow overlay for Obsidian */}
              {isObsidian && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  }}
                />
              )}
              {/* Dark overlay for depth */}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isObsidian ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                }}
              />
              {children}
            </ImageBackground>
          ) : (
            <View>
              {/* Fallback: No texture, just dark overlay */}
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
              {children}
            </View>
          )}
        </LinearGradient>
      );
    };
  }, [tierTheme.gradient, tierTheme.texture, isObsidian]);

  return (
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 4 }}>
      <GradientContainer>
        <View style={{ padding: 16, paddingBottom: 0 }}>
          {/* Greeting and Level Section */}
          <View style={{ marginBottom: 16 }}>
            {/* Greeting with username */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: 2,
                textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: isObsidian ? 8 : 4,
                marginBottom: 2,
              }}
            >
              {greeting.toUpperCase()}
              {username && `, ${username.toUpperCase()}`}
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
                {/* Title */}
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 30,
                    textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: isObsidian ? 12 : 8,
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
                  {/* Level Badge - Consistent white style */}
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: '#FFFFFF',
                        letterSpacing: 0.5,
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
                      }}
                    >
                      LEVEL {userLevel}
                    </Text>
                  </View>

                  {/* Total XP Display - Consistent white style */}
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: 16,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: '#FFFFFF',
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 3,
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
                <AchievementBadge
                  achievement={currentAchievement}
                  onPress={() => {
                    HapticFeedback.light();
                    handleAchievementPress();
                  }}
                  tierTheme={tierTheme}
                  size={70}
                />
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

          {/* Stats Grid */}
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
                habits={habits}
              />
            </View>
          )}
        </View>
      </GradientContainer>
    </Animated.View>
  );
};

export default React.memo(DashboardHeader);
