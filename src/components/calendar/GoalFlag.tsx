/**
 * GoalFlag.tsx
 *
 * Custom flag icon component for goal day visualization.
 * Orange theme matching milestone level up style.
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// Orange colors matching milestone level up
const GOAL_COLORS = {
  accent: '#f59e0b',
  particle: '#ea8c04', // Slightly lighter orange for particles
  border: '#f59e0b',
};

interface GoalFlagProps {
  size?: number;
  color?: string;
}

interface ParticleConfig {
  id: number;
  startX: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/**
 * Optimized animated particle - runs entirely on UI thread
 * No JS timers, pure Reanimated animations
 */
const Particle: React.FC<ParticleConfig> = ({ startX, startY, size, duration, delay, opacity: baseOpacity }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Single animation that controls both translateY and opacity
    // Runs entirely on UI thread - no JS timers
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    // Map progress 0->1 to translateY 0->-25 and opacity baseOpacity->0
    return {
      transform: [{ translateY: -25 * progress.value }],
      opacity: baseOpacity * (1 - progress.value),
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          bottom: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * Simple cartoony wavy flag SVG
 */
const FlagIcon: React.FC<{ size: number; color?: string }> = ({ size, color = '#ffffff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M3 5 Q7 3 12 5 Q17 7 21 5 L21 17 Q17 19 12 17 Q7 15 3 17 Z"
      fill={color}
    />
  </Svg>
);

/**
 * GoalFlag component - Simple cartoony flag
 */
const GoalFlag: React.FC<GoalFlagProps> = ({ size = 24, color }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <FlagIcon size={size} color={color} />
    </View>
  );
};

/**
 * GoalDayOverlay - Orange background overlay for the calendar day cell
 * Contains only the gradient background and particles
 */
export const GoalDayOverlay: React.FC<{ showParticles?: boolean }> = ({ showParticles = true }) => {
  // Particles optimized to 4 for performance
  const particles = useMemo<ParticleConfig[]>(() => [
    { id: 1, startX: 4, startY: 4, size: 4, duration: 2200, delay: 0, opacity: 0.9 },
    { id: 2, startX: 22, startY: 5, size: 3.5, duration: 2400, delay: 400, opacity: 0.8 },
    { id: 3, startX: 12, startY: 6, size: 4, duration: 2000, delay: 800, opacity: 0.85 },
    { id: 4, startX: 18, startY: 3, size: 3.5, duration: 2300, delay: 1200, opacity: 0.75 },
  ], []);

  return (
    <View style={styles.dayOverlay}>
      <LinearGradient
        colors={['#fbbf24', '#f59e0b', '#d97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.dayGradient}
      />
      {showParticles && (
        <View style={styles.dayParticlesContainer}>
          {particles.map((p) => (
            <Particle key={p.id} {...p} />
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * GoalFlagBadge - The flag icon badge in the corner
 * Positioned exactly like the streak flame badge
 */
export const GoalFlagBadge: React.FC = () => (
  <View style={styles.flagBadge}>
    <GoalFlag size={10} color="#ffffff" />
  </View>
);

/**
 * Optimized large particle for DateDetails - runs entirely on UI thread
 */
const LargeParticle: React.FC<ParticleConfig & { riseHeight?: number }> = ({
  startX,
  startY,
  size,
  duration,
  delay,
  opacity: baseOpacity,
  riseHeight = 60,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -riseHeight * progress.value }],
    opacity: baseOpacity * (1 - progress.value),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          bottom: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
        animatedStyle,
      ]}
    />
  );
};

/**
 * GoalDateDetailsParticles - Particles overlay for DateDetails component
 * Optimized to 5 particles for performance
 */
export const GoalDateDetailsParticles: React.FC = () => {
  const particles = useMemo<(ParticleConfig & { riseHeight: number })[]>(() => [
    { id: 1, startX: 30, startY: 8, size: 7, duration: 2800, delay: 0, opacity: 0.85, riseHeight: 65 },
    { id: 2, startX: 100, startY: 10, size: 6, duration: 3000, delay: 400, opacity: 0.8, riseHeight: 55 },
    { id: 3, startX: 180, startY: 6, size: 7, duration: 2600, delay: 800, opacity: 0.85, riseHeight: 60 },
    { id: 4, startX: 260, startY: 8, size: 6, duration: 2900, delay: 1200, opacity: 0.75, riseHeight: 50 },
    { id: 5, startX: 330, startY: 10, size: 7, duration: 2700, delay: 600, opacity: 0.8, riseHeight: 55 },
  ], []);

  return (
    <View style={styles.dateDetailsParticlesContainer}>
      {particles.map((p) => (
        <LargeParticle key={p.id} {...p} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GOAL_COLORS.border,
    overflow: 'hidden',
  },
  dayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dayParticlesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  flagBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GOAL_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  dateDetailsParticlesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
});

export default GoalFlag;
