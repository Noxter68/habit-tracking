// src/components/TabBarIcon.tsx
import React from 'react';
import { View } from 'react-native';
import { Home, Calendar, BarChart3, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'chart' | 'settings';
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 22 }) => {
  // Animated styles for smooth transitions
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1 : 0.9, {
            damping: 15,
            stiffness: 200,
          }),
        },
        {
          translateY: withTiming(focused ? -2 : 0, {
            duration: 200,
          }),
        },
      ],
      opacity: withTiming(focused ? 1 : 0.6, {
        duration: 200,
      }),
    };
  });

  // Get the appropriate icon
  const getIcon = () => {
    const iconProps = {
      size: size,
      color: color,
      strokeWidth: focused ? 2.5 : 2,
    };

    switch (name) {
      case 'home':
        return <Home {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'chart':
        return <BarChart3 {...iconProps} />;
      case 'settings':
        return <Settings {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <View style={tw`items-center justify-center`}>
      <Animated.View style={animatedIconStyle}>{getIcon()}</Animated.View>

      {/* Active Indicator Dot */}
      <Animated.View
        style={[
          tw`mt-1 w-1 h-1 rounded-full`,
          { backgroundColor: color },
          useAnimatedStyle(() => ({
            opacity: withTiming(focused ? 1 : 0, { duration: 200 }),
            transform: [
              {
                scale: withSpring(focused ? 1 : 0, {
                  damping: 15,
                  stiffness: 200,
                }),
              },
            ],
          })),
        ]}
      />
    </View>
  );
};

export default TabBarIcon;
