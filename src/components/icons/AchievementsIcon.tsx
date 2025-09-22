import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop, Rect, Polygon, Ellipse, RadialGradient, Filter, FeDropShadow } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';

// Achievement Badge SVG Components
export const AchievementBadge: React.FC<{ level: number; isUnlocked: boolean; size?: number }> = ({ level, isUnlocked, size = 32 }) => {
  const getTierDesign = () => {
    if (level <= 5) return <NoviceBadge isUnlocked={isUnlocked} level={level} />;
    if (level <= 10) return <RisingBadge isUnlocked={isUnlocked} level={level} />;
    if (level <= 15) return <MasteryBadge isUnlocked={isUnlocked} level={level} />;
    if (level <= 20) return <LegendaryBadge isUnlocked={isUnlocked} level={level} />;
    if (level <= 25) return <EpicBadge isUnlocked={isUnlocked} level={level} />;
    return <MythicBadge isUnlocked={isUnlocked} level={level} />;
  };

  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>{isUnlocked ? getTierDesign() : <LockedBadge />}</View>;
};

// Locked Badge Design
const LockedBadge = () => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
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

// Novice Badge (Levels 1-5) - Simple wooden shield
const NoviceBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      {/* Main wood/bronze gradient */}
      <RadialGradient id="coinGrad" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#b45309" />
        <Stop offset="70%" stopColor="#92400e" />
        <Stop offset="100%" stopColor="#78350f" />
      </RadialGradient>

      {/* Inner glow gradient */}
      <RadialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
        <Stop offset="100%" stopColor="transparent" />
      </RadialGradient>

      {/* Drop shadow filter */}
      <Filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <FeDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
      </Filter>
    </Defs>

    {/* Outer coin circle */}
    <Circle cx="32" cy="32" r="28" fill="url(#coinGrad)" stroke="#451a03" strokeWidth="2" filter="url(#shadow)" />

    {/* Inner glow */}
    <Circle cx="32" cy="32" r="20" fill="url(#innerGrad)" />

    {/* Subtle highlight arc */}
    <Path d="M16 20 A20 20 0 0 1 48 20" stroke="white" strokeOpacity="0.25" strokeWidth="3" fill="none" strokeLinecap="round" />

    {/* Level number circle */}
    <Circle cx="32" cy="32" r="10" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
    <Text x="32" y="36" textAnchor="middle" fill="#78350f" fontSize="12" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);

// Rising Hero Badge (Levels 6-10) - Iron shield with sword
const RisingBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      {/* Shield gradient */}
      <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#facc15" />
        <Stop offset="50%" stopColor="#eab308" />
        <Stop offset="100%" stopColor="#b45309" />
      </LinearGradient>

      {/* Inner glow */}
      <RadialGradient id="innerGlow" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
        <Stop offset="100%" stopColor="transparent" />
      </RadialGradient>
    </Defs>

    {/* Shield base */}
    <Path d="M32 6 L54 16 L54 36 Q54 54 32 60 Q10 54 10 36 L10 16 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="2" />

    {/* Inner shading */}
    <Path d="M32 8 L52 18 L52 35 Q52 51 32 57 Q12 51 12 35 L12 18 Z" fill="url(#innerGlow)" />

    {/* Compass circle */}
    <Circle cx="32" cy="32" r="14" stroke="#92400e" strokeWidth="2" fill="none" />

    {/* Compass star */}
    <Path d="M32 18 L36 32 L32 46 L28 32 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
    <Path d="M18 32 L32 28 L46 32 L32 36 Z" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />

    {/* Compass center */}
    <Circle cx="32" cy="32" r="4" fill="#f59e0b" stroke="#92400e" strokeWidth="1" />

    {/* Level number at bottom */}
    <Circle cx="32" cy="52" r="7" fill="#fbbf24" stroke="#92400e" strokeWidth="2" />
    <Text x="32" y="55" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);

// Mastery Badge (Levels 11-15) - Golden shield with flame
const MasteryBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      <SvgGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
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
    {/* Golden Shield */}
    <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#goldGrad)" stroke="#92400e" strokeWidth="2" />
    {/* Flame */}
    <Path d="M32 22 Q28 28 28 32 Q28 38 32 38 Q36 38 36 32 Q36 28 32 22" fill="url(#flameGrad)" />
    {/* Level */}
    <Circle cx="32" cy="48" r="7" fill="#fff" stroke="#f59e0b" strokeWidth="1.5" />
    <Text x="32" y="51" textAnchor="middle" fill="#d97706" fontSize="9" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);

