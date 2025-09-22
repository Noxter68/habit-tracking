// src/components/icons/AchievementsIcon.tsx
import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop, Text, Polygon, Ellipse, RadialGradient } from 'react-native-svg';
import { View } from 'react-native';

// Achievement Badge SVG Components with proper scaling
export const AchievementBadge: React.FC<{ level: number; isUnlocked: boolean; size?: number }> = ({ level, isUnlocked, size = 32 }) => {
  const getTierDesign = () => {
    // Scale factor to convert from 64px viewBox to desired size
    const scale = size / 64;

    if (!isUnlocked) return <LockedBadge size={size} />;
    if (level <= 5) return <NoviceBadge level={level} size={size} />;
    if (level <= 10) return <RisingBadge level={level} size={size} />;
    if (level <= 15) return <MasteryBadge level={level} size={size} />;
    if (level <= 20) return <LegendaryBadge level={level} size={size} />;
    if (level <= 25) return <EpicBadge level={level} size={size} />;
    return <MythicBadge level={level} size={size} />;
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {getTierDesign()}
    </View>
  );
};

// Locked Badge Design
const LockedBadge: React.FC<{ size: number }> = ({ size }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs>
      <SvgGradient id="lockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#475569" />
        <Stop offset="100%" stopColor="#1e293b" />
      </SvgGradient>
    </Defs>
    <Circle cx="32" cy="32" r="28" fill="url(#lockGrad)" opacity="0.3" />
    <Circle cx="32" cy="32" r="28" stroke="#334155" strokeWidth="2" fill="none" />
    <G transform="translate(32, 32)">
      <Path d="M-8 2 L-8 -4 Q-8 -12 0 -12 Q8 -12 8 -4 L8 2 M-10 2 L10 2 L10 14 L-10 14 Z" fill="#64748b" stroke="#475569" strokeWidth="1" />
    </G>
  </Svg>
);

// Novice Badge (Levels 1-5) - Bronze coin
const NoviceBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  // Calculate font size based on badge size
  const fontSize = Math.max(8, size * 0.15);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="coinGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#b45309" />
          <Stop offset="70%" stopColor="#92400e" />
          <Stop offset="100%" stopColor="#78350f" />
        </RadialGradient>
        <RadialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
      </Defs>

      <Circle cx="32" cy="32" r="28" fill="url(#coinGrad)" stroke="#451a03" strokeWidth="2" />
      <Circle cx="32" cy="32" r="20" fill="url(#innerGrad)" />
      <Path d="M16 20 A20 20 0 0 1 48 20" stroke="white" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />

      <Circle cx="32" cy="32" r="10" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
      <Text x="32" y="36" textAnchor="middle" fill="#78350f" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

// Rising Hero Badge (Levels 6-10) - Gold compass
const RisingBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const fontSize = Math.max(8, size * 0.14);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#facc15" />
          <Stop offset="50%" stopColor="#eab308" />
          <Stop offset="100%" stopColor="#b45309" />
        </SvgGradient>
        <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="transparent" />
        </RadialGradient>
      </Defs>

      <Path d="M32 6 L54 16 L54 36 Q54 54 32 60 Q10 54 10 36 L10 16 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="2" />
      <Path d="M32 8 L52 18 L52 35 Q52 51 32 57 Q12 51 12 35 L12 18 Z" fill="url(#innerGlow)" />

      <Circle cx="32" cy="32" r="14" stroke="#92400e" strokeWidth="2" fill="none" />
      <Path d="M32 18 L36 32 L32 46 L28 32 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
      <Path d="M18 32 L32 28 L46 32 L32 36 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
      <Circle cx="32" cy="32" r="4" fill="#f59e0b" stroke="#92400e" strokeWidth="1" />

      <Circle cx="32" cy="52" r="7" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
      <Text x="32" y="55" textAnchor="middle" fill="#78350f" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

// Mastery Badge (Levels 11-15) - Golden flame shield
const MasteryBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const fontSize = Math.max(8, size * 0.14);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="masteryGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="50%" stopColor="#f59e0b" />
          <Stop offset="100%" stopColor="#d97706" />
        </SvgGradient>
        <SvgGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%" stopColor="#dc2626" />
          <Stop offset="50%" stopColor="#f97316" />
          <Stop offset="100%" stopColor="#fbbf24" />
        </SvgGradient>
      </Defs>

      <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#masteryGoldGrad)" stroke="#92400e" strokeWidth="2" />
      <Path d="M32 22 Q28 28 28 32 Q28 38 32 38 Q36 38 36 32 Q36 28 32 22" fill="url(#flameGrad)" />

      <Circle cx="32" cy="48" r="7" fill="#fff" stroke="#f59e0b" strokeWidth="1.5" />
      <Text x="32" y="51" textAnchor="middle" fill="#d97706" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

