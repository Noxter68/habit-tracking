// src/components/StreakCounter.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, FadeIn, interpolate } from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import tw from '../lib/tailwind';

interface StreakCounterProps {
  streak: number;
  isActive?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak = 0, isActive = false, size = 'small', showLabel = false }) => {
  const pulseAnimation = useSharedValue(0);

  // Determine streak level for styling
  const isEpic = streak >= 7 && streak < 30;
  const isLegendary = streak >= 30;
  const hasStreak = streak > 0;

  // Size configurations - cleaner, more minimal
  const sizeConfig = {
    small: {
      container: 'w-12 h-12',
      icon: 18,
      text: 'text-[11px]',
      label: 'text-[10px]',
      padding: 'p-2',
    },
    medium: {
      container: 'w-14 h-14',
      icon: 22,
      text: 'text-sm',
      label: 'text-xs',
      padding: 'p-2.5',
    },
    large: {
      container: 'w-18 h-18',
      icon: 26,
      text: 'text-base',
      label: 'text-sm',
      padding: 'p-3',
    },
  };

  const config = sizeConfig[size];

  // Simple pulse animation for active streaks
  React.useEffect(() => {
    if (hasStreak && (isEpic || isLegendary)) {
      // Gentle pulse for epic/legendary streaks
      pulseAnimation.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
    } else {
      pulseAnimation.value = 0;
    }
  }, [hasStreak, isEpic, isLegendary]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, isLegendary ? 1.08 : 1.05]);

    return {
      transform: [{ scale }],
    };
  });

  // Subtle glow animation for the background
  const animatedGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(pulseAnimation.value, [0, 1], [0.3, 0.6]);

    return {
      opacity: hasStreak && isEpic ? opacity : 0,
    };
  });

  // Gradient colors - more subtle and elegant
  const getGradientColors = (): [string, string, ...string[]] => {
    if (isLegendary) return ['#f59e0b', '#d97706', '#b45309']; // Deep amber-orange
    if (isEpic) return ['#fbbf24', '#f59e0b', '#d97706']; // Warm amber
    if (hasStreak) return ['#fde68a', '#fcd34d', '#fbbf24']; // Light amber
    return ['#f5f5f4', '#e7e5e4', '#d6d3d1']; // Neutral gray
  };

  // Border styling - minimal and clean
  const getBorderStyle = (): string => {
    if (isLegendary) return 'border-amber-600/50';
    if (isEpic) return 'border-amber-500/40';
    if (hasStreak) return 'border-amber-400/30';
    return 'border-gray-200/50';
  };

  // Icon and text colors
  const getIconColor = (): string => {
    if (isLegendary || isEpic) return '#ffffff';
    if (hasStreak) return '#d97706';
    return '#9ca3af';
  };

  const getTextColor = (): string => {
    if (isLegendary || isEpic) return 'text-white';
    if (hasStreak) return 'text-amber-800';
    return 'text-gray-400';
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <View style={tw`items-center`}>
        {/* Main container with subtle animations */}
        <Animated.View style={animatedContainerStyle}>
          <View style={tw`relative`}>
            {/* Subtle glow effect for epic/legendary - very minimal */}
            {(isEpic || isLegendary) && (
              <Animated.View style={[tw`absolute inset-0 ${config.container} rounded-xl`, animatedGlowStyle]} pointerEvents="none">
                <LinearGradient colors={isLegendary ? ['rgba(217, 119, 6, 0.2)', 'transparent'] : ['rgba(251, 191, 36, 0.15)', 'transparent']} style={tw`w-full h-full rounded-xl scale-110`} />
              </Animated.View>
            )}

            {/* Main rounded square container */}
            <LinearGradient
              colors={getGradientColors()}
              style={[
                tw`${config.container} rounded-xl items-center justify-center border ${getBorderStyle()} ${config.padding}`,
                {
                  shadowColor: hasStreak ? '#f59e0b' : '#000000',
                  shadowOffset: { width: 0, height: hasStreak ? 2 : 1 },
                  shadowOpacity: hasStreak ? 0.1 : 0.05,
                  shadowRadius: hasStreak ? 4 : 2,
                  elevation: hasStreak ? 3 : 1,
                },
              ]}
            >
              {/* Icon and number stacked vertically */}
              <View style={tw`items-center justify-center relative`}>
                <Flame size={config.icon} color={getIconColor()} strokeWidth={2} fill={hasStreak && (isEpic || isLegendary) ? getIconColor() : 'none'} />
              </View>
            </LinearGradient>

            {/* Badge indicator for any streak > 0 */}
            {streak > 0 && (
              <View style={tw`absolute -top-1 -right-1`}>
                <View style={tw`w-5 h-5 ${isLegendary ? 'bg-amber-500' : isEpic ? 'bg-amber-400' : 'bg-amber-300'} rounded-full flex items-center justify-center`}>
                  {isLegendary && <View style={tw`absolute inset-0 bg-amber-500 rounded-full animate-ping`} />}
                  <Text style={tw`text-[9px] font-bold text-white`}>{streak}</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Minimal label */}
        {showLabel && (
          <View style={tw`mt-2`}>
            <Text style={tw`${config.label} font-medium ${hasStreak ? 'text-gray-600' : 'text-gray-400'}`}>
              {isLegendary ? 'Legendary' : isEpic ? 'Epic' : hasStreak ? `${streak} days` : 'No streak'}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default StreakCounter;
