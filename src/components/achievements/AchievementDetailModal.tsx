import React from 'react';
import { Modal, View, Text, Pressable, Image, ImageBackground } from 'react-native';
import Animated, { SlideInDown, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ visible, onClose, achievement, currentLevel, totalCompletions }) => {
  if (!achievement) return null;

  const isUnlocked = achievement.level <= currentLevel;
  const requiredCompletions = (achievement.level - 1) * 10;
  const remaining = requiredCompletions - totalCompletions;
  const progress = Math.min((totalCompletions / requiredCompletions) * 100, 100);

  const tierTheme = getAchievementTierTheme(achievement.tier as any);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  const getTextColors = (gemName: string) => {
    if (['Crystal', 'Topaz'].includes(gemName)) {
      return {
        primary: '#292524',
        secondary: '#57534e',
      };
    }
    return {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.9)',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);
  const lockedGradient = [tierGradient[0] + '40', tierGradient[1] + '35', tierGradient[2] + '30'];
  const lockedProgressGradient = [tierGradient[0] + '60', tierGradient[1] + '50'];
  const lockedButtonGradient = [tierGradient[0] + '80', tierGradient[1] + '80'];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tw`flex-1 bg-black/60 items-center justify-center px-4`} onPress={onClose}>
        <Animated.View entering={SlideInDown.duration(400).springify()} style={tw`w-full max-w-sm`}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Outer gradient border */}
            <LinearGradient colors={tierGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-1`}>
              <View style={tw`bg-sand-50 rounded-3xl overflow-hidden relative`}>
                {/* Background gradient - extends full height */}
                <View style={tw`absolute inset-0 z-0`}>
                  <LinearGradient colors={quartzGradients.overlay} style={tw`flex-1`} />
                </View>

                {/* Header with tier texture and gradient */}
                <View style={tw`relative z-10`}>
                  <ImageBackground source={tierTexture} style={{ overflow: 'hidden' }} imageStyle={{ opacity: isUnlocked ? 0.8 : 0.5 }} resizeMode="cover">
                    <LinearGradient
                      colors={isUnlocked ? [tierGradient[0] + 'dd', tierGradient[1] + 'dd', tierGradient[2] + 'cc'] : lockedGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`px-6 pt-8 pb-16 items-center`}
                    >
                      {/* Achievement Badge */}
                      <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <Image
                          source={achievement.image}
                          style={{
                            width: 250,
                            height: 180,
                            opacity: isUnlocked ? 1 : 0.3,
                          }}
                          resizeMode="contain"
                        />

                        {/* Lock overlay for locked achievements */}
                        {!isUnlocked && (
                          <View style={tw`absolute inset-0 items-center justify-center`}>
                            <Image
                              source={require('../../../assets/achievements/locked.png')}
                              style={{
                                width: 60,
                                height: 60,
                                opacity: 0.6,
                              }}
                              resizeMode="contain"
                            />
                          </View>
                        )}
                      </Animated.View>
                    </LinearGradient>
                  </ImageBackground>
                </View>

                {/* Content Section - overlaps header */}
                <View style={tw`px-6 pb-6 -mt-10 relative z-20`}>
                  {/* Title Card */}
                  <View style={tw`bg-white rounded-2xl shadow-sm p-4 mb-4 border border-sand-200`}>
                    <Text style={tw`text-xl font-bold text-stone-800 text-center mb-3`}>{achievement.title}</Text>

                    <View style={tw`flex-row gap-2 justify-center`}>
                      {/* Level badge with tier gradient */}
                      <LinearGradient colors={isUnlocked ? tierGradient : lockedButtonGradient} style={tw`rounded-full px-3.5 py-1.5`}>
                        <Text style={tw`text-sm font-bold text-white`}>Level {achievement.level}</Text>
                      </LinearGradient>

                      {/* Tier badge - shows gem name */}
                      <View
                        style={[
                          tw`rounded-full px-3.5 py-1.5 border`,
                          {
                            backgroundColor: isUnlocked ? `${tierTheme.accent}15` : '#F5F5F4',
                            borderColor: isUnlocked ? `${tierTheme.accent}40` : '#D6D3D1',
                          },
                        ]}
                      >
                        <Text style={[tw`text-sm font-semibold`, { color: isUnlocked ? tierTheme.accent : '#78716C' }]}>{tierTheme.gemName}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Card with tier texture and gradient */}
                  <ImageBackground
                    source={tierTexture}
                    style={{ overflow: 'hidden', borderRadius: 16, marginBottom: 16 }}
                    imageStyle={{ opacity: isUnlocked ? 0.7 : 0.4, borderRadius: 16 }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={isUnlocked ? [tierGradient[0] + 'dd', tierGradient[1] + 'dd'] : lockedProgressGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`rounded-2xl p-4`}
                    >
                      <Text style={[tw`text-sm font-semibold text-center mb-2`, { color: textColors.primary }]}>{isUnlocked ? 'Achievement Unlocked!' : 'Progress Status'}</Text>

                      <Text style={[tw`text-sm text-center leading-5 font-medium`, { color: textColors.secondary }]}>
                        {isUnlocked ? `Unlocked at ${requiredCompletions} completions` : `Requires ${requiredCompletions} total completions`}
                      </Text>

                      {!isUnlocked && (
                        <>
                          {/* Progress bar with tier gradient */}
                          <View style={tw`mt-3 bg-white/50 rounded-full h-2.5 overflow-hidden`}>
                            <LinearGradient colors={tierGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
                          </View>
                          <Text style={tw`text-xs text-sand-700 text-center mt-2 font-medium`}>
                            {remaining} more needed • {Math.round(progress)}% complete
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </ImageBackground>

                  {/* Action Button with tier gradient */}
                  <Pressable onPress={onClose} style={({ pressed }) => [tw`overflow-hidden rounded-2xl`, pressed && tw`scale-95`]}>
                    <LinearGradient colors={isUnlocked ? tierGradient : lockedButtonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-3.5`}>
                      <Text style={tw`font-bold text-center text-base text-white`}>{isUnlocked ? 'Awesome!' : 'Keep Going!'}</Text>
                    </LinearGradient>
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
