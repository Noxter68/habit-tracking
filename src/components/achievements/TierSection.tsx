import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sparkles, Trophy } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Achievement, TierName, UserAchievement } from '../../types/achievement.types';
import { AchievementCard } from './AchievementCard';
import { getTierGradient } from '../../utils/achievements';

interface TierSectionProps {
  tierName: TierName;
  tierIndex: number;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isAchievementUnlocked: (achievement: Achievement) => boolean;
  onAchievementPress: (achievement: Achievement) => void;
}

export const TierSection: React.FC<TierSectionProps> = ({ tierName, tierIndex, achievements, userAchievements, isAchievementUnlocked, onAchievementPress }) => {
  const tierUnlockedCount = achievements.filter((a) => isAchievementUnlocked(a)).length;
  const tierTotalCount = achievements.length;
  const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
  const isCompleted = tierUnlockedCount === tierTotalCount;

  return (
    <Animated.View entering={FadeInDown.delay(tierIndex * 100).springify()} style={tw`mb-6`}>
      {/* Tier Header */}
      <LinearGradient
        colors={getTierGradient(tierName, isCompleted)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`mx-2 rounded-2xl p-4 mb-3 border ${isCompleted ? 'border-achievement-amber-300' : 'border-gray-200'}`}
      >
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <View style={tw`flex-row items-center gap-2`}>
            {isCompleted && <Sparkles size={18} color="#92400e" />}
            <Text style={tw`text-base font-bold ${isCompleted ? 'text-achievement-amber-900' : 'text-gray-700'}`}>{tierName}</Text>
          </View>

          <View style={tw`flex-row items-center gap-2`}>
            <Text style={tw`text-sm font-semibold ${isCompleted ? 'text-achievement-amber-800' : 'text-gray-600'}`}>
              {tierUnlockedCount}/{tierTotalCount}
            </Text>
            {isCompleted && <Trophy size={16} color="#d97706" />}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`h-1.5 bg-black/10 rounded-full overflow-hidden`}>
          <View style={[tw`h-full ${isCompleted ? 'bg-white' : 'bg-gray-400'} rounded-full`, { width: `${progress}%` }]} />
        </View>
      </LinearGradient>

      {/* Achievement Cards */}
      <View style={tw`flex-row flex-wrap justify-between px-2`}>
        {achievements.map((achievement, index) => {
          const isUnlocked = isAchievementUnlocked(achievement);
          const isFromBackend = userAchievements.some((ua) => ua?.title === achievement.title);

          return <AchievementCard key={achievement.title} achievement={achievement} isUnlocked={isUnlocked} isFromBackend={isFromBackend} index={index} onPress={onAchievementPress} />;
        })}
      </View>
    </Animated.View>
  );
};
