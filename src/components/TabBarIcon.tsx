// src/components/TabBarIcon.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, G, Polyline } from 'react-native-svg';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'chart' | 'settings' | 'leaderboard';
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 24 }) => {
  // Sand/Stone color scheme - warm and calming
  const activeColor = focused ? '#726454' : '#BFB3A3'; // sand-700 : sand-400
  const strokeWidth = focused ? 2.3 : 2;

  // Smooth animated styles for the icon container
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.08 : 1, {
            damping: 18,
            stiffness: 320,
            mass: 0.8,
          }),
        },
      ],
      opacity: withTiming(focused ? 1 : 0.7, {
        duration: 220,
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
              d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {focused && <Circle cx="12" cy="3" r="1.2" fill={activeColor} opacity="0.4" />}
          </Svg>
        );

      case 'calendar':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="6" width="18" height="15" rx="2" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 10H21M8 3V6M16 3V6" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {focused && (
              <G>
                <Rect x="7" y="13" width="2" height="2" rx="0.5" fill={activeColor} />
                <Rect x="11" y="13" width="2" height="2" rx="0.5" fill={activeColor} />
                <Rect x="15" y="13" width="2" height="2" rx="0.5" fill={activeColor} />
                <Rect x="7" y="17" width="2" height="2" rx="0.5" fill={activeColor} opacity="0.6" />
              </G>
            )}
          </Svg>
        );

      case 'chart':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 3V21H21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7 17V14M12 17V11M17 17V7" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {focused && (
              <G>
                <Circle cx="7" cy="14" r="1.2" fill={activeColor} opacity="0.5" />
                <Circle cx="12" cy="11" r="1.2" fill={activeColor} opacity="0.5" />
                <Circle cx="17" cy="7" r="1.2" fill={activeColor} opacity="0.5" />
              </G>
            )}
          </Svg>
        );

      case 'settings':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="3"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.2 : 0}
            />
            <Path
              d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {focused && (
              <G>
                <Circle cx="12" cy="1" r="0.8" fill={activeColor} opacity="0.4" />
                <Circle cx="12" cy="23" r="0.8" fill={activeColor} opacity="0.4" />
                <Circle cx="1" cy="12" r="0.8" fill={activeColor} opacity="0.4" />
                <Circle cx="23" cy="12" r="0.8" fill={activeColor} opacity="0.4" />
              </G>
            )}
          </Svg>
        );

      case 'leaderboard':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Trophy Cup */}
            <Path d="M6 9C6 10.5 6.5 13 9 13M18 9C18 10.5 17.5 13 15 13" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <Path
              d="M9 4H15C15.5523 4 16 4.44772 16 5V10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10V5C8 4.44772 8.44772 4 9 4Z"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.15 : 0}
            />
            {/* Base */}
            <Path
              d="M10 14V17H14V14M8 20H16C16.5523 20 17 19.5523 17 19V18C17 17.4477 16.5523 17 16 17H8C7.44772 17 7 17.4477 7 18V19C7 19.5523 7.44772 20 8 20Z"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {focused && (
              <G>
                <Path d="M10.5 7.5L11.5 9L13 8.5" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
              </G>
            )}
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
