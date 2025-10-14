// src/components/dashboard/LevelProgress.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface LevelProgressProps {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
  tierTheme?: TierTheme;
}

const AnimatedView = Animated.View;

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, currentLevelXP, xpForNextLevel, levelProgress, tierTheme }) => {
  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;
  const xpToNextLevel = Math.max(0, xpForNextLevel - currentLevelXP);

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const calculateProgress = () => {
    if (!xpForNextLevel || xpForNextLevel <= 0) return 0;
    const rawProgress = (currentLevelXP / xpForNextLevel) * 100;
    return Math.min(Math.max(0, rawProgress), 99.9);
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    if (xpForNextLevel > 0) {
      opacity.value = withTiming(1, { duration: 300 });

      setTimeout(() => {
        progress.value = withSpring(progressPercentage, {
          damping: 15,
          stiffness: 100,
          mass: 1,
        });
      }, 100);
    } else {
      opacity.value = 0;
      progress.value = 0;
    }
  }, [progressPercentage, xpForNextLevel]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (!xpForNextLevel || xpForNextLevel <= 0) {
    return (
      <View style={{ marginBottom: 16, height: 48 }}>
        <View
          style={{
            height: 20,
            backgroundColor: `${theme.accent}10`,
            borderRadius: 20,
          }}
        />
      </View>
    );
  }

  return (
    <Animated.View style={[animatedContainerStyle]}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: theme.accent,
            letterSpacing: 0.5,
          }}
        >
          Progress to Level {currentLevel + 1}
        </Text>
        <View
          style={{
            backgroundColor: `${theme.accent}10`,
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: `${theme.accent}30`,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: theme.accent,
            }}
          >
            {currentLevelXP}/{xpForNextLevel} XP
          </Text>
        </View>
      </View>

      {/* Progress bar container */}
      <View
        style={{
          height: 20,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: `${theme.accent}10`,
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        <AnimatedView
          style={[
            {
              height: '100%',
              borderRadius: 20,
              overflow: 'hidden',
            },
            animatedBarStyle,
          ]}
        >
          {/* Tier-based gradient fill */}
          <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: '100%' }} />
        </AnimatedView>
      </View>

      {/* Remaining XP */}
      {xpToNextLevel > 0 && (
        <Text
          style={{
            fontSize: 11,
            color: '#9CA3AF',
            marginTop: 6,
            textAlign: 'center',
            fontWeight: '600',
          }}
        >
          {xpToNextLevel} XP to next level
        </Text>
      )}
    </Animated.View>
  );
};

export default LevelProgress;
