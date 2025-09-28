// src/components/TabBarIcon.tsx
import React from 'react';
import { View, Image } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'chart' | 'settings';
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 28 }) => {
  // Animated styles for smooth transitions
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.2 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
        {
          translateY: withTiming(focused ? -3 : 0, {
            duration: 200,
          }),
        },
      ],
      opacity: withTiming(focused ? 1 : 0.5, {
        duration: 200,
      }),
    };
  });

  // Get the appropriate icon image
  const getIcon = () => {
    // Dynamic size based on focus state
    const iconSize = focused ? 70 : 80;

    switch (name) {
      case 'home':
        return (
          <Image
            source={require('../../assets/interface/navigation/home.png')}
            style={{
              width: 40,
              height: iconSize,
            }}
            resizeMode="contain"
          />
        );
      case 'calendar':
        return (
          <Image
            source={require('../../assets/interface/navigation/calendar.png')}
            style={{
              width: 40,
              height: iconSize,
            }}
            resizeMode="contain"
          />
        );
      case 'chart':
        return (
          <Image
            source={require('../../assets/interface/navigation/stats.png')}
            style={{
              width: 40,
              height: iconSize,
            }}
            resizeMode="contain"
          />
        );
      case 'settings':
        return (
          <Image
            source={require('../../assets/interface/navigation/settings.png')}
            style={{
              width: 40,
              height: iconSize,
            }}
            resizeMode="contain"
          />
        );
      default:
        return (
          <Image
            source={require('../../assets/interface/navigation/home.png')}
            style={{
              width: iconSize,
              height: iconSize,
            }}
            resizeMode="contain"
          />
        );
    }
  };

  return (
    <View style={tw`items-center justify-center`}>
      <Animated.View style={animatedIconStyle}>{getIcon()}</Animated.View>

      {/* Elegant Active Indicator - using the passed color */}
      <Animated.View
        style={[
          tw`mt-1.5 rounded-full`,
          {
            backgroundColor: focused ? '#f59e0b' : 'transparent',
            width: focused ? 18 : 4,
            height: 3,
          },
          useAnimatedStyle(() => ({
            opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
            width: withSpring(focused ? 18 : 4, {
              damping: 15,
              stiffness: 200,
            }),
          })),
        ]}
      />
    </View>
  );
};

export default TabBarIcon;
