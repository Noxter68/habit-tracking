import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import ProgressBar from '@/components/ui/ProgressBar';
import { TierInfo } from '@/services/habitProgressionService';
import { HabitHeroBackground } from '@/components/habits/HabitHeroBackground';

interface HabitHeroProps {
  habitName: string;
  habitType: 'good' | 'bad';
  category: string;
  currentStreak: number;
  bestStreak: number;
  tierInfo: TierInfo;
  nextTier: TierInfo | null;
  tierProgress: number;
  tierMultiplier: number;
  totalXPEarned: number;
  completionRate: number;
}

export const HabitHero: React.FC<HabitHeroProps> = ({ habitName, habitType, category, currentStreak, bestStreak, tierInfo, nextTier, tierProgress, tierMultiplier, totalXPEarned, completionRate }) => {
  if (!tierInfo) return null;
  return (
    <HabitHeroBackground tier={tierInfo?.name || 'Crystal'}>
      <View style={tw`absolute inset-0 opacity-10`}>
        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-full h-full`} />
      </View>
      {/* Content without big circle */}
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-1 pr-4`}>
          <Text style={tw`text-white/80 text-xs font-bold uppercase tracking-wider`}>{habitType === 'good' ? 'Building' : 'Breaking'}</Text>
          <Text style={tw`text-white text-2xl font-black mt-1`} numberOfLines={1}>
            {habitName}
          </Text>

          <View style={tw`flex-row items-center gap-2 mt-2.5`}>
            <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
              <Text style={tw`text-white text-xs font-bold`}>
                {tierInfo.icon} {tierInfo.name}
              </Text>
            </View>
            <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
              <Text style={tw`text-white text-xs font-bold`}>{category}</Text>
            </View>
            {tierMultiplier > 1 && (
              <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                <Text style={tw`text-white text-xs font-bold`}>×{tierMultiplier.toFixed(1)} XP</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {/* Progress bar */}
      {nextTier && (
        <View style={tw`mt-4`}>
          <View style={tw`flex-row justify-between mb-1.5`}>
            <Text style={tw`text-white/80 text-xs font-semibold`}>Progress to {nextTier.name}</Text>
            <Text style={tw`text-white font-bold text-xs`}>{Math.round(tierProgress)}%</Text>
          </View>
          <ProgressBar progress={tierProgress} theme="crystal" height={20} width={200} />
        </View>
      )}
      {/* Stats */}
      <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-white/20`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Streak</Text>
          <Text style={tw`text-white font-black text-xl`}>{currentStreak}</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Best</Text>
          <Text style={tw`text-white font-black text-xl`}>{bestStreak}</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Total XP</Text>
          <Text style={tw`text-white font-black text-xl`}>{totalXPEarned}</Text>
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Consistency</Text>
          <Text style={tw`text-white font-black text-xl`}>{completionRate}%</Text>
        </View>
      </View>
    </HabitHeroBackground>
  );
};
