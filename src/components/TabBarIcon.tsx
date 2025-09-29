// src/components/TabBarIcon.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'chart' | 'settings';
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 24 }) => {
  // Professional color scheme
  const activeColor = focused ? '#6366F1' : '#94A3B8';
  const strokeWidth = focused ? 2.2 : 1.8;

  // Smooth animated styles for the icon container
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.05 : 1, {
            damping: 20,
            stiffness: 350,
            mass: 1,
          }),
        },
      ],
      opacity: withTiming(focused ? 1 : 0.65, {
        duration: 200,
      }),
    };
  });

  // Get the appropriate icon
  const getIcon = () => {
    switch (name) {
      case 'home':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 21V13C9 12.4477 9.44772 12 10 12H14C14.5523 12 15 12.4477 15 13V21M12 3L3 10V21H21V10L12 3Z"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );

      case 'calendar':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="4" width="18" height="18" rx="2" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M16 2V6M8 2V6M3 10H21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {focused && (
              <G>
                <Circle cx="8" cy="15" r="1" fill={activeColor} />
                <Circle cx="12" cy="15" r="1" fill={activeColor} />
                <Circle cx="16" cy="15" r="1" fill={activeColor} />
              </G>
            )}
          </Svg>
        );

      case 'chart':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 3V21H21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7 16L12 11L15 14L20 9" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {focused && (
              <G>
                <Circle cx="7" cy="16" r="1.5" fill={activeColor} />
                <Circle cx="12" cy="11" r="1.5" fill={activeColor} />
                <Circle cx="15" cy="14" r="1.5" fill={activeColor} />
                <Circle cx="20" cy="9" r="1.5" fill={activeColor} />
              </G>
            )}
          </Svg>
        );

      case 'settings':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M10.325 4.317C10.751 2.561 13.249 2.561 13.675 4.317C13.834 5.018 14.591 5.428 15.293 5.188C16.945 4.659 18.285 6.005 17.757 7.656C17.517 8.358 17.927 9.115 18.628 9.274C20.383 9.7 20.383 12.2 18.628 12.626C17.927 12.785 17.517 13.542 17.757 14.244C18.286 15.895 16.94 17.235 15.289 16.707C14.587 16.467 13.83 16.877 13.671 17.578C13.245 19.333 10.747 19.333 10.321 17.578C10.162 16.877 9.405 16.467 8.703 16.707C7.052 17.236 5.712 15.89 6.24 14.239C6.48 13.537 6.07 12.78 5.369 12.621C3.614 12.195 3.614 9.695 5.369 9.269C6.07 9.11 6.48 8.353 6.24 7.651C5.711 6 7.057 4.66 8.708 5.188C9.41 5.428 10.167 5.018 10.326 4.317Z"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="12" cy="12" r="3" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={focused ? activeColor : 'none'} />
          </Svg>
        );

      default:
        return null;
    }
  };

  return (
    <View style={tw`items-center justify-center py-1`}>
      <Animated.View style={animatedIconStyle}>{getIcon()}</Animated.View>
    </View>
  );
};

export default TabBarIcon;
