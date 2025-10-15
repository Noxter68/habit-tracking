// src/components/habits/HabitHero.tsx

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import ProgressBar from '@/components/ui/ProgressBar';
import { TierInfo } from '@/services/habitProgressionService';
import { HabitHeroBackground } from '@/components/habits/HabitHeroBackground';
import { Image } from 'expo-image';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

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

  // Create a sync key that changes when either streak updates
  // This forces both animations to trigger together
  const streakSyncKey = useMemo(() => `${currentStreak}-${bestStreak}`, [currentStreak, bestStreak]);

  // Get the correct gem icon based on tier
  const getGemIcon = () => {
    switch (tierInfo.name) {
      case 'Ruby':
        return require('../../../assets/interface/gems/ruby-gem.png');
      case 'Amethyst':
        return require('../../../assets/interface/gems/amethyst-gem.png');
      case 'Crystal':
      default:
        return require('../../../assets/interface/gems/crystal-gem.png');
    }
  };

  return (
    <HabitHeroBackground tier={tierInfo?.name || 'Crystal'}>
      <View style={tw`absolute inset-0 opacity-10`}>
        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-full h-full`} />
      </View>

      {/* Gem Icon in Top Right */}
      <View style={tw`absolute top-2 right-3 z-10`}>
        <View style={tw``}>
          <Image source={getGemIcon()} style={tw`w-20 h-20`} contentFit="contain" />
        </View>
      </View>

      {/* Content */}
      <View style={tw`flex-row items-center justify-between`}>
        <View style={tw`flex-1 pr-16`}>
          <Text style={tw`text-white/80 text-xs font-bold uppercase tracking-wider`}>{habitType === 'good' ? 'Building' : 'Breaking'}</Text>
          <Text style={tw`text-white text-2xl font-black mt-1`} numberOfLines={1}>
            {habitName}
          </Text>
          <View style={tw`flex-row items-center gap-2 mt-2.5`}>
            <View style={tw`bg-sand/25 rounded-xl px-2.5 py-1`}>
              <Text style={tw`text-white text-xs font-bold`}>{tierInfo.name}</Text>
            </View>
            <View style={tw`bg-sand/25 rounded-xl px-2.5 py-1`}>
              <Text style={tw`text-white text-xs font-bold`}>{category}</Text>
            </View>
            {tierMultiplier > 1 && (
              <View style={tw`bg-sand/25 rounded-xl px-2.5 py-1`}>
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
          <ProgressBar progress={tierProgress} height={20} width={200} tier={tierInfo.name.toLowerCase() as 'crystal' | 'ruby' | 'amethyst'} />
        </View>
      )}

      {/* Stats - All Animated */}
      <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-white/20`}>
        <View style={tw`items-center`} key={`streak-${streakSyncKey}`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Streak</Text>
          <AnimatedNumber value={currentStreak} style={tw`text-white font-black text-xl`} />
        </View>
        <View style={tw`items-center`} key={`best-${streakSyncKey}`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Best</Text>
          <AnimatedNumber value={bestStreak} style={tw`text-white font-black text-xl`} />
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Total XP</Text>
          <AnimatedNumber value={totalXPEarned} style={tw`text-white font-black text-xl`} />
        </View>
        <View style={tw`items-center`}>
          <Text style={tw`text-white/80 text-xs font-semibold`}>Consistency</Text>
          <AnimatedNumber value={completionRate} style={tw`text-white font-black text-xl`} suffix="%" />
        </View>
      </View>
    </HabitHeroBackground>
  );
};
