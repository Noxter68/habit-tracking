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
  const progressPercentage = Math.min(Math.round((currentLevelXP / xpForNextLevel) * 100), 100);

  // Animate the width of the clipping container
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
        <Text style={tw`text-xs font-semibold text-quartz-500`}>Progress to Level {currentLevel + 1}</Text>
        <Text style={tw`text-xs font-bold text-quartz-600`}>
          {currentLevelXP}/{xpForNextLevel} XP
        </Text>
      </View>

      {/* Progress bar container */}
      <View style={tw`h-5 bg-quartz-100 rounded-full overflow-hidden border-2 border-quartz-400`}>
        {progressPercentage > 0 ? (
          <AnimatedView style={[tw`h-full rounded-full overflow-hidden`, animatedStyle]}>
            {/* Fixed width container for texture */}
            <View style={tw`h-full flex-row`}>
              <Image
                source={require('../../../assets/interface/quartz-texture-2.png')}
                style={{
                  height: '100%',
                  width: 500, // Fixed width larger than the full bar
                }}
                contentFit="cover"
              />
            </View>
          </AnimatedView>
        ) : (
          <View style={tw`h-full w-full bg-quartz-100`} />
        )}
      </View>

      {/* Remaining XP */}
      {xpToNextLevel > 0 && <Text style={tw`text-xs text-quartz-400 mt-1.5`}>{xpToNextLevel} XP to next level</Text>}
    </View>
  );
};

export default LevelProgress;
