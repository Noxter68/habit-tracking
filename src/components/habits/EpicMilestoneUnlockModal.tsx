/**
 * EpicMilestoneUnlockModal.tsx
 *
 * Modal de célébration pour le déblocage d'un milestone.
 * Affiche des animations épiques avec particules et effets visuels
 * dans le thème jaune/ambre des milestones.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React et React Native
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet, Image } from 'react-native';

// Bibliothèques externes
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withDelay,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

// Utilitaires
import { getTranslatedMilestone } from '@/i18n/milestoneTranslations';
import Logger from '@/utils/logger';

// Types
import type { HabitMilestone } from '@/services/habitProgressionService';

// =============================================================================
// CONSTANTES
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Nombre de particules d'énergie (optimisé pour les performances) */
const ENERGY_PARTICLES = 40;

/** Couleurs du thème milestone (ambre/jaune) */
const MILESTONE_THEME = {
  accent: '#f59e0b',
  gradient: ['#fbbf24', '#f59e0b', '#d97706'] as const,
  gradientOverlay: ['#fbbf24e6', '#f59e0bdd', '#d97706cc'] as const,
};

// Import tier icons
const tierIcons = {
  0: require('../../../assets/tiers/tier-1/level-1.png'),
  1: require('../../../assets/tiers/tier-1/level-2.png'),
  2: require('../../../assets/tiers/tier-1/level-3.png'),
  3: require('../../../assets/tiers/tier-1/level-4.png'),
  4: require('../../../assets/tiers/tier-1/level-5.png'),
  5: require('../../../assets/tiers/tier-2/level-6.png'),
  6: require('../../../assets/tiers/tier-2/level-7.png'),
  7: require('../../../assets/tiers/tier-2/level-8.png'),
  8: require('../../../assets/tiers/tier-2/level-9.png'),
  9: require('../../../assets/tiers/tier-2/level-10.png'),
  10: require('../../../assets/tiers/tier-3/level-11.png'),
  11: require('../../../assets/tiers/tier-3/level-12.png'),
  12: require('../../../assets/tiers/tier-3/level-13.png'),
  13: require('../../../assets/tiers/tier-3/level-14.png'),
  14: require('../../../assets/tiers/tier-3/level-15.png'),
};

// =============================================================================
// SOUS-COMPOSANTS
// =============================================================================

/**
 * Particule d'énergie animée
 * Version optimisée pour de meilleures performances
 */
const EnergyParticle: React.FC<{
  index: number;
  isActive: boolean;
}> = React.memo(({ index, isActive }) => {
  const progress = useSharedValue(0);
  const flicker = useSharedValue(1);

  // Calcul de la position et direction
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

      // Animation de scintillement simplifiée
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
    backgroundColor: MILESTONE_THEME.accent,
    opacity: interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]) * flicker.value,
  }));

  return <Animated.View style={particleStyle} />;
});

/**
 * Anneau d'onde de choc
 * Version optimisée pour de meilleures performances
 */
const ShockwaveRing: React.FC<{
  index: number;
  isActive: boolean;
}> = React.memo(({ index, isActive }) => {
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
    borderColor: MILESTONE_THEME.accent,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={ringStyle} />;
});

// =============================================================================
// TYPES
// =============================================================================

export interface EpicMilestoneUnlockModalProps {
  /** Visibilité du modal */
  visible: boolean;
  /** Milestone débloqué */
  milestone: HabitMilestone | null;
  /** Index du milestone (pour l'icône) */
  milestoneIndex: number;
  /** Callback de fermeture */
  onClose: () => void;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const EpicMilestoneUnlockModal: React.FC<EpicMilestoneUnlockModalProps> = ({
  visible,
  milestone,
  milestoneIndex,
  onClose,
}) => {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { t, i18n } = useTranslation();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [countdown, setCountdown] = useState(8);

  // ---------------------------------------------------------------------------
  // Valeurs d'animation
  // ---------------------------------------------------------------------------
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.5);
  const shake = useSharedValue(0);
  const iconBounce = useSharedValue(0);

  // ---------------------------------------------------------------------------
  // Valeurs calculées
  // ---------------------------------------------------------------------------
  const translatedMilestone = milestone
    ? getTranslatedMilestone(milestone.title, i18n.language as 'en' | 'fr')
    : null;

  // ---------------------------------------------------------------------------
  // Fonctions utilitaires
  // ---------------------------------------------------------------------------

