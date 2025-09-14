// src/components/TabBarIcon.tsx
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import tw from '../lib/tailwind';

interface TabBarIconProps {
  name: 'home' | 'calendar' | 'chart' | 'settings';
  color: string;
  focused: boolean;
  size?: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, color, focused, size = 24 }) => {
  const renderIcon = () => {
    switch (name) {
      case 'home':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15"
              stroke={color}
              strokeWidth={focused ? 2.5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );

      case 'calendar':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x="3" y="6" width="18" height="15" rx="2" stroke={color} strokeWidth={focused ? 2.5 : 2} />
            <Path d="M3 10H21" stroke={color} strokeWidth={focused ? 2.5 : 2} />
            <Path d="M8 2V6" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M16 2V6" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            {focused && (
              <>
                <Circle cx="9" cy="15" r="1" fill={color} />
                <Circle cx="12" cy="15" r="1" fill={color} />
                <Circle cx="15" cy="15" r="1" fill={color} />
              </>
            )}
          </Svg>
        );

      case 'chart':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M3 3V21H21" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7 16L7 12" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M12 16L12 8" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M17 16L17 10" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            {focused && <Path d="M7 12L12 8L17 10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          </Svg>
        );

      case 'settings':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={focused ? 2.5 : 2} />
            <Path d="M12 1V6M12 18V23" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M20.5 7.5L16.5 10M7.5 14L3.5 16.5" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M20.5 16.5L16.5 14M7.5 10L3.5 7.5" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
            <Path d="M23 12H18M6 12H1" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
          </Svg>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[tw`items-center justify-center`, focused && tw`scale-110`]}>
      {focused && <View style={[tw`absolute w-12 h-12 rounded-full opacity-10`, { backgroundColor: color }]} />}
      {renderIcon()}
    </View>
  );
};

export default TabBarIcon;
