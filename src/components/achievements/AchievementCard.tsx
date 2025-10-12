import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
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
  // Use lighter gradient colors
  const unlockedGradient = ['#F3F4F6', '#E5E7EB', '#F9FAFB']; // quartz-50, quartz-100, near white
  const lockedGradient = ['#FAFAFA', '#F5F5F5', '#EEEEEE']; // very light grays

  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
      <Pressable onPress={() => onPress(achievement)} style={({ pressed }) => pressed && tw`scale-[0.98]`}>
        <LinearGradient
          colors={isUnlocked ? unlockedGradient : lockedGradient}
          style={tw`rounded-2xl p-3 items-center border ${isUnlocked ? 'border-quartz-200' : 'border-sand-200'} ${isFromBackend ? 'shadow-md' : 'shadow-sm'}`}
        >
          <AchievementBadge level={achievement.level} achievement={achievement} isUnlocked={isUnlocked} size={50} />

          <Text style={[tw`text-xs font-semibold text-center mt-2`, isUnlocked ? tw`text-quartz-700` : tw`text-sand-500`]} numberOfLines={2}>
            {achievement.title}
          </Text>

          <View style={tw`items-center mt-1`}>
            <View style={tw`rounded-full px-2 py-0.5 ${isUnlocked ? 'bg-quartz-300' : 'bg-stone-200'}`}>
              <Text style={tw`text-xs font-bold ${isUnlocked ? 'text-quartz-700' : 'text-sand-500'}`}>LVL {achievement.level}</Text>
            </View>
          </View>

          {isFromBackend && (
            <View style={tw`absolute top-1 right-1`}>
              <View style={tw`w-2 h-2 bg-teal-500 rounded-full`} />
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
