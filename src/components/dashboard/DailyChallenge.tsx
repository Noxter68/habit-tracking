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

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface DailyChallengeProps {
  completedToday: number;
  totalTasksToday: number;
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

  // Glow animation when complete only
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
      console.error('Error checking collection status:', error);
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
      const success = await XPService.collectDailyChallenge(userId);

      if (success) {
        // Update local state immediately
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

        // Call parent callback after animation starts
        setTimeout(() => {
          onCollect(20); // Triggers optimistic update

          // Check level up
          if (currentLevelXP + 20 >= xpForNextLevel && onLevelUp) {
            setTimeout(() => {
              onLevelUp();
            }, 100);
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error collecting daily challenge:', error);
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
        console.log('Debug: Daily challenge reset');
      }
    } catch (error) {
      console.error('Error resetting daily challenge:', error);
    }
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Floating XP Badge */}
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
              backgroundColor: 'rgba(100, 200, 150, 0.95)',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: 'rgba(100, 200, 150, 1)',
              shadowColor: 'rgba(100, 200, 150, 1)',
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

      {/* Glow effect when complete */}
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
              backgroundColor: 'rgba(100, 200, 150, 0.3)',
            },
            animatedGlowStyle,
          ]}
        />
      )}

      <Pressable onPress={handleCollect} disabled={!isComplete || isCollected || isAnimating}>
        <Animated.View style={[animatedButtonStyle, cardAnimatedStyle]}>
          <LinearGradient
            colors={
              isCollected
                ? ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                : isComplete
                ? ['rgba(100, 200, 150, 0.25)', 'rgba(100, 200, 150, 0.15)']
                : ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: isComplete && !isCollected ? 'rgba(100, 200, 150, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Flask Icon - BIGGER (no bounce animation) */}
                <View style={{ width: 36, height: 36 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: 'rgba(100, 200, 150, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(100, 200, 150, 0.25)',
                    }}
                  >
                    {isCollected ? (
                      <CheckCircle2 size={20} color="rgba(150, 220, 180, 0.85)" />
                    ) : isComplete ? (
                      <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    ) : (
                      <Image source={require('../../../assets/interface/challenge.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                    )}
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      letterSpacing: 0.3,
                      textShadowColor: 'rgba(0, 0, 0, 0.2)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    Daily Challenge
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: textColor,
                      opacity: 0.8,
                      marginTop: 1,
                    }}
                  >
                    {isCollected ? 'Collected!' : isComplete ? 'Complete!' : `${totalTasksToday - completedToday} tasks to go`}
                  </Text>
                </View>
              </View>

              {/* XP Reward Badge */}
              <View
                style={{
                  backgroundColor: isComplete && !isCollected ? 'rgba(100, 200, 150, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
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
                  height: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }}
              >
                <LinearGradient
                  colors={isComplete ? ['rgba(100, 200, 150, 0.9)', 'rgba(80, 180, 130, 0.7)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    width: `${Math.min(completionPercentage, 100)}%`,
                    height: '100%',
                    borderRadius: 6,
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
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: textColor,
                  opacity: 0.9,
                }}
              >
                {isCollected ? 'See you tomorrow!' : `${completedToday} / ${totalTasksToday} Quests`}
              </Text>

              {isComplete && !isCollected && (
                <LinearGradient
                  colors={['rgba(100, 200, 150, 0.35)', 'rgba(80, 180, 130, 0.25)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: 'rgba(100, 200, 150, 0.5)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    CLAIM
                  </Text>
                </LinearGradient>
              )}
            </View>
          </LinearGradient>
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
            Reset (Debug)
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default DailyChallenge;
