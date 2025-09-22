// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { Trophy, TrendingUp, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';

import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import AchievementBadge from '../icons/AchievementsIcon';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  weekProgress: number;
  activeHabits: number;
  totalCompletions?: number;
}

// Motivational messages that rotate
const getMotivationalMessage = () => {
  const messages = [
    'Every habit shapes your destiny',
    'Consistency creates champions',
    'Small steps lead to giant leaps',
    'Your journey, your pace, your victory',
    'Building greatness, one day at a time',
    'Progress is progress, no matter how small',
    "You're stronger than yesterday",
    'Keep going, greatness awaits',
    "Today's effort is tomorrow's strength",
    'Rise and conquer your day',
  ];

  const today = new Date().getDate();
  return messages[today % messages.length];
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userTitle, userLevel, totalStreak, weekProgress, activeHabits, totalCompletions = 0 }) => {
  const navigation = useNavigation();
  const greeting = getGreeting();
  const motivationalMessage = getMotivationalMessage();
  const currentTitle = achievementTitles.find((t) => t.level === userLevel);
  const nextTitle = achievementTitles.find((t) => t.level === userLevel + 1);

  // Calculate progress to next level (10 completions per level)
  const completionsInCurrentLevel = totalCompletions % 10;
  const progressToNext = (completionsInCurrentLevel / 10) * 100; // percentage
  const completionsNeeded = 10 - completionsInCurrentLevel;

  return (
    <View style={tw`bg-white`}>
      <View style={tw`px-5 pt-5 pb-6 border-b border-gray-100`}>
        {/* Top Section - Greeting with Title */}
        <Animated.View entering={FadeIn.duration(400)} style={tw`mb-5`}>
          {/* Greeting + Title on same line */}
          <View style={tw`flex-row items-center justify-center flex-wrap mb-3`}>
            <Text style={tw`text-lg font-semibold text-gray-700 mr-2`}>{greeting},</Text>

            {/* Simple Clean Title Badge */}
            <View style={tw`bg-gray-100 rounded-full px-4 py-1.5`}>
              <Text style={tw`text-sm font-bold text-gray-900 uppercase tracking-wide`}>{userTitle}</Text>
            </View>
          </View>

          {/* Motivational Quote - More prominent */}
          <View style={tw`bg-gray-50 rounded-2xl px-4 py-3 mx-2`}>
            <Text style={tw`text-sm text-gray-600 text-center font-medium`}>💫 {motivationalMessage}</Text>
          </View>
        </Animated.View>

        {/* Bottom Section - Enhanced Achievement Display */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={tw`w-full`}>
          <Pressable
            style={({ pressed }) => [tw`bg-gradient-to-b from-white to-gray-50 rounded-3xl p-4 border border-gray-200 shadow-sm`, pressed && tw`scale-98`]}
            onPress={() => navigation.navigate('Achievements' as never)}
          >
            <View style={tw`items-center`}>
              {/* Large Achievement Icon */}
              <View style={tw`mb-3`}>
                <AchievementBadge level={userLevel} title={currentTitle?.title || userTitle} isUnlocked={true} size={72} />
              </View>

              {/* Level and Progress Section */}
              <View style={tw`w-full items-center mb-3`}>
                {/* Current Level */}
                <View style={tw`flex-row items-center mb-2`}>
                  <Trophy size={14} color="#f59e0b" />
                  <Text style={tw`text-base font-bold text-gray-900 mx-2`}>Level {userLevel}</Text>
                  <View style={tw`bg-amber-100 rounded-full px-2 py-0.5`}>
                    <Text style={tw`text-xs font-semibold text-amber-700`}>{currentTitle?.title}</Text>
                  </View>
                </View>

                {/* Progress Bar to Next Level */}
                {nextTitle && (
                  <View style={tw`w-full px-4`}>
                    <View style={tw`flex-row justify-between mb-1`}>
                      <Text style={tw`text-xs text-gray-500`}>Progress</Text>
                      <Text style={tw`text-xs text-gray-500 font-medium`}>
                        {completionsNeeded} more to Level {userLevel + 1}
                      </Text>
                    </View>

                    <View style={tw`h-2 bg-gray-200 rounded-full overflow-hidden`}>
                      <LinearGradient colors={['#fbbf24', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progressToNext}%` }]} />
                    </View>
                  </View>
                )}
              </View>

              {/* Next Unlock Preview */}
              {nextTitle && (
                <View style={tw`bg-gray-50 rounded-2xl px-3 py-2 mb-3 flex-row items-center`}>
                  <Lock size={12} color="#9ca3af" style={tw`mr-2`} />
                  <Text style={tw`text-xs text-gray-600`}>
                    Next: <Text style={tw`font-semibold`}>{nextTitle.title}</Text>
                  </Text>
                </View>
              )}

              {/* CTA Button */}
              <Pressable style={tw`bg-gray-900 rounded-full px-5 py-2 flex-row items-center`} onPress={() => navigation.navigate('Achievements' as never)}>
                <Trophy size={14} color="#fff" style={tw`mr-2`} />
                <Text style={tw`text-sm text-white font-semibold`}>View All Achievements</Text>
                <TrendingUp size={14} color="#fff" style={tw`ml-2`} />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default DashboardHeader;
