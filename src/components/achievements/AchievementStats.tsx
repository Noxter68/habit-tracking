import React from 'react';
import { View, Text, Image } from 'react-native';
import tw from '../../lib/tailwind';

interface AchievementStatsProps {
  unlockedCount: number;
  totalCount: number;
  totalCompletions: number;
  totalXP: number;
}

export const AchievementStats: React.FC<AchievementStatsProps> = ({ unlockedCount, totalCount, totalCompletions, totalXP }) => {
  return (
    <View style={tw`flex-row justify-center gap-8`}>
      {/* Unlocked */}
      <View style={tw`items-center w-20`}>
        <Image source={require('../../../assets/achievements/level-panel.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
        <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>

      {/* Completions */}
      <View style={tw`items-center w-20`}>
        <Image source={require('../../../assets/achievements/achievement-panel.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
        <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>{totalCompletions}</Text>
      </View>

      {/* XP */}
      <View style={tw`items-center w-20`}>
        <Image source={require('../../../assets/achievements/xp.png')} style={{ width: 150, height: 60 }} resizeMode="contain" />
        <Text style={tw`text-lg font-bold text-achievement-amber-800 mt-1`}>{totalXP} XP</Text>
      </View>
    </View>
  );
};
