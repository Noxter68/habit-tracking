// src/components/dashboard/DashboardHeader.tsx
import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Trophy, TrendingUp, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../lib/tailwind';
import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  weekProgress: number;
  activeHabits: number;
  totalCompletions?: number;
}

// Achievement Badge Component
const AchievementBadge: React.FC<{ level: number; isUnlocked: boolean; size?: number }> = ({ level, isUnlocked, size = 60 }) => {
  const getImageSource = () => {
    if (!isUnlocked) {
      return require('../../../assets/achievements/locked.png');
    }

    const imageMap: { [key: number]: any } = {
      1: require('../../../assets/achievements/level-1.png'),
      2: require('../../../assets/achievements/level-2.png'),
      3: require('../../../assets/achievements/level-3.png'),
      4: require('../../../assets/achievements/level-4.png'),
      5: require('../../../assets/achievements/level-5.png'),
      6: require('../../../assets/achievements/level-6.png'),
      7: require('../../../assets/achievements/level-7.png'),
      8: require('../../../assets/achievements/level-8.png'),
      9: require('../../../assets/achievements/level-9.png'),
      10: require('../../../assets/achievements/level-10.png'),
      11: require('../../../assets/achievements/level-11.png'),
      12: require('../../../assets/achievements/level-12.png'),
      13: require('../../../assets/achievements/level-13.png'),
      14: require('../../../assets/achievements/level-14.png'),
      15: require('../../../assets/achievements/level-15.png'),
      16: require('../../../assets/achievements/level-16.png'),
      // 17: require('../../../assets/achievements/level-17.png'),
      // 18: require('../../../assets/achievements/level-18.png'),
      // 19: require('../../../assets/achievements/level-19.png'),
      // 20: require('../../../assets/achievements/level-20.png'),
      // 21: require('../../../assets/achievements/level-21.png'),
      // 22: require('../../../assets/achievements/level-22.png'),
      // 23: require('../../../assets/achievements/level-23.png'),
      // 24: require('../../../assets/achievements/level-24.png'),
      // 25: require('../../../assets/achievements/level-25.png'),
      // 26: require('../../../assets/achievements/level-26.png'),
      // 27: require('../../../assets/achievements/level-27.png'),
      // 28: require('../../../assets/achievements/level-28.png'),
      // 29: require('../../../assets/achievements/level-29.png'),
      // 30: require('../../../assets/achievements/level-30.png'),
    };

    return imageMap[level] || require('../../../assets/achievements/locked.png');
  };

  return (
    <Image
      source={getImageSource()}
      style={{
        width: size,
        height: size,
        opacity: isUnlocked ? 1 : 0.4,
      }}
      resizeMode="contain"
    />
  );
};

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
  const progressToNext = (completionsInCurrentLevel / 10) * 100;
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
          <Pressable style={({ pressed }) => [tw`bg-white rounded-2xl p-2 border border-gray-100 shadow-sm`, pressed && tw`opacity-95`]} onPress={() => navigation.navigate('Achievements' as never)}>
            <View style={tw`items-center`}>
              {/* Compact Achievement Icon - REDUCED SIZE HERE */}
              <View style={tw`mb-1`}>
                <AchievementBadge level={userLevel} isUnlocked={true} size={120} />
              </View>

              {/* Level and Progress Section */}
              <View style={tw`w-full items-center`}>
                {/* Current Level */}
                <View style={tw`flex-row items-center mb-1.5`}>
                  <Trophy size={12} color="#f59e0b" />
                  <Text style={tw`text-sm font-semibold text-gray-900 mx-1.5`}>Level {userLevel}</Text>
                  <View style={tw`bg-amber-50 rounded-full px-2 py-0.5`}>
                    <Text style={tw`text-xs font-medium text-amber-600`}>{currentTitle?.title}</Text>
                  </View>
                </View>
              </View>

              {/* Next Unlock Preview */}
              {nextTitle && (
                <View style={tw`bg-gray-50 rounded-xl px-2.5 py-1.5 mb-1.5 flex-row items-center`}>
                  <Lock size={10} color="#9ca3af" style={tw`mr-1.5`} />
                  <Text style={tw`text-xs text-gray-500`}>
                    Next: <Text style={tw`font-medium text-gray-700`}>{nextTitle.title}</Text>
                  </Text>
                </View>
              )}

              {/* Compact CTA Button */}
              <Pressable style={tw`bg-gray-800 rounded-full px-4 py-1.5 flex-row items-center`} onPress={() => navigation.navigate('Achievements' as never)}>
                <Trophy size={12} color="#fff" style={tw`mr-1.5`} />
                <Text style={tw`text-xs text-white font-medium`}>View Achievements</Text>
                <TrendingUp size={12} color="#fff" style={tw`ml-1.5`} />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default DashboardHeader;
