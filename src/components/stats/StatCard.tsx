// src/components/stats/StatCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import tw from '../../lib/tailwind';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, color, bgColor }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[tw`bg-white rounded-2xl p-4 shadow-sm border border-slate-100`, animatedStyle]}>
        <View style={tw`w-12 h-12 ${bgColor} rounded-xl items-center justify-center mb-3`}>{icon}</View>
        <Text style={tw`text-2xl font-bold text-slate-900`}>{value}</Text>
        <Text style={tw`text-xs text-slate-500 mt-1`}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

export default StatCard;
