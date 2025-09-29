// src/components/dashboard/LevelProgress.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, interpolate } from 'react-native-reanimated';
import { Image } from 'expo-image';
import tw from '../../lib/tailwind';

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
        <View style={tw`h-5 bg-sage-50/50 rounded-full`} />
      </View>
    );
  }

  return (
    <Animated.View style={[tw`mb-4`, animatedContainerStyle]}>
      {/* Header */}
      <View style={tw`flex-row justify-between mb-1.5`}>
        <Text style={tw`text-xs font-semibold text-sage-600`}>Progress to Level {currentLevel + 1}</Text>
        <Text style={tw`text-xs font-bold text-sage-700`}>
          {currentLevelXP}/{xpForNextLevel} XP
        </Text>
      </View>

      {/* Progress bar container */}
      <View style={tw`h-5 bg-sage-50 rounded-full overflow-hidden border border-sage-200`}>
        <AnimatedView style={[tw`h-full rounded-full overflow-hidden bg-sage-400`, animatedBarStyle]}>
          {/* Texture overlay */}
          <View style={tw`h-full flex-row`}>
            <Image
              source={require('../../../assets/interface/quartz-texture.png')}
              style={{
                height: '100%',
                width: 320, // Wider to ensure coverage
              }}
              contentFit="cover"
            />
          </View>
        </AnimatedView>
      </View>

      {/* Remaining XP */}
      {xpToNextLevel > 0 && <Text style={tw`text-xs text-sage-500 mt-1.5`}>{xpToNextLevel} XP to next level</Text>}
    </Animated.View>
  );
};

export default LevelProgress;
