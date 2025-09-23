// src/components/icons/StatsIcons.tsx
import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const StatsIcons = {
  // Flame icon for streaks
  Flame: ({ size = 20, color = '#fb923c' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 8 6 8 10C8 11 8.5 13 9 14C7.5 12.5 6 11 6 11C6 11 4 13 4 16C4 19.866 7.134 23 11 23C14.866 23 18 19.866 18 16C18 12 12 2 12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 16C10 17.657 11.343 19 13 19C14.104 19 15.057 18.366 15.535 17.465C15.837 16.887 16 16.217 16 15.5C16 13.5 14 11 14 11C14 11 10 14 10 16Z" fill={color} opacity="0.3" />
    </Svg>
  ),

  // Trophy icon for achievements
  Trophy: ({ size = 20, color = '#fbbf24' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2V7C6 10.314 8.686 13 12 13C15.314 13 18 10.314 18 7V2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 2H18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 13V18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 22H16" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18L8 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 18L16 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="7" r="2" fill={color} opacity="0.3" />
    </Svg>
  ),

  // Check circle for completions
  CheckCircle: ({ size = 20, color = '#10b981' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12L11 14L15 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="10" fill={color} opacity="0.1" />
    </Svg>
  ),

  // Diamond for perfect days
  Diamond: ({ size = 20, color = '#8b5cf6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3L2 9L12 21L22 9L18 3H6Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M2 9H22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 3V9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 3L2 9L12 21" fill={color} opacity="0.2" />
    </Svg>
  ),

  // Activity for daily progress
  Activity: ({ size = 20, color = '#3b82f6' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 12H18L15 21L9 3L6 12H2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  ),

  // Target for goals
  Target: ({ size = 20, color = '#6366f1' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="6" fill={color} opacity="0.1" />
    </Svg>
  ),

  // Trend up for building habits
  TrendUp: ({ size = 20, color = '#10b981' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 17L9 11L13 15L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 7H21V13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="11" r="1.5" fill={color} />
      <Circle cx="13" cy="15" r="1.5" fill={color} />
    </Svg>
  ),

  // Trend down for quitting habits
  TrendDown: ({ size = 20, color = '#ef4444' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7L9 13L13 9L21 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15 17H21V11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9" cy="13" r="1.5" fill={color} />
      <Circle cx="13" cy="9" r="1.5" fill={color} />
    </Svg>
  ),

  // Calendar for dates
  Calendar: ({ size = 20, color = '#64748b' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Rect x="3" y="10" width="18" height="12" rx="2" fill={color} opacity="0.1" />
    </Svg>
  ),

  // Star for achievements
  Star: ({ size = 20, color = '#fbbf24' }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="12,2 15,9 22,9 16.5,14 19,21 12,16.5 5,21 7.5,14 2,9 9,9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polygon points="12,2 15,9 22,9 16.5,14 19,21 12,16.5 5,21 7.5,14 2,9 9,9" fill={color} opacity="0.2" />
    </Svg>
  ),
};
