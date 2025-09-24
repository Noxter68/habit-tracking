// src/components/dashboard/LevelProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';
import Animated, { withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';

interface LevelProgressProps {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, currentLevelXP, xpForNextLevel, levelProgress }) => {
  const xpToNextLevel = xpForNextLevel - currentLevelXP;
  console.log('LevelProgressProps', currentLevel, currentLevelXP, xpForNextLevel, levelProgress);
  return (
    <View style={tw`mb-4`}>
      <View style={tw`flex-row justify-between mb-1`}>
        <Text style={tw`text-xs font-semibold text-amber-700`}>Progress to Level {currentLevel + 1}</Text>
        <Text style={tw`text-xs font-bold text-amber-800`}>
          {currentLevelXP}/{xpForNextLevel} XP
        </Text>
      </View>

      <View style={tw`h-5 bg-amber-50 rounded-full overflow-hidden border border-amber-200`}>
        <Animated.View
          style={[
            tw`h-full`,
            {
              width: withSpring(`${levelProgress}%`, { damping: 15 }),
            },
          ]}
        >
          <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full rounded-full`} />
        </Animated.View>
      </View>

      {xpToNextLevel > 0 && <Text style={tw`text-xs text-amber-600 mt-1`}>{xpToNextLevel} XP to next level</Text>}
    </View>
  );
};

export default LevelProgress;
