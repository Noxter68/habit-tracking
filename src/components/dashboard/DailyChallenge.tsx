// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withRepeat, Easing, cancelAnimation } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { XPService, getProgressiveXPReward } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { getTodayString, isWeeklyHabitCompletedThisWeek, getWeeklyCompletedTasksCount } from '@/utils/dateHelpers';
import { Habit } from '@/types';
import { HapticFeedback } from '@/utils/haptics';
import Logger from '@/utils/logger';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
  texture?: any;
}

interface DailyChallengeProps {
  habits: Habit[];
  onCollect: (amount: number) => void;
  userId: string;
  userLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  onLevelUp?: () => void;
  tierTheme?: TierTheme;
  compact?: boolean;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ habits, onCollect, userId, userLevel, currentLevelXP, xpForNextLevel, onLevelUp, tierTheme, compact = false }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation();

  // Calculate XP reward based on user level
  const xpReward = useMemo(() => getProgressiveXPReward(userLevel), [userLevel]);

  // Get tier-based challenge image
  const getChallengeImage = () => {
    const gemName = tierTheme?.gemName || 'Amethyst';
    switch (gemName.toLowerCase()) {
      case 'crystal':
        return require('../../../assets/interface/challenge/crystal-challenge.png');
      case 'ruby':
        return require('../../../assets/interface/challenge/ruby-challenge.png');
      case 'amethyst':
        return require('../../../assets/interface/challenge/amethyst-challenge.png');
      case 'jade':
        return require('../../../assets/interface/challenge/jade-challenge.png');
      case 'topaz':
        return require('../../../assets/interface/challenge/topaz-challenge.png');
      case 'obsidian':
        return require('../../../assets/interface/challenge/obsidien-challenge.png');
      case 'inferno':
        return require('../../../assets/interface/challenge/fire-challenge.png');
      default:
        return require('../../../assets/interface/challenge/amethyst-challenge.png');
    }
  };

  const stats = useMemo(() => {
    const today = getTodayString();

    let dailyTasksTotal = 0;
    let dailyTasksCompleted = 0;
    let weeklyTasksTotal = 0;
    let weeklyTasksCompletedThisWeek = 0;

    habits.forEach((habit) => {
      const taskCount = habit.tasks?.length || 0;
      const todayData = habit.dailyTasks?.[today];
      const completedCount = todayData?.completedTasks?.length || 0;

      // Les habitudes daily ET custom sont traitées comme quotidiennes
      if (habit.frequency === 'daily' || habit.frequency === 'custom') {
        dailyTasksTotal += taskCount;
        dailyTasksCompleted += completedCount;
      } else if (habit.frequency === 'weekly') {
        weeklyTasksTotal += taskCount;

        if (isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt)) {
          weeklyTasksCompletedThisWeek += taskCount;
        } else {
          weeklyTasksCompletedThisWeek += getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
        }
      }
    });

    return {
      dailyTasksTotal,
      dailyTasksCompleted,
      weeklyTasksTotal,
      weeklyTasksCompletedThisWeek,
      hasDaily: dailyTasksTotal > 0,
      hasWeekly: weeklyTasksTotal > 0,
      hasOnlyDaily: dailyTasksTotal > 0 && weeklyTasksTotal === 0,
    };
  }, [habits]);

  // Pour réclamer le défi :
  // - Toutes les tâches daily doivent être complétées aujourd'hui
  // - Les weekly ne bloquent PAS le claim (elles sont optionnelles)
  // - Il faut avoir au moins une tâche daily
  const canClaimChallenge = stats.dailyTasksCompleted >= stats.dailyTasksTotal && stats.dailyTasksTotal > 0;

  // ProgressBar basée UNIQUEMENT sur les daily (ignore les weekly)
  const completionPercentage = stats.dailyTasksTotal > 0
    ? Math.min(100, Math.round((stats.dailyTasksCompleted / stats.dailyTasksTotal) * 100))
    : 0;

  // Duolingo-style press effect
  const pressed = useSharedValue(0);
  const breatheScale = useSharedValue(1);

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  // Combined animation: breathe + press effect on the same container
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breatheScale.value },
      { translateY: pressed.value * 4 }, // Push down effect when pressed
    ],
  }));

  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;
  const accentColor = theme.accent;

  useEffect(() => {
    if (canClaimChallenge && !isCollected) {
      // Infinite breathing animation when ready to claim
      breatheScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite
        true
      );
    } else {
      cancelAnimation(breatheScale);
      breatheScale.value = 1.0;
    }

    return () => {
      cancelAnimation(breatheScale);
    };
  }, [canClaimChallenge, isCollected]);

  useEffect(() => {
    checkCollectionStatus();
  }, [userId]);

  const checkCollectionStatus = async () => {
    try {
      const today = getTodayString();
      const { data, error } = await supabase.from('daily_challenges').select('xp_collected').eq('user_id', userId).eq('date', today).single();

      if (!error && data) {
        setIsCollected(data.xp_collected || false);
      } else {
        setIsCollected(false);
      }
    } catch (error) {
      Logger.error('Error checking collection status:', error);
      setIsCollected(false);
    }
  };

  const handleCollect = async () => {
    if (!canClaimChallenge || isCollected || isAnimating) return;

    // Immediate haptic on tap for instant feedback
    HapticFeedback.celebrationBell();
    setIsAnimating(true);

    try {
      const result = await XPService.collectDailyChallenge(userId, userLevel);

      if (result.success) {
        setIsCollected(true);
        onCollect(result.xpEarned);

        if (currentLevelXP + result.xpEarned >= xpForNextLevel && onLevelUp) {
          setTimeout(() => {
            onLevelUp();
          }, 100);
        }
      }
    } catch (error) {
      Logger.error('Error collecting daily challenge:', error);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }
  };

  const getProgressText = () => {
    if (isCollected) return t('dashboard.dailyChallenge.collected');
    if (canClaimChallenge) return t('dashboard.dailyChallenge.readyToClaim');

    // Affiche uniquement les tâches daily restantes (les weekly ne bloquent pas le claim)
    const dailyRemaining = stats.dailyTasksTotal - stats.dailyTasksCompleted;
    return t('dashboard.dailyChallenge.tasksRemaining', { count: dailyRemaining });
  };

  const renderTaskBadges = () => {
    const badges = [];

    if (stats.hasDaily) {
      badges.push(
        <View
          key="daily"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {t('dashboard.dailyChallenge.dailyTask', { count: stats.dailyTasksTotal })}
          </Text>
        </View>
      );
    }

    if (stats.hasWeekly) {
      badges.push(
        <View
          key="weekly"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {t('dashboard.dailyChallenge.weeklyTask', { count: stats.weeklyTasksTotal })}
          </Text>
        </View>
      );
    }

    return badges;
  };

  const getInfoMessage = () => {
    if (isCollected || stats.hasOnlyDaily) return null;
    if (stats.hasWeekly) return t('dashboard.dailyChallenge.weeklyInfo');
    return null;
  };

  const infoMessage = getInfoMessage();

  // Get gradient colors for compact mode
  const gradientColors = (theme.gradient as [string, string, ...string[]]) || ['#9333EA', '#7C3AED', '#6D28D9'];

  // Card inner content
  const cardInnerContent = (
    <View
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: compact ? 0 : 16,
        padding: 12,
        paddingBottom: 10,
        borderWidth: compact ? 0 : 1,
        borderBottomWidth: canClaimChallenge && !isCollected && !compact ? 4 : compact ? 0 : 1,
        borderColor: canClaimChallenge && !isCollected ? `${accentColor}66` : 'rgba(255, 255, 255, 0.2)',
        borderBottomColor: canClaimChallenge && !isCollected ? `${accentColor}99` : 'rgba(255, 255, 255, 0.2)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 38, height: 38 }}>
            {isCollected ? (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                <CheckCircle2 size={22} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: `${accentColor}26`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: `${accentColor}40`,
                }}
              >
                <Image source={getChallengeImage()} style={{ width: 45, height: 45 }} resizeMode="contain" />
              </View>
            )}
          </View>

          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#FFFFFF',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginBottom: 2,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {t('dashboard.dailyChallenge.title')}
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '700',
                color: '#FFFFFF',
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {getProgressText()}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: '#FFFFFF',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {isCollected ? '✓' : t('dashboard.dailyChallenge.xpReward', { amount: xpReward })}
          </Text>
        </View>
      </View>

      {!isCollected && (
        <View style={{ marginBottom: 6 }}>
          <View
            style={{
              height: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 5,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${Math.min(completionPercentage, 100)}%`,
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 5,
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
              }}
            />
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
        }}
      >
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>{renderTaskBadges()}</View>
      </View>
    </View>
  );

  return (
    <View>
      <View style={{ position: 'relative' }}>
        <Pressable
          onPress={handleCollect}
          onPressIn={canClaimChallenge && !isCollected ? handlePressIn : undefined}
          onPressOut={canClaimChallenge && !isCollected ? handlePressOut : undefined}
          disabled={!canClaimChallenge || isCollected || isAnimating}
        >
          <Animated.View
            style={[
              {
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
                borderRadius: 16,
                overflow: 'hidden',
              },
              cardAnimatedStyle,
            ]}
          >
            {compact ? (
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16 }}
              >
                {cardInnerContent}
              </LinearGradient>
            ) : (
              cardInnerContent
            )}
          </Animated.View>
        </Pressable>

      </View>

      {infoMessage && !isCollected && !compact && (
        <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: '#FFFFFF',
              textAlign: 'center',
              lineHeight: 15,
            }}
          >
            {infoMessage}
          </Text>
        </View>
      )}
    </View>
  );
};

export default DailyChallenge;
