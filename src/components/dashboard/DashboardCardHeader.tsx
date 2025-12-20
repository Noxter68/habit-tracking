/**
 * DashboardCardHeader.tsx
 *
 * Header compact pour les cartes d'habitudes sur le Dashboard.
 * Affiche le nom de l'habitude, puis sur une ligne: Streak, Milestone, Gem, Chevron
 */

import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { ChevronRight, Flame } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { HabitTier } from '@/services/habitProgressionService';
import { getTierIcon } from '@/utils/tierIcons';

interface DashboardCardHeaderProps {
  habitName: string;
  tierName: HabitTier;
  currentStreak: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  unlockedMilestonesCount: number;
  onNavigate: () => void;
}

/**
 * Retourne l'icone de gemme selon le tier
 */
const getGemIcon = (tier: string) => {
  switch (tier) {
    case 'Obsidian':
      return require('../../../assets/interface/gems/obsidian-gem.png');
    case 'Topaz':
      return require('../../../assets/interface/gems/topaz-gem.png');
    case 'Jade':
      return require('../../../assets/interface/gems/jade-gem.png');
    case 'Amethyst':
      return require('../../../assets/interface/gems/amethyst-gem.png');
    case 'Ruby':
      return require('../../../assets/interface/gems/ruby-gem.png');
    case 'Crystal':
    default:
      return require('../../../assets/interface/gems/crystal-gem.png');
  }
};

export const DashboardCardHeader: React.FC<DashboardCardHeaderProps> = ({
  habitName,
  tierName,
  currentStreak,
  unlockedMilestonesCount,
  onNavigate,
}) => {
  return (
    <View style={tw`mb-3`}>
      {/* Row 1: Badges container + Chevron - En haut */}
      <View style={tw`flex-row items-center justify-between mb-2`}>
        {/* Badges: Streak | Milestone | Gem */}
        <View
          style={[
            tw`flex-row items-center py-2 px-3 rounded-xl`,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          {/* Streak Badge */}
          <View style={tw`flex-row items-center`}>
            <View
              style={[
                tw`w-7 h-7 rounded-lg items-center justify-center mr-1.5`,
                { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
              ]}
            >
              <Flame size={16} color="#FFFFFF" strokeWidth={2} fill="rgba(255, 255, 255, 0.4)" />
            </View>
            <Text style={tw`text-lg font-black text-white`}>{currentStreak}</Text>
          </View>

          {/* Separator */}
          <View style={[tw`w-px h-6 mx-3`, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

          {/* Milestone Icon */}
          <View
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center`,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
          >
            {unlockedMilestonesCount > 0 ? (
              <Image source={getTierIcon(unlockedMilestonesCount)} style={tw`w-6 h-6`} resizeMode="contain" />
            ) : (
              <Text style={tw`text-white/50 text-xs font-bold`}>-</Text>
            )}
          </View>

          {/* Separator */}
          <View style={[tw`w-px h-6 mx-3`, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />

          {/* Tier Gem */}
          <View
            style={[
              tw`w-8 h-8 rounded-lg items-center justify-center`,
              { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            ]}
          >
            <Image source={getGemIcon(tierName)} style={tw`w-6 h-6`} resizeMode="contain" />
          </View>
        </View>

        {/* Navigate Button - Badge séparé */}
        <Pressable
          onPress={onNavigate}
          style={({ pressed }) => [
            tw`w-10 h-10 rounded-xl items-center justify-center`,
            {
              backgroundColor: pressed ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      {/* Row 2: Habit Name */}
      <Text numberOfLines={1} style={tw`text-lg font-black text-white`}>
        {habitName}
      </Text>
    </View>
  );
};

export default DashboardCardHeader;
