// src/components/streak/StreakCelebrationModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet, ImageBackground } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withDelay, withTiming, withSpring, interpolate, Easing, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getAchievementTierTheme } from '@/utils/tierTheme';
import type { TierKey } from '@/types/achievement.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StreakCelebrationModalProps {
  visible: boolean;
  previousStreak: number;
  newStreak: number;
  currentTier: TierKey; // Le tier actuel de l'utilisateur
  onClose: () => void;
}

// Composant de particule d'énergie
const EnergyParticle: React.FC<{ index: number; isActive: boolean; tierColor: string }> = React.memo(({ index, isActive, tierColor }) => {
  const progress = useSharedValue(0);

  const angle = (index / 20) * 360 + Math.random() * 20;
  const radian = (angle * Math.PI) / 180;
  const distance = 60 + Math.random() * 40;

  const startX = SCREEN_WIDTH / 2 + Math.cos(radian) * 40;
  const startY = SCREEN_HEIGHT / 2 + Math.sin(radian) * 40;
  const endX = SCREEN_WIDTH / 2 + Math.cos(radian) * distance;
  const endY = SCREEN_HEIGHT / 2 + Math.sin(radian) * distance;

  const particleSize = 2 + Math.random() * 2;
  const delay = Math.random() * 400;
  const duration = 1200 + Math.random() * 600;

  useEffect(() => {
    if (isActive) {
      progress.value = withDelay(200 + delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
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
    opacity: interpolate(progress.value, [0, 0.15, 0.85, 1], [0, 0.8, 0.8, 0]),
  }));

  return <Animated.View style={particleStyle} />;
});

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({ visible, previousStreak, newStreak, currentTier, onClose }) => {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [displayStreak, setDisplayStreak] = useState(previousStreak);

  // Animation values
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const shake = useSharedValue(0);
  const numberTranslateY = useSharedValue(0);
  const numberOpacity = useSharedValue(1);
  const flamePulse = useSharedValue(1);

  // Récupérer le thème du tier
  const tierTheme = getAchievementTierTheme(currentTier);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const triggerLightHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    if (visible) {
      // Reset
      cardOpacity.value = 0;
      cardScale.value = 0.8;
      shake.value = 0;
      numberTranslateY.value = 0;
      numberOpacity.value = 1;
      flamePulse.value = 1;
      setCountdown(5);
      setDisplayStreak(previousStreak);

      // Card entrance smooth
      setTimeout(() => {
        cardOpacity.value = withTiming(1, { duration: 500 });
        cardScale.value = withSpring(1, {
          damping: 12,
          stiffness: 100,
          mass: 0.8,
        });
      }, 100);

      // Shake de modal + vibration après 1s
      setTimeout(() => {
        runOnJS(triggerHaptic)();

        shake.value = withSequence(
          withTiming(8, { duration: 60 }),
          withTiming(-6, { duration: 60 }),
          withTiming(4, { duration: 60 }),
          withTiming(-3, { duration: 60 }),
          withTiming(0, { duration: 80 })
        );

        setTimeout(() => runOnJS(triggerLightHaptic)(), 80);
        setTimeout(() => runOnJS(triggerLightHaptic)(), 140);
      }, 1000);

      // Number roll animation (slot machine style)
      setTimeout(() => {
        // Le nombre actuel monte et disparaît
        numberTranslateY.value = withTiming(-180, {
          duration: 350,
          easing: Easing.in(Easing.cubic),
        });
        numberOpacity.value = withTiming(0, { duration: 350 });

        // Change le nombre au milieu
        setTimeout(() => {
          runOnJS(setDisplayStreak)(newStreak);
          runOnJS(triggerHaptic)();
          // Prépare le nouveau nombre en bas
          numberTranslateY.value = 180;
          numberOpacity.value = 0;
          // Le nouveau nombre arrive d'en bas
          numberTranslateY.value = withTiming(0, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
          });
          numberOpacity.value = withTiming(1, { duration: 400 });
        }, 350);
      }, 1200);

      // Flame pulse subtil
      setTimeout(() => {
        flamePulse.value = withSequence(withTiming(1.1, { duration: 200 }), withTiming(1, { duration: 200 }));
      }, 1200);

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
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [visible]);

  const handleClose = () => {
    cardOpacity.value = withTiming(0, { duration: 400 });
    cardScale.value = withTiming(0.9, { duration: 400 });
    setTimeout(() => onClose(), 400);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: numberTranslateY.value }],
    opacity: numberOpacity.value,
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flamePulse.value }],
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop} />

        {/* Particules d'énergie avec la couleur du tier */}
        <View style={styles.effectsContainer} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <EnergyParticle key={`particle-${i}`} index={i} isActive={visible} tierColor={tierTheme.accent} />
          ))}
        </View>

        <Pressable style={styles.container} onPress={handleClose}>
          <Animated.View style={containerStyle}>
            <Animated.View style={[styles.contentWrapper, cardStyle]}>
              <View style={styles.cardWrapper}>
                {/* Bordure avec gradient du tier */}
                <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientBorder}>
                  {/* Card content avec texture du tier */}
                  <ImageBackground source={tierTheme.texture} style={styles.card} imageStyle={{ opacity: 0.15 }}>
                    <LinearGradient
                      colors={[`${tierTheme.gradient[0]}F5`, `${tierTheme.gradient[1]}F0`, `${tierTheme.gradient[2]}F5`]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.cardContent}
                    >
                      {/* Flamme animée */}
                      <Animated.View style={[styles.flameContainer, flameStyle]}>
                        <Flame size={100} fill={tierTheme.accent} color={tierTheme.gradient[0]} strokeWidth={0} />
                      </Animated.View>

                      {/* Badge arrondi autour du nombre avec couleur du tier */}
                      <View style={styles.numberBadgeContainer}>
                        <LinearGradient colors={[tierTheme.gradient[0], tierTheme.gradient[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.numberBadge}>
                          <View style={styles.numberInner}>
                            <Animated.Text style={[styles.streakNumber, numberStyle]}>{displayStreak}</Animated.Text>
                          </View>
                        </LinearGradient>
                      </View>

                      <Text style={styles.title}>{t('streak.celebration.title', { defaultValue: 'Série active !' })}</Text>

                      <Text style={styles.message}>
                        {t('streak.celebration.message', {
                          defaultValue: 'Tu gardes la flamme en vie ! Continue comme ça ! 🔥',
                        })}
                      </Text>

                      <View style={styles.hintContainer}>
                        <Text style={styles.hint}>{t('streak.celebration.tapToContinue', { defaultValue: 'Toucher pour continuer' })}</Text>
                        <Text style={styles.countdown}>
                          {t('streak.celebration.closingIn', {
                            seconds: countdown,
                            defaultValue: `Fermeture dans ${countdown}s`,
                          })}
                        </Text>
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </LinearGradient>
              </View>
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
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 30,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  flameContainer: {
    marginBottom: 20,
  },
  numberBadgeContainer: {
    marginBottom: 20,
  },
  numberBadge: {
    borderRadius: 30,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  numberInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 26,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    overflow: 'hidden',
  },
  streakNumber: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 20,
    letterSpacing: -4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
    lineHeight: 24,
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  hint: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
