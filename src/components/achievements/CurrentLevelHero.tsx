/**
 * CurrentLevelHero.tsx
 *
 * Current level hero section with Duolingo 3D depth style.
 */

import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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

export const CurrentLevelHero: React.FC<CurrentLevelHeroProps> = ({
  currentLevel,
  currentTitle,
  nextTitle,
  levelProgress,
  requiredXp,
  currentStreak,
  perfectDays,
  totalHabits,
  onPress,
}) => {
  const { t } = useTranslation();
  const pressed = useSharedValue(0);
  const percent = Math.min(100, Math.round((levelProgress / requiredXp) * 100));

  const tierTheme = getAchievementTierTheme(currentTitle?.tierKey || 'novice');
  const isObsidian = tierTheme.gemName === 'Obsidian';

  // Darker shade for 3D depth
  const shadowColor = tierTheme.gradient[2] || tierTheme.gradient[1];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 4 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.5,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 100 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 100 });
      }}
      style={{ position: 'relative' }}
    >
      {/* Shadow/depth layer - Duolingo 3D style */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 5,
            left: 0,
            right: 0,
            bottom: -5,
            backgroundColor: shadowColor,
            borderRadius: 24,
          },
          shadowStyle,
        ]}
      />

      {/* Main card */}
      <Animated.View
        style={[
          {
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: isObsidian ? 2 : 2,
            borderColor: isObsidian ? 'rgba(139, 92, 246, 0.5)' : tierTheme.gradient[0],
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={tierTheme.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ImageBackground
            source={tierTheme.texture}
            resizeMode="cover"
            imageStyle={{ opacity: 0.15 }}
          >
            {/* Obsidian special glow */}
            {isObsidian && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                }}
              />
            )}

            <View style={tw`p-5`}>
              {/* Top Section: Title & Badge */}
              <View style={tw`flex-row items-start justify-between mb-5`}>
                <View style={tw`flex-1 pr-20`}>
                  <Text
                    style={[
                      tw`text-xs font-semibold uppercase tracking-wide mb-1.5 text-white/70`,
                      {
                        textShadowColor: 'rgba(0, 0, 0, 0.5)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 4,
                      },
                    ]}
                  >
                    {t('achievements.currentAchievement')}
                  </Text>

                  <Text
                    style={[
                      tw`text-xl font-bold leading-tight mb-3 text-white`,
                      {
                        textShadowColor: 'rgba(0, 0, 0, 0.6)',
                        textShadowOffset: { width: 0, height: 2 },
                        textShadowRadius: 8,
                      },
                    ]}
                  >
                    {currentTitle?.title || t('achievements.tiers.novice')}
                  </Text>

                  {/* Level & Tier badges */}
                  <View style={tw`flex-row items-center gap-2`}>
                    {/* Level badge with 3D effect */}
                    <View style={{ position: 'relative' }}>
                      <View
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 0,
                          right: 0,
                          bottom: -2,
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 10,
                        }}
                      />
                      <View
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: '#FFFFFF',
                          }}
                        >
                          {t('achievements.level', { level: currentLevel })}
                        </Text>
                      </View>
                    </View>

                    <View style={tw`h-1 w-1 rounded-full bg-white/30`} />

                    <Text style={tw`text-xs font-medium text-white/80`}>
                      {tierTheme.gemName}
                    </Text>
                  </View>
                </View>

                {/* Achievement Badge */}
                <View style={tw`absolute right-0 top-0`}>
                  <AchievementBadge
                    achievement={currentTitle}
                    isUnlocked={true}
                    size={90}
                  />
                </View>
              </View>

              {/* Progress to next level */}
              {nextTitle && (
                <View style={tw`mb-5`}>
                  <View style={tw`flex-row justify-between items-center mb-2`}>
                    <Text style={tw`text-xs font-medium text-white/80`}>
                      {t('achievements.next', { title: nextTitle.title })}
                    </Text>
                    <Text style={tw`font-bold text-sm text-white`}>{percent}%</Text>
                  </View>

                  {/* Progress bar with 3D depth */}
                  <View style={{ position: 'relative' }}>
                    <View
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: 0,
                        right: 0,
                        height: 10,
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 5,
                      }}
                    />
                    <View
                      style={{
                        height: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        borderRadius: 5,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      {percent > 0 && (
                        <View
                          style={{
                            height: '100%',
                            backgroundColor: '#FFFFFF',
                            borderRadius: 4,
                            width: `${percent}%`,
                          }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* Stats Section - 3D cards */}
              <View style={tw`flex-row gap-3`}>
                {/* Streak */}
                <View style={{ flex: 1, position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      right: 0,
                      bottom: -2,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 14,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 14,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Text style={tw`text-2xl font-bold text-white`}>{currentStreak}</Text>
                    <Text style={tw`text-xs font-medium text-white/70`}>
                      {t('achievements.streak')}
                    </Text>
                  </View>
                </View>

                {/* Perfect Days */}
                <View style={{ flex: 1, position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      right: 0,
                      bottom: -2,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 14,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 14,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Text style={tw`text-2xl font-bold text-white`}>{perfectDays}</Text>
                    <Text style={tw`text-xs font-medium text-white/70`}>
                      {t('achievements.perfectDays')}
                    </Text>
                  </View>
                </View>

                {/* Habits */}
                <View style={{ flex: 1, position: 'relative' }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 0,
                      right: 0,
                      bottom: -2,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 14,
                    }}
                  />
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 14,
                      padding: 12,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <Text style={tw`text-2xl font-bold text-white`}>{totalHabits}</Text>
                    <Text style={tw`text-xs font-medium text-white/70`}>
                      {t('achievements.habits')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ImageBackground>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};
