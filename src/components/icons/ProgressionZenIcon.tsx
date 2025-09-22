// src/components/icons/ProgressZenIcon.tsx
import React from 'react';
import { Svg, Path, Circle, Defs, LinearGradient, Stop, G, Ellipse, RadialGradient } from 'react-native-svg';

interface ProgressZenIconProps {
  size?: number;
  progress?: number;
}

export const ProgressZenIcon: React.FC<ProgressZenIconProps> = ({ size = 40, progress = 0 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      {/* Calm gradient for outer ring */}
      <LinearGradient id="zenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.6" />
        <Stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#34d399" stopOpacity="0.6" />
      </LinearGradient>

      {/* Inner peaceful gradient */}
      <RadialGradient id="innerZen" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#ecfdf5" stopOpacity="1" />
        <Stop offset="70%" stopColor="#d1fae5" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#a7f3d0" stopOpacity="0.3" />
      </RadialGradient>

      {/* Shadow gradient */}
      <RadialGradient id="shadowGradient" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#065f46" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#065f46" stopOpacity="0" />
      </RadialGradient>
    </Defs>

    {/* Shadow for depth */}
    <Ellipse cx="20" cy="21" rx="18" ry="18" fill="url(#shadowGradient)" />

    {/* Outer circle with gradient */}
    <Circle cx="20" cy="20" r="18" fill="url(#zenGradient)" opacity="0.2" />

    {/* Middle ring */}
    <Circle cx="20" cy="20" r="15" fill="none" stroke="url(#zenGradient)" strokeWidth="1" opacity="0.4" />

    {/* Inner peaceful circle */}
    <Circle cx="20" cy="20" r="12" fill="url(#innerZen)" />

    {/* Zen lotus petals */}
    <G opacity="0.7">
      <Path d="M20 14C20 14 16 16 16 20C16 22.21 17.79 24 20 24C22.21 24 24 22.21 24 20C24 16 20 14 20 14Z" fill="#6ee7b7" opacity="0.6" />
      <Path d="M20 14C20 14 18 16.5 18 19C18 20.66 19.34 22 20 22C20.66 22 22 20.66 22 19C22 16.5 20 14 20 14Z" fill="#34d399" opacity="0.5" />
    </G>

    {/* Center dot for focus */}
    <Circle cx="20" cy="20" r="2" fill="#10b981" opacity="0.8" />
    <Circle cx="20" cy="20" r="1" fill="#ecfdf5" />
  </Svg>
);

export const MeditationWaveIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.4" />
        <Stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
      </LinearGradient>
      <LinearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.3" />
        <Stop offset="50%" stopColor="#c4b5fd" stopOpacity="0.5" />
        <Stop offset="100%" stopColor="#a78bfa" stopOpacity="0.3" />
      </LinearGradient>
      <RadialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.2" />
      </RadialGradient>
    </Defs>

    {/* Background circle with glow */}
    <Circle cx="20" cy="20" r="18" fill="url(#centerGlow)" />

    {/* Flowing wave lines */}
    <Path d="M8 20C8 20 12 16 16 16C20 16 22 20 26 20C30 20 32 16 32 16" stroke="url(#waveGradient1)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
    <Path d="M8 24C8 24 12 20 16 20C20 20 22 24 26 24C30 24 32 20 32 20" stroke="url(#waveGradient2)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />

    {/* Center breathing circle */}
    <Circle cx="20" cy="20" r="6" fill="#e0e7ff" opacity="0.5" />
    <Circle cx="20" cy="20" r="4" fill="#c7d2fe" opacity="0.6" />
    <Circle cx="20" cy="20" r="2" fill="#6366f1" opacity="0.8" />
  </Svg>
);

