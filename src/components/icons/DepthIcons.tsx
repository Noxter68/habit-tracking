// src/components/icons/DepthIcons.tsx
import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Rect, Ellipse, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const StreakFlameIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="flameGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <Stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
        <Stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="flameGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fed7aa" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
      </LinearGradient>
      <LinearGradient id="flameInner" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <Stop offset="50%" stopColor="#fef3c7" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
      </LinearGradient>
    </Defs>

    {/* Outer glow */}
    <Ellipse cx="12" cy="14" rx="7" ry="9" fill="url(#flameGrad2)" opacity="0.3" />

    {/* Main flame body with depth */}
    <Path d="M12 2c-1 2-6 5-6 10.5C6 16.64 8.686 20 12 20s6-3.36 6-7.5C18 7 13 4 12 2z" fill="url(#flameGrad1)" />

    {/* Inner flame highlight for depth */}
    <Path d="M12 5c-0.5 1.5-3 3.5-3 6.5c0 2.5 1.5 4.5 3 4.5s3-2 3-4.5C15 8.5 12.5 6.5 12 5z" fill="url(#flameInner)" />

    {/* Top highlight for 3D effect */}
    <Ellipse cx="12" cy="8" rx="2" ry="3" fill="#ffffff" opacity="0.4" />

    {/* Shadow at base */}
    <Ellipse cx="12" cy="19.5" rx="4" ry="1" fill="#000000" opacity="0.2" />
  </Svg>
);

export const TrophyDepthIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="trophyGold" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fde047" stopOpacity="1" />
        <Stop offset="30%" stopColor="#facc15" stopOpacity="1" />
        <Stop offset="70%" stopColor="#f59e0b" stopOpacity="1" />
        <Stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="trophyShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="#fef3c7" stopOpacity="0.2" />
      </LinearGradient>
      <LinearGradient id="trophyHandle" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
        <Stop offset="100%" stopColor="#92400e" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Base shadow */}
    <Ellipse cx="12" cy="21" rx="5" ry="1.5" fill="#000000" opacity="0.2" />

    {/* Trophy base */}
    <Rect x="9" y="17" width="6" height="4" rx="0.5" fill="url(#trophyGold)" />
    <Rect x="9.5" y="17.5" width="5" height="3" rx="0.3" fill="url(#trophyShine)" opacity="0.5" />

    {/* Trophy stem */}
    <Rect x="11" y="13" width="2" height="5" fill="url(#trophyGold)" />

    {/* Left handle */}
    <Path d="M6 6c0 0-1.5 0-1.5 2s1.5 3 3 3" stroke="url(#trophyHandle)" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Right handle */}
    <Path d="M18 6c0 0 1.5 0 1.5 2s-1.5 3-3 3" stroke="url(#trophyHandle)" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Main cup */}
    <Path d="M8 5h8v4c0 2.5-1.5 4.5-4 4.5s-4-2-4-4.5V5z" fill="url(#trophyGold)" />

    {/* Cup rim */}
    <Rect x="8" y="4" width="8" height="2" rx="0.5" fill="url(#trophyGold)" />

    {/* Shine on cup */}
    <Path d="M9 5.5h3v3c0 1-0.5 2-1.5 2s-1.5-1-1.5-2v-3z" fill="url(#trophyShine)" opacity="0.6" />

    {/* Star decoration */}
    <Path d="M12 7.5l0.5 1.5h1.5l-1.2 0.9 0.5 1.5-1.3-0.9-1.3 0.9 0.5-1.5-1.2-0.9h1.5z" fill="#ffffff" opacity="0.8" />
  </Svg>
);

export const CalendarCheckIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="calBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ddd6fe" stopOpacity="1" />
        <Stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
        <Stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="calHeader" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
        <Stop offset="100%" stopColor="#6d28d9" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#34d399" stopOpacity="1" />
        <Stop offset="100%" stopColor="#10b981" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Shadow */}
    <Ellipse cx="12" cy="21" rx="7" ry="2" fill="#000000" opacity="0.15" />

    {/* Calendar body with depth */}
    <G>
      {/* Back layer for depth */}
      <Rect x="4.5" y="6.5" width="15" height="14" rx="2" fill="#000000" opacity="0.2" />

      {/* Main calendar body */}
      <Rect x="4" y="6" width="16" height="14" rx="2" fill="url(#calBg)" />

      {/* Calendar header */}
      <Path d="M4 8c0-1.1 0.9-2 2-2h12c1.1 0 2 0.9 2 2v2H4V8z" fill="url(#calHeader)" />

      {/* Calendar rings */}
      <Circle cx="8" cy="4" r="1" fill="#6d28d9" />
      <Rect x="7.5" y="2" width="1" height="4" rx="0.5" fill="#8b5cf6" />

      <Circle cx="16" cy="4" r="1" fill="#6d28d9" />
      <Rect x="15.5" y="2" width="1" height="4" rx="0.5" fill="#8b5cf6" />

      {/* Date grid lines */}
      <G opacity="0.3">
        <Rect x="6" y="12" width="2" height="2" rx="0.5" fill="#ffffff" />
        <Rect x="9" y="12" width="2" height="2" rx="0.5" fill="#ffffff" />
        <Rect x="6" y="15" width="2" height="2" rx="0.5" fill="#ffffff" />
        <Rect x="9" y="15" width="2" height="2" rx="0.5" fill="#ffffff" />
      </G>

      {/* Checkmark circle with depth */}
      <Circle cx="14.5" cy="15.5" r="4" fill="#000000" opacity="0.2" />
      <Circle cx="14" cy="15" r="4" fill="url(#checkGrad)" />

      {/* Checkmark */}
      <Path d="M12 15l1.5 1.5 3-3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Highlight on checkmark circle */}
      <Ellipse cx="14" cy="13.5" rx="2" ry="1" fill="#ffffff" opacity="0.4" />
    </G>
  </Svg>
);

export const ShieldQuestIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="shieldMain" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#e0e7ff" stopOpacity="1" />
        <Stop offset="30%" stopColor="#c7d2fe" stopOpacity="1" />
        <Stop offset="70%" stopColor="#a5b4fc" stopOpacity="1" />
        <Stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="shieldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
        <Stop offset="100%" stopColor="#4f46e5" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="shieldStar" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <Stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Shadow */}
    <Path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" fill="#000000" opacity="0.2" transform="translate(0.5, 0.5)" />

    {/* Shield border */}
    <Path d="M12 21.5s7.5-3.5 7.5-10.5V5.5L12 2.5l-7.5 3v5.5c0 7 7.5 10.5 7.5 10.5z" fill="url(#shieldBorder)" />

    {/* Shield main body */}
    <Path d="M12 20s6-3 6-9V6l-6-2.5L6 6v5c0 6 6 9 6 9z" fill="url(#shieldMain)" />

    {/* Center emblem */}
    <Circle cx="12" cy="10" r="3" fill="url(#shieldStar)" opacity="0.9" />

    {/* Star in center */}
    <Path d="M12 8l0.7 2h2l-1.6 1.2 0.6 2-1.7-1.2-1.7 1.2 0.6-2L9.3 10h2z" fill="#ffffff" opacity="0.95" />

    {/* Top shine effect */}
    <Ellipse cx="12" cy="6" rx="4" ry="2" fill="#ffffff" opacity="0.5" />

    {/* Side highlights for 3D effect */}
    <Path d="M7 7l0 4c0 2 1 3.5 2 4.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.4" fill="none" />
  </Svg>
);
