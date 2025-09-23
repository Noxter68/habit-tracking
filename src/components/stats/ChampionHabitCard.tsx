// src/components/stats/ChampionHabitCard.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';
import { StatsIcons } from '../icons/StatsIcons';

interface ChampionHabitCardProps {
  habit: {
    name: string;
    completedDays: string[];
    currentStreak: number;
  };
}

const ChampionHabitCard: React.FC<ChampionHabitCardProps> = ({ habit }) => {
  return (
    <LinearGradient colors={['#fbbf24', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-5`}>
      <View style={tw`flex-row items-start justify-between`}>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center mb-2`}>
            <View style={tw`w-8 h-8 bg-white/20 rounded-lg items-center justify-center mr-2`}>
              <StatsIcons.Star size={16} color="#ffffff" />
            </View>
            <Text style={tw`text-xs font-bold text-white/90 uppercase tracking-wide`}>Champion Habit</Text>
          </View>
          <Text style={tw`text-lg font-bold text-white mb-2`}>{habit.name}</Text>
          <View style={tw`flex-row gap-4`}>
            <View>
              <Text style={tw`text-2xl font-bold text-white`}>{habit.completedDays.length}</Text>
              <Text style={tw`text-xs text-white/80`}>Total Days</Text>
            </View>
            <View>
              <Text style={tw`text-2xl font-bold text-white`}>{habit.currentStreak}</Text>
              <Text style={tw`text-xs text-white/80`}>Current Streak</Text>
            </View>
          </View>
        </View>
        <View style={tw`w-16 h-16 bg-white/20 rounded-2xl items-center justify-center`}>
          <StatsIcons.Trophy size={32} color="#ffffff" />
        </View>
      </View>
    </LinearGradient>
  );
};

export default ChampionHabitCard;
