// src/components/ui/AnimatedNumber.tsx
import React, { useEffect, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import Animated, { useSharedValue, withTiming, Easing, useAnimatedStyle } from 'react-native-reanimated';

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}

/**
 * Simple animated number component
 * No complex optimistic updates - just smooth number transitions
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, prefix = '', suffix = '', duration = 600, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const previousValue = displayValue;

    if (value !== previousValue) {
      const startValue = previousValue;
      const endValue = value;
      const startTime = Date.now();
      const isIncreasing = value > previousValue;

      // Faster animation for increases
      const animDuration = isIncreasing ? duration * 0.7 : duration;

      const animateNumber = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animDuration, 1);

        // If animation complete, set exact value FIRST then return
        if (progress >= 1) {
          setDisplayValue(endValue);
          return;
        }

        // Ease out quad for smooth deceleration
        const easedProgress = 1 - Math.pow(1 - progress, 2);

        const currentValue = startValue + (endValue - startValue) * easedProgress;
        setDisplayValue(currentValue);

        requestAnimationFrame(animateNumber);
      };

      // Quick flash on increase
      if (isIncreasing) {
        opacity.value = withTiming(0.6, {
          duration: 80,
          easing: Easing.out(Easing.ease),
        });
        setTimeout(() => {
          opacity.value = withTiming(1, {
            duration: 120,
            easing: Easing.in(Easing.ease),
          });
        }, 80);
      }

      animateNumber();
    }
  }, [value, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const formattedValue = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <Animated.View style={animatedStyle}>
      <Text style={style} allowFontScaling={false}>
        {prefix}
        {formattedValue}
        {suffix}
      </Text>
    </Animated.View>
  );
};

export default AnimatedNumber;
