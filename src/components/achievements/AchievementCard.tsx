/**
 * AchievementCard.tsx
 *
 * Achievement card with Duolingo 3D depth style.
 */


import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AchievementBadge } from '../shared/AchievementBadge';
import tw from '../../lib/tailwind';
import { getAchievementTierTheme } from '../../utils/tierTheme';
import { Achievement, TierKey } from '../../types/achievement.types';

// TYPES

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isFromBackend: boolean;
  index: number;
  onPress: (achievement: Achievement) => void;
  tierName?: string;
}

// COMPONENT

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isUnlocked,
  isFromBackend,
  index,
  onPress,
  tierName,
}) => {
  const pressed = useSharedValue(0);

  const tierTheme = tierName ? getAchievementTierTheme(tierName as TierKey) : null;
  const cardBgColor = isUnlocked ? '#FFFFFF' : '#F5F5F5';
  const shadowColor = isUnlocked ? '#d4d4d8' : '#D4D4D4';


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 4 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.5,
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
      <Pressable
        onPress={() => onPress(achievement)}
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

        {/* Main card */}
        <Animated.View
          style={[
            {
              height: 170,
              backgroundColor: cardBgColor,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: '#e4e4e7',
              overflow: 'hidden',
            },
            animatedStyle,
          ]}
        >
          {/* Shine effect for unlocked */}
          {isUnlocked && (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0)'] as any}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '35%',
              }}
            />
          )}

          {/* Content */}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 18,
              paddingHorizontal: 12,
            }}
          >
            {/* Badge */}
            <View
              style={{
                opacity: isUnlocked ? 1 : 0.35,
                height: 60,
                width: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AchievementBadge
                achievement={achievement}
                isUnlocked={true}
                size={60}
              />
            </View>

            {/* Title */}
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
                  fontSize: 12,
                  lineHeight: 15,
                  fontWeight: '700',
                  textAlign: 'center',
                  paddingHorizontal: 4,
                }}
                numberOfLines={2}
              >
                {achievement.title}
              </Text>
            </View>

            {/* Level badge - Duolingo pill style with 3D depth */}
            <View style={{ position: 'relative' }}>
              {/* Shadow for pill */}
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 0,
                  right: 0,
                  bottom: -2,
                  backgroundColor: isUnlocked ? (tierTheme?.gradient[2] || '#6B7280') : '#9CA3AF',
                  borderRadius: 10,
                }}
              />
              <LinearGradient
                colors={
                  isUnlocked && tierTheme
                    ? [tierTheme.gradient[0], tierTheme.gradient[1]] as any
                    : ['#D1D5DB', '#9CA3AF'] as any
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 11,
                    letterSpacing: 0.5,
                    fontWeight: '800',
                  }}
                >
                  LEVEL {achievement.level}
                </Text>
              </LinearGradient>
            </View>
          </View>

          {/* Backend sync indicator */}
          {isFromBackend && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#14B8A6',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            />
          )}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};
