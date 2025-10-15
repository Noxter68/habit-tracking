import React from 'react';
import { View, Text, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';

const getGemIcon = (tier: string) => {
  switch (tier) {
    case 'Ruby':
      return require('../../../assets/interface/gems/ruby-gem.png');
    case 'Amethyst':
      return require('../../../assets/interface/gems/amethyst-gem.png');
    case 'Crystal':
    default:
      return require('../../../assets/interface/gems/crystal-gem.png');
  }
};

interface CalendarHeaderProps {
  habit: Habit;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({ habit }) => {
  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  return (
    <ImageBackground source={theme.texture} style={tw`overflow-hidden`} imageStyle={tw`opacity-70`} resizeMode="cover">
      <LinearGradient colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-5 pt-6 pb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={tw`text-2xl font-bold text-white mb-1`}>Calendar</Text>
            <Text style={tw`text-sm text-white/80`}>Track your habit journey</Text>
          </View>
          <Image source={getGemIcon(tier.name)} style={tw`w-16 h-16`} resizeMode="contain" />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default CalendarHeader;
