// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat, Easing, runOnJS, cancelAnimation } from 'react-native-reanimated';
import { XPService } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { getTodayString } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';
import { Config } from '@/config';
import { Habit } from '@/types';
import FloatingXP from './FloatingXp';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface DailyChallengeProps {
  habits: Habit[];
  onCollect: (amount: number) => void;
  userId: string;
  currentLevelXP: number;
  xpForNextLevel: number;
  onLevelUp?: () => void;
  tierTheme?: TierTheme;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ habits, onCollect, userId, currentLevelXP, xpForNextLevel, onLevelUp, tierTheme }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXPBadge, setShowXPBadge] = useState(false);

  // ============================================================================
  // CALCULATE STATS FROM HABITS
  // ============================================================================
  const stats = useMemo(() => {
    const today = getTodayString();

    let dailyTasksTotal = 0;
    let dailyTasksCompleted = 0;
    let weeklyTasksTotal = 0;

    habits.forEach((habit) => {
      const taskCount = habit.tasks?.length || 0;
      const todayData = habit.dailyTasks?.[today];
      const completedCount = todayData?.completedTasks?.length || 0;

      if (habit.frequency === 'daily') {
        dailyTasksTotal += taskCount;
        dailyTasksCompleted += completedCount;
      } else {
        weeklyTasksTotal += taskCount;
      }
    });

    return {
      dailyTasksTotal,
      dailyTasksCompleted,
      weeklyTasksTotal,
      hasDaily: dailyTasksTotal > 0,
      hasWeekly: weeklyTasksTotal > 0,
      hasOnlyDaily: dailyTasksTotal > 0 && weeklyTasksTotal === 0,
    };
  }, [habits]);

  const canClaimChallenge = stats.dailyTasksCompleted >= stats.dailyTasksTotal && stats.dailyTasksTotal > 0;
  const totalTasksToday = stats.dailyTasksTotal + stats.weeklyTasksTotal;
  const completionPercentage = totalTasksToday > 0 ? Math.min(100, Math.round((stats.dailyTasksCompleted / totalTasksToday) * 100)) : 0;

  // ============================================================================
  // ANIMATION VALUES
  // ============================================================================
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

  // ============================================================================
  // THEME
  // ============================================================================
  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;
  const accentColor = theme.accent;
  const progressColor = `${accentColor}E6`;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Breathing animation - Infinite smooth loop
  useEffect(() => {
    if (canClaimChallenge && !isCollected) {
      // Animation infinie avec loop() - pas de jump
      const animate = () => {
        'worklet';
        breatheScale.value = withRepeat(
          withTiming(1.015, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          true // reverse automatique, pas de jump
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

  // Check collection status on mount
  useEffect(() => {
    checkCollectionStatus();
  }, [userId]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

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
      const result = await XPService.collectDailyChallenge(userId);

      if (result.success) {
        setIsCollected(true);
        setShowXPBadge(true);

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

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getProgressText = () => {
    if (isCollected) return 'Collected!';
    if (canClaimChallenge) return 'Ready to Claim!';

    const remaining = stats.dailyTasksTotal - stats.dailyTasksCompleted;
    if (remaining === 1) return '1 daily task to go';
    return `${remaining} daily tasks to go`;
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
            {stats.dailyTasksTotal} {stats.dailyTasksTotal === 1 ? 'Daily Task' : 'Daily Tasks'}
          </Text>
        </View>
      );
    }

    if (stats.hasWeekly) {
      badges.push(
        <View
          key="weekly"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.3)',
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.85)',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {stats.weeklyTasksTotal} {stats.weeklyTasksTotal === 1 ? 'Weekly Task' : 'Weekly Tasks'}
          </Text>
        </View>
      );
    }

    return badges;
  };

  const getInfoMessage = () => {
    if (isCollected || stats.hasOnlyDaily) return null;
    if (stats.hasWeekly) return 'Weekly habits can be completed anytime this week';
    return null;
  };

  const infoMessage = getInfoMessage();

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View>
      <View style={{ position: 'relative' }}>
        {/* Floating XP Badge */}
        {showXPBadge && (
          <Animated.View style={badgeAnimatedStyle}>
            <FloatingXP show={showXPBadge} amount={20} accentColor={accentColor} texture={tierTheme?.texture} onComplete={hideBadge} />
          </Animated.View>
        )}

        {/* Glow effect - REMOVED */}

        {/* Colored Shadow Container */}
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
          {/* Main Card */}
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
                {/* Header */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Icon */}
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
                          {canClaimChallenge ? (
                            <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                          ) : (
                            <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 60, height: 60 }} resizeMode="contain" />
                          )}
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
                        Daily Challenge
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

                  {/* XP Reward Badge */}
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
                      {isCollected ? '✓' : '+20 XP'}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {!isCollected && (
                  <View
                    style={{
                      height: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 6,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                      marginBottom: 6,
                    }}
                  >
                    <LinearGradient
                      colors={canClaimChallenge ? [progressColor, `${accentColor}B3`] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.75)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        width: `${Math.min(completionPercentage, 100)}%`,
                        height: '100%',
                        borderRadius: 6,
                        shadowColor: canClaimChallenge ? accentColor : '#FFFFFF',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                      }}
                    />
                  </View>
                )}

                {/* Task Badges */}
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

        {/* Debug Reset Button */}
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
              🔄 Reset Challenge (Debug)
            </Text>
          </Pressable>
        )}
      </View>

      {/* Info Message */}
      {infoMessage && !isCollected && (
        <View style={{ marginTop: 8, paddingHorizontal: 4 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '500',
              color: '#94a3b8',
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
