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
        <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.1)']} style={tw`rounded-2xl p-3 border border-amber-100`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-10 h-10 bg-amber-100 rounded-xl items-center justify-center mr-3`}>
                <Lock size={18} color="#d97706" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold text-amber-800`}>NEXT: {nextTitle.title.toUpperCase()}</Text>
                <View style={tw`flex-row items-center mt-0.5`}>
                  <Text style={tw`text-xs text-amber-700`}>{xpToNextLevel} XP needed</Text>
                </View>
              </View>
            </View>
            <TrendingUp size={16} color="#d97706" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default NextAchievement;
