// src/components/ui/AnimatedNumber.tsx
import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: any;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, prefix = '', suffix = '' }) => {
  const previousValue = useRef(value);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Only animate when value actually changes and it's not the initial render
    if (previousValue.current !== value && previousValue.current !== 0) {
      // Determine direction based on increase/decrease
      const direction = value > previousValue.current ? -8 : 8;

      // Quick fade out + slide
      opacity.value = withSequence(
        withTiming(0, {
          duration: 100,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(1, {
          duration: 150,
          easing: Easing.in(Easing.ease),
        })
      );

      translateY.value = withSequence(
        withTiming(direction, {
          duration: 100,
          easing: Easing.out(Easing.ease),
        }),
        withTiming(0, {
          duration: 150,
          easing: Easing.out(Easing.cubic),
        })
      );
    }

    previousValue.current = value;
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style} allowFontScaling={false}>
        {prefix}
        {value}
        {suffix}
      </Text>
    </Animated.View>
  );
};

export default AnimatedNumber;
