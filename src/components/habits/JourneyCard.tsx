import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Activity } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { HabitTier } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';

interface JourneyCardProps {
  overallProgress: number;
  completedDays: number;
  totalDays: number;
  bestStreak: number;
  perfectDays: number;
  consistency: number;
  tier: HabitTier; // 🔹 NEW: Pass the current tier
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ overallProgress, completedDays, totalDays, bestStreak, perfectDays, consistency, tier }) => {
  const theme = tierThemes[tier];

  return (
    <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
      <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Journey Progress</Text>

      {/* Progress Bar */}
      <View style={tw`mb-4`}>
        <View style={tw`flex-row justify-between mb-2`}>
          <Text style={tw`text-sm text-gray-600`}>Overall Completion</Text>
          <Text style={[tw`text-sm font-bold`, { color: theme.accent }]}>{Math.round(overallProgress)}%</Text>
        </View>
        <View style={tw`h-4 bg-gray-100 rounded-full overflow-hidden`}>
          <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${overallProgress}%` }]} />
        </View>
        <Text style={tw`text-xs text-gray-500 mt-1`}>
          {completedDays} of {totalDays} days
        </Text>
      </View>

      {/* Stats */}
      <View style={tw`flex-row justify-between pt-4 border-t border-gray-100`}>
        {/* Best Streak */}
        <View style={tw`items-center flex-1`}>
          <View style={[tw`rounded-xl p-2 mb-2`, { backgroundColor: theme.accent + '22' }]}>
            <Trophy size={20} color={theme.accent} />
          </View>
          <Text style={tw`text-2xl font-black text-gray-900`}>{bestStreak}</Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>Best Streak</Text>
        </View>

        {/* Perfect Days */}
        <View style={tw`items-center flex-1`}>
          <View style={[tw`rounded-xl p-2 mb-2`, { backgroundColor: theme.accent + '22' }]}>
            <Star size={20} color={theme.accent} />
          </View>
          <Text style={tw`text-2xl font-black text-gray-900`}>{perfectDays}</Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>Perfect Days</Text>
        </View>

        {/* Consistency */}
        <View style={tw`items-center flex-1`}>
          <View style={[tw`rounded-xl p-2 mb-2`, { backgroundColor: theme.accent + '22' }]}>
            <Activity size={20} color={theme.accent} />
          </View>
          <Text style={tw`text-2xl font-black text-gray-900`}>{consistency}%</Text>
          <Text style={tw`text-xs text-gray-500 mt-1`}>Consistency</Text>
        </View>
      </View>
    </View>
  );
};