// Legendary Badge (Levels 16-20) - Diamond crown shield
const LegendaryBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const fontSize = Math.max(8, size * 0.15);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="legendDiamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#e0e7ff" />
          <Stop offset="50%" stopColor="#c7d2fe" />
          <Stop offset="100%" stopColor="#a5b4fc" />
        </SvgGradient>
        <SvgGradient id="legendCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#f59e0b" />
        </SvgGradient>
      </Defs>

      <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#legendDiamondGrad)" stroke="#6366f1" strokeWidth="2" />
      <Path d="M24 24 L26 18 L29 22 L32 16 L35 22 L38 18 L40 24 L40 30 L24 30 Z" fill="url(#legendCrownGrad)" stroke="#d97706" strokeWidth="1" />

      <Circle cx="26" cy="27" r="2" fill="#fff" opacity="0.8" />
      <Circle cx="32" cy="27" r="2" fill="#fff" opacity="0.8" />
      <Circle cx="38" cy="27" r="2" fill="#fff" opacity="0.8" />

      <Circle cx="32" cy="44" r="8" fill="#6366f1" />
      <Text x="32" y="48" textAnchor="middle" fill="#fff" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

// Epic Badge (Levels 21-25) - Dragon shield
const EpicBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const fontSize = Math.max(8, size * 0.14);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="epicDragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#991b1b" />
          <Stop offset="50%" stopColor="#dc2626" />
          <Stop offset="100%" stopColor="#7f1d1d" />
        </SvgGradient>
        <SvgGradient id="epicScaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#f59e0b" />
        </SvgGradient>
      </Defs>

      <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#epicDragonGrad)" stroke="#450a0a" strokeWidth="2" />

      <Circle cx="26" cy="22" r="3" fill="url(#epicScaleGrad)" opacity="0.7" />
      <Circle cx="38" cy="22" r="3" fill="url(#epicScaleGrad)" opacity="0.7" />
      <Circle cx="32" cy="28" r="3" fill="url(#epicScaleGrad)" opacity="0.7" />
      <Circle cx="26" cy="34" r="3" fill="url(#epicScaleGrad)" opacity="0.7" />
      <Circle cx="38" cy="34" r="3" fill="url(#epicScaleGrad)" opacity="0.7" />

      <Ellipse cx="32" cy="40" rx="8" ry="4" fill="#fbbf24" />
      <Ellipse cx="32" cy="40" rx="2" ry="4" fill="#000" />

      <Circle cx="32" cy="52" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
      <Text x="32" y="55" textAnchor="middle" fill="#7f1d1d" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

// Mythic Badge (Levels 26-30) - Cosmic shield
const MythicBadge: React.FC<{ level: number; size: number }> = ({ level, size }) => {
  const fontSize = Math.max(8, size * 0.15);

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgGradient id="mythicCosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#6366f1" />
          <Stop offset="33%" stopColor="#8b5cf6" />
          <Stop offset="66%" stopColor="#ec4899" />
          <Stop offset="100%" stopColor="#6366f1" />
        </SvgGradient>
        <SvgGradient id="mythicStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="100%" stopColor="#fff" />
        </SvgGradient>
      </Defs>

      <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#mythicCosmicGrad)" stroke="#312e81" strokeWidth="2" opacity="0.9" />

      <Circle cx="25" cy="20" r="1.5" fill="url(#mythicStarGrad)" />
      <Circle cx="39" cy="22" r="1.5" fill="url(#mythicStarGrad)" />
      <Circle cx="32" cy="28" r="2" fill="url(#mythicStarGrad)" />
      <Circle cx="28" cy="36" r="1.5" fill="url(#mythicStarGrad)" />
      <Circle cx="36" cy="38" r="1.5" fill="url(#mythicStarGrad)" />

      <Polygon points="32,38 34,44 40,44 35,48 37,54 32,50 27,54 29,48 24,44 30,44" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />

      <Circle cx="32" cy="44" r="8" fill="#fff" opacity="0.9" />
      <Text x="32" y="48" textAnchor="middle" fill="#6366f1" fontSize={fontSize} fontWeight="bold">
        {level}
      </Text>
    </Svg>
  );
};

export default AchievementBadge;
