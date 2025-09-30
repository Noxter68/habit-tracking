// src/components/modals/EpicLevelUpModal.tsx
import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withDelay, withTiming, interpolate, Extrapolate, Easing, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementBadge } from '../achievements/AchievementBadge';
import { useLevelUp } from '../../context/LevelUpContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Optimized particle system - 30 particles for epic effect
const PARTICLE_COUNT = 30;

// Simple Particle Component with varied sizes
const Particle: React.FC<{ index: number; isActive: boolean; triggerDelay: number }> = ({ index, isActive, triggerDelay }) => {
  const progress = useSharedValue(0);

  // Pre-calculate particle properties with more variation
  const angle = (Math.PI * 2 * index) / PARTICLE_COUNT + Math.random() * 0.3;
  const startX = SCREEN_WIDTH / 2;
  const startY = SCREEN_HEIGHT / 2;
  const distance = 150 + Math.random() * 150;
  const endX = Math.cos(angle) * distance;
  const endY = Math.sin(angle) * distance - 50;
  const particleSize = 4 + Math.random() * 6; // Varied sizes

  useEffect(() => {
    if (isActive) {
      // Wait for card to appear, then trigger particles
      progress.value = withDelay(
        triggerDelay + index * 15, // Base delay + faster stagger
        withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) })
      );
    } else {
      progress.value = 0;
    }
  }, [isActive, triggerDelay]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: startX - particleSize / 2,
    top: startY - particleSize / 2,
    transform: [{ translateX: progress.value * endX }, { translateY: progress.value * endY }, { scale: interpolate(progress.value, [0, 0.3, 1], [0, 1.5, 0]) }],
    opacity: interpolate(progress.value, [0, 0.1, 0.7, 1], [0, 1, 1, 0]),
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        style={{
          width: particleSize,
          height: particleSize,
          borderRadius: particleSize / 2,
          backgroundColor: ['#fbbf24', '#f59e0b', '#fcd34d', '#fde68a'][index % 4],
        }}
      />
    </Animated.View>
  );
};

// Main Component
export const EpicLevelUpModal: React.FC = () => {
  const { showLevelUpModal, levelUpData, closeLevelUpModal } = useLevelUp();

  // Minimal animation values for performance
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.7); // Start much smaller for visible scale effect
  const cardY = useSharedValue(50);
  const contentOpacity = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => {
    if (showLevelUpModal && levelUpData) {
      // Faster, more dynamic entrance
      cardOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
      cardScale.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }); // From 0.7 to 1
      cardY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      contentOpacity.value = withDelay(250, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));

      // Second haptic when particles explode
      setTimeout(() => {
        runOnJS(triggerHaptic)();
      }, 350);

      // Auto close
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [showLevelUpModal, levelUpData]);

  const handleClose = () => {
    // Smooth fade out with scale down
    cardOpacity.value = withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) });
    cardScale.value = withTiming(0.8, { duration: 300, easing: Easing.in(Easing.ease) });
    cardY.value = withTiming(30, { duration: 300, easing: Easing.in(Easing.ease) });
    contentOpacity.value = withTiming(0, { duration: 200 });

    setTimeout(() => {
      closeLevelUpModal();
    }, 300);
  };

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }, { scale: cardScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (!showLevelUpModal || !levelUpData) return null;

  return (
    <Modal visible={showLevelUpModal} transparent animationType="none" statusBarTranslucent onRequestClose={handleClose}>
      <View style={StyleSheet.absoluteFillObject}>
        {/* Simple backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]} />

        {/* Particles - 30 for epic effect, triggered after card appears */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
            <Particle
              key={index}
              index={index}
              isActive={showLevelUpModal}
              triggerDelay={350} // Faster - wait 350ms for card to appear
            />
          ))}
        </View>

        {/* Main content */}
        <Pressable style={styles.container} onPress={handleClose} activeOpacity={1}>
          <Animated.View style={[styles.cardWrapper, cardStyle]}>
            {/* Simple glow effect */}
            <View style={styles.glowContainer}>
              <View style={styles.glowEffect} />
            </View>

            {/* Main Card */}
            <LinearGradient colors={['#fef3c7', '#fde68a', '#fbbf24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorder}>
              <View style={styles.card}>
                <Animated.View style={[styles.cardContent, contentStyle]}>
                  {/* Header */}
                  <LinearGradient colors={['#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
                    <Text style={styles.headerText}>LEVEL UP!</Text>
                  </LinearGradient>

                  {/* Achievement Badge */}
                  <View style={styles.badgeContainer}>
                    <AchievementBadge level={levelUpData.newLevel} achievement={levelUpData.achievement} isUnlocked={true} size={120} showLock={false} />
                  </View>

                  {/* Level Info */}
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelNumber}>Level {levelUpData.newLevel}</Text>
                    <Text style={styles.achievementTitle}>{levelUpData.achievement?.title || 'New Achievement'}</Text>
                  </View>

                  {/* Progress */}
                  <View style={styles.progress}>
                    <Text style={styles.progressText}>
                      {levelUpData.previousLevel} → {levelUpData.newLevel}
                    </Text>
                  </View>

                  {/* Motivational message */}
                  <Text style={styles.message}>{getMotivationalMessage(levelUpData.newLevel)}</Text>

                  {/* Continue hint */}
                  <Text style={styles.hint}>Tap to continue</Text>
                </Animated.View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
};

// Helper function
function getMotivationalMessage(level: number): string {
  if (level <= 5) return 'Great start! Keep building!';
  if (level <= 10) return 'Amazing progress!';
  if (level <= 15) return "You're on fire!";
  if (level <= 20) return 'Incredible achievement!';
  return 'Legendary status!';
}

// Optimized styles
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  glowContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    width: (SCREEN_WIDTH - 60) * 0.85,
    maxWidth: 340,
    height: 350,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fbbf24',
    // Reduced shadow for performance
    shadowColor: '#fbbf24',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientBorder: {
    borderRadius: 22,
    padding: 2,
    width: (SCREEN_WIDTH - 60) * 0.85,
    maxWidth: 340,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  cardContent: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  headerText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  levelNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  progress: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d97706',
  },
  message: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 10,
  },
  hint: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  particle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
});
