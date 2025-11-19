import React from 'react';
import { View, Text, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  return (
    <ImageBackground source={theme.texture} style={tw`overflow-hidden`} imageStyle={tw`opacity-70`} resizeMode="cover">
      <LinearGradient colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-5 pt-3 pb-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View>
            <Text style={tw`text-3xl font-black text-white mb-0.5`}>{t('calendar.title')}</Text>
            <Text style={tw`text-sm font-bold text-white/80`}>{t('calendar.trackYourJourney')}</Text>
          </View>
          <Image source={getGemIcon(tier.name)} style={tw`w-14 h-14`} resizeMode="contain" />
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default CalendarHeader;
