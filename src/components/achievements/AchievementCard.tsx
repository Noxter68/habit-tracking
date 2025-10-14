import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';
import { getAchievementTierTheme } from '../../utils/tierTheme';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isFromBackend: boolean;
  index: number;
  onPress: (achievement: Achievement) => void;
  tierName?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, isUnlocked, isFromBackend, index, onPress, tierName }) => {
  // Get tier theme for gradient colors
  const tierTheme = tierName ? getAchievementTierTheme(tierName as any) : null;

  // Create lighter versions of tier gradients for unlocked state
  const getLightGradient = (tierGradient: string[]) => {
    return [tierGradient[0] + '15', tierGradient[1] + '20', tierGradient[2] + '15'];
  };

  // Gradient colors based on state
  const unlockedGradient = tierTheme ? getLightGradient(tierTheme.gradient) : ['#F3F4F610', '#E5E7EB15', '#F9FAFB10'];

  const lockedGradient = ['#FAFAFA', '#F5F5F5', '#EEEEEE'];

  // Border and accent colors
  const borderColor = isUnlocked ? (tierTheme ? tierTheme.gradient[1] + '40' : '#E5E7EB') : '#E0E0E0';

  const accentColor = tierTheme ? tierTheme.gradient[1] : '#6B7280';

  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
      <Pressable onPress={() => onPress(achievement)} style={({ pressed }) => [pressed && tw`scale-[0.98]`, tw`relative`]}>
        {/* Outer glow effect for unlocked achievements */}
        {isUnlocked && tierTheme && (
          <View
            style={[
              tw`absolute inset-0 rounded-2xl`,
              {
                backgroundColor: tierTheme.gradient[1] + '15',
                transform: [{ scale: 1.02 }],
                opacity: 0.5,
              },
            ]}
          />
        )}

        <LinearGradient
          colors={isUnlocked ? unlockedGradient : lockedGradient}
          style={[
            tw`rounded-2xl relative`,
            {
              height: 170,
              width: '100%',
              borderWidth: 2,
              borderColor: borderColor,
              backgroundColor: isUnlocked ? 'rgba(255, 255, 255, 0.95)' : 'rgba(245, 245, 245, 1)',
              shadowColor: isUnlocked ? accentColor : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isUnlocked ? 0.2 : 0.08,
              shadowRadius: isUnlocked ? 8 : 4,
              elevation: isUnlocked ? 6 : 2,
            },
          ]}
        >
          {/* Top shine effect for unlocked */}
          {isUnlocked && tierTheme && <LinearGradient colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']} style={[tw`absolute top-0 left-0 right-0 rounded-t-2xl`, { height: '40%' }]} />}

          {/* Content container - flexbox for consistent spacing */}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 20,
              paddingHorizontal: 12,
            }}
          >
            {/* Badge - FIXED 60x60 size */}
            <View
              style={{
                opacity: isUnlocked ? 1 : 0.35,
                height: 60,
                width: 60,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <AchievementBadge level={achievement.level} achievement={achievement} isUnlocked={isUnlocked} size={60} />
            </View>

            {/* Lock icon overlay for locked achievements */}

            {/* Title - FIXED 32px height */}
            <View
              style={{
                height: 32,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: isUnlocked ? '#1F2937' : '#9CA3AF',
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  lineHeight: 12,
                  fontWeight: '700',
                  textAlign: 'center',
                  paddingHorizontal: 4,
                }}
                numberOfLines={2}
              >
                {achievement.title}
              </Text>
            </View>

            {/* Level badge */}
            <LinearGradient
              colors={isUnlocked && tierTheme ? [tierTheme.gradient[0], tierTheme.gradient[1]] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                shadowColor: isUnlocked ? accentColor : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isUnlocked ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 11,
                  letterSpacing: 0.5,
                  fontWeight: '900',
                }}
              >
                LEVEL {achievement.level}
              </Text>
            </LinearGradient>
          </View>

          {/* Backend indicator */}
          {isFromBackend && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(20, 184, 166, 0.9)',
                shadowColor: '#14B8A6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