export const HarmonyLeafIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#86efac" stopOpacity="0.8" />
        <Stop offset="50%" stopColor="#4ade80" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
      </LinearGradient>
      <LinearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#16a34a" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#15803d" stopOpacity="0.8" />
      </LinearGradient>
      <RadialGradient id="glowEffect" cx="50%" cy="30%" r="50%">
        <Stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.4" />
        <Stop offset="100%" stopColor="#86efac" stopOpacity="0.1" />
      </RadialGradient>
    </Defs>

    {/* Soft glow background */}
    <Ellipse cx="20" cy="18" rx="15" ry="15" fill="url(#glowEffect)" />

    {/* Main leaf shape */}
    <Path d="M20 8C20 8 12 12 12 20C12 24.42 15.58 28 20 28C24.42 28 28 24.42 28 20C28 12 20 8 20 8Z" fill="url(#leafGradient)" opacity="0.9" />

    {/* Leaf vein pattern */}
    <Path d="M20 12L20 24M16 16L20 20L24 16" stroke="url(#stemGradient)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

    {/* Inner lighter leaf */}
    <Path d="M20 11C20 11 15 14 15 19C15 21.76 17.24 24 20 24C22.76 24 25 21.76 25 19C25 14 20 11 20 11Z" fill="#bbf7d0" opacity="0.5" />

    {/* Dewdrop for freshness */}
    <Ellipse cx="23" cy="17" rx="2" ry="2" fill="#ffffff" opacity="0.7" />
    <Ellipse cx="23.5" cy="16.5" rx="1" ry="1" fill="#ffffff" opacity="0.9" />
  </Svg>
);

export const PeacefulStoneIcon: React.FC<{ size?: number; stacked?: boolean }> = ({ size = 40, stacked = false }) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Defs>
      <LinearGradient id="stone1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.9" />
        <Stop offset="50%" stopColor="#d1d5db" stopOpacity="1" />
        <Stop offset="100%" stopColor="#9ca3af" stopOpacity="0.9" />
      </LinearGradient>
      <LinearGradient id="stone2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#c7d2fe" stopOpacity="0.8" />
        <Stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
      </LinearGradient>
      <LinearGradient id="stone3" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#d1fae5" stopOpacity="0.8" />
        <Stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#6ee7b7" stopOpacity="0.8" />
      </LinearGradient>
    </Defs>

    {stacked ? (
      <>
        {/* Bottom stone */}
        <Ellipse cx="20" cy="28" rx="8" ry="4" fill="url(#stone1)" />
        <Ellipse cx="20" cy="27" rx="7" ry="3.5" fill="#f3f4f6" opacity="0.6" />

        {/* Middle stone */}
        <Ellipse cx="20" cy="20" rx="6" ry="3" fill="url(#stone2)" />
        <Ellipse cx="20" cy="19" rx="5" ry="2.5" fill="#e0e7ff" opacity="0.6" />

        {/* Top stone */}
        <Ellipse cx="20" cy="13" rx="4" ry="2" fill="url(#stone3)" />
        <Ellipse cx="20" cy="12" rx="3" ry="1.5" fill="#ecfdf5" opacity="0.7" />
      </>
    ) : (
      <>
        {/* Single peaceful stone */}
        <Ellipse cx="20" cy="22" rx="12" ry="6" fill="url(#stone1)" opacity="0.3" />
        <Ellipse cx="20" cy="20" rx="10" ry="5" fill="url(#stone2)" />
        <Ellipse cx="20" cy="19" rx="8" ry="4" fill="#e0e7ff" opacity="0.6" />
        <Ellipse cx="21" cy="18" rx="3" ry="2" fill="#ffffff" opacity="0.4" />
      </>
    )}
  </Svg>
);

// Export a compound icon that can be used in the ProgressCard
export const ProgressZenComposite: React.FC<{
  size?: number;
  type?: 'zen' | 'wave' | 'leaf' | 'stone';
}> = ({ size = 40, type = 'zen' }) => {
  switch (type) {
    case 'wave':
      return <MeditationWaveIcon size={size} />;
    case 'leaf':
      return <HarmonyLeafIcon size={size} />;
    case 'stone':
      return <PeacefulStoneIcon size={size} stacked={true} />;
    default:
      return <ProgressZenIcon size={size} />;
  }
};
