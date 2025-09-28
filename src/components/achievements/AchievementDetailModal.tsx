import React from 'react';
import { Modal, View, Text, Pressable, Image, Dimensions } from 'react-native';
import Animated, { SlideInDown, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import tw, { quartzGradients } from '../../lib/tailwind';
import { Achievement } from '../../utils/achievements';

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  currentLevel: number;
  totalCompletions: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({ visible, onClose, achievement, currentLevel, totalCompletions }) => {
  if (!achievement) return null;

  const isUnlocked = achievement.level <= currentLevel;
  const requiredCompletions = (achievement.level - 1) * 10;
  const remaining = requiredCompletions - totalCompletions;
  const progress = Math.min((totalCompletions / requiredCompletions) * 100, 100);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tw`flex-1 bg-black/60 items-center justify-center px-4`} onPress={onClose}>
        <Animated.View entering={SlideInDown.duration(400).springify()} style={tw`w-full max-w-sm`}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Outer gradient border */}
            <LinearGradient colors={isUnlocked ? quartzGradients.unlocked.border : quartzGradients.locked.border} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-0.5`}>
              <View style={tw`bg-white rounded-3xl overflow-hidden`}>
                {/* Header with gradient background */}
                <LinearGradient
                  colors={isUnlocked ? quartzGradients.unlocked.header : quartzGradients.locked.header}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={tw`px-6 pt-8 pb-12 items-center relative`}
                >
                  {/* Subtle decorative circles */}
                  <View style={tw`absolute top-4 left-4 w-24 h-24 bg-white/15 rounded-full`} />
                  <View style={tw`absolute bottom-0 right-0 w-36 h-36 bg-white/10 rounded-full`} />

                  {/* Achievement Badge */}
                  <Animated.View entering={FadeInDown.delay(200).springify()} style={tw`relative`}>
                    {/* Show actual achievement image */}
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

                    {/* Subtle glow effect for unlocked */}
                    {isUnlocked && (
                      <View style={tw`absolute inset-0 items-center justify-center`}>
                        <View style={tw`w-48 h-48 bg-achievement-amber-300/20 rounded-full absolute blur-xl`} />
                      </View>
                    )}
                  </Animated.View>
                </LinearGradient>

                {/* Content Section with subtle gradient overlay */}
                <LinearGradient colors={quartzGradients.overlay} style={tw`px-6 pb-6 -mt-6`}>
                  {/* Title Card */}
                  <View style={tw`bg-white rounded-2xl shadow-sm p-4 mb-4 border border-achievement-amber-100`}>
                    <Text style={tw`text-xl font-bold text-gray-800 text-center mb-3`}>{achievement.title}</Text>

                    <View style={tw`flex-row gap-2 justify-center`}>
                      <LinearGradient colors={quartzGradients.unlocked.progressBar} style={tw`rounded-full px-3.5 py-1.5`}>
                        <Text style={tw`text-sm font-bold text-white`}>Level {achievement.level}</Text>
                      </LinearGradient>

                      <View style={tw`bg-achievement-amber-50 rounded-full px-3.5 py-1.5 border border-achievement-amber-200`}>
                        <Text style={tw`text-sm font-semibold text-achievement-amber-700`}>{achievement.tier}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress Card */}
                  <LinearGradient
                    colors={isUnlocked ? quartzGradients.unlocked.progress : quartzGradients.locked.progress}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={tw`rounded-2xl p-4 mb-4`}
                  >
                    <Text style={tw`text-sm font-semibold text-center mb-2 ${isUnlocked ? 'text-achievement-amber-900' : 'text-achievement-amber-800'}`}>
                      {isUnlocked ? 'Achievement Unlocked!' : 'Progress Status'}
                    </Text>

                    <Text style={tw`text-sm text-center leading-5 font-medium ${isUnlocked ? 'text-achievement-amber-800' : 'text-achievement-amber-700'}`}>
                      {isUnlocked ? `Unlocked at ${requiredCompletions} completions` : `Requires ${requiredCompletions} total completions`}
                    </Text>

                    {!isUnlocked && (
                      <>
                        <View style={tw`mt-3 bg-white/50 rounded-full h-2.5 overflow-hidden`}>
                          <LinearGradient colors={quartzGradients.unlocked.progressBar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
                        </View>
                        <Text style={tw`text-xs text-achievement-amber-600 text-center mt-2 font-medium`}>
                          {remaining} more needed • {Math.round(progress)}% complete
                        </Text>
                      </>
                    )}
                  </LinearGradient>

                  {/* Action Button */}
                  <Pressable onPress={onClose} style={({ pressed }) => [tw`overflow-hidden rounded-2xl`, pressed && tw`scale-95`]}>
                    <LinearGradient colors={isUnlocked ? quartzGradients.unlocked.button : quartzGradients.locked.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-3.5`}>
                      <Text style={tw`font-bold text-center text-base text-white`}>{isUnlocked ? 'Awesome!' : 'Keep Going!'}</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
