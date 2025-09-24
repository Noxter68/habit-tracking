// src/components/dashboard/FloatingXP.tsx
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';

interface FloatingXPProps {
  amount: number;
  show: boolean;
  onComplete?: () => void;
}

const FloatingXP: React.FC<FloatingXPProps> = ({ amount, show, onComplete }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSequence(
        withTiming(-60, { duration: 800 }),
        withTiming(-80, { duration: 400 }, () => {
          if (onComplete) {
            runOnJS(onComplete)();
          }
        })
      );
      opacity.value = withSequence(withTiming(1, { duration: 200 }), withDelay(800, withTiming(0, { duration: 400 })));
    } else {
      opacity.value = 0;
      translateY.value = 0;
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!show) return null;

  return (
    <Animated.View style={[tw`absolute top-0 right-4 z-50`, animatedStyle]}>
      <LinearGradient colors={['#f59e0b', '#d97706']} style={tw`px-4 py-2 rounded-full shadow-xl`}>
        <Text style={tw`text-white font-bold text-lg`}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default FloatingXP;
