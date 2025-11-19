import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from '../shared/AchievementBadge';
import { getAchievementTierTheme, AchievementTierName } from '../../utils/tierTheme';

interface CurrentLevelHeroProps {
  currentLevel: number;
  currentTitle: Achievement | undefined;
  nextTitle: Achievement | undefined;
  levelProgress: number;
  requiredXp: number;
  currentStreak: number;
  perfectDays: number;
  totalHabits: number;
  onPress: () => void;
}

export const CurrentLevelHero: React.FC<CurrentLevelHeroProps> = ({ currentLevel, currentTitle, nextTitle, levelProgress, requiredXp, currentStreak, perfectDays, totalHabits, onPress }) => {
  const { t } = useTranslation();
  const percent = Math.min(100, Math.round((levelProgress / requiredXp) * 100));

  // Get the tier theme directly from utils using tierKey
  const tierTheme = getAchievementTierTheme(currentTitle?.tierKey || 'novice');

  // Determine text colors based on gem type
  const getTextColors = (gemName: string) => {
    // Lighter gems need darker text for contrast
    if (['Crystal', 'Topaz', 'Ruby', 'Amethyst', 'Jade', 'Obsidian'].includes(gemName)) {
      return {
        primary: 'text-white',
        secondary: 'text-white/80',
        badge: 'text-white',
        badgeBg: 'bg-white/15',
        statBg: 'bg-white/10',
      };
    }

    // Darker gems need lighter text
    return {
      primary: 'text-stone-800',
      secondary: 'text-stone-600',
      badge: 'text-stone-800',
      badgeBg: 'bg-white/50',
      statBg: 'bg-white/30',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && tw`opacity-95`]}>
      <View style={tw`rounded-2xl overflow-hidden mb-4`}>
        {/* Subtle gradient background */}
        <LinearGradient colors={[tierTheme.gradient[0], tierTheme.gradient[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl`}>
          {/* Texture overlay - more subtle */}
          <ImageBackground source={tierTheme.texture} style={tw`rounded-2xl`} resizeMode="cover" imageStyle={{ opacity: 0.1 }}>
            <View style={tw`p-5`}>
              {/* Top Section: Title & Badge - Simplified */}
              <View style={tw`flex-row items-start justify-between mb-5`}>
                <View style={tw`flex-1 pr-16`}>
                  <Text style={[tw`text-xs font-semibold uppercase tracking-wide mb-1.5`, tw`${textColors.secondary}`]}>{t('achievements.currentAchievement')}</Text>

                  <Text style={[tw`text-xl font-bold leading-tight mb-3`, tw`${textColors.primary}`]}>{currentTitle?.title || t('achievements.tiers.novice')}</Text>

                  {/* Level badge only - simplified */}
                  <View style={tw`flex-row items-center gap-2`}>
                    <View style={[tw`rounded-lg px-3 py-1`, tw`${textColors.badgeBg}`]}>
                      <Text style={[tw`text-xs font-semibold`, tw`${textColors.badge}`]}>{t('achievements.level', { level: currentLevel })}</Text>
                    </View>

                    <View style={[tw`h-1 w-1 rounded-full`, { backgroundColor: 'rgba(255, 255, 255, 0.4)' }]} />

                    <Text style={[tw`text-xs font-medium`, tw`${textColors.secondary}`]}>{tierTheme.gemName}</Text>
                  </View>
                </View>

                {/* Achievement Badge - Slightly smaller */}
                <View style={tw`absolute right-0 top-0`}>
                  <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={90} showLock={false} />
                </View>
              </View>

              {/* Progress to next level - Cleaner design */}
              {nextTitle && (
                <View style={tw`mb-5`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={[tw`text-xs font-medium`, tw`${textColors.secondary}`]}>{t('achievements.next', { title: nextTitle.title })}</Text>
                    <Text style={[tw`font-semibold text-xs`, tw`${textColors.primary}`]}>{percent}%</Text>
                  </View>

                  {/* Minimalist progress bar */}
                  <View style={[tw`h-2 rounded-full overflow-hidden`, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    {percent > 0 && <View style={[tw`h-full rounded-full bg-white`, { width: `${percent}%` }]} />}
                  </View>
                </View>
              )}

              {/* Stats Section - More spacious and minimal */}
              <View
                style={[
                  tw`flex-row justify-between pt-4`,
                  {
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.15)',
                  },
                ]}
              >
                {/* Streak */}
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-md font-medium mb-2`, tw`${textColors.secondary}`]}>{t('achievements.streak')}</Text>
                  <Text style={[tw`font-bold text-2xl`, tw`${textColors.primary}`]}>{currentStreak}</Text>
                </View>

                {/* Vertical separator */}
                <View style={[tw`w-px mx-2`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />

                {/* Perfect Days */}
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-md font-medium mb-2`, tw`${textColors.secondary}`]}>{t('achievements.perfectDays')}</Text>
                  <Text style={[tw`font-bold text-2xl`, tw`${textColors.primary}`]}>{perfectDays}</Text>
                </View>

                {/* Vertical separator */}
                <View style={[tw`w-px mx-2`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} />

                {/* Active Habits */}
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-md font-medium mb-2`, tw`${textColors.secondary}`]}>{t('achievements.habits')}</Text>
                  <Text style={[tw`font-bold text-2xl`, tw`${textColors.primary}`]}>{totalHabits}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </LinearGradient>
      </View>
    </Pressable>
  );
};
