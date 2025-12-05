/**
 * ConnectionToast.tsx
 *
 * Toast qui s'affiche en haut de l'écran quand il y a un problème de connexion
 * Avec animation de 3 points qui bougent pour indiquer une reconnexion en cours
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionToastProps {
  /** true pour afficher le toast */
  visible: boolean;
  /** Message à afficher (optionnel, défaut: "Problème de connexion") */
  message?: string;
}

/**
 * Composant de toast pour les problèmes de connexion
 * S'affiche en haut de l'écran avec une animation slide-down
 */
export const ConnectionToast: React.FC<ConnectionToastProps> = ({
  visible,
  message = 'Problème de connexion',
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  // Animation slide in/out
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : -100,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [visible, slideAnim]);

  // Animation des 3 points
  useEffect(() => {
    if (!visible) return;

    const animateDots = () => {
      // Séquence d'animation pour les 3 points
      Animated.loop(
        Animated.sequence([
          // Point 1
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Point 2
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Point 3
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          // Pause
          Animated.delay(200),
          // Reset tous les points
          Animated.parallel([
            Animated.timing(dot1Opacity, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(dot2Opacity, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(dot3Opacity, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateDots();

    return () => {
      dot1Opacity.setValue(0.3);
      dot2Opacity.setValue(0.3);
      dot3Opacity.setValue(0.3);
    };
  }, [visible, dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={18} color="#fff" style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.95)', // Rouge semi-transparent
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginHorizontal: 2,
  },
});
