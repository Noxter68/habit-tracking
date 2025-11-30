import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from '../shared/AchievementBadge';
import { getAchievementTierTheme } from '../../utils/tierTheme';

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

  // Special styling for Obsidian tier
  const isObsidian = tierTheme.gemName === 'Obsidian';

  // Text colors for gradient background with texture (like DashboardHeader)
  const textColors = {
    primary: 'text-white',
    secondary: 'text-white/80',
    badge: 'text-white',
    badgeBg: 'rgba(255, 255, 255, 0.3)',
    badgeBorder: 'rgba(255, 255, 255, 0.4)',
    separatorColor: 'rgba(255, 255, 255, 0.15)',
    progressBg: 'rgba(255, 255, 255, 0.2)',
    progressFill: '#FFFFFF',
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && tw`opacity-95`]}>
      <View
        style={[
          tw`rounded-2xl overflow-hidden mb-4`,
          {
            borderWidth: isObsidian ? 2 : 1.5,
            borderColor: isObsidian ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            shadowColor: isObsidian ? '#8b5cf6' : '#000',
            shadowOffset: { width: 0, height: isObsidian ? 12 : 8 },
            shadowOpacity: isObsidian ? 0.6 : 0.3,
            shadowRadius: isObsidian ? 24 : 20,
          },
        ]}
      >
        {/* Gradient background with tier colors */}
        <LinearGradient colors={tierTheme.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl`}>
          {/* Texture overlay */}
          <ImageBackground source={tierTheme.texture} resizeMode="cover" imageStyle={{ opacity: 0.2 }}>
            {/* Obsidian glow overlay */}
            {isObsidian && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                }}
              />
            )}
            {/* Dark overlay for better text readability */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isObsidian ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
              }}
            />
            <View style={tw`p-5`}>
              {/* Top Section: Title & Badge - Simplified */}
              <View style={tw`flex-row items-start justify-between mb-5`}>
                <View style={tw`flex-1 pr-16`}>
                  <Text
                    style={[
                      tw`text-xs font-semibold uppercase tracking-wide mb-1.5`,
                      tw`${textColors.secondary}`,
                      {
                        textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: isObsidian ? 8 : 4,
                      },
                    ]}
                  >
                    {t('achievements.currentAchievement')}
                  </Text>

                  <Text
                    style={[
                      tw`text-xl font-bold leading-tight mb-3`,
                      tw`${textColors.primary}`,
                      {
                        textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: isObsidian ? 12 : 8,
                      },
                    ]}
                  >
                    {currentTitle?.title || t('achievements.tiers.novice')}
                  </Text>

                  {/* Level badge only - simplified */}
                  <View style={tw`flex-row items-center gap-2`}>
                    <View
                      style={[
                        tw`rounded-lg px-3 py-1`,
                        {
                          backgroundColor: textColors.badgeBg,
                          borderWidth: 1,
                          borderColor: textColors.badgeBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          tw`text-xs font-semibold`,
                          tw`${textColors.badge}`,
                          {
                            textShadowColor: 'rgba(0, 0, 0, 0.3)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 3,
                          },
                        ]}
                      >
                        {t('achievements.level', { level: currentLevel })}
                      </Text>
                    </View>

                    <View style={[tw`h-1 w-1 rounded-full`, { backgroundColor: textColors.separatorColor }]} />

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
                  <View style={[tw`h-2 rounded-full overflow-hidden`, { backgroundColor: textColors.progressBg }]}>
                    {percent > 0 && <View style={[tw`h-full rounded-full`, { width: `${percent}%`, backgroundColor: textColors.progressFill }]} />}
                  </View>
                </View>
              )}

              {/* Stats Section - More spacious and minimal */}
              <View
                style={[
                  tw`flex-row justify-between pt-4`,
                  {
                    borderTopWidth: 1,
                    borderTopColor: textColors.separatorColor,
                  },
                ]}
              >
                {/* Streak */}
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-md font-medium mb-2`, tw`${textColors.secondary}`]}>{t('achievements.streak')}</Text>
                  <Text style={[tw`font-bold text-2xl`, tw`${textColors.primary}`]}>{currentStreak}</Text>
                </View>

                {/* Vertical separator */}
                <View style={[tw`w-px mx-2`, { backgroundColor: textColors.separatorColor }]} />

                {/* Perfect Days */}
                <View style={tw`items-center flex-1`}>
                  <Text style={[tw`text-md font-medium mb-2`, tw`${textColors.secondary}`]}>{t('achievements.perfectDays')}</Text>
                  <Text style={[tw`font-bold text-2xl`, tw`${textColors.primary}`]}>{perfectDays}</Text>
                </View>

                {/* Vertical separator */}
                <View style={[tw`w-px mx-2`, { backgroundColor: textColors.separatorColor }]} />

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
