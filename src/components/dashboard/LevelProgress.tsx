// src/components/dashboard/LevelProgress.tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface LevelProgressProps {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
}

const AnimatedView = Animated.View;

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, currentLevelXP, xpForNextLevel, levelProgress }) => {
  const xpToNextLevel = Math.max(0, xpForNextLevel - currentLevelXP);

  // Use shared value for smooth transitions
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Calculate progress percentage with safety checks
  const calculateProgress = () => {
    if (!xpForNextLevel || xpForNextLevel <= 0) return 0;
    const rawProgress = (currentLevelXP / xpForNextLevel) * 100;
    // Clamp between 0 and 99.9 to ensure bar is never completely full until level up
    return Math.min(Math.max(0, rawProgress), 99.9);
  };

  const progressPercentage = calculateProgress();

  useEffect(() => {
    // Only animate if we have valid data
    if (xpForNextLevel > 0) {
      // Fade in the component
      opacity.value = withTiming(1, { duration: 300 });

      // Animate progress after a slight delay to prevent flashing
      setTimeout(() => {
        progress.value = withSpring(progressPercentage, {
          damping: 15,
          stiffness: 100,
          mass: 1,
        });
      }, 100);
    } else {
      // If no data, keep at 0 without animation
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

  // Don't render if we don't have valid data
  if (!xpForNextLevel || xpForNextLevel <= 0) {
    return (
      <View style={{ marginBottom: 16, height: 48 }}>
        {/* Placeholder with same height to prevent layout shift */}
        <View style={{ height: 20, backgroundColor: '#F5F3FF', borderRadius: 20 }} />
      </View>
    );
  }

  return (
    <Animated.View style={[animatedContainerStyle]}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9333EA', letterSpacing: 0.5 }}>Progress to Level {currentLevel + 1}</Text>
        <View
          style={{
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: 'rgba(147, 51, 234, 0.2)',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#9333EA' }}>
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
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          shadowColor: '#9333EA',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        }}
      >
        <AnimatedView style={[{ height: '100%', borderRadius: 20, overflow: 'hidden' }, animatedBarStyle]}>
          {/* Amethyst gradient fill */}
          <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: '100%' }} />
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
