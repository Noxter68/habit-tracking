// src/components/dashboard/LevelProgress.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import tw, { quartzGradients } from '../../lib/tailwind';

interface LevelProgressProps {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
}

const AnimatedView = Animated.View;

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, currentLevelXP, xpForNextLevel, levelProgress }) => {
  const xpToNextLevel = Math.max(0, xpForNextLevel - currentLevelXP);

  // Use shared value for smooth transitions
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Calculate progress percentage with safety checks
  const calculateProgress = () => {
    if (!xpForNextLevel || xpForNextLevel <= 0) return 0;
    const rawProgress = (currentLevelXP / xpForNextLevel) * 100;
    // Clamp between 0 and 99.9 to ensure bar is never completely full until level up
    return Math.min(Math.max(0, rawProgress), 99.9);
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    // Only animate if we have valid data
    if (xpForNextLevel > 0) {
      // Fade in the component
      opacity.value = withTiming(1, { duration: 300 });

      // Animate progress after a slight delay to prevent flashing
      setTimeout(() => {
        progress.value = withSpring(progressPercentage, {
          damping: 15,
          stiffness: 100,
          mass: 1,
        });
      }, 100);
    } else {
      // If no data, keep at 0 without animation
      opacity.value = 0;
      progress.value = 0;
    }
  }, [progressPercentage, xpForNextLevel]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Don't render if we don't have valid data
  if (!xpForNextLevel || xpForNextLevel <= 0) {
    return (
      <View style={tw`mb-4 h-12`}>
        {/* Placeholder with same height to prevent layout shift */}
        <View style={tw`h-5 bg-sand-100 rounded-full`} />
      </View>
    );
  }

  return (
    <Animated.View style={[animatedContainerStyle]}>
      {/* Header */}
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <Text style={tw`text-xs font-semibold text-sand-700`}>Progress to Level {currentLevel + 1}</Text>
        <View style={tw`bg-white/70 rounded-full px-2.5 py-0.5`}>
          <Text style={tw`text-xs font-bold text-stone-700`}>
            {currentLevelXP}/{xpForNextLevel} XP
          </Text>
        </View>
      </View>

      {/* Progress bar container with subtle shadow */}
      <View
        style={[
          tw`h-5 rounded-full overflow-hidden`,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <AnimatedView style={[tw`h-full rounded-full overflow-hidden`, animatedBarStyle]}>
          {/* Clean white gradient fill */}
          <LinearGradient colors={['#ffffff', 'rgba(255, 255, 255, 0.95)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full w-full`} />
        </AnimatedView>
      </View>

      {/* Remaining XP */}
      {xpToNextLevel > 0 && <Text style={tw`text-xs text-sand-600 mt-1.5 text-center`}>{xpToNextLevel} XP to next level</Text>}
    </Animated.View>
  );
};

export default LevelProgress;
