// src/components/dashboard/LevelProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  // Use Math.floor instead of Math.round to avoid rounding up at 99.x%
  // Also clamp between 0 and 99 to ensure bar is never completely full until level up
  const progressPercentage = Math.min(Math.floor((currentLevelXP / xpForNextLevel) * 100), 99);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${progressPercentage}%`, {
        damping: 15,
        stiffness: 100,
      }),
    };
  });

  return (
    <View style={tw`mb-4`}>
      {/* Header */}
      <View style={tw`flex-row justify-between mb-1.5`}>
        <Text style={tw`text-xs font-semibold text-sage-600`}>Progress to Level {currentLevel + 1}</Text>
        <Text style={tw`text-xs font-bold text-sage-700`}>
          {currentLevelXP}/{xpForNextLevel} XP
        </Text>
      </View>

      {/* Progress bar container */}
      <View style={tw`h-5 bg-sage-50 rounded-full overflow-hidden border border-sage-200`}>
        <AnimatedView style={[tw`h-full rounded-full overflow-hidden bg-sage-400`, animatedStyle]}>
          {/* Texture overlay (optional) */}
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
    </View>
  );
};

export default LevelProgress;
