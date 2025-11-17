// src/components/groups/GroupTierUpModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet, ImageBackground, Image } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withDelay, withTiming, withSpring, interpolate, Easing, runOnJS, withRepeat } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useGroupCelebration } from '@/context/GroupCelebrationContext';
import { getAchievementTierTheme, getHabitTierTheme } from '@/utils/tierTheme';
import { getGroupTierThemeKey } from '@/utils/groups/groupConstants';
import Logger from '@/utils/logger';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENERGY_PARTICLES = 40;

// Energy Particle Component
const EnergyParticle: React.FC<{ index: number; isActive: boolean; tierColor: string }> = React.memo(({ index, isActive, tierColor }) => {
  const progress = useSharedValue(0);
  const flicker = useSharedValue(1);

  const angle = (index / ENERGY_PARTICLES) * 360 + Math.random() * 20;
  const radian = (angle * Math.PI) / 180;
  const distance = 80 + Math.random() * 80;

  const startX = SCREEN_WIDTH / 2 + Math.cos(radian) * 40;
  const startY = SCREEN_HEIGHT / 2 + Math.sin(radian) * 40;
  const endX = SCREEN_WIDTH / 2 + Math.cos(radian) * distance;
  const endY = SCREEN_HEIGHT / 2 + Math.sin(radian) * distance;

  const particleSize = 3 + Math.random() * 4;
  const delay = Math.random() * 300;
  const duration = 700 + Math.random() * 400;

  useEffect(() => {
    if (isActive) {
      progress.value = withDelay(200 + delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));

      flicker.value = withDelay(200 + delay, withRepeat(withSequence(withTiming(1.3, { duration: 150 }), withTiming(0.9, { duration: 150 })), -1, true));
    }
  }, [isActive]);

  const particleStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: interpolate(progress.value, [0, 1], [startX, endX]),
    top: interpolate(progress.value, [0, 1], [startY, endY]),
    width: particleSize,
    height: particleSize,
    borderRadius: particleSize / 2,
    backgroundColor: tierColor,
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]) * flicker.value,
  }));

  return <Animated.View style={particleStyle} />;
});

// Shockwave Ring Component
const ShockwaveRing: React.FC<{ index: number; isActive: boolean; tierColor: string }> = React.memo(({ index, isActive, tierColor }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const delay = index * 150;

      scale.value = withDelay(delay, withTiming(2.5, { duration: 1000, easing: Easing.out(Easing.cubic) }));

      opacity.value = withDelay(delay, withSequence(withTiming(0.5, { duration: 150 }), withTiming(0, { duration: 850 })));
    }
  }, [isActive]);

  const ringStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: tierColor,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={ringStyle} />;
});

// Main Component
export const GroupTierUpModal: React.FC = () => {
  const { t } = useTranslation();
  const { showTierUpModal, tierUpData, closeTierUpModal } = useGroupCelebration();
  const [countdown, setCountdown] = useState(8);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const shake = useSharedValue(0);
  const iconBounce = useSharedValue(0);

  const tierTheme = tierUpData
    ? tierUpData.newTier <= 3
      ? getHabitTierTheme(tierUpData.tierConfig.name as any)
      : getAchievementTierTheme(getGroupTierThemeKey(tierUpData.newTier))
    : getHabitTierTheme('Crystal');

  const playSound = async () => {
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
    if (showTierUpModal && tierUpData) {
      // Reset animations
      cardOpacity.value = 0;
      cardScale.value = 0.5;
      shake.value = 0;
      iconBounce.value = 0;
      setCountdown(8);

      runOnJS(triggerHaptic)();
      runOnJS(playSound)();

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

      // Icon bounce animation
      iconBounce.value = withRepeat(withSequence(withTiming(-20, { duration: 300, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })), -1, false);

      setTimeout(() => runOnJS(triggerLightHaptic)(), 400);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 600);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 800);

      // Countdown
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-close
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        iconBounce.value = 0;
      };
    }
  }, [showTierUpModal, tierUpData]);

  const handleClose = () => {
    cardOpacity.value = withTiming(0, { duration: 300 });
    cardScale.value = withTiming(0.8, { duration: 300 });
    iconBounce.value = 0;
    setTimeout(() => closeTierUpModal(), 300);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const iconBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconBounce.value }],
  }));

  if (!showTierUpModal || !tierUpData) return null;

  const isObsidian = tierUpData.newTier === 6;
  const isJade = tierUpData.newTier === 4;
  const isTopaz = tierUpData.newTier === 5;

  return (
    <Modal visible={showTierUpModal} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop} />

        {/* Particle Effects */}
        <View style={styles.effectsContainer} pointerEvents="none">
          <View style={styles.shockwaveContainer}>
            {Array.from({ length: 3 }).map((_, i) => (
              <ShockwaveRing key={`shockwave-${i}`} index={i} isActive={showTierUpModal} tierColor={tierTheme.accent} />
            ))}
          </View>

          {Array.from({ length: ENERGY_PARTICLES }).map((_, i) => (
            <EnergyParticle key={`particle-${i}`} index={i} isActive={showTierUpModal} tierColor={tierTheme.accent} />
          ))}
        </View>

        {/* Main Content */}
        <Pressable style={styles.container} onPress={handleClose} activeOpacity={1}>
          <Animated.View style={[styles.contentWrapper, containerStyle]}>
            <Animated.View style={[styles.cardWrapper, cardStyle]}>
              <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorder}>
                <ImageBackground source={tierTheme.texture} style={styles.card} imageStyle={{ borderRadius: 24, opacity: isObsidian ? 0.35 : 0.2 }} resizeMode="cover">
                  <LinearGradient
                    colors={[`${tierTheme.gradient[0]}e6`, `${tierTheme.gradient[1]}dd`, `${tierTheme.gradient[2]}cc`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <View style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.header}>
                      <Text style={styles.headerText} numberOfLines={1} adjustsFontSizeToFit>
                        {t('groups.tierUp.title')}
                      </Text>
                    </View>

                    {/* Tier Icon */}
                    <Animated.View style={[styles.iconContainer, iconBounceStyle]}>
                      <View style={styles.iconShadow}>
                        <Image source={tierUpData.tierConfig.icon} style={styles.tierIcon} resizeMode="contain" />
                      </View>
                    </Animated.View>

                    {/* Tier Info */}
                    <View style={styles.tierInfo}>
                      <Text style={styles.tierLabel}>{t('groups.tierUp.newTier')}</Text>
                      <Text style={styles.tierName} numberOfLines={1}>
                        {tierUpData.tierConfig.name}
                      </Text>
                    </View>

                    {/* Level Badge */}
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{t('groups.tierUp.level', { level: tierUpData.newLevel })}</Text>
                    </View>

                    {/* Message */}
                    <View style={styles.messageContainer}>
                      <Text style={styles.message}>{t('groups.tierUp.congratulations')}</Text>
                    </View>

                    {/* Hint */}
                    <View style={styles.hintContainer}>
                      <Text style={styles.hint}>{t('groups.tierUp.tapToContinue')}</Text>
                      <Text style={styles.countdown}>{t('groups.tierUp.closingIn', { seconds: countdown })}</Text>
                    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 24,
    width: '100%',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  tierIcon: {
    width: 140,
    height: 140,
  },
  tierInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tierName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  levelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  messageContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
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
  hintContainer: {
    alignItems: 'center',
    gap: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countdown: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
