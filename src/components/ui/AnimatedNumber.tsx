// src/components/ui/AnimatedNumber.tsx
import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: any;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, prefix = '', suffix = '' }) => {
  const previousValue = useRef(value);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Only animate when value actually changes and it's not the initial render
    if (previousValue.current !== value && previousValue.current !== 0) {
      // Quick, professional bounce: scale up to 1.15x then back to 1x
      scale.value = withSequence(
        withSpring(1.15, {
          damping: 12,
          stiffness: 180,
        }),
        withSpring(1, {
          damping: 15,
          stiffness: 150,
        })
      );
    }

    previousValue.current = value;
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style}>
        {prefix}
        {value}
        {suffix}
      </Text>
    </Animated.View>
  );
};

export default AnimatedNumber;
