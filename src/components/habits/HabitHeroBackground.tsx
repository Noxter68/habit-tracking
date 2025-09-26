// src/components/habits/HabitHeroBackground.tsx
import React from 'react';
import { View, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';

interface Props {
  tier: HabitTier;
  children: React.ReactNode;
}

export const HabitHeroBackground: React.FC<Props> = ({ tier, children }) => {
  const theme = tierThemes[tier];

  return (
    <ImageBackground source={theme.texture} style={tw`rounded-3xl p-5 overflow-hidden`} imageStyle={tw`rounded-3xl opacity-90`} resizeMode="cover">
      <LinearGradient colors={[theme.gradient[0] + 'cc', theme.gradient[1] + 'cc', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0 rounded-3xl`} />
      {children}
    </ImageBackground>
  );
};
