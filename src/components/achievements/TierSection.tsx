import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Achievement, TierName, UserAchievement } from '../../types/achievement.types';
import { AchievementCard } from './AchievementCard';
import { getAchievementTierTheme } from '../../utils/tierTheme';

interface TierSectionProps {
  tierName: TierName;
  tierIndex: number;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isAchievementUnlocked: (achievement: Achievement) => boolean;
  onAchievementPress: (achievement: Achievement) => void;
}

export const TierSection: React.FC<TierSectionProps> = ({ tierName, tierIndex, achievements, userAchievements, isAchievementUnlocked, onAchievementPress }) => {
  const tierUnlockedCount = achievements.filter((a) => isAchievementUnlocked(a)).length;
  const tierTotalCount = achievements.length;
  const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
  const isCompleted = tierUnlockedCount === tierTotalCount;

  // Get tier theme directly from utils
  const tierTheme = getAchievementTierTheme(tierName as any);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  // Determine text colors based on gem
  const getTextColors = (gemName: string) => {
    return {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.9)',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  return (
    <Animated.View entering={FadeInDown.delay(tierIndex * 100).springify()} style={{ marginBottom: 24 }}>
      {/* Tier Header with Gradient & Texture */}
      <View style={{ marginHorizontal: 8, marginBottom: 12, borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={[tierGradient[0], tierGradient[1], tierGradient[2]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={{
            borderRadius: 20,
          }}
        >
          <ImageBackground source={tierTexture} style={{ padding: 16 }} imageStyle={{ opacity: 0.8 }} resizeMode="cover">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: textColors.primary,
                    letterSpacing: 0.5,
                  }}
                >
                  {tierName}
                </Text>
                {isCompleted && (
                  <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: textColors.primary }}>COMPLETE</Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: textColors.primary,
                }}
              >
                {tierUnlockedCount}/{tierTotalCount}
              </Text>
            </View>

            {/* Progress Bar with white fill */}
            <View
              style={{
                height: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 4,
                  width: `${progress}%`,
                }}
              />
            </View>

            {/* Progress percentage */}
            {!isCompleted && progress > 0 && (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: textColors.secondary,
                  marginTop: 6,
                  textAlign: 'right',
                }}
              >
                {Math.round(progress)}% Complete
              </Text>
            )}
          </ImageBackground>
        </LinearGradient>
      </View>

      {/* Achievement Grid */}
      <View
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
              key={`${achievement.id}=${achievement.title}`}
              style={{
                width: '50%',
                paddingHorizontal: 4,
                paddingVertical: 4,
              }}
            >
              <AchievementCard achievement={achievement} isUnlocked={isUnlocked} isFromBackend={isFromBackend} index={index} onPress={onAchievementPress} tierName={tierName} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};
