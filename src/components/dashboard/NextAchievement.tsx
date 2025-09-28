// src/components/dashboard/NextAchievement.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Lock, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import tw from '../../lib/tailwind';

interface NextAchievementProps {
  nextTitle?: {
    title: string;
    level: number;
  };
  xpToNextLevel: number;
}

const NextAchievement: React.FC<NextAchievementProps> = ({ nextTitle, xpToNextLevel }) => {
  const navigation = useNavigation();

  if (!nextTitle) return null;

  const handlePress = () => {
    navigation.navigate('Achievements' as never);
  };

  return (
    <Animated.View entering={FadeIn.delay(300)}>
      <Pressable onPress={handlePress} style={({ pressed }) => [tw`mt-3`, pressed && tw`scale-[0.98]`]}>
        <LinearGradient colors={['rgba(243, 244, 246, 0.5)', 'rgba(229, 231, 235, 0.3)']} style={tw`rounded-2xl p-3 border border-quartz-200`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-10 h-10 bg-quartz-100 rounded-xl items-center justify-center mr-3`}>
                <Lock size={18} color="#6B7280" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold text-quartz-600 uppercase`}>NEXT: {nextTitle.title.toUpperCase()}</Text>
                <View style={tw`flex-row items-center mt-0.5`}>
                  <Text style={tw`text-xs text-quartz-500`}>{xpToNextLevel} XP needed</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default NextAchievement;
