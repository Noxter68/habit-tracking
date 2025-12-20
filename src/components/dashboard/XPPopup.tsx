/**
 * XPPopup.tsx
 *
 * Popup affichant le gain d'XP lors de la validation d'une tâche.
 * Gère jusqu'à 3 popups empilées avec animation smooth.
 * Style identique aux TaskCards du dashboard.
 */

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import tw from '@/lib/tailwind';

interface PopupData {
  id: number;
  taskName: string;
  xpAmount: number;
  accentColor: string;
}

interface XPPopupProps {
  visible: boolean;
  taskName: string;
  xpAmount: number;
  onHide: () => void;
  accentColor?: string;
}

interface SinglePopupProps {
  popup: PopupData;
  index: number;
  onComplete: (id: number) => void;
}

// Configuration spring pour animation fluide
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

// Composant interne pour chaque popup individuelle - optimisé pour 60fps
const SinglePopup: React.FC<SinglePopupProps> = memo(({ popup, index, onComplete }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const initialIndex = useRef(index);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hasAnimatedIn = useRef(false);

  const handleComplete = useCallback(() => {
    onComplete(popup.id);
  }, [onComplete, popup.id]);

  useEffect(() => {
    if (hasAnimatedIn.current) return;
    hasAnimatedIn.current = true;

    // Animation d'entrée avec spring pour fluidité
    const targetY = initialIndex.current * 70;

    // Délai minimal pour éviter le batching React
    requestAnimationFrame(() => {
      translateY.value = withSpring(targetY, SPRING_CONFIG);
      opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      scale.value = withSpring(1, SPRING_CONFIG);
    });

    // Auto-hide après 2 secondes
    timeoutRef.current = setTimeout(() => {
      translateY.value = withTiming(-100, {
        duration: 250,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.9, { duration: 200 });

      // Callback après animation de sortie
      setTimeout(() => {
        runOnJS(handleComplete)();
      }, 260);
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Mettre à jour la position quand l'index change (quand une popup disparaît)
  useEffect(() => {
    if (index !== initialIndex.current && hasAnimatedIn.current) {
      const targetY = index * 70;
      translateY.value = withSpring(targetY, {
        ...SPRING_CONFIG,
        stiffness: 400,
      });
      initialIndex.current = index;
    }
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.popupWrapper, animatedStyle]}>
      <View
        style={[
          styles.popup,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderBottomWidth: 3,
            borderBottomColor: popup.accentColor + '50',
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: 1,
            borderLeftColor: 'rgba(255, 255, 255, 0.5)',
            borderRightColor: 'rgba(255, 255, 255, 0.5)',
            borderTopColor: 'rgba(255, 255, 255, 0.5)',
            shadowColor: popup.accentColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        <View style={tw`flex-row items-center px-4 py-3`}>
          {/* Icône XP */}
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
              { backgroundColor: popup.accentColor + '20' },
            ]}
          >
            <Zap size={20} color={popup.accentColor} fill={popup.accentColor} />
          </View>

          {/* Contenu */}
          <View style={tw`flex-1 mr-3`}>
            <Text numberOfLines={1} style={tw`text-stone-500 text-xs font-medium`}>
              {popup.taskName}
            </Text>
          </View>

          {/* XP Amount */}
          <View
            style={[
              tw`px-3 py-1.5 rounded-lg`,
              { backgroundColor: popup.accentColor + '15' },
            ]}
          >
            <Text style={[tw`text-base font-black`, { color: popup.accentColor }]}>
              +{popup.xpAmount} XP
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
});

export const XPPopup: React.FC<XPPopupProps> = ({
  visible,
  taskName,
  xpAmount,
  onHide,
  accentColor = '#3b82f6',
}) => {
  const [popups, setPopups] = React.useState<PopupData[]>([]);
  const popupIdRef = useRef(0);
  const lastVisibleRef = useRef(false);

  // Détecter une nouvelle popup (quand visible passe de false à true)
  useEffect(() => {
    if (visible && !lastVisibleRef.current) {
      // Nouvelle popup à ajouter
      const newPopup: PopupData = {
        id: popupIdRef.current++,
        taskName,
        xpAmount,
        accentColor,
      };

      setPopups((prev) => {
        // Maximum 3 popups, supprimer la plus ancienne si nécessaire
        const updated = [...prev, newPopup];
        if (updated.length > 3) {
          return updated.slice(-3);
        }
        return updated;
      });

      // Appeler onHide immédiatement pour réinitialiser le parent
      // Les popups gèrent leur propre cycle de vie
      requestAnimationFrame(() => {
        onHide();
      });
    }
    lastVisibleRef.current = visible;
  }, [visible, taskName, xpAmount, accentColor, onHide]);

  const handlePopupComplete = useCallback((id: number) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  if (popups.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {popups.map((popup, index) => (
        <SinglePopup
          key={popup.id}
          popup={popup}
          index={index}
          onComplete={handlePopupComplete}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  popupWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  popup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default XPPopup;
