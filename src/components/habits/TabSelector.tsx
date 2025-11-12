import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { HabitTier } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';

export type TabType = 'overview' | 'tiers';

interface TabSelectorProps {
  selected: TabType;
  onChange: (tab: TabType) => void;
  tier: HabitTier;
}

const TABS: TabType[] = ['overview', 'tiers'];

export const TabSelector: React.FC<TabSelectorProps> = ({ selected, onChange, tier }) => {
  const { t } = useTranslation();
  const theme = tierThemes[tier];

  return (
    <View style={tw`bg-sand rounded-2xl p-1.5 shadow-sm border border-stone-100`}>
      <View style={tw`flex-row`}>
        {TABS.map((tab) => {
          const isActive = selected === tab;

          return (
            <Pressable key={tab} onPress={() => onChange(tab)} style={tw`flex-1`}>
              {isActive ? (
                <ImageBackground source={theme.texture} style={tw`rounded-xl overflow-hidden`} imageStyle={tw`rounded-xl`} resizeMode="cover">
                  <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)']} style={tw`py-3 rounded-xl`}>
                    <Text style={tw`text-center font-bold text-white text-sm`}>{t(`habitDetails.tabs.${tab}`)}</Text>
                  </LinearGradient>
                </ImageBackground>
              ) : (
                <View style={tw`py-3`}>
                  <Text style={tw`text-center font-semibold text-sand-500 text-sm`}>{t(`habitDetails.tabs.${tab}`)}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
