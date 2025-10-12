// src/components/dashboard/NextAchievement.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Lock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import tw, { quartzGradients } from '../../lib/tailwind';

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
      <Pressable onPress={handlePress} style={({ pressed }) => [pressed && tw`scale-[0.98]`]}>
        {/* Clean gradient card with subtle shadow */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.7)', 'rgba(250, 249, 247, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`rounded-2xl p-4`,
            {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            },
          ]}
        >
          <View style={tw`flex-row items-center justify-between`}>
            {/* Left side: Icon + Text */}
            <View style={tw`flex-row items-center flex-1`}>
              {/* Lock Icon */}
              <View
                style={[
                  tw`w-10 h-10 bg-sand-100 rounded-xl items-center justify-center mr-3`,
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                  },
                ]}
              >
                <Lock size={18} color="#a89885" />
              </View>

              {/* Text Content */}
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-bold text-sand-600 uppercase tracking-wide`}>NEXT ACHIEVEMENT</Text>
                <Text style={tw`text-sm font-bold text-stone-800 mt-0.5`}>{nextTitle.title}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <View style={tw`bg-sand-200 rounded-full px-2 py-0.5`}>
                    <Text style={tw`text-xs font-semibold text-sand-700`}>{xpToNextLevel} XP needed</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right side: Chevron indicator */}
            <View
              style={[
                tw`w-8 h-8 bg-sand-100 rounded-full items-center justify-center`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                },
              ]}
            >
              <ChevronRight size={16} color="#a89885" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default NextAchievement;
