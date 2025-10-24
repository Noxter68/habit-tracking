// src/components/dashboard/LevelProgress.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

interface LevelProgressProps {
  currentLevel: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  levelProgress: number;
  tierTheme?: any;
  textColor?: string;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, currentLevelXP, xpForNextLevel, levelProgress, tierTheme, textColor = 'rgba(255, 255, 255, 0.95)' }) => {
  const progressPercent = Math.min(levelProgress, 100);
  const xpRemaining = xpForNextLevel - currentLevelXP;

  return (
    <Animated.View entering={FadeIn.delay(200)}>
      <View
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: textColor,
                opacity: 0.8,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Level Progress
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: '#FFFFFF',
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              Level {currentLevel} → {currentLevel + 1}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: '#FFFFFF',
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {Math.round(progressPercent)}%
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.25)',
            marginBottom: 6,
          }}
        >
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.75)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: 8,
              shadowColor: '#FFFFFF',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
        </View>

        {/* XP Stats */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: textColor,
              opacity: 0.85,
            }}
          >
            {currentLevelXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </Text>

          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: textColor,
              opacity: 0.75,
            }}
          >
            {xpRemaining.toLocaleString()} XP to go
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default LevelProgress;
