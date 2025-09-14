// src/components/CheckAnimation.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, runOnJS, Easing } from 'react-native-reanimated';
import tw from '../lib/tailwind';

interface CheckAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const CheckAnimation: React.FC<CheckAnimationProps> = ({ isVisible, onComplete }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Start animation sequence
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(withSpring(1.2, { damping: 10, stiffness: 100 }), withSpring(1, { damping: 10, stiffness: 100 }));
      checkScale.value = withSequence(withTiming(0, { duration: 100 }), withSpring(1.2, { damping: 8, stiffness: 80 }), withSpring(1, { damping: 10, stiffness: 100 }));
      rotation.value = withSequence(withTiming(15, { duration: 100, easing: Easing.out(Easing.cubic) }), withSpring(0, { damping: 10, stiffness: 100 }));

      // Hide after animation
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        });
        scale.value = withTiming(0.8, { duration: 300 });
      }, 1500);
    } else {
      scale.value = 0;
      opacity.value = 0;
      checkScale.value = 0;
      rotation.value = 0;
    }
  }, [isVisible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  if (!isVisible) return null;

  return (
    <View style={tw`absolute inset-0 items-center justify-center z-50 pointer-events-none`}>
      <Animated.View style={[tw`w-32 h-32 bg-teal-500 rounded-full items-center justify-center shadow-lg`, containerStyle]}>
        <Animated.Text style={[tw`text-white text-6xl`, checkStyle]}>✓</Animated.Text>
      </Animated.View>
    </View>
  );
};

export default CheckAnimation;
