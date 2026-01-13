/**
 * RatingRewardModal.tsx
 *
 * Modal qui propose à l'utilisateur de noter l'application
 * en échange de 500 XP de récompense.
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Dimensions, StyleSheet, ImageBackground } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Star, Search, MessageSquare, Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';
import { RatingService } from '@/services/ratingService';
import { useAuth } from '@/context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useQuests } from '@/context/QuestContext';
import Logger from '@/utils/logger';
import { getAchievementTierTheme } from '@/utils/tierTheme';

// =============================================================================
// CONSTANTES
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENERGY_PARTICLES = 40;

// Thème Topaz (epicMastery) pour la récompense XP
const REWARD_THEME = getAchievementTierTheme('epicMastery');

// =============================================================================
// SOUS-COMPOSANTS
// =============================================================================

/**
 * Particule d'énergie animée
 */
const EnergyParticle: React.FC<{
  index: number;
  isActive: boolean;
  tierColor: string;
}> = React.memo(({ index, isActive, tierColor }) => {
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
      progress.value = withDelay(
        200 + delay,
        withTiming(1, { duration, easing: Easing.out(Easing.quad) })
      );

      flicker.value = withDelay(
        200 + delay,
        withRepeat(
          withSequence(
            withTiming(1.3, { duration: 150 }),
            withTiming(0.9, { duration: 150 })
          ),
          -1,
          true
        )
      );
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

/**
 * Anneau d'onde de choc
 */
const ShockwaveRing: React.FC<{
  index: number;
  isActive: boolean;
  tierColor: string;
}> = React.memo(({ index, isActive, tierColor }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const ringDelay = index * 150;

      scale.value = withDelay(
        ringDelay,
        withTiming(2.5, { duration: 1000, easing: Easing.out(Easing.cubic) })
      );

      opacity.value = withDelay(
        ringDelay,
        withSequence(
          withTiming(0.5, { duration: 150 }),
          withTiming(0, { duration: 850 })
        )
      );
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

// =============================================================================
// TYPES
// =============================================================================

interface RatingRewardModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ModalState = 'prompt' | 'success' | 'loading';

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const RatingRewardModal: React.FC<RatingRewardModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [state, setState] = useState<ModalState>('prompt');
  const [xpAwarded, setXpAwarded] = useState(0);
  const [countdown, setCountdown] = useState(8);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { updateStatsOptimistically } = useStats();
  const { refreshQuests } = useQuests();

  const xpReward = RatingService.getRewardAmount();

  // ---------------------------------------------------------------------------
  // Valeurs d'animation
  // ---------------------------------------------------------------------------
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const shake = useSharedValue(0);
  const xpBounce = useSharedValue(0);

  // ---------------------------------------------------------------------------
  // Fonctions utilitaires
  // ---------------------------------------------------------------------------

  const playLevelUpSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sounds/level-up.mp3'),
        { shouldPlay: true, volume: 0.5 }
      );
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

  // ---------------------------------------------------------------------------
  // Effets
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state === 'success') {
      // Réinitialisation des animations
      cardOpacity.value = 0;
      cardScale.value = 0.5;
      shake.value = 0;
      xpBounce.value = 0;
      setCountdown(8);

      runOnJS(triggerHaptic)();
      runOnJS(playLevelUpSound)();

      // Animation de secousse
      shake.value = withSequence(
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(0, { duration: 100 })
      );

      // Animation d'entrée de la carte
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      });

      // Animation de rebond du XP
      xpBounce.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 300, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );

      // Retours haptiques séquentiels
      setTimeout(() => runOnJS(triggerLightHaptic)(), 400);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 600);
      setTimeout(() => runOnJS(triggerLightHaptic)(), 800);

      // Compte à rebours
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Fermeture automatique après 8 secondes
      const timer = setTimeout(() => {
        handleClose();
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
        xpBounce.value = 0;
      };
    }
  }, [state]);

  // ---------------------------------------------------------------------------
  // Styles animés
  // ---------------------------------------------------------------------------

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const xpBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: xpBounce.value }],
  }));

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleClaimReward = async () => {
    if (!user?.id) return;

    setState('loading');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await RatingService.claimRatingReward(user.id);

      if (result.success) {
        setXpAwarded(result.xpAwarded);
        setState('success');
        // Met à jour les stats immédiatement pour voir le changement dans la barre XP
        updateStatsOptimistically(result.xpAwarded);
        // Rafraîchit les quêtes pour afficher la quête comme complétée
        refreshQuests();
        onSuccess?.();
      } else {
        onClose();
      }
    } catch (error) {
      Logger.error('Error in handleClaimReward:', error);
      setState('prompt');
    }
  };

  const handleClose = () => {
    // Libérer l'écran immédiatement
    onClose();

    // Réinitialiser l'état pour la prochaine ouverture
    setState('prompt');
    setCountdown(8);
    xpBounce.value = 0;
  };

  // ---------------------------------------------------------------------------
  // État de succès - Style Epic Level Up
  // ---------------------------------------------------------------------------

  if (state === 'success') {
    return (
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        <View style={StyleSheet.absoluteFillObject}>
          <View style={styles.backdrop} />

          {/* Effets visuels - Particules et ondes */}
          <View style={styles.effectsContainer} pointerEvents="none">
            {/* Anneaux d'onde de choc */}
            <View style={styles.shockwaveContainer}>
              {Array.from({ length: 3 }).map((_, i) => (
                <ShockwaveRing
                  key={`shockwave-${i}`}
                  index={i}
                  isActive={true}
                  tierColor={REWARD_THEME.accent}
                />
              ))}
            </View>

            {/* Particules d'énergie */}
            {Array.from({ length: ENERGY_PARTICLES }).map((_, i) => (
              <EnergyParticle
                key={`particle-${i}`}
                index={i}
                isActive={true}
                tierColor={REWARD_THEME.accent}
              />
            ))}
          </View>

          {/* Contenu principal */}
          <Pressable style={styles.container} onPress={handleClose}>
            <Animated.View style={[styles.contentWrapper, containerStyle]}>
              <Animated.View style={[styles.cardWrapper, cardStyle]}>
                <LinearGradient
                  colors={REWARD_THEME.gradient as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBorder}
                >
                  <ImageBackground
                    source={REWARD_THEME.texture}
                    style={styles.card}
                    imageStyle={{ borderRadius: 24, opacity: 0.7 }}
                    resizeMode="cover"
                  >
                    {/* Overlay avec couleurs du thème */}
                    <LinearGradient
                      colors={[
                        `${REWARD_THEME.gradient[0]}e6`,
                        `${REWARD_THEME.gradient[1]}dd`,
                        `${REWARD_THEME.gradient[2]}cc`,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />

                    <View style={styles.cardContent}>
                      {/* En-tête */}
                      <View style={styles.header}>
                        <Text style={styles.headerText} numberOfLines={1} adjustsFontSizeToFit>
                          {t('settings.rating.thankYou')}
                        </Text>
                      </View>

                      {/* Icône étoile */}
                      <View style={styles.badgeContainer}>
                        <View style={styles.badgeShadow}>
                          <View style={styles.starContainer}>
                            <Star size={80} color="#ffffff" fill="#ffffff" />
                          </View>
                        </View>
                      </View>

                      {/* XP avec animation de rebond */}
                      <Animated.View style={[styles.levelInfo, xpBounceStyle]}>
                        <Text style={styles.xpText} allowFontScaling={false}>
                          +{xpAwarded} XP
                        </Text>
                      </Animated.View>

                      {/* Message */}
                      <View style={styles.messageContainer}>
                        <Text style={styles.message}>
                          {t('settings.rating.rewardReceived')}
                        </Text>
                      </View>

                      {/* Indication de fermeture */}
                      <View style={styles.hintContainer}>
                        <Text style={styles.hint}>{t('levelUp.tapToContinue')}</Text>
                        <Text style={styles.countdown}>
                          {t('levelUp.closingIn', { seconds: countdown })}
                        </Text>
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
  }

  // ---------------------------------------------------------------------------
  // État principal (prompt avec étapes)
  // ---------------------------------------------------------------------------

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <BlurView intensity={40} style={tw`flex-1`}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={tw`flex-1 bg-black/60 items-center justify-center px-5`}
        >
          <Pressable style={tw`absolute inset-0`} onPress={handleClose} />

          <Animated.View
            entering={FadeInDown.duration(400).springify()}
            style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl`}
          >
            {/* Header avec gradient */}
            <LinearGradient
              colors={['#fef3c7', '#fde68a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`px-5 pt-5 pb-6 relative`}
            >
              <Pressable
                onPress={handleClose}
                style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 items-center justify-center shadow-sm`}
              >
                <X size={18} color="#57534E" strokeWidth={2.5} />
              </Pressable>

              <Animated.View
                entering={ZoomIn.duration(600).springify()}
                style={tw`items-center`}
              >
                <View
                  style={tw`w-16 h-16 rounded-xl bg-white items-center justify-center shadow-lg mb-3`}
                >
                  <Star size={36} color="#f59e0b" fill="#f59e0b" />
                </View>
                <Text style={tw`text-xl font-black text-amber-900 mb-1 text-center`}>
                  {t('settings.rating.title')}
                </Text>
                <Text style={tw`text-xs text-amber-700/70 text-center`}>
                  {t('settings.rating.subtitle')}
                </Text>
              </Animated.View>
            </LinearGradient>

            <View style={tw`px-5 py-5`}>
              {/* Récompense XP */}
              <View
                style={tw`bg-amber-50 rounded-2xl p-4 mb-5 border border-amber-100`}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <View>
                    <Text style={tw`text-base font-black text-amber-900`}>
                      {t('settings.rating.reward')}
                    </Text>
                    <Text style={tw`text-xs text-stone-500`}>
                      {t('settings.rating.rewardDescription')}
                    </Text>
                  </View>
                  <View style={tw`bg-amber-500 px-3 py-1.5 rounded-lg`}>
                    <Text style={tw`text-white font-black text-base`}>
                      +{xpReward}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Étapes */}
              <View style={tw`mb-5`}>
                <Text style={tw`text-sm font-bold text-stone-700 mb-3`}>
                  {t('settings.rating.howTo')}
                </Text>

                {/* Étape 1 */}
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={tw`w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-3`}>
                    <Search size={16} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                  <Text style={tw`flex-1 text-sm text-stone-600`}>
                    {t('settings.rating.step1')}
                  </Text>
                </View>

                {/* Étape 2 */}
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={tw`w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-3`}>
                    <MessageSquare size={16} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                  <Text style={tw`flex-1 text-sm text-stone-600`}>
                    {t('settings.rating.step2')}
                  </Text>
                </View>

                {/* Étape 3 */}
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-3`}>
                    <Gift size={16} color="#f59e0b" strokeWidth={2.5} />
                  </View>
                  <Text style={tw`flex-1 text-sm text-stone-600`}>
                    {t('settings.rating.step3')}
                  </Text>
                </View>
              </View>

              {/* Bouton principal */}
              <Pressable
                onPress={handleClaimReward}
                disabled={state === 'loading'}
                style={({ pressed }) => [
                  tw`rounded-xl overflow-hidden`,
                  pressed && tw`opacity-90`,
                ]}
              >
                <LinearGradient
                  colors={['#f59e0b', '#d97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={tw`py-4 items-center`}
                >
                  {state === 'loading' ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <View style={tw`flex-row items-center`}>
                      <Gift size={18} color="white" />
                      <Text style={tw`text-white font-bold text-base ml-2`}>
                        {t('settings.rating.claimReward')}
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Bouton secondaire */}
              <Pressable
                onPress={handleClose}
                style={tw`mt-3 py-3`}
              >
                <Text style={tw`text-stone-400 text-center text-sm font-medium`}>
                  {t('settings.rating.later')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// =============================================================================
// STYLES
// =============================================================================

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
  starContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  xpText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
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
