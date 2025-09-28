import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';
import { getTierGradient } from '../../utils/achievements';

interface CurrentLevelHeroProps {
  currentLevel: number;
  currentTitle: Achievement | undefined;
  nextTitle: Achievement | undefined;
  levelProgress: number;
  currentStreak: number;
  perfectDays: number;
  totalHabits: number;
  onPress: () => void;
}

export const CurrentLevelHero: React.FC<CurrentLevelHeroProps> = ({ currentLevel, currentTitle, nextTitle, levelProgress, currentStreak, perfectDays, totalHabits, onPress }) => {
  return (
    <Pressable onPress={onPress}>
      <View style={tw`rounded-3xl overflow-hidden mb-4 relative`}>
        {/* LinearGradient as base */}
        <LinearGradient colors={getTierGradient(currentTitle?.tier || 'Novice', true)} style={tw`rounded-3xl`}>
          {/* Quartz Texture Overlay */}
          <ImageBackground
            source={require('../../../assets/interface/quartz-texture.png')}
            style={tw`rounded-3xl`}
            imageStyle={{
              opacity: 0.5,
              borderRadius: 24,
            }}
            resizeMode="cover"
          >
            <View style={tw`p-5`}>
              <View style={tw`flex-row items-center justify-between mb-3 relative`}>
                <View style={tw`flex-1 pr-20`}>
                  <Text style={tw`text-achievement-amber-600 text-xs font-semibold uppercase tracking-wider`}>Current Achievement</Text>
                  <Text style={tw`text-achievement-amber-800 text-2xl font-black mt-1`}>{currentTitle?.title || 'Newcomer'}</Text>
                  <View style={tw`flex-row items-center gap-2 mt-2`}>
                    <View style={tw`bg-white/60 rounded-full px-2 py-0.5`}>
                      <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>Level {currentLevel}</Text>
                    </View>
                    <View style={tw`bg-white/60 rounded-full px-2 py-0.5`}>
                      <Text style={tw`text-achievement-amber-800 text-xs font-bold`}>{currentTitle?.tier || 'Novice'}</Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '65%',
                    opacity: 0.8,
                    transform: [{ translateY: -60 }],
                  }}
                >
                  <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={100} showLock={false} />
                </View>
              </View>

              {/* Progress to next level */}
              {nextTitle && (
                <View style={tw`mt-2`}>
                  <View style={tw`flex-row justify-between mb-1`}>
                    <Text style={tw`text-achievement-amber-800 text-xs`}>Progress to {nextTitle.title}</Text>
                    <Text style={tw`text-amber-800 font-bold text-xs`}>{levelProgress}%</Text>
                  </View>

                  <View style={tw`h-5 bg-quartz-100 rounded-full overflow-hidden border-2 border-quartz-400`}>
                    {levelProgress > 0 ? (
                      <View style={[tw`h-full rounded-full flex-row`, { width: `${levelProgress}%`, overflow: 'hidden' }]}>
                        {Array.from({ length: Math.ceil(levelProgress / 5) }).map((_, i) => (
                          <Image
                            key={i}
                            source={require('../../../assets/interface/quartz-texture-2.png')}
                            style={{
                              height: '100%',
                              width: 500,
                              resizeMode: 'cover',
                            }}
                          />
                        ))}
                      </View>
                    ) : (
                      <View style={tw`h-full w-full bg-achievement-amber-200 rounded-full`} />
                    )}
                  </View>
                </View>
              )}

              {/* Backend Stats */}
              <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-amber-400`}>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Streak</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{currentStreak}</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Perfect Days</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{perfectDays}</Text>
                </View>
                <View style={tw`items-center`}>
                  <Text style={tw`text-achievement-amber-800/80 text-sm font-medium`}>Active Habits</Text>
                  <Text style={tw`text-achievement-amber-800 font-bold text-lg`}>{totalHabits}</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </LinearGradient>
      </View>
    </Pressable>
  );
};
