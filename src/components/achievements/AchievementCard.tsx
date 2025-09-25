import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw, { achievementGradients } from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isFromBackend: boolean;
  index: number;
  onPress: (achievement: Achievement) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isUnlocked, isFromBackend, index, onPress }) => {
  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
      <Pressable onPress={() => onPress(achievement)} style={({ pressed }) => pressed && tw`scale-[0.95]`}>
        <LinearGradient
          colors={isUnlocked ? achievementGradients?.unlocked?.card || ['#fef3c7', '#fde68a'] : achievementGradients?.locked?.card || ['#e5e5e5', '#d4d4d4']}
          style={tw`rounded-2xl p-3 items-center border ${isUnlocked ? 'border-achievement-amber-200' : 'border-gray-200'} ${isFromBackend ? 'shadow-lg' : ''}`}
        >
          <AchievementBadge level={achievement.level} achievement={achievement} isUnlocked={isUnlocked} size={50} />

          <Text style={[tw`text-xs font-semibold text-center mt-2`, isUnlocked ? tw`text-achievement-amber-900` : tw`text-gray-600`]} numberOfLines={2}>
            {achievement.title}
          </Text>

          <View style={tw`items-center mt-1`}>
            <View style={tw`rounded-full px-2 py-0.5 ${isUnlocked ? 'bg-achievement-amber-800' : 'bg-gray-300'}`}>
              <Text style={tw`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>LVL {achievement.level}</Text>
            </View>
          </View>

          {isFromBackend && (
            <View style={tw`absolute top-1 right-1`}>
              <View style={tw`w-2 h-2 bg-green-500 rounded-full`} />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
