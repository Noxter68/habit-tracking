// src/components/dashboard/StatsCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import tw from '../../lib/tailwind';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  subtitle?: string;
  highlight?: boolean;
  isStreak?: boolean;
  streakValue?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon: Icon, subtitle, highlight = false, isStreak = false, streakValue = 0 }) => {
  const fireScale = useSharedValue(1);

  React.useEffect(() => {
    if (isStreak && streakValue >= 7) {
      fireScale.value = withRepeat(withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    }
  }, [isStreak, streakValue]);

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const getGradientColors = () => {
    if (isStreak && streakValue >= 30) return ['#dc2626', '#991b1b']; // Legendary
    if (isStreak && streakValue >= 7) return ['#f59e0b', '#d97706']; // Epic
    if (highlight) return ['#fef3c7', '#fed7aa'];
    return ['#ffffff', '#fef3c7'];
  };

  const getTextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white';
    return 'text-gray-900';
  };

  const getSubtextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white opacity-90';
    return 'text-amber-600';
  };

  return (
    <LinearGradient colors={getGradientColors()} style={[tw`flex-1 rounded-2xl p-3`, (!isStreak || streakValue < 7) && tw`border border-amber-200`]}>
      <View style={tw`flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-xs font-medium ${isStreak && streakValue >= 7 ? 'text-white opacity-90' : 'text-amber-700'}`}>{label}</Text>
          <Text style={tw`text-xl font-black ${getTextColors()}`}>{value}</Text>
        </View>
        {Icon && (
          <Animated.View style={isStreak && streakValue >= 7 ? fireAnimatedStyle : undefined}>
            <View style={tw`w-10 h-10 ${isStreak && streakValue >= 7 ? 'bg-white bg-opacity-20' : 'bg-amber-200 bg-opacity-50'} rounded-xl items-center justify-center`}>
              <Icon size={24} color={isStreak && streakValue >= 7 ? '#fff' : '#d97706'} />
            </View>
          </Animated.View>
        )}
      </View>
      {subtitle && <Text style={tw`text-xs ${getSubtextColors()} mt-1`}>{subtitle}</Text>}
      {isStreak && streakValue >= 7 && <Text style={tw`text-xs font-bold text-white opacity-90 mt-1`}>{streakValue >= 30 ? 'LEGENDARY!' : 'ON FIRE!'}</Text>}
    </LinearGradient>
  );
};

export default StatsCard;
