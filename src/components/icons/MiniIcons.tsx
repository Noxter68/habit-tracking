// src/components/icons/MiniIcons.tsx
import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface MiniIconProps {
  size?: number;
  color?: string;
}

export const MiniFlameIcon: React.FC<MiniIconProps> = ({ size = 12, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path d="M6 1.5c-.5 1-2.5 2-2.5 4.25C3.5 7.5 4.5 9 6 9s2.5-1.5 2.5-3.25C8.5 3.5 6.5 2.5 6 1.5z" fill={color} />
    <Path d="M6 3c-.25.5-1.25 1.25-1.25 2.5c0 1 .5 1.75 1.25 1.75s1.25-.75 1.25-1.75C7.25 4.25 6.25 3.5 6 3z" fill={color} opacity="0.4" />
  </Svg>
);

export const MiniCheckIcon: React.FC<MiniIconProps> = ({ size = 12, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path d="M3 6l2 2 4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MiniTrophyIcon: React.FC<MiniIconProps> = ({ size = 12, color = '#fbbf24' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path d="M3.5 3h5v2.5c0 1-.75 1.75-1.75 1.75h-1.5C4.25 7.25 3.5 6.5 3.5 5.5V3z" fill={color} />
    <Path d="M5.5 7.25V9h1V7.25M4.5 9h3M2.5 3.5c0 1 .5 1.5 1 1.5M9.5 3.5c0 1-.5 1.5-1 1.5" stroke={color} strokeWidth="0.75" strokeLinecap="round" />
  </Svg>
);

export const MiniCalendarIcon: React.FC<MiniIconProps> = ({ size = 12, color = '#8b5cf6' }) => (
  <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <Path d="M2 4.5c0-.5.5-1 1-1h6c.5 0 1 .5 1 1V9c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1V4.5z" fill={color} />
    <Path d="M2 5h8M4 2v2M8 2v2" stroke={color} strokeWidth="0.75" strokeLinecap="round" />
    <Circle cx="4.5" cy="7" r="0.5" fill="white" />
    <Circle cx="7.5" cy="7" r="0.5" fill="white" />
  </Svg>
);

// Add this to MiniIcons.tsx

export const QuestCompleteIcon: React.FC<MiniIconProps> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Defs>
      <LinearGradient id="swordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <Stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#fef3c7" stopOpacity="0.6" />
      </LinearGradient>
    </Defs>

    {/* Crossed swords */}
    <G>
      {/* Left sword */}
      <Path d="M3 3L10 10M3 3L3.5 5.5L5.5 3.5L3 3Z" stroke="url(#swordGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="10.5" cy="10.5" r="1" fill="url(#swordGrad)" />

      {/* Right sword */}
      <Path d="M13 3L6 10M13 3L12.5 5.5L10.5 3.5L13 3Z" stroke="url(#swordGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="5.5" cy="10.5" r="1" fill="url(#swordGrad)" />

      {/* Center sparkle */}
      <Circle cx="8" cy="6.5" r="1.5" fill="url(#sparkle)" opacity="0.8" />
      <Circle cx="8" cy="6.5" r="0.5" fill="#ffffff" />
    </G>

    {/* Victory stars */}
    <G opacity="0.7">
      <Circle cx="3" cy="13" r="0.5" fill="#fbbf24" />
      <Circle cx="13" cy="13" r="0.5" fill="#fbbf24" />
      <Circle cx="8" cy="14" r="0.5" fill="#fbbf24" />
    </G>
  </Svg>
);

export const KeepGoingIcon: React.FC<MiniIconProps> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Defs>
      <LinearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <Stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Arrow pointing forward with energy lines */}
    <Path d="M2 8h10M10 5l3 3-3 3" stroke="url(#arrowGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

    {/* Energy/speed lines */}
    <Path d="M2 5.5h3M2 10.5h3M4 8h2" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

    {/* Sparkle dots */}
    <Circle cx="7" cy="4" r="0.5" fill="#fbbf24" opacity="0.8" />
    <Circle cx="9" cy="12" r="0.5" fill="#fbbf24" opacity="0.8" />
  </Svg>
);

export const TomorrowStarIcon: React.FC<MiniIconProps> = ({ size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Defs>
      <LinearGradient id="sunriseGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <Stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
        <Stop offset="50%" stopColor="#f97316" stopOpacity="1" />
        <Stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Horizon line */}
    <Path d="M1 10h14" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />

    {/* Rising sun */}
    <Circle cx="8" cy="10" r="3" fill="url(#sunriseGrad)" />

    {/* Sun rays */}
    <G opacity="0.7">
      <Path d="M8 6v1M11.5 8.5l-0.7 0.7M4.5 8.5l0.7 0.7" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
    </G>

    {/* Stars fading */}
    <G opacity="0.4">
      <Circle cx="3" cy="3" r="0.5" fill="#c7d2fe" />
      <Circle cx="13" cy="4" r="0.5" fill="#c7d2fe" />
    </G>
  </Svg>
);
