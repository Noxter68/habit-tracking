/**
 * StatsBar.tsx
 *
 * Fixed stats bar at the top of the dashboard displaying:
 * - Level (clickable to navigate to Achievements)
 * - Streak
 * - Streak Savers
 * - XP Boost indicator (when active)
 * - Streak Alert icon (when habits need saving)
 *
 * Uses dynamic tier theme based on user level.
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, Image, ImageBackground, Pressable, StyleSheet } from 'react-native';
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
import { getAchievementByLevel, achievementTitles } from '@/utils/achievements';
import { getAchievementTierTheme } from '@/utils/tierTheme';
import { TierKey } from '@/types/achievement.types';

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

interface BoostBadgeProps {
  accentColor: string;
  gradient: string[];
}

const BoostBadge: React.FC<BoostBadgeProps> = ({ accentColor, gradient }) => {
  return (
    <View style={[styles.boostBadgeContainer, { shadowColor: accentColor }]}>
      <LinearGradient
        colors={gradient as [string, string, ...string[]]}
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
// HELPER: Get pastel background color from accent
// ============================================================================

const getPastelBackground = (accent: string): string => {
  // Map accent colors to their pastel equivalents for the progress bar background
  const pastelMap: Record<string, string> = {
    '#3b82f6': '#dbeafe', // Blue -> Light blue
    '#dc2626': '#fecaca', // Red -> Light red
    '#7c3aed': '#ddd6fe', // Purple -> Light purple
    '#059669': '#d1fae5', // Green -> Light green
    '#f59e0b': '#fef3c7', // Amber -> Light amber
    '#8b5cf6': '#e9d5ff', // Violet -> Light violet
    '#3f7eea': '#dbeafe', // Celeste -> Light blue
    '#ff4500': '#fed7aa', // Inferno -> Light orange
  };
  return pastelMap[accent] || '#e2e8f0';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface StatsBarProps {
  userLevel: number;
  totalStreak: number;
  levelProgress?: number;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  streaksToSaveCount?: number;
  onStreakAlertPress?: () => void;
  showAchievementBadge?: boolean;
}

const StatsBar: React.FC<StatsBarProps> = ({
  userLevel,
  totalStreak,
  levelProgress = 0,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  streaksToSaveCount = 0,
  onStreakAlertPress,
  showAchievementBadge = false,
}) => {
  const navigation = useNavigation();
  const { streakSavers } = useSubscription();
  const { activeBoost } = useInventory();

  // Get current tier theme based on level
  const currentTierKey = useMemo((): TierKey => {
    const title = achievementTitles.find(
      (t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity)
    );
    return (title?.tierKey as TierKey) || 'novice';
  }, [userLevel]);

  const tierTheme = useMemo(() => getAchievementTierTheme(currentTierKey), [currentTierKey]);

  // Derived colors from tier theme
  const gradientColors = tierTheme.gradient as string[];
  const accentColor = tierTheme.accent;
  const shadowColor = gradientColors[gradientColors.length - 1] || '#1e3a5f';
  const pastelBackground = getPastelBackground(accentColor);

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

  useEffect(() => {
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
      <View style={[styles.shadowLayer, { backgroundColor: shadowColor }]} />

      {/* Main bar with gradient and texture */}
      <View style={styles.barContainer}>
        <ImageBackground
          source={tierTheme.texture}
          style={styles.textureBackground}
          imageStyle={styles.textureImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[
              gradientColors[0] + 'cc',
              gradientColors[1] + 'cc',
              (gradientColors[2] || gradientColors[1]) + 'cc',
            ]}
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
                  <Animated.View style={[styles.alertBadge, { backgroundColor: accentColor, shadowColor: accentColor }, animatedAlertStyle]}>
                    <AlertTriangle size={16} color="#FFFFFF" strokeWidth={2.5} fill="rgba(255, 255, 255, 0.3)" />
                    <View style={styles.alertCount}>
                      <Text style={[styles.alertCountText, { color: accentColor }]}>{streaksToSaveCount}</Text>
                    </View>
                  </Animated.View>
                </Pressable>
              )}

              {/* Boost indicator with bubble animation */}
              {hasActiveBoost && <BoostBadge accentColor={accentColor} gradient={gradientColors} />}

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

            {/* Progress bar with XP text inside - Duolingo cartoony style */}
            <View style={styles.progressContainer}>
              {/* Outer wrapper for depth effect */}
              <View style={[styles.progressTrackOuter, { backgroundColor: shadowColor }]}>
                {/* Inner track */}
                <View style={[styles.progressTrack, { backgroundColor: pastelBackground }]}>
                  {/* Fill bar */}
                  {levelProgress > 0 && (
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(Math.round(levelProgress), 100)}%`,
                          backgroundColor: accentColor,
                        },
                      ]}
                    >
                      {/* Subtle thin shine line at top */}
                      <View style={styles.progressShine} />
                    </View>
                  )}
                  {/* XP text centered - always white with shadow for visibility */}
                  <Text style={styles.progressXpText}>
                    {currentLevelXP} / {xpForNextLevel} XP
                  </Text>
                </View>
              </View>
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
    paddingVertical: 10,
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
    borderRadius: 10,
    padding: 8,
    position: 'relative',
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
  },
  boostBadgeContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    overflow: 'hidden',
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
  progressContainer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    marginTop: -2,
  },
  progressTrackOuter: {
    borderRadius: 14,
    padding: 2,
    paddingBottom: 4,
  },
  progressTrack: {
    position: 'relative',
    height: 14,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressShine: {
    position: 'absolute',
    left: 2,
    top: 2,
    right: 2,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
  },
  progressXpText: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default React.memo(StatsBar);
