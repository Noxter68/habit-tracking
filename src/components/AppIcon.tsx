import React from 'react';
import { Image, View, Platform } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle } from 'react-native-reanimated';

interface AppIconProps {
  size?: number;
  animated?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 120, animated = false }) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if (animated) {
      scale.value = withRepeat(withTiming(1.1, { duration: 2000 }), -1, true);
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // You can add your logo image in these locations:
  // assets/images/logo.png
  // assets/images/logo@2x.png (for 2x resolution)
  // assets/images/logo@3x.png (for 3x resolution)

  if (animated) {
    return (
      <Animated.View style={animatedStyle}>
        <Image
          source={require('../../assets/images/base-logo.png')} // Update path to your image
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return (
    <Image
      source={require('../../assets/images/logo.png')} // Update path to your image
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
};
