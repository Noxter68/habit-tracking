// src/components/modals/EpicLevelUpModal.tsx
import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet, ImageBackground } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withDelay, withTiming, withSpring, interpolate, Easing, runOnJS, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementBadge } from '../achievements/AchievementBadge';
import { useLevelUp } from '../../context/LevelUpContext';
import { getAchievementTierTheme } from '@/utils/tierTheme';
import type { AchievementTierName } from '@/utils/tierTheme';
import Logger from '@/utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ENERGY_PARTICLES = 120;

// Energy Particle with Electric Movement
const EnergyParticle: React.FC<{ index: number; isActive: boolean; tierColor: string }> = ({ index, isActive, tierColor }) => {
  const progress = useSharedValue(0);
  const flicker = useSharedValue(1);

  const angle = Math.random() * 360;
  const radian = (angle * Math.PI) / 180;
  const distance = 80 + Math.random() * 100; // Closer to card

  const startX = SCREEN_WIDTH / 2 + Math.cos(radian) * 40;
  const startY = SCREEN_HEIGHT / 2 + Math.sin(radian) * 40;
  const endX = SCREEN_WIDTH / 2 + Math.cos(radian) * distance;
  const endY = SCREEN_HEIGHT / 2 + Math.sin(radian) * distance;

  const particleSize = 4 + Math.random() * 6;
  const delay = Math.random() * 400;
  const duration = 800 + Math.random() * 600;

  useEffect(() => {
    if (isActive) {
      progress.value = withDelay(300 + delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));

      // Electric flicker effect
      flicker.value = withDelay(300 + delay, withRepeat(withSequence(withTiming(1.5, { duration: 100 }), withTiming(0.8, { duration: 100 }), withTiming(1.2, { duration: 100 })), -1, true));
    }
  }, [isActive, delay, duration]);

  const particleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: interpolate(progress.value, [0, 1], [startX, endX]),
    top: interpolate(progress.value, [0, 1], [startY, endY]),
    width: particleSize,
    height: particleSize,
    borderRadius: particleSize / 2,
    backgroundColor: tierColor,
    opacity: interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 1, 1, 0]) * flicker.value,
    shadowColor: tierColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  }));

  return <Animated.View style={particleStyle} />;
};

// Shockwave Ring
const ShockwaveRing: React.FC<{ index: number; isActive: boolean; tierColor: string }> = ({ index, isActive, tierColor }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const delay = index * 200;

      scale.value = withDelay(delay, withTiming(3, { duration: 1200, easing: Easing.out(Easing.cubic) }));

      opacity.value = withDelay(delay, withSequence(withTiming(0.6, { duration: 200 }), withTiming(0, { duration: 1000 })));
    }
  }, [isActive, index]);

  const ringStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: tierColor,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={ringStyle} />;
};

