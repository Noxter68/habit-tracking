/**
 * AchievementDetailModal.tsx
 *
 * Achievement detail modal with Duolingo 3D depth style.
 */

import React from 'react';
import { Modal, View, Text, Pressable, Image, ImageBackground } from 'react-native';
import Animated, {
  SlideInDown,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw, { quartzGradients } from '../../lib/tailwind';
import { getAchievementTierTheme } from '../../utils/tierTheme';
import { Achievement } from '../../utils/achievements';

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  currentLevel: number;
  totalCompletions: number;
}

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  achievement,
  currentLevel,
  totalCompletions,
}) => {
  const { t } = useTranslation();
  const buttonPressed = useSharedValue(0);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonPressed.value * 4 }],
  }));

  const buttonShadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - buttonPressed.value * 0.5,
  }));

  if (!achievement) return null;

  const isUnlocked = achievement.level <= currentLevel;
  const requiredCompletions = (achievement.level - 1) * 10;
  const remaining = requiredCompletions - totalCompletions;
  const progress = Math.min((totalCompletions / requiredCompletions) * 100, 100);

  const tierTheme = getAchievementTierTheme(achievement.tierKey);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  const isDarkTier = achievement.tierKey === 'mythicGlory' || achievement.tierKey === 'infernalDominion';

  const isInfernalLevel = achievement.level >= 36 && achievement.level <= 40;
  const imageWidth = isInfernalLevel ? 320 : 250;
  const imageHeight = isInfernalLevel ? 230 : 180;

  const getTextColors = (gemName: string) => {
    return {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.9)',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  const lockedGradient = isDarkTier
    ? [tierGradient[0] + 'ee', tierGradient[1] + 'ee', tierGradient[2] + 'dd']
    : [tierGradient[0] + '70', tierGradient[1] + '65', tierGradient[2] + '60'];
  const lockedProgressGradient = isDarkTier
    ? [tierGradient[0] + 'f5', tierGradient[1] + 'ee']
    : [tierGradient[0] + '85', tierGradient[1] + '75'];
  const lockedButtonGradient = [tierGradient[0] + 'B0', tierGradient[1] + 'B0'];

  // Shadow color for depth effect (darker version of tier color)
  const depthShadowColor = tierGradient[2] || tierGradient[1];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={tw`flex-1 bg-black/60 items-center justify-center px-4`}
        onPress={onClose}
      >
        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={tw`w-full max-w-sm`}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Border with tier gradient */}
            <LinearGradient
              colors={tierGradient as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`rounded-3xl p-1`}
            >
              <View style={tw`bg-sand-50 rounded-3xl overflow-hidden relative`}>
                {/* Background gradient */}
                <View style={tw`absolute inset-0 z-0`}>
                  <LinearGradient colors={quartzGradients.overlay as any} style={tw`flex-1`} />
                </View>

                {/* Header with tier texture and gradient */}
                <View style={tw`relative z-10`}>
                  <ImageBackground
                    source={tierTexture}
                    style={{ overflow: 'hidden' }}
                    imageStyle={{ opacity: isUnlocked ? 0.8 : 0.5 }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={
                        (isUnlocked
                          ? [
                              tierGradient[0] + 'dd',
                              tierGradient[1] + 'dd',
                              tierGradient[2] + 'cc',
                            ]
                          : lockedGradient) as any
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`px-6 pt-8 pb-16 items-center`}
                    >
                      {/* Achievement badge */}
                      <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <Image
                          source={achievement.image}
                          style={{
                            width: imageWidth,
                            height: imageHeight,
                            opacity: isUnlocked ? 1 : 0.5,
                          }}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </LinearGradient>
                  </ImageBackground>
                </View>

                {/* Content section */}
                <View style={tw`px-6 pb-6 -mt-10 relative z-20`}>
                  {/* Title card with 3D depth */}
                  <View style={{ position: 'relative', marginBottom: 16 }}>
                    {/* Shadow layer for 3D depth */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 0,
                        right: 0,
                        bottom: -4,
                        backgroundColor: '#d4d4d8',
                        borderRadius: 16,
                      }}
                    />
                    <View
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 2,
                        borderColor: '#e4e4e7',
                      }}
                    >
                      <Text style={tw`text-xl font-bold text-stone-800 text-center mb-3`}>
                        {achievement.title}
                      </Text>

                      <View style={tw`flex-row gap-2 justify-center`}>
                        {/* Level badge with 3D depth */}
                        <View style={{ position: 'relative' }}>
                          <View
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 0,
                              right: 0,
                              bottom: -2,
                              backgroundColor: isUnlocked ? depthShadowColor : '#9CA3AF',
                              borderRadius: 20,
                            }}
                          />
                          <LinearGradient
                            colors={(isUnlocked ? [tierGradient[0], tierGradient[1]] : lockedButtonGradient) as any}
                            style={{
                              borderRadius: 20,
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                            }}
                          >
                            <Text style={tw`text-sm font-bold text-white`}>
                              {t('achievements.level', { level: achievement.level })}
                            </Text>
                          </LinearGradient>
                        </View>

                        {/* Tier badge with 3D depth */}
                        <View style={{ position: 'relative' }}>
                          <View
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 0,
                              right: 0,
                              bottom: -2,
                              backgroundColor: isUnlocked ? `${tierTheme.accent}40` : '#D6D3D1',
                              borderRadius: 20,
                            }}
                          />
                          <View
                            style={{
                              borderRadius: 20,
                              paddingHorizontal: 14,
                              paddingVertical: 6,
                              backgroundColor: isUnlocked ? `${tierTheme.accent}15` : '#F5F5F4',
                              borderWidth: 2,
                              borderColor: isUnlocked ? `${tierTheme.accent}40` : '#e4e4e7',
                            }}
                          >
                            <Text
                              style={[
                                tw`text-sm font-semibold`,
                                { color: isUnlocked ? tierTheme.accent : '#78716C' },
                              ]}
                            >
                              {tierTheme.gemName}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Progress card with 3D depth */}
                  <View style={{ position: 'relative', marginBottom: 16 }}>
                    {/* Shadow layer for 3D depth */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 0,
                        right: 0,
                        bottom: -4,
                        backgroundColor: depthShadowColor,
                        borderRadius: 16,
                      }}
                    />
                    <ImageBackground
                      source={tierTexture}
                      style={{
                        overflow: 'hidden',
                        borderRadius: 16,
                      }}
                      imageStyle={{
                        opacity: isUnlocked ? 0.7 : 0.4,
                        borderRadius: 16,
                      }}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={
                          (isUnlocked
                            ? [tierGradient[0] + 'dd', tierGradient[1] + 'dd']
                            : lockedProgressGradient) as any
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={tw`rounded-2xl p-4`}
                      >
                        <Text
                          style={[
                            tw`text-sm font-semibold text-center mb-2`,
                            { color: textColors.primary },
                          ]}
                        >
                          {isUnlocked
                            ? t('achievements.achievementUnlocked')
                            : t('achievements.progressStatus')}
                        </Text>

                        <Text
                          style={[
                            tw`text-sm text-center leading-5 font-medium`,
                            { color: textColors.secondary },
                          ]}
                        >
                          {isUnlocked
                            ? t('achievements.unlockedAt', { count: requiredCompletions })
                            : t('achievements.requiresCompletions', {
                                count: requiredCompletions,
                              })}
                        </Text>

                        {!isUnlocked && (
                          <View
                            style={tw`mt-3 bg-white/50 rounded-full h-2.5 overflow-hidden`}
                          >
                            <LinearGradient
                              colors={tierGradient as any}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[tw`h-full rounded-full`, { width: `${progress}%` }]}
                            />
                          </View>
                        )}
                      </LinearGradient>
                    </ImageBackground>
                  </View>

                  {/* Action button with 3D depth */}
                  <Pressable
                    onPress={onClose}
                    onPressIn={() => {
                      buttonPressed.value = withTiming(1, { duration: 100 });
                    }}
                    onPressOut={() => {
                      buttonPressed.value = withTiming(0, { duration: 100 });
                    }}
                    style={{ position: 'relative' }}
                  >
                    {/* Shadow layer for 3D depth */}
                    <Animated.View
                      style={[
                        {
                          position: 'absolute',
                          top: 4,
                          left: 0,
                          right: 0,
                          bottom: -4,
                          backgroundColor: isUnlocked ? depthShadowColor : '#9CA3AF',
                          borderRadius: 16,
                        },
                        buttonShadowStyle,
                      ]}
                    />
                    <Animated.View style={[{ borderRadius: 16, overflow: 'hidden' }, buttonAnimatedStyle]}>
                      <LinearGradient
                        colors={(isUnlocked ? [tierGradient[0], tierGradient[1]] : lockedButtonGradient) as any}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={tw`py-3.5`}
                      >
                        <Text style={tw`font-bold text-center text-base text-white`}>
                          {isUnlocked
                            ? t('achievements.awesome')
                            : t('achievements.keepGoing')}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
