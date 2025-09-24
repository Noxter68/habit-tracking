import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground } from 'expo-image';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';
import { getTierGradient } from '../../utils/achievements';

interface CurrentLevelHeroProps {
  currentLevel: number;
  currentTitle: Achievement | undefined;
  nextTitle: Achievement | undefined;
  levelProgress: number;
  currentStreak: number;
  perfectDays: number;
  totalHabits: number;
  onPress: () => void;
}

export const CurrentLevelHero: React.FC<CurrentLevelHeroProps> = ({ currentLevel, currentTitle, nextTitle, levelProgress, currentStreak, perfectDays, totalHabits, onPress }) => {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient colors={getTierGradient(currentTitle?.tier || 'Novice', true)} style={tw`rounded-3xl p-5 mb-4`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-1`}>
            <Text style={tw`text-achievement-amber-600 text-xs font-semibold uppercase tracking-wider`}>Current Achievement</Text>
            <Text style={tw`text-achievement-amber-800 text-2xl font-black mt-1`}>{currentTitle?.title || 'Newcomer'}</Text>
            <View style={tw`flex-row items-center gap-2 mt-2`}>
              <View style={tw`bg-white/20 rounded-full px-2 py-0.5`}>
                <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>Level {currentLevel}</Text>
              </View>
              <View style={tw`bg-white/20 rounded-full px-2 py-0.5`}>
                <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>{currentTitle?.tier || 'Novice'}</Text>
              </View>
            </View>
          </View>
          <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={80} showLock={false} />
        </View>

        {/* Progress to next level */}
        {nextTitle && (
          <View style={tw`mt-2`}>
            <View style={tw`flex-row justify-between mb-1`}>
              <Text style={tw`text-amber-800/80 text-xs`}>Progress to {nextTitle.title}</Text>
              <Text style={tw`text-amber-800 font-bold text-xs`}>{Math.round(levelProgress)}%</Text>
            </View>

            <View style={tw`h-5 rounded-full overflow-hidden`}>
              <ImageBackground source={require('../../../assets/interface/rope.png')} style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]} />
            </View>
          </View>
        )}

        {/* Backend Stats */}
        <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-amber-400`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Streak</Text>
            <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{currentStreak}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Perfect Days</Text>
            <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{perfectDays}</Text>
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Active Habits</Text>
            <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{totalHabits}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};
