// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat, Easing, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { XPService, getProgressiveXPReward } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { getTodayString, isWeeklyHabitCompletedThisWeek, getWeeklyCompletedTasksCount } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';
import { Config } from '@/config';
import { Habit } from '@/types';
import FloatingXP from './FloatingXp';

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
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ habits, onCollect, userId, userLevel, currentLevelXP, xpForNextLevel, onLevelUp, tierTheme }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXPBadge, setShowXPBadge] = useState(false);
  const [collectedXP, setCollectedXP] = useState(0);
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

      if (habit.frequency === 'daily') {
        dailyTasksTotal += taskCount;
        dailyTasksCompleted += completedCount;
      } else if (habit.frequency === 'weekly') {
        weeklyTasksTotal += taskCount;

        // Utilise la fonction centralisée qui utilise les semaines calendaires (lundi-dimanche)
        if (isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt)) {
          // Weekly complétée cette semaine → compte toutes les tâches
          weeklyTasksCompletedThisWeek += taskCount;
        } else {
          // Weekly en cours → compte les tâches uniques complétées cette semaine
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

  const scale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const badgeTranslateY = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);
  const breatheScale = useSharedValue(1);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheScale.value }, { translateY: cardTranslateY.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeTranslateY.value }],
    opacity: badgeOpacity.value,
  }));

  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;
  const accentColor = theme.accent;
  const progressColor = `${accentColor}E6`;

  useEffect(() => {
    if (canClaimChallenge && !isCollected) {
      const animate = () => {
        'worklet';
        breatheScale.value = withRepeat(
          withTiming(1.015, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true
        );
      };
      animate();
    } else {
      cancelAnimation(breatheScale);
      breatheScale.value = withTiming(1.0, { duration: 300 });
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

  const hideBadge = () => {
    setShowXPBadge(false);
  };

  const handleCollect = async () => {
    if (!canClaimChallenge || isCollected || isAnimating) return;

    setIsAnimating(true);

    scale.value = withSequence(withTiming(0.95, { duration: 100 }), withSpring(1, { damping: 12, stiffness: 300 }));

    cardTranslateY.value = withSequence(withTiming(-8, { duration: 100, easing: Easing.out(Easing.ease) }), withSpring(0, { damping: 10, stiffness: 350 }));

    try {
      const result = await XPService.collectDailyChallenge(userId, userLevel);

      if (result.success) {
        setIsCollected(true);
        setShowXPBadge(true);
        setCollectedXP(result.xpEarned);

        badgeTranslateY.value = 0;
        badgeOpacity.value = 0;

        badgeOpacity.value = withTiming(1, { duration: 200 });
        badgeTranslateY.value = withSequence(
          withTiming(-50, { duration: 1200, easing: Easing.out(Easing.cubic) }),
          withTiming(-50, { duration: 0 }, (finished) => {
            if (finished) {
              runOnJS(hideBadge)();
            }
          })
        );

        badgeOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(1, { duration: 600 }), withTiming(0, { duration: 400 }));

        setTimeout(() => {
          onCollect(result.xpEarned);

          if (currentLevelXP + result.xpEarned >= xpForNextLevel && onLevelUp) {
            setTimeout(() => {
              onLevelUp();
            }, 100);
          }
        }, 300);
      }
    } catch (error) {
      Logger.error('Error collecting daily challenge:', error);
    } finally {
      setTimeout(() => {
        setIsAnimating(false);
      }, 1300);
    }
  };

  const handleDebugReset = async () => {
    try {
      const today = getTodayString();
      const { error } = await supabase
        .from('daily_challenges')
        .update({
          xp_collected: false,
          collected_at: null,
        })
        .eq('user_id', userId)
        .eq('date', today);

      if (!error) {
        setIsCollected(false);
        Logger.debug('✅ Debug: Daily challenge reset');
      }
    } catch (error) {
      Logger.error('❌ Error resetting daily challenge:', error);
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

  return (
    <View>
      <View style={{ position: 'relative' }}>
        {showXPBadge && (
          <Animated.View style={badgeAnimatedStyle}>
            <FloatingXP show={showXPBadge} amount={collectedXP || xpReward} accentColor={accentColor} texture={tierTheme?.texture} onComplete={hideBadge} />
          </Animated.View>
        )}

        <View
          style={{
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
            borderRadius: 16,
          }}
        >
          <Pressable onPress={handleCollect} disabled={!canClaimChallenge || isCollected || isAnimating}>
            <Animated.View style={[animatedButtonStyle, cardAnimatedStyle]}>
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 16,
                  padding: 12,
                  paddingBottom: 10,
                  borderWidth: 1,
                  borderColor: canClaimChallenge && !isCollected ? `${accentColor}66` : 'rgba(255, 255, 255, 0.2)',
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
                  <View
                    style={{
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        height: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      <LinearGradient
                        colors={canClaimChallenge ? [progressColor, `${accentColor}B3`] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.75)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          width: `${Math.min(completionPercentage, 100)}%`,
                          height: '100%',
                          borderRadius: 8,
                          shadowColor: canClaimChallenge ? accentColor : '#FFFFFF',
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
            </Animated.View>
          </Pressable>
        </View>

        {Config.debug.showTestButtons && isCollected && (
          <Pressable
            onPress={handleDebugReset}
            style={{
              marginTop: 8,
              backgroundColor: '#DC2626',
              borderRadius: 12,
              padding: 8,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 11,
                textAlign: 'center',
                fontWeight: '700',
              }}
            >
              {t('dashboard.dailyChallenge.debugReset')}
            </Text>
          </Pressable>
        )}
      </View>

      {infoMessage && !isCollected && (
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
