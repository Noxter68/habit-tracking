import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, SharedValue, AnimatedStyleProp, ViewStyle } from 'react-native-reanimated';
import tw from '../lib/tailwind';

const BreathingCircle: React.FC = () => {
  const scale: SharedValue<number> = useSharedValue(1);
  const opacity: SharedValue<number> = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.2, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1, false);

    opacity.value = withRepeat(withSequence(withTiming(0.6, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(0.3, { duration: 3000, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);

  const animatedStyle: AnimatedStyleProp<ViewStyle> = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const middleAnimatedStyle: AnimatedStyleProp<ViewStyle> = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value * 0.7,
  }));

  return (
    <View style={tw`items-center justify-center`}>
      {/* Outer circle */}
      <Animated.View style={[tw`absolute`, styles.outerCircle, animatedStyle]} />

      {/* Middle circle */}
      <Animated.View style={[tw`absolute`, styles.middleCircle, middleAnimatedStyle]} />

      {/* Inner circle */}
      <View style={[styles.innerCircle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  outerCircle: {
    width: 192,
    height: 192,
    backgroundColor: '#99F6E4', // teal-200
    borderRadius: 96,
  },
  middleCircle: {
    width: 144,
    height: 144,
    backgroundColor: '#5EEAD4', // teal-300
    borderRadius: 72,
  },
  innerCircle: {
    width: 96,
    height: 96,
    backgroundColor: '#2DD4BF', // teal-400
    borderRadius: 48,
    opacity: 0.4,
  },
});

export default BreathingCircle;
