import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { TierInfo, HabitMilestone } from '@/services/habitProgressionService';

interface TierCardProps {
  tierInfo: TierInfo;
  currentStreak: number;
  nextMilestone: HabitMilestone | null;
}

export const TierCard: React.FC<TierCardProps> = ({ tierInfo, currentStreak, nextMilestone }) => {
  if (!tierInfo) return null;
  return (
    <View>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <View>
          <Text style={tw`text-stone-100 text-xs font-bold uppercase tracking-wider`}>Current Tier</Text>
          <Text style={tw`text-white font-black text-2xl mt-1`}>
            {tierInfo.icon} {tierInfo.name}
          </Text>
          <Text style={tw`text-stone-50/80 text-xs mt-1`}>{tierInfo.description}</Text>
        </View>
        <View style={tw`bg-sand/20 rounded-2xl px-4 py-3`}>
          <Text style={tw`text-white font-black text-2xl`}>{currentStreak}</Text>
          <Text style={tw`text-stone-100 text-xs font-semibold`}>days</Text>
        </View>
      </View>

      {/* Next Milestone */}
      {nextMilestone && (
        <View style={tw`bg-black/15 rounded-xl p-3`}>
          <Text style={tw`text-stone-50 text-sm`}>
            {nextMilestone.days - currentStreak} days until {nextMilestone.title}
          </Text>
          <Text style={tw`text-stone-100 font-bold text-xs mt-1`}>
            Reward: +{nextMilestone.xpReward} XP {nextMilestone.badge}
          </Text>
        </View>
      )}
    </View>
  );
};
