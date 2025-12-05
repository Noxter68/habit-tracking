/**
 * ConnectionToast.tsx
 *
 * Toast style Duolingo qui s'affiche en haut de l'écran quand il y a un problème de connexion
 * Card rectangulaire avec profondeur et animation slide-down
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ConnectionToastProps {
  /** true pour afficher le toast */
  visible: boolean;
}

/**
 * Composant de toast pour les problèmes de connexion
 * Style Duolingo avec card rectangulaire et profondeur
 */
export const ConnectionToast: React.FC<ConnectionToastProps> = ({ visible }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const dot1Opacity = useRef(new Animated.Value(0.4)).current;
  const dot2Opacity = useRef(new Animated.Value(0.4)).current;
  const dot3Opacity = useRef(new Animated.Value(0.4)).current;

  // Animation slide in/out (de haut vers le bas)
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -150,
      useNativeDriver: true,
      tension: 65,
      friction: 10,
    }).start();
  }, [visible, slideAnim]);

  // Animation des 3 points
  useEffect(() => {
    if (!visible) return;

    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          // Point 1
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          // Point 2
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          // Point 3
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          // Pause
          Animated.delay(300),
          // Reset tous les points
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.4,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.4,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.4,
              duration: 150,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateDots();

    return () => {
      dot1Opacity.setValue(0.4);
      dot2Opacity.setValue(0.4);
      dot3Opacity.setValue(0.4);
    };
  }, [visible, dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + 12,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Card avec effet de profondeur style Duolingo */}
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-offline" size={20} color="#fff" />
          </View>
          <Text style={styles.text}>{t('common.connectionError')}</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardShadow: {
    // Effet de profondeur style Duolingo (bordure basse plus foncée)
    backgroundColor: '#b91c1c', // Rouge plus foncé pour l'ombre
    borderRadius: 16,
    paddingBottom: 4, // Crée l'effet de profondeur
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444', // Rouge principal
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
});
