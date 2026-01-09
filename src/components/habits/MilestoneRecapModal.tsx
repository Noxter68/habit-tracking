/**
 * MilestoneRecapModal.tsx
 *
 * Modal récapitulatif pour afficher plusieurs milestones débloqués.
 * Utilisé quand l'utilisateur a plusieurs milestones non vus à rattraper.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Modal, Pressable, Dimensions, StyleSheet, Image, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react-native';

import { getTranslatedMilestone } from '@/i18n/milestoneTranslations';
import tw from '@/lib/tailwind';

import type { HabitMilestone } from '@/services/habitProgressionService';

// =============================================================================
// CONSTANTES
// =============================================================================

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Couleurs du thème milestone (ambre/jaune) */
const MILESTONE_THEME = {
  accent: '#f59e0b',
  gradient: ['#fbbf24', '#f59e0b', '#d97706'] as const,
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
// TYPES
// =============================================================================

export interface MilestoneWithIndex {
  milestone: HabitMilestone;
  index: number;
}

export interface MilestoneRecapModalProps {
  visible: boolean;
  milestones: MilestoneWithIndex[];
  onClose: () => void;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const MilestoneRecapModal: React.FC<MilestoneRecapModalProps> = ({
  visible,
  milestones,
  onClose,
}) => {
  const { t, i18n } = useTranslation();
  const [countdown, setCountdown] = useState(10);
  const [isClosing, setIsClosing] = useState(false);

  // Refs pour les timers
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.8);

  /**
   * Nettoie tous les timers actifs
   */
  const clearAllTimers = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    // Éviter les fermetures multiples
    if (isClosing) return;
    setIsClosing(true);

    // Nettoyer tous les timers immédiatement
    clearAllTimers();

    cardOpacity.value = withTiming(0, { duration: 200 });
    cardScale.value = withTiming(0.8, { duration: 200 });

    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 200);
  }, [isClosing, clearAllTimers, onClose, cardOpacity, cardScale]);

  useEffect(() => {
    if (visible && milestones.length > 0) {
      // Réinitialisation de l'état de fermeture
      setIsClosing(false);

      cardOpacity.value = 0;
      cardScale.value = 0.8;
      setCountdown(10);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withSpring(1, { damping: 15, stiffness: 100 });

      // Countdown avec ref
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-close avec ref
      autoCloseTimeoutRef.current = setTimeout(() => {
        handleClose();
      }, 10000);

      return () => {
        clearAllTimers();
      };
    }
  }, [visible, milestones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  if (!visible || milestones.length === 0) return null;

  const totalXP = milestones.reduce((sum, m) => sum + m.milestone.xpReward, 0);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.backdrop} />

        <Pressable style={styles.container} onPress={handleClose} activeOpacity={1}>
          <Animated.View style={[styles.cardWrapper, cardStyle]}>
            <LinearGradient
              colors={[...MILESTONE_THEME.gradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBorder}
            >
              <View style={styles.card}>
                <LinearGradient
                  colors={['#fef3c7', '#fde68a', '#fcd34d']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.cardContent}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={styles.headerText}>
                      {t('milestoneRecap.title')}
                    </Text>
                    <Text style={styles.subHeaderText}>
                      {t('milestoneRecap.subtitle', { count: milestones.length })}
                    </Text>
                  </View>

                  {/* Milestones List */}
                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {milestones.map(({ milestone, index }, idx) => {
                      const translated = getTranslatedMilestone(
                        milestone.title,
                        i18n.language as 'en' | 'fr'
                      );

                      return (
                        <Animated.View
                          key={milestone.id || milestone.title}
                          entering={FadeInDown.delay(idx * 100).springify()}
                          style={styles.milestoneItem}
                        >
                          <View style={styles.milestoneIcon}>
                            <Image
                              source={tierIcons[index as keyof typeof tierIcons] || tierIcons[0]}
                              style={styles.iconImage}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.milestoneInfo}>
                            <Text style={styles.milestoneTitle} numberOfLines={1}>
                              {translated.title}
                            </Text>
                            <Text style={styles.milestoneDays}>
                              {t('milestoneRecap.day', { count: milestone.days })}
                            </Text>
                          </View>
                          <View style={styles.milestoneCheck}>
                            <CheckCircle2 size={24} color="#f59e0b" fill="#fef3c7" />
                          </View>
                        </Animated.View>
                      );
                    })}
                  </ScrollView>

                  {/* Total XP */}
                  <View style={styles.totalXpContainer}>
                    <Text style={styles.totalXpLabel}>{t('milestoneRecap.totalXp')}</Text>
                    <Text style={styles.totalXpValue}>+{totalXP} XP</Text>
                  </View>

                  {/* Close hint */}
                  <View style={styles.hintContainer}>
                    <Text style={styles.hint}>{t('milestoneRecap.tapToContinue')}</Text>
                    <Text style={styles.countdown}>
                      {t('milestoneRecap.closingIn', { seconds: countdown })}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  cardWrapper: {
    width: SCREEN_WIDTH - 40,
    maxWidth: 380,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  gradientBorder: {
    borderRadius: 26,
    padding: 3,
    width: '100%',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#92400e',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 4,
  },
  scrollView: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  scrollContent: {
    gap: 10,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  milestoneIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  milestoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78350f',
  },
  milestoneDays: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    marginTop: 2,
  },
  milestoneCheck: {
    marginLeft: 8,
  },
  totalXpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#92400e',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  totalXpLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fef3c7',
  },
  totalXpValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  countdown: {
    fontSize: 10,
    fontWeight: '500',
    color: '#b45309',
  },
});

export default MilestoneRecapModal;