  /**
   * Joue le son de déblocage
   */
  const playUnlockSound = async () => {
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

  /**
   * Déclenche un retour haptique fort
   */
  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  /**
   * Déclenche un retour haptique léger
   */
  const triggerLightHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Retourne un message motivationnel selon le nombre de jours
   */
  const getMotivationalMessage = (days: number): string => {
    if (days <= 7) return t('milestoneUnlock.motivational.week');
    if (days <= 21) return t('milestoneUnlock.motivational.threeWeeks');
    if (days <= 30) return t('milestoneUnlock.motivational.month');
    if (days <= 60) return t('milestoneUnlock.motivational.twoMonths');
    if (days <= 100) return t('milestoneUnlock.motivational.hundred');
    return t('milestoneUnlock.motivational.legendary');
  };

  // ---------------------------------------------------------------------------
  // Effets
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (visible && milestone) {
      // Réinitialisation des animations
      cardOpacity.value = 0;
      cardScale.value = 0.5;
      shake.value = 0;
      iconBounce.value = 0;
      setCountdown(8);

      runOnJS(triggerHaptic)();
      runOnJS(playUnlockSound)();

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

      // Animation de rebond de l'icône
      iconBounce.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
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
        iconBounce.value = 0;
      };
    }
  }, [visible, milestone]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Gère la fermeture du modal avec animation
   */
  const handleClose = () => {
    cardOpacity.value = withTiming(0, { duration: 300 });
    cardScale.value = withTiming(0.8, { duration: 300 });
    iconBounce.value = 0;
    setTimeout(() => onClose(), 300);
  };

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

  const iconBounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: iconBounce.value }],
  }));

  // ---------------------------------------------------------------------------
  // Rendu conditionnel
  // ---------------------------------------------------------------------------
  if (!visible || !milestone) return null;

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
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
                isActive={visible}
              />
            ))}
          </View>

          {/* Particules d'énergie */}
          {Array.from({ length: ENERGY_PARTICLES }).map((_, i) => (
            <EnergyParticle
              key={`particle-${i}`}
              index={i}
              isActive={visible}
            />
          ))}
        </View>

        {/* Contenu principal */}
        <Pressable style={styles.container} onPress={handleClose} activeOpacity={1}>
          <Animated.View style={[styles.contentWrapper, containerStyle]}>
            <Animated.View style={[styles.cardWrapper, cardStyle]}>
              <LinearGradient
                colors={[...MILESTONE_THEME.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBorder}
              >
                <View style={styles.card}>
                  {/* Overlay avec couleurs du thème milestone */}
                  <LinearGradient
                    colors={[...MILESTONE_THEME.gradientOverlay]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  <View style={styles.cardContent}>
                    {/* En-tête */}
                    <View style={styles.header}>
                      <Text style={styles.headerText} numberOfLines={1} adjustsFontSizeToFit>
                        {t('milestoneUnlock.title')}
                      </Text>
                    </View>

                    {/* Icône du milestone avec animation */}
                    <Animated.View style={[styles.iconContainer, iconBounceStyle]}>
                      <View style={styles.iconShadow}>
                        <View style={styles.iconBackground}>
                          <Image
                            source={tierIcons[milestoneIndex as keyof typeof tierIcons] || tierIcons[0]}
                            style={styles.milestoneIcon}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    </Animated.View>

                    {/* Jours */}
                    <View style={styles.daysInfo}>
                      <Text style={styles.daysLabel}>{t('milestoneUnlock.daysLabel')}</Text>
                      <Text style={styles.daysNumber} allowFontScaling={false}>
                        {milestone.days}
                      </Text>
                    </View>

                    {/* Titre du milestone */}
                    <View style={styles.titleContainer}>
                      <Text style={styles.milestoneTitle} numberOfLines={2}>
                        {translatedMilestone?.title || milestone.title}
                      </Text>
                    </View>

                    {/* XP Reward */}
                    <View style={styles.xpContainer}>
                      <Text style={styles.xpText}>+{milestone.xpReward} XP</Text>
                    </View>

                    {/* Message motivationnel */}
                    <View style={styles.messageContainer}>
                      <Text style={styles.message}>
                        {getMotivationalMessage(milestone.days)}
                      </Text>
                    </View>

                    {/* Indication de fermeture */}
                    <View style={styles.hintContainer}>
                      <Text style={styles.hint}>{t('milestoneUnlock.tapToContinue')}</Text>
                      <Text style={styles.countdown}>
                        {t('milestoneUnlock.closingIn', { seconds: countdown })}
                      </Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
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
    backgroundColor: '#fef3c7', // amber-100
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  iconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  iconBackground: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIcon: {
    width: 120,
    height: 120,
  },
  daysInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  daysLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  daysNumber: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 48,
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  titleContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  milestoneTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  xpContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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

export default EpicMilestoneUnlockModal;
