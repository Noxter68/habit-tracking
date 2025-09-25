// src/components/StreakCounter.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, FadeIn } from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import tw from '../lib/tailwind';

interface StreakCounterProps {
  streak: number;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak = 0, isActive = false, size = 'small', showLabel = false }) => {
  const fireScale = useSharedValue(1);
  const fireRotation = useSharedValue(0);

  // Determine streak level
  const isEpic = streak >= 7 && streak < 30;
  const isLegendary = streak >= 30;
  const hasStreak = streak > 0;

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-12 h-12',
      innerContainer: 'w-10 h-10',
      icon: 20,
      text: 'text-xs',
      label: 'text-[10px]',
      padding: 'p-2',
    },
    medium: {
      container: 'w-16 h-16',
      innerContainer: 'w-14 h-14',
      icon: 24,
      text: 'text-sm',
      label: 'text-xs',
      padding: 'p-3',
    },
    large: {
      container: 'w-20 h-20',
      innerContainer: 'w-18 h-18',
      icon: 28,
      text: 'text-base',
      label: 'text-sm',
      padding: 'p-4',
    },
  };

  const config = sizeConfig[size];

  // Animate fire for epic/legendary streaks
  React.useEffect(() => {
    if (isEpic || isLegendary) {
      // Pulsing animation
      fireScale.value = withRepeat(withSequence(withTiming(1.15, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1, true);

      // Subtle rotation for legendary
      if (isLegendary) {
        fireRotation.value = withRepeat(withSequence(withTiming(-5, { duration: 2000 }), withTiming(5, { duration: 2000 })), -1, true);
      }
    } else {
      fireScale.value = withSpring(1);
      fireRotation.value = withSpring(0);
    }
  }, [isEpic, isLegendary]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }, { rotate: `${fireRotation.value}deg` }],
  }));

  // Gradient colors based on streak level
  const getGradientColors = (): string[] => {
    if (isLegendary) return ['#dc2626', '#991b1b', '#7f1d1d']; // Red gradient
    if (isEpic) return ['#f59e0b', '#d97706', '#b45309']; // Orange gradient
    if (hasStreak) return ['#fbbf24', '#f59e0b', '#d97706']; // Amber gradient
    return ['#e5e7eb', '#d1d5db', '#9ca3af']; // Gray gradient
  };

  // Icon color based on streak
  const getIconColor = (): string => {
    if (isLegendary) return '#ffffff';
    if (isEpic) return '#ffffff';
    if (hasStreak) return '#ffffff';
    return '#6b7280';
  };

  // Text color based on streak
  const getTextColor = (): string => {
    if (hasStreak) return 'text-white';
    return 'text-gray-500';
  };

  return (
    <Animated.View entering={FadeIn.springify()}>
      <View style={tw`items-center`}>
        <Animated.View style={animatedStyle}>
          <View style={tw`${config.container} relative`}>
            {/* Outer glow for epic/legendary */}
            {(isEpic || isLegendary) && (
              <View style={tw`absolute inset-0 rounded-full`}>
                <LinearGradient
                  colors={isLegendary ? ['rgba(220, 38, 38, 0.3)', 'rgba(220, 38, 38, 0.1)', 'transparent'] : ['rgba(245, 158, 11, 0.3)', 'rgba(245, 158, 11, 0.1)', 'transparent']}
                  style={tw`w-full h-full rounded-full`}
                />
              </View>
            )}

            {/* Main container */}
            <LinearGradient
              colors={getGradientColors()}
              style={tw`${config.container} rounded-full items-center justify-center border-2 ${
                isLegendary ? 'border-red-600' : isEpic ? 'border-amber-600' : hasStreak ? 'border-amber-500' : 'border-gray-300'
              }`}
            >
              {/* Inner container with icon and number */}
              <View style={tw`items-center justify-center`}>
                <Flame size={config.icon} color={getIconColor()} strokeWidth={2} fill={hasStreak ? getIconColor() : 'none'} />
                {streak > 0 && <Text style={tw`${config.text} font-black ${getTextColor()} absolute`}>{streak}</Text>}
              </View>
            </LinearGradient>

            {/* Legendary sparkles */}
            {isLegendary && (
              <>
                <View style={tw`absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full`} />
                <View style={tw`absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full`} />
                <View style={tw`absolute top-1/2 -left-1 w-1.5 h-1.5 bg-yellow-300 rounded-full`} />
                <View style={tw`absolute top-1/2 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full`} />
              </>
            )}
          </View>
        </Animated.View>

        {/* Label */}
        {showLabel && (
          <View style={tw`mt-1`}>
            <Text style={tw`${config.label} font-semibold ${hasStreak ? 'text-gray-700' : 'text-gray-400'}`}>
              {isLegendary ? 'Legendary!' : isEpic ? 'Epic Streak!' : hasStreak ? 'Streak' : 'No Streak'}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default StreakCounter;
