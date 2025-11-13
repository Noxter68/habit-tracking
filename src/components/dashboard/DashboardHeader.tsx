// src/components/dashboard/DashboardHeader.tsx
import React, { useMemo, useCallback } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

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
import { HapticFeedback } from '@/utils/haptics';
import { getTodayString } from '@/utils/dateHelpers';
import { Habit } from '@/types';
import { TierKey } from '@/types/achievement.types';

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
  const { t, i18n } = useTranslation();

  const greeting = useMemo(() => getGreeting(), [i18n.language]);

  const [optimisticXP, setOptimisticXP] = React.useState(currentLevelXP);
  const [optimisticTotalXP, setOptimisticTotalXP] = React.useState(totalXP);

  const isOptimisticUpdate = React.useRef(false);

  React.useEffect(() => {
    if (isOptimisticUpdate.current) {
      return;
    }

    setOptimisticXP(currentLevelXP);
    setOptimisticTotalXP(totalXP);
  }, [currentLevelXP, totalXP]);

  // ✅ FIX: Use tierKey instead of tier for theme lookup
  const currentTierKey = useMemo((): TierKey => {
    const title = achievementTitles.find((t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity));
    return (title?.tierKey as TierKey) || 'novice';
  }, [userLevel]);

  const tierTheme = useMemo(() => getAchievementTierTheme(currentTierKey), [currentTierKey]);
  const isObsidian = useMemo(() => tierTheme.gemName === 'Obsidian', [tierTheme.gemName]);

  const textColors = useMemo(() => {
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

  const handleAchievementPress = useCallback(() => {
    navigation.navigate('Achievements' as never);
  }, [navigation]);

  const handleXPCollect = async (amount: number) => {
    isOptimisticUpdate.current = true;

    setOptimisticXP((prev) => prev + amount);
    setOptimisticTotalXP((prev) => prev + amount);

    if (onXPCollected) {
      onXPCollected(amount);
    }

    setTimeout(async () => {
      if (onStatsRefresh) {
        onStatsRefresh();
      }

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

  const nextTitle = useMemo(() => achievementTitles.find((title) => title.level > userLevel), [userLevel]);

  const { displayXP, displayProgress } = useMemo(() => {
    const xpToShow = optimisticXP > xpForNextLevel ? optimisticXP % xpForNextLevel : optimisticXP;
    const progressPercent = xpForNextLevel > 0 ? (xpToShow / xpForNextLevel) * 100 : 0;

    return {
      displayXP: xpToShow,
      displayProgress: progressPercent,
    };
  }, [optimisticXP, xpForNextLevel]);

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

      totalTasks += taskCount;
      completedTasks += completedCount;

      if (habit.frequency === 'daily') {
        dailyTasksTotal += taskCount;
        dailyTasksCompleted += completedCount;
      }

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

  const taskStats = calculateTaskStats(habits);

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
          <View style={{ marginBottom: 16 }}>
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
                      {t('dashboard.header.level').toUpperCase()} {userLevel}
                    </Text>
                  </View>

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
                      {optimisticTotalXP.toLocaleString()} {t('dashboard.header.xpTotal')}
                    </Text>
                  </View>
                </View>
              </View>

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

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <StatsCard
              label={t('dashboard.header.streak')}
              value={totalStreak}
              image="streak"
              subtitle={t('dashboard.header.streakSubtitle')}
              isStreak={true}
              streakValue={totalStreak}
              tierTheme={tierTheme}
              textColor={textColors.secondary}
            />
            <StatsCard
              label={t('dashboard.header.active')}
              value={activeHabits}
              image="active"
              subtitle={t('dashboard.header.activeSubtitle')}
              tierTheme={tierTheme}
              textColor={textColors.secondary}
            />
          </View>

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
