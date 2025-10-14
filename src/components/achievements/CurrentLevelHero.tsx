import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';
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
  const percent = Math.min(100, Math.round((levelProgress / requiredXp) * 100));

  // Get the tier theme directly from utils
  const tierTheme = getAchievementTierTheme((currentTitle?.tier as AchievementTierName) || 'Novice');

  // Determine text colors based on gem type
  const getTextColors = (gemName: string) => {
    // Lighter gems need darker text for contrast
    if (['Crystal', 'Topaz'].includes(gemName)) {
      return {
        primary: 'text-stone-800',
        secondary: 'text-stone-700',
        badge: 'text-stone-800',
        badgeBg: 'bg-white/70',
      };
    }

    // Darker gems need lighter text
    return {
      primary: 'text-white',
      secondary: 'text-white/90',
      badge: 'text-white',
      badgeBg: 'bg-white/20',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && tw`opacity-95`]}>
      <View style={tw`rounded-3xl overflow-hidden mb-4 shadow-lg`}>
        {/* Gradient background */}
        <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl`}>
          {/* Texture overlay */}
          <ImageBackground source={tierTheme.texture} style={tw`rounded-3xl`} resizeMode="cover" imageStyle={{ opacity: 0.15 }}>
            <View style={tw`p-6`}>
              {/* Top Section: Title & Badge */}
              <View style={tw`flex-row items-center justify-between mb-4 relative`}>
                <View style={tw`flex-1 pr-20`}>
                  <Text style={[tw`text-xs font-semibold uppercase tracking-wider mb-1`, tw`${textColors.secondary}`]}>Current Achievement</Text>

                  <Text style={[tw`text-2xl font-black leading-tight`, tw`${textColors.primary}`]}>{currentTitle?.title || 'Newcomer'}</Text>

                  {/* Level & Gem badges */}
                  <View style={tw`flex-row items-center gap-2 mt-3`}>
                    <View style={[tw`rounded-full px-3 py-1 border`, tw`${textColors.badgeBg}`, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                      <Text style={[tw`text-xs font-bold`, tw`${textColors.badge}`]}>Level {currentLevel}</Text>
                    </View>

                    <View style={[tw`rounded-full px-3 py-1 border`, tw`${textColors.badgeBg}`, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}>
                      <Text style={[tw`text-xs font-bold`, tw`${textColors.badge}`]}>{tierTheme.gemName}</Text>
                    </View>
                  </View>
                </View>

                {/* Achievement Badge Image */}
                <View
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: '50%',
                    transform: [{ translateY: -50 }],
                  }}
                >
                  <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={100} showLock={false} />
                </View>
              </View>

              {/* Progress to next level */}
              {nextTitle && (
                <View style={tw`mt-2 mb-4`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={[tw`text-xs font-medium`, tw`${textColors.secondary}`]}>Progress to {nextTitle.title}</Text>
                    <View style={[tw`rounded-full px-2.5 py-0.5`, tw`${textColors.badgeBg}`, { borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1 }]}>
                      <Text style={[tw`font-bold text-xs`, tw`${textColors.badge}`]}>{percent}%</Text>
                    </View>
                  </View>

                  {/* Progress bar with tier accent color */}
                  <View
                    style={[
                      tw`h-5 rounded-full overflow-hidden`,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        borderWidth: 2,
                        borderColor: tierTheme.accent,
                      },
                    ]}
                  >
                    {percent > 0 && <View style={[tw`h-full rounded-full bg-white`, { width: `${percent}%` }]} />}
                  </View>
                </View>
              )}

              {/* Stats Section */}
              <View
                style={[
                  tw`flex-row justify-around pt-4 mt-2`,
                  {
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              >
                {/* Streak */}
                <View style={tw`items-center`}>
                  <Text style={[tw`text-xs font-medium mb-1`, tw`${textColors.secondary}`]}>Streak</Text>
                  <View style={[tw`rounded-xl px-3 py-1`, tw`${textColors.badgeBg}`]}>
                    <Text style={[tw`font-bold text-lg`, tw`${textColors.primary}`]}>{currentStreak}</Text>
                  </View>
                </View>

                {/* Perfect Days */}
                <View style={tw`items-center`}>
                  <Text style={[tw`text-xs font-medium mb-1`, tw`${textColors.secondary}`]}>Perfect Days</Text>
                  <View style={[tw`rounded-xl px-3 py-1`, tw`${textColors.badgeBg}`]}>
                    <Text style={[tw`font-bold text-lg`, tw`${textColors.primary}`]}>{perfectDays}</Text>
                  </View>
                </View>

                {/* Active Habits */}
                <View style={tw`items-center`}>
                  <Text style={[tw`text-xs font-medium mb-1`, tw`${textColors.secondary}`]}>Habits</Text>
                  <View style={[tw`rounded-xl px-3 py-1`, tw`${textColors.badgeBg}`]}>
                    <Text style={[tw`font-bold text-lg`, tw`${textColors.primary}`]}>{totalHabits}</Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </LinearGradient>
      </View>
    </Pressable>
  );
};
