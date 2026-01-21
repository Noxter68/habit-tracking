/**
 * StatsBar.tsx
 *
 * Fixed stats bar at the top of the dashboard displaying:
 * - Level (clickable to navigate to Achievements)
 * - Streak
 * - Streak Savers
 * - XP Boost indicator (when active)
 * - Streak Alert icon (when habits need saving)
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, Image, ImageBackground, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, AlertTriangle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

import { useSubscription } from '@/context/SubscriptionContext';
import { useInventory } from '@/context/InventoryContext';
import { HapticFeedback } from '@/utils/haptics';
import { getAchievementByLevel } from '@/utils/achievements';

// Amethyst theme colors
const AMETHYST_GRADIENT: [string, string, string] = ['#8b5cf6', '#7c3aed', '#6d28d9'];
const AMETHYST_SHADOW = '#5b21b6';

// ============================================================================
// ANIMATED BUBBLE COMPONENT
// ============================================================================

interface BubbleProps {
  delay: number;
  startX: number;
  size: number;
}

const AnimatedBubble: React.FC<BubbleProps> = ({ delay, startX, size }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const translateY = progress.value * -20;
    let opacity = 0.5;
    if (progress.value < 0.3) {
      opacity = progress.value * 1.67;
    } else if (progress.value > 0.8) {
      opacity = (1 - progress.value) * 2.5;
    }

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 2,
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================================================
// BOOST BADGE WITH BUBBLES
// ============================================================================

const BoostBadge: React.FC = () => {
  return (
    <View style={styles.boostBadgeContainer}>
      <LinearGradient
        colors={AMETHYST_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.boostBadgeGradient}
      >
        {/* Bubbles */}
        <View style={styles.bubblesContainer}>
          <AnimatedBubble delay={0} startX={4} size={3} />
          <AnimatedBubble delay={300} startX={12} size={2} />
          <AnimatedBubble delay={600} startX={20} size={3} />
          <AnimatedBubble delay={900} startX={8} size={2} />
        </View>

        {/* Icon */}
        <Image
          source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
          style={styles.boostBadgeIcon}
          resizeMode="contain"
        />
      </LinearGradient>
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StatsBarProps {
  userLevel: number;
  totalStreak: number;
  streaksToSaveCount?: number;
  onStreakAlertPress?: () => void;
  showAchievementBadge?: boolean;
}

const StatsBar: React.FC<StatsBarProps> = ({
  userLevel,
  totalStreak,
  streaksToSaveCount = 0,
  onStreakAlertPress,
  showAchievementBadge = false,
}) => {
  const navigation = useNavigation();
  const { streakSavers } = useSubscription();
  const { activeBoost } = useInventory();

  // Get current achievement badge image based on level
  const currentAchievement = useMemo(() => getAchievementByLevel(userLevel), [userLevel]);

  const handleLevelPress = () => {
    HapticFeedback.light();
    navigation.navigate('Achievements' as never);
  };

  // Check if boost is valid
  const hasActiveBoost = activeBoost && new Date(activeBoost.expires_at) > new Date();

  // Pulsing animation for streak alert
  const alertScale = useSharedValue(1);

  React.useEffect(() => {
    if (streaksToSaveCount > 0) {
      alertScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      alertScale.value = withTiming(1, { duration: 200 });
    }
  }, [streaksToSaveCount]);

  const animatedAlertStyle = useAnimatedStyle(() => ({
    transform: [{ scale: alertScale.value }],
  }));

  const handleAlertPress = () => {
    HapticFeedback.light();
    onStreakAlertPress?.();
  };

  return (
    <View style={styles.container}>
      {/* Shadow layer for depth effect */}
      <View style={styles.shadowLayer} />

      {/* Main bar with gradient and texture */}
      <View style={styles.barContainer}>
        <ImageBackground
          source={require('../../../assets/interface/progressBar/amethyst-texture.png')}
          style={styles.textureBackground}
          imageStyle={styles.textureImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[AMETHYST_GRADIENT[0] + 'cc', AMETHYST_GRADIENT[1] + 'cc', AMETHYST_GRADIENT[2] + 'cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >
            <View style={styles.content}>
              {/* Level */}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LVL</Text>
                <Text style={styles.statValue}>{userLevel}</Text>
              </View>

              {/* Streak */}
              <View style={styles.statItem}>
                <Flame
                  size={20}
                  color="#FFFFFF"
                  strokeWidth={2.5}
                  fill="rgba(255, 255, 255, 0.4)"
                />
                <Text style={styles.statValue}>{totalStreak}</Text>
              </View>

              {/* Streak Savers */}
              <View style={styles.statItem}>
                <Image
                  source={require('../../../assets/interface/streak-saver.png')}
                  style={styles.streakSaverIcon}
                  resizeMode="contain"
                />
                <Text style={styles.statValue}>{streakSavers}</Text>
              </View>

              {/* Streak Alert - when habits need saving */}
              {streaksToSaveCount > 0 && onStreakAlertPress && (
                <Pressable onPress={handleAlertPress}>
                  <Animated.View style={[styles.alertBadge, animatedAlertStyle]}>
                    <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2.5} fill="rgba(255, 255, 255, 0.3)" />
                    <View style={styles.alertCount}>
                      <Text style={styles.alertCountText}>{streaksToSaveCount}</Text>
                    </View>
                  </Animated.View>
                </Pressable>
              )}

              {/* Boost indicator with bubble animation */}
              {hasActiveBoost && <BoostBadge />}

              {/* Achievement Badge - Only shown in compact mode */}
              {showAchievementBadge && (
                <Pressable onPress={handleLevelPress} style={styles.achievementButton}>
                  <Image
                    source={currentAchievement?.image}
                    style={styles.achievementBadgeIcon}
                    resizeMode="contain"
                  />
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  shadowLayer: {
    position: 'absolute',
    top: 3,
    left: 0,
    right: 0,
    bottom: -3,
    backgroundColor: AMETHYST_SHADOW,
    borderRadius: 16,
  },
  barContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  textureBackground: {
    width: '100%',
  },
  textureImage: {
    opacity: 0.85,
  },
  gradient: {
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  streakSaverIcon: {
    width: 22,
    height: 22,
  },
  alertBadge: {
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    padding: 8,
    position: 'relative',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  alertCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alertCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7c3aed',
  },
  boostBadgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  boostBadgeGradient: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 10,
  },
  boostBadgeIcon: {
    width: 20,
    height: 20,
  },
  achievementButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  achievementBadgeIcon: {
    width: 22,
    height: 22,
  },
});

export default React.memo(StatsBar);
