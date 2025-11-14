// src/components/TabBarIcon.tsx
import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, G, Line, Polygon } from 'react-native-svg';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'users' | 'settings' | 'leaderboard'; // ✅ 'chart' remplacé par 'users'
  color: string;
  focused: boolean;
  size?: number;
}

export const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 24 }) => {
  // Dark slate color scheme matching screens
  const activeColor = focused ? '#1e293b' : '#64748b'; // slate-800 : slate-500
  const strokeWidth = focused ? 2.2 : 1.8;

  // Smooth animated styles for the icon container
  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.1 : 1, {
            damping: 15,
            stiffness: 300,
            mass: 0.7,
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
            {/* Modern house with clean lines */}
            <Path
              d="M3 10L12 2L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.08 : 0}
            />
            {/* Door */}
            <Path d="M9 21V14C9 13.4477 9.44772 13 10 13H14C14.5523 13 15 13.4477 15 14V21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {/* Roof accent */}
            {focused && <Circle cx="12" cy="2" r="1.5" fill={activeColor} opacity="0.5" />}
          </Svg>
        );

      case 'calendar':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Calendar body */}
            <Rect
              x="3"
              y="5"
              width="18"
              height="16"
              rx="2"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.06 : 0}
            />
            {/* Header separator */}
            <Path d="M3 9H21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            {/* Hooks */}
            <Path d="M7 3V7M17 3V7" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
            {/* Calendar dots - professional grid pattern */}
            {focused ? (
              <G>
                <Circle cx="7.5" cy="13" r="1.2" fill={activeColor} opacity="0.7" />
                <Circle cx="12" cy="13" r="1.2" fill={activeColor} opacity="0.7" />
                <Circle cx="16.5" cy="13" r="1.2" fill={activeColor} opacity="0.7" />
                <Circle cx="7.5" cy="17" r="1.2" fill={activeColor} opacity="0.5" />
                <Circle cx="12" cy="17" r="1.2" fill={activeColor} opacity="0.5" />
              </G>
            ) : (
              <G>
                <Circle cx="7.5" cy="13" r="0.8" fill={activeColor} opacity="0.5" />
                <Circle cx="12" cy="13" r="0.8" fill={activeColor} opacity="0.5" />
                <Circle cx="16.5" cy="13" r="0.8" fill={activeColor} opacity="0.5" />
              </G>
            )}
          </Svg>
        );

      case 'users':
        // ✅ NOUVELLE ICÔNE: Groupe d'utilisateurs
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* User 1 (left) */}
            <Circle
              cx="9"
              cy="8"
              r="3.5"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.08 : 0}
            />
            {/* User 2 (right) */}
            <Circle
              cx="15"
              cy="8"
              r="3.5"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.08 : 0}
            />
            {/* Body/shoulders group */}
            <Path
              d="M3 21C3 18 5.5 16 9 16C10 16 10.8 16.2 11.5 16.5M13 16.5C13.7 16.2 14.5 16 15.5 16C19 16 21.5 18 21.5 21"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Connection line when focused */}
            {focused && (
              <G>
                <Path d="M10.5 9.5L13.5 9.5" stroke={activeColor} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" opacity="0.4" />
                <Circle cx="12" cy="9.5" r="1" fill={activeColor} opacity="0.3" />
              </G>
            )}
          </Svg>
        );

      case 'settings':
        // User profile icon - more relevant for app settings
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* User head */}
            <Circle
              cx="12"
              cy="8"
              r="4"
              stroke={activeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={focused ? activeColor : 'none'}
              fillOpacity={focused ? 0.12 : 0}
            />
            {/* User body/shoulders */}
            <Path d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21" stroke={activeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            {/* Settings gear overlay when focused */}
            {focused && (
              <G opacity="0.35">
                <Circle cx="17" cy="7" r="3" fill="#FFFFFF" />
                <Circle cx="17" cy="7" r="2" stroke={activeColor} strokeWidth="1.2" fill="none" />
                <Line x1="17" y1="5" x2="17" y2="4.5" stroke={activeColor} strokeWidth="1" />
                <Line x1="17" y1="9.5" x2="17" y2="9" stroke={activeColor} strokeWidth="1" />
                <Line x1="19" y1="7" x2="19.5" y2="7" stroke={activeColor} strokeWidth="1" />
                <Line x1="14.5" y1="7" x2="15" y2="7" stroke={activeColor} strokeWidth="1" />
              </G>
            )}
          </Svg>
        );

      case 'leaderboard':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {/* Podium style leaderboard - more professional */}
            <G>
              {/* 1st place - tallest */}
              <Rect x="9" y="6" width="6" height="15" rx="1" stroke={activeColor} strokeWidth={strokeWidth} fill={focused ? activeColor : 'none'} fillOpacity={focused ? 0.15 : 0} />
              {/* Crown/star on top */}
              <Path d="M12 3L12.7 5.3L15 6L12.7 6.7L12 9L11.3 6.7L9 6L11.3 5.3L12 3Z" fill={activeColor} opacity={focused ? 0.8 : 0.6} />

              {/* 2nd place - medium */}
              <Rect x="2" y="11" width="6" height="10" rx="1" stroke={activeColor} strokeWidth={strokeWidth} fill={focused ? activeColor : 'none'} fillOpacity={focused ? 0.08 : 0} />

              {/* 3rd place - shortest */}
              <Rect x="16" y="14" width="6" height="7" rx="1" stroke={activeColor} strokeWidth={strokeWidth} fill={focused ? activeColor : 'none'} fillOpacity={focused ? 0.05 : 0} />

              {/* Rankings numbers */}
              {focused && (
                <G>
                  <Circle cx="5" cy="13.5" r="1.5" fill={activeColor} opacity="0.3" />
                  <Circle cx="12" cy="8.5" r="1.5" fill={activeColor} opacity="0.4" />
                  <Circle cx="19" cy="16.5" r="1.5" fill={activeColor} opacity="0.25" />
                </G>
              )}
            </G>
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
