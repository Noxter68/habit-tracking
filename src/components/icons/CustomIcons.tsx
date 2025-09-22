// src/components/icons/CustomIcons.tsx
import React from 'react';
import { Svg, Path, Circle, Defs, LinearGradient, Stop, G, Rect, Ellipse } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const StreakFlameIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
        <Stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
        <Stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="flameInner" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fef3c7" stopOpacity="1" />
        <Stop offset="100%" stopColor="#fbbf24" stopOpacity="0.8" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2C12 2 8 7 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 7 12 2 12 2Z" fill="url(#flameGradient)" opacity="0.9" />
    <Path d="M12 5C12 5 10 8 10 11C10 12.66 11.34 14 13 14C14.66 14 16 12.66 16 11C16 8 14 5 12 5Z" fill="url(#flameInner)" opacity="0.8" />
    <Circle cx="12" cy="12" r="1.5" fill="#fff" opacity="0.9" />
  </Svg>
);

export const ActivityWaveIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
        <Stop offset="50%" stopColor="#8b5cf6" stopOpacity="1" />
        <Stop offset="100%" stopColor="#a78bfa" stopOpacity="0.8" />
      </LinearGradient>
    </Defs>
    <Path d="M2 12L4.5 6L7.5 14L10 10L12 13L14.5 8L17 15L19.5 11L22 12" stroke="url(#waveGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="13" r="2" fill="#6366f1" opacity="0.3" />
    <Circle cx="12" cy="13" r="1" fill="#6366f1" />
  </Svg>
);

export const TargetAchievedIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
        <Stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="10" fill="url(#targetGradient)" />
    <Circle cx="12" cy="12" r="7" fill="#10b981" opacity="0.1" />
    <Circle cx="12" cy="12" r="4" fill="#10b981" opacity="0.2" />
    <Circle cx="12" cy="12" r="2" fill="#10b981" />
    <Path d="M9 12L11 14L15 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ProgressCircleIcon: React.FC<{ size?: number; progress: number }> = ({ size = 48, progress }) => {
  const radius = 20;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6366f1" />
          <Stop offset="100%" stopColor="#8b5cf6" />
        </LinearGradient>
      </Defs>
      {/* Background circle */}
      <Circle cx="24" cy="24" r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      {/* Progress circle */}
      <Circle
        cx="24"
        cy="24"
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
      />
      {/* Center content */}
      <Circle cx="24" cy="24" r="15" fill="#f3f4f6" opacity="0.5" />
      <Path d="M18 24L22 28L30 20" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity={progress === 100 ? '1' : '0.3'} />
    </Svg>
  );
};

export const AddHabitIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="addGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" />
        <Stop offset="100%" stopColor="#8b5cf6" />
      </LinearGradient>
    </Defs>
    <Rect x="2" y="2" width="20" height="20" rx="10" fill="url(#addGradient)" opacity="0.1" />
    <Rect x="4" y="4" width="16" height="16" rx="8" fill="url(#addGradient)" opacity="0.2" />
    <Path d="M12 8V16M8 12H16" stroke="url(#addGradient)" strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const ChevronExpandIcon: React.FC<{ size?: number; expanded: boolean }> = ({ size = 16, expanded }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
    <Path d="M4 6L8 10L12 6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
