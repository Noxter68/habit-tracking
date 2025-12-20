/**
 * XPPopup.tsx
 *
 * Popup affichant le gain d'XP lors de la validation d'une tâche.
 * Apparaît depuis le haut de l'écran avec une animation smooth.
 * Style identique aux TaskCards du dashboard.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import tw from '@/lib/tailwind';

interface XPPopupProps {
  visible: boolean;
  taskName: string;
  xpAmount: number;
  onHide: () => void;
  accentColor?: string;
}

export const XPPopup: React.FC<XPPopupProps> = ({
  visible,
  taskName,
  xpAmount,
  onHide,
  accentColor = '#3b82f6',
}) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animation d'entrée - simple et smooth
      translateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto-hide après 1.8 secondes
      const timeout = setTimeout(() => {
        translateY.value = withTiming(-100, {
          duration: 200,
          easing: Easing.in(Easing.cubic),
        });
        opacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        });
      }, 1800);

      return () => clearTimeout(timeout);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.popup,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            // 3D border effect - même style que DashboardTaskItem
            borderBottomWidth: 3,
            borderBottomColor: accentColor + '40',
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderTopWidth: 1,
            borderLeftColor: 'rgba(255, 255, 255, 0.4)',
            borderRightColor: 'rgba(255, 255, 255, 0.4)',
            borderTopColor: 'rgba(255, 255, 255, 0.4)',
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        <View style={tw`flex-row items-center px-4 py-3`}>
          {/* Icône XP */}
          <View
            style={[
              tw`w-9 h-9 rounded-xl items-center justify-center mr-3`,
              { backgroundColor: accentColor + '20' },
            ]}
          >
            <Zap size={20} color={accentColor} fill={accentColor} />
          </View>

          {/* Contenu */}
          <View style={tw`flex-1 mr-3`}>
            <Text numberOfLines={1} style={tw`text-stone-500 text-xs font-medium`}>
              {taskName}
            </Text>
          </View>

          {/* XP Amount */}
          <View
            style={[
              tw`px-3 py-1.5 rounded-lg`,
              { backgroundColor: accentColor + '15' },
            ]}
          >
            <Text style={[tw`text-base font-black`, { color: accentColor }]}>
              +{xpAmount} XP
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
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
  popup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default XPPopup;
