import React from 'react';
import { View, Text, ImageBackground, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
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

export const TierSection: React.FC<TierSectionProps> = ({ tierName, tierKey, tierIndex, achievements, userAchievements, isAchievementUnlocked, onAchievementPress, isExpanded, onToggle }) => {
  const { t } = useTranslation();

  const tierUnlockedCount = achievements.filter((a) => isAchievementUnlocked(a)).length;
  const tierTotalCount = achievements.length;
  const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
  const isCompleted = tierUnlockedCount === tierTotalCount;

  const tierTheme = getAchievementTierTheme(tierKey);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  const textColors = {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
  };

  return (
    <Animated.View entering={FadeInDown.delay(tierIndex * 100).springify()} style={{ marginBottom: 24 }}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => ({
          marginHorizontal: 8,
          marginBottom: isExpanded ? 12 : 0,
          overflow: 'hidden',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <LinearGradient colors={[tierGradient[0], tierGradient[1], tierGradient[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }} style={{ borderRadius: 20 }}>
          <ImageBackground source={tierTexture} style={{ padding: 16 }} imageStyle={{ opacity: 0.8 }} resizeMode="cover">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
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
                  <View
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: textColors.primary,
                      }}
                    >
                      {t('achievements.complete').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: textColors.primary,
                  }}
                >
                  {tierUnlockedCount}/{tierTotalCount}
                </Text>

                {isExpanded ? <ChevronUp size={20} color={textColors.primary} /> : <ChevronDown size={20} color={textColors.primary} />}
              </View>
            </View>

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
                {t('achievements.percentComplete', { percent: Math.round(progress) })}
              </Text>
            )}
          </ImageBackground>
        </LinearGradient>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(400)}
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
                <AchievementCard achievement={achievement} isUnlocked={isUnlocked} isFromBackend={isFromBackend} index={index} onPress={onAchievementPress} tierName={tierName} />
              </View>
            );
          })}
        </Animated.View>
      )}
    </Animated.View>
  );
};