// Legendary Badge (Levels 16-20) - Diamond shield with crown
const LegendaryBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      <SvgGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#e0e7ff" />
        <Stop offset="50%" stopColor="#c7d2fe" />
        <Stop offset="100%" stopColor="#a5b4fc" />
      </SvgGradient>
      <SvgGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="100%" stopColor="#f59e0b" />
      </SvgGradient>
    </Defs>
    {/* Diamond Shield */}
    <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#diamondGrad)" stroke="#6366f1" strokeWidth="2" />
    {/* Crown */}
    <Path d="M24 24 L26 18 L29 22 L32 16 L35 22 L38 18 L40 24 L40 30 L24 30 Z" fill="url(#crownGrad)" stroke="#d97706" strokeWidth="1" />
    {/* Diamond gems */}
    <Circle cx="26" cy="27" r="2" fill="#fff" opacity="0.8" />
    <Circle cx="32" cy="27" r="2" fill="#fff" opacity="0.8" />
    <Circle cx="38" cy="27" r="2" fill="#fff" opacity="0.8" />
    {/* Level */}
    <Circle cx="32" cy="44" r="8" fill="#6366f1" />
    <Text x="32" y="48" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);

// Epic Badge (Levels 21-25) - Dragon shield
const EpicBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      <SvgGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#991b1b" />
        <Stop offset="50%" stopColor="#dc2626" />
        <Stop offset="100%" stopColor="#7f1d1d" />
      </SvgGradient>
      <SvgGradient id="scaleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="100%" stopColor="#f59e0b" />
      </SvgGradient>
    </Defs>
    {/* Dragon Shield */}
    <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#dragonGrad)" stroke="#450a0a" strokeWidth="2" />
    {/* Dragon scales pattern */}
    <Circle cx="26" cy="22" r="3" fill="url(#scaleGrad)" opacity="0.7" />
    <Circle cx="38" cy="22" r="3" fill="url(#scaleGrad)" opacity="0.7" />
    <Circle cx="32" cy="28" r="3" fill="url(#scaleGrad)" opacity="0.7" />
    <Circle cx="26" cy="34" r="3" fill="url(#scaleGrad)" opacity="0.7" />
    <Circle cx="38" cy="34" r="3" fill="url(#scaleGrad)" opacity="0.7" />
    {/* Dragon eye */}
    <Ellipse cx="32" cy="40" rx="8" ry="4" fill="#fbbf24" />
    <Ellipse cx="32" cy="40" rx="2" ry="4" fill="#000" />
    {/* Level */}
    <Circle cx="32" cy="52" r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
    <Text x="32" y="55" textAnchor="middle" fill="#7f1d1d" fontSize="9" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);

// Mythic Badge (Levels 26-30) - Cosmic shield
const MythicBadge: React.FC<{ isUnlocked: boolean; level: number }> = ({ level }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64">
    <Defs>
      <SvgGradient id="cosmicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#6366f1" />
        <Stop offset="33%" stopColor="#8b5cf6" />
        <Stop offset="66%" stopColor="#ec4899" />
        <Stop offset="100%" stopColor="#6366f1" />
      </SvgGradient>
      <SvgGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="100%" stopColor="#fff" />
      </SvgGradient>
    </Defs>
    {/* Cosmic Shield */}
    <Path d="M32 8 L48 16 L48 36 Q48 52 32 56 Q16 52 16 36 L16 16 Z" fill="url(#cosmicGrad)" stroke="#312e81" strokeWidth="2" opacity="0.9" />
    {/* Stars constellation */}
    <Circle cx="25" cy="20" r="1.5" fill="url(#starGrad)" />
    <Circle cx="39" cy="22" r="1.5" fill="url(#starGrad)" />
    <Circle cx="32" cy="28" r="2" fill="url(#starGrad)" />
    <Circle cx="28" cy="36" r="1.5" fill="url(#starGrad)" />
    <Circle cx="36" cy="38" r="1.5" fill="url(#starGrad)" />
    {/* Central star burst */}
    <Polygon points="32,38 34,44 40,44 35,48 37,54 32,50 27,54 29,48 24,44 30,44" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
    {/* Level */}
    <Circle cx="32" cy="44" r="8" fill="#fff" opacity="0.9" />
    <Text x="32" y="48" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold">
      {level}
    </Text>
  </Svg>
);