// Main Component
export const EpicLevelUpModal: React.FC = () => {
  const { showLevelUpModal, levelUpData, closeLevelUpModal } = useLevelUp();

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const shake = useSharedValue(0);
  const levelBounce = useSharedValue(1); // Changed to scale for breathing effect

  const tierTheme = levelUpData?.achievement?.tier ? getAchievementTierTheme(levelUpData.achievement.tier as AchievementTierName) : getAchievementTierTheme('Novice');

  const playLevelUpSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../../assets/sounds/level-up.mp3'), { shouldPlay: true, volume: 0.5 });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      Logger.debug('Error playing sound:', error);
    }
  };

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const triggerLightHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (showLevelUpModal && levelUpData) {
      // Reset all animations to initial state
      cardOpacity.value = 0;
      cardScale.value = 0.5;
      shake.value = 0;
      levelBounce.value = 0;

      runOnJS(triggerHaptic)();
      runOnJS(playLevelUpSound)();

      // Screen shake
      shake.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 100 })
      );

      // Card entrance
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      });

      // Level bounce - starts immediately, continuous throughout animation
      levelBounce.value = withRepeat(
        withSequence(
          withSpring(-25, {
            damping: 8,
            stiffness: 200,
            mass: 1,
          }),
          withSpring(0, {
            damping: 10,
            stiffness: 150,
            mass: 1,
          })
        ),
        -1, // Infinite repeat
        false
      );

      setTimeout(() => runOnJS(triggerLightHaptic)(), 400);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 600);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 800);

      // Close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => {
        clearTimeout(timer);
        // Reset on unmount
        levelBounce.value = 0;
      };
    }
  }, [showLevelUpModal, levelUpData]);

  const handleClose = () => {
    cardOpacity.value = withTiming(0, { duration: 300 });
    cardScale.value = withTiming(0.8, { duration: 300 });
    levelBounce.value = 0; // Stop bounce animation
    setTimeout(() => closeLevelUpModal(), 300);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const levelBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: levelBounce.value }],
  }));

  if (!showLevelUpModal || !levelUpData) return null;

  return (
    <Modal visible={showLevelUpModal} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop} />

        {/* Electric Field Effects */}
        <View style={styles.effectsContainer} pointerEvents="none">
          {/* Shockwave rings */}
          <View style={styles.shockwaveContainer}>
            {Array.from({ length: 3 }).map((_, i) => (
              <ShockwaveRing key={`shockwave-${i}`} index={i} isActive={showLevelUpModal} tierColor={tierTheme.accent} />
            ))}
          </View>

          {/* Energy particles */}
          {Array.from({ length: ENERGY_PARTICLES }).map((_, i) => (
            <EnergyParticle key={`particle-${i}`} index={i} isActive={showLevelUpModal} tierColor={tierTheme.accent} />
          ))}
        </View>

        {/* Main content */}
        <Pressable style={styles.container} onPress={handleClose} activeOpacity={1}>
          <Animated.View style={[styles.contentWrapper, containerStyle]}>
            <Animated.View style={[styles.cardWrapper, cardStyle]}>
              <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorder}>
                <ImageBackground source={tierTheme.texture} style={styles.card} imageStyle={{ borderRadius: 24 }} resizeMode="cover">
                  <LinearGradient
                    colors={[`${tierTheme.gradient[0]}f0`, `${tierTheme.gradient[1]}f5`, `${tierTheme.gradient[2]}f0`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.header}>
                      <Text style={styles.headerText}>LEVEL UP!</Text>
                    </View>

                    {/* Badge without rotation */}
                    <View style={styles.badgeContainer}>
                      <View style={styles.badgeShadow}>
                        <AchievementBadge level={levelUpData.newLevel} achievement={levelUpData.achievement} isUnlocked={true} size={140} showLock={false} />
                      </View>
                    </View>

                    {/* Level with bounce */}
                    <Animated.View style={[styles.levelInfo, levelBounceStyle]}>
                      <Text style={styles.levelLabel}>LEVEL</Text>
                      <Text style={styles.levelNumber} allowFontScaling={false}>
                        {levelUpData.newLevel}
                      </Text>
                    </Animated.View>

                    <View style={styles.titleContainer}>
                      <Text style={styles.achievementTitle}>{levelUpData.achievement?.title || 'New Achievement'}</Text>
                    </View>

                    <View style={styles.messageContainer}>
                      <Text style={styles.message}>{getMotivationalMessage(levelUpData.newLevel)}</Text>
                    </View>

                    <Text style={styles.hint}>Tap to continue</Text>
                  </View>
                </ImageBackground>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
};

function getMotivationalMessage(level: number): string {
  if (level <= 5) return 'Great start on your journey!';
  if (level <= 10) return "You're on fire!";
  if (level <= 15) return 'Unstoppable progress!';
  if (level <= 20) return 'Legendary warrior!';
  if (level <= 30) return 'Elite achiever!';
  return 'MYTHIC STATUS ACHIEVED!';
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  effectsContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwaveContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SCREEN_WIDTH - 40,
    maxWidth: 380,
  },
  gradientBorder: {
    borderRadius: 26,
    padding: 3,
    width: '100%',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 30,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  header: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
  },
  headerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  badgeContainer: {
    marginBottom: 24,
  },
  badgeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  levelNumber: {
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 56,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  messageContainer: {
    marginBottom: 16,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
