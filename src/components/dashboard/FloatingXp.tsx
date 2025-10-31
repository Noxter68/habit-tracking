// src/components/dashboard/FloatingXP.tsx
import Logger from '@/utils/logger';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';

interface FloatingXPProps {
  amount?: number;
  show: boolean;
  onComplete?: () => void;
  type?: 'xp' | 'level-up';
  message?: string;
}

const FloatingXP: React.FC<FloatingXPProps> = ({ amount = 20, show, onComplete, type = 'xp', message }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const isLevelUp = type === 'level-up';
  const displayText = message || (isLevelUp ? 'LEVEL UP!' : `+${amount} XP`);

  useEffect(() => {
    if (show) {
      Logger.debug('FloatingXP: Starting animation for type:', type);

      // Reset values
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;

      // Fade in and scale up
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1);

      // Move up
      translateY.value = withTiming(-80, { duration: 1500 }, (finished) => {
        if (finished) {
          Logger.debug('FloatingXP: Animation finished');
          // Fade out
          opacity.value = withTiming(0, { duration: 300 }, (finished) => {
            if (finished && onComplete) {
              runOnJS(onComplete)();
            }
          });
        }
      });
    } else {
      // Reset when not showing
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [show, type]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!show) {
    return null;
  }

  Logger.debug('FloatingXP: Rendering with text:', displayText);

  return (
    <View
      style={{
        position: 'absolute',
        top: -50,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 999,
        alignItems: 'center',
      }}
      pointerEvents="none"
    >
      <Animated.View style={animatedStyle}>
        <View
          style={{
            backgroundColor: isLevelUp ? '#7c3aed' : '#f59e0b',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 999,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontWeight: 'bold',
              fontSize: isLevelUp ? 20 : 18,
            }}
          >
            {displayText}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default FloatingXP;
