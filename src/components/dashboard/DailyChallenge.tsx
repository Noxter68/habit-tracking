// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2 } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, Easing, runOnJS } from 'react-native-reanimated';
import { XPService } from '../../services/xpService';
import { supabase } from '../../lib/supabase';
import { useDebugMode } from '@/hooks/useDebugMode';
import { getTodayString } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface DailyChallengeProps {
  completedToday: number; // ✅ Now represents completed HABITS
  totalTasksToday: number; // ✅ Now represents total HABITS
  onCollect: (amount: number) => void;
  userId: string;
  currentLevelXP: number;
  xpForNextLevel: number;
  onLevelUp?: () => void;
  debugMode?: boolean;
  tierTheme?: TierTheme;
  textColor?: string;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({
  completedToday,
  totalTasksToday,
  onCollect,
  userId,
  currentLevelXP,
  xpForNextLevel,
  onLevelUp,
  debugMode = false,
  tierTheme,
  textColor = 'rgba(255, 255, 255, 0.95)',
}) => {
  const [isCollected, setIsCollected] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXPBadge, setShowXPBadge] = useState(false);

  // ✅ UPDATED: A habit is complete when ALL its tasks are done
  const isComplete = completedToday >= totalTasksToday && totalTasksToday > 0;
  const completionPercentage = totalTasksToday > 0 ? Math.min(100, Math.round((completedToday / totalTasksToday) * 100)) : 0;

  const { showTestButtons } = useDebugMode();

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);
  const badgeTranslateY = useSharedValue(0);
  const badgeOpacity = useSharedValue(0);

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
  }));

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeTranslateY.value }],
    opacity: badgeOpacity.value,
  }));

  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;

  // Extract accent color with opacity variations
  const accentColor = theme.accent;
  const glowColor = `${accentColor}80`; // 50% opacity
  const progressColor = `${accentColor}E6`; // 90% opacity

  // Glow animation when complete - using tier accent color
  React.useEffect(() => {
    if (isComplete && !isCollected) {
      glowOpacity.value = withTiming(0.6, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isComplete, isCollected]);

  // Check collection status from DATABASE
  useEffect(() => {
    checkCollectionStatus();
  }, [userId, completedToday, totalTasksToday]);

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
    if (!isComplete || isCollected || isAnimating) return;

    setIsAnimating(true);

    // Quick bouncy bubble effect on card
    cardScale.value = withSequence(
      withTiming(1.02, { duration: 60, easing: Easing.out(Easing.ease) }),
      withSpring(0.98, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );

    cardTranslateY.value = withSequence(withTiming(-5, { duration: 75, easing: Easing.out(Easing.ease) }), withSpring(0, { damping: 10, stiffness: 350 }));

    try {
      const result = await XPService.collectDailyChallenge(userId);

      if (result.success) {
        setIsCollected(true);
        setShowXPBadge(true);

        // XP Badge float up animation
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

  // ✅ UPDATED: Dynamic text based on habits remaining
  const getProgressText = () => {
    if (isCollected) return 'Collected!';
    if (isComplete) return 'Perfect Day!';

    const remaining = totalTasksToday - completedToday;
    if (remaining === 1) return '1 habit to go';
    return `${remaining} habits to go`;
  };

  // ✅ UPDATED: Show habits count
  const getCountText = () => {
    if (isCollected) return 'See you tomorrow!';

    // Use "habit" for singular, "habits" for plural
    if (totalTasksToday === 1) {
      return `${completedToday} / ${totalTasksToday} habit`;
    }
    return `${completedToday} / ${totalTasksToday} habits`;
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Floating XP Badge - using tier accent color */}
      {showXPBadge && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginLeft: -40,
              marginTop: -20,
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${accentColor}F2`, // 95% opacity
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: accentColor,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 12,
              elevation: 10,
            },
            badgeAnimatedStyle,
          ]}
        >
          <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 22, height: 22, marginRight: 8 }} resizeMode="contain" />
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: '800',
              textShadowColor: 'rgba(0, 0, 0, 0.3)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2,
            }}
          >
            +20 XP
          </Text>
        </Animated.View>
      )}

      {/* Glow effect when complete - using tier accent color */}
      {isComplete && !isCollected && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -4,
              left: -4,
              right: -4,
              bottom: -4,
              borderRadius: 22,
              backgroundColor: `${accentColor}4D`, // 30% opacity
            },
            animatedGlowStyle,
          ]}
        />
      )}

      <Pressable onPress={handleCollect} disabled={!isComplete || isCollected || isAnimating}>
        <Animated.View style={[animatedButtonStyle, cardAnimatedStyle]}>
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 16,
              padding: 12,
              paddingBottom: 10,
              borderWidth: 1,
              borderColor: isComplete && !isCollected ? `${accentColor}66` : 'rgba(255, 255, 255, 0.2)', // 40% opacity for complete
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
                {/* Flask Icon - themed with tier accent */}
                <View style={{ width: 38, height: 38 }}>
                  {isCollected ? (
                    // ✅ FIXED: White opaque background with white border when collected
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
                        backgroundColor: `${accentColor}26`, // 15% opacity
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: `${accentColor}40`, // 25% opacity
                      }}
                    >
                      {isComplete ? (
                        <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                      ) : (
                        <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
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

            {/* Progress Bar - themed with tier accent */}
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
                  colors={isComplete ? [progressColor, `${accentColor}B3`] : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.75)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: `${Math.min(completionPercentage, 100)}%`,
                    height: '100%',
                    borderRadius: 6,
                    shadowColor: isComplete ? accentColor : '#FFFFFF',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }}
                />
              </View>
            )}

            {/* Progress Text & Button */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 6,
              }}
            >
              {/* Habit count badge - matching XP badge style */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
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
                  {getCountText()}
                </Text>
              </View>

              {isComplete && !isCollected && (
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    paddingHorizontal: 12,
                    paddingVertical: 4,
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
                      letterSpacing: 0.6,
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                    }}
                  >
                    CLAIM
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {/* Debug Reset Button */}
      {showTestButtons && isCollected && (
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
  );
};

export default DailyChallenge;
