/**
 * TierSection.tsx
 *
 * Collapsible tier section with Duolingo 3D depth style.
 */

import React from 'react';
import { View, Text, ImageBackground, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Achievement, TierKey, UserAchievement } from '../../types/achievement.types';
import { AchievementCard } from './AchievementCard';
import { getAchievementTierTheme } from '../../utils/tierTheme';

interface TierSectionProps {
  tierName: string;
  tierKey: TierKey;
  tierIndex: number;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isAchievementUnlocked: (achievement: Achievement) => boolean;
  onAchievementPress: (achievement: Achievement) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const TierSection: React.FC<TierSectionProps> = ({
  tierName,
  tierKey,
  tierIndex,
  achievements,
  userAchievements,
  isAchievementUnlocked,
  onAchievementPress,
  isExpanded,
  onToggle,
}) => {
  const { t } = useTranslation();
  const pressed = useSharedValue(0);

  const tierUnlockedCount = achievements.filter((a) => isAchievementUnlocked(a)).length;
  const tierTotalCount = achievements.length;
  const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
  const isCompleted = tierUnlockedCount === tierTotalCount;

  const tierTheme = getAchievementTierTheme(tierKey);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  // Darker shade for 3D depth effect
  const shadowColor = tierGradient[2] || tierGradient[1];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 3 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.6,
  }));

  return (
    <Animated.View entering={FadeInDown.delay(tierIndex * 100).springify()} style={{ marginBottom: 24 }}>
      <Pressable
        onPress={onToggle}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 100 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 100 });
        }}
        style={{
          marginHorizontal: 8,
          marginBottom: isExpanded ? 12 : 0,
        }}
      >
        {/* Shadow/depth layer - Duolingo 3D style */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 4,
              left: 0,
              right: 0,
              bottom: -4,
              backgroundColor: shadowColor,
              borderRadius: 20,
            },
            shadowStyle,
          ]}
        />

        {/* Main header card */}
        <Animated.View style={[{ borderRadius: 20, overflow: 'hidden' }, animatedStyle]}>
          <LinearGradient
            colors={[tierGradient[0], tierGradient[1], tierGradient[2]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
            style={{ borderRadius: 20 }}
          >
            <ImageBackground
              source={tierTexture}
              style={{ padding: 16 }}
              imageStyle={{ opacity: 0.25, borderRadius: 20 }}
              resizeMode="cover"
            >
              {/* Header row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                    }}
                  >
                    {tierName}
                  </Text>
                  {isCompleted && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Trophy size={12} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: '#FFFFFF',
                        }}
                      >
                        {t('achievements.complete').toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Count pill - only show if NOT completed */}
                  {!isCompleted && (
                    <View
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: '#FFFFFF',
                        }}
                      >
                        {tierUnlockedCount}/{tierTotalCount}
                      </Text>
                    </View>
                  )}

                  {/* Chevron with background */}
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 10,
                      padding: 6,
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp size={18} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <ChevronDown size={18} color="#FFFFFF" strokeWidth={2.5} />
                    )}
                  </View>
                </View>
              </View>

              {/* Progress bar - Duolingo style with depth */}
              <View style={{ position: 'relative' }}>
                {/* Progress bar shadow */}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {progress > 0 && (
                    <View
                      style={{
                        height: '100%',
                        backgroundColor: '#FFFFFF',
                        borderRadius: 4,
                        width: `${progress}%`,
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Percentage text */}
              {!isCompleted && progress > 0 && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginTop: 8,
                    textAlign: 'right',
                  }}
                >
                  {t('achievements.percentComplete', { percent: Math.round(progress) })}
                </Text>
              )}
            </ImageBackground>
          </LinearGradient>
        </Animated.View>
      </Pressable>

      {/* Achievement cards grid */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={{
            paddingHorizontal: 8,
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
          }}
        >
          {achievements.map((achievement, index) => {
            const isUnlocked = isAchievementUnlocked(achievement);
            const isFromBackend = userAchievements.some((ua) => ua?.title === achievement.title);

            return (
              <View
                key={`${achievement.level}-${achievement.tierKey}`}
                style={{
                  width: '50%',
                  paddingHorizontal: 4,
                  paddingVertical: 4,
                }}
              >
                <AchievementCard
                  achievement={achievement}
                  isUnlocked={isUnlocked}
                  isFromBackend={isFromBackend}
                  index={index}
                  onPress={onAchievementPress}
                  tierName={tierName}
                />
              </View>
            );
          })}
        </Animated.View>
      )}
    </Animated.View>
  );
};
