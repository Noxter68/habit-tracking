import React from 'react';
import Svg, { Path, G, Circle, Polygon, Defs, LinearGradient, Stop, Ellipse, Rect, Text } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

// Gem Icon - Like a crystalline achievement gem
export const GemIcon: React.FC<IconProps> = ({ size = 24, color = '#8b5cf6' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="gem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="1" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L8 8L12 22L16 8L12 2Z" fill="url(#gem-grad)" />
    <Path d="M12 2L4 8H8L12 2Z" fill={color} opacity="0.8" />
    <Path d="M12 2L16 8H20L12 2Z" fill={color} opacity="0.6" />
    <Path d="M4 8L8 8L12 22L4 8Z" fill={color} opacity="0.5" />
    <Path d="M20 8L16 8L12 22L20 8Z" fill={color} opacity="0.4" />
  </Svg>
);

// Mystical Orb Icon
export const OrbIcon: React.FC<IconProps> = ({ size = 24, color = '#10b981' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="orb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
        <Stop offset="50%" stopColor={color} />
        <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="9" fill="url(#orb-grad)" />
    <Circle cx="12" cy="12" r="7" fill={color} opacity="0.4" />
    <Circle cx="12" cy="12" r="5" fill={color} opacity="0.6" />
    <Ellipse cx="10" cy="9" rx="3" ry="2" fill="#ffffff" opacity="0.5" />
  </Svg>
);

// Mountain Peak Icon
export const MountainIcon: React.FC<IconProps> = ({ size = 24, color = '#64748b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L4 18H20L12 2Z" fill={color} opacity="0.8" />
    <Path d="M12 2L16 10L20 18L12 2Z" fill={color} opacity="0.6" />
    <Path d="M8 11L12 5L14 8L11 13L8 11Z" fill="#ffffff" opacity="0.3" />
    <Rect x="3" y="18" width="18" height="3" fill={color} opacity="0.4" />
  </Svg>
);

// Sword Icon
export const SwordIcon: React.FC<IconProps> = ({ size = 24, color = '#ef4444' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="sword-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={color} />
        <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L11 12H13L12 2Z" fill="url(#sword-grad)" />
    <Path d="M10 12H14V14H10V12Z" fill={color} />
    <Path d="M11 14H13V19H11V14Z" fill={color} opacity="0.8" />
    <Circle cx="12" cy="20" r="2" fill={color} />
    <Path d="M8 13H16L15 14H9L8 13Z" fill={color} opacity="0.6" />
  </Svg>
);

// Shield Icon with better contrast
export const ShieldIcon: React.FC<IconProps> = ({ size = 24, color = '#f59e0b' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="shield-main" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={color} stopOpacity="1" />
        <Stop offset="50%" stopColor={color} stopOpacity="0.85" />
        <Stop offset="100%" stopColor={color} stopOpacity="0.7" />
      </LinearGradient>
      <LinearGradient id="shield-highlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </LinearGradient>
      <LinearGradient id="shield-emblem" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
      </LinearGradient>
    </Defs>

    {/* Main shield body */}
    <Path d="M12 2L4 5V11C4 16 7 20 12 21C17 20 20 16 20 11V5L12 2Z" fill="url(#shield-main)" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />

    {/* Top highlight for depth */}
    <Path d="M12 2L4 5V8C4 8 6 6 12 5C18 6 20 8 20 8V5L12 2Z" fill="url(#shield-highlight)" />

    {/* Center emblem - sword/cross */}
    <G>
      <Path d="M12 6L12 15" stroke="url(#shield-emblem)" strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 9L15 9" stroke="url(#shield-emblem)" strokeWidth="2" strokeLinecap="round" />
      {/* Small gem in center */}
      <Circle cx="12" cy="9" r="1.5" fill="#ffffff" opacity="0.8" />
    </G>
  </Svg>
);

// Solid achievement gem - for completed days
export const AchievementGemIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="gem-complete" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#34d399" />
        <Stop offset="50%" stopColor="#10b981" />
        <Stop offset="100%" stopColor="#059669" />
      </LinearGradient>
      <LinearGradient id="gem-shine" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
        <Stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L8 8L12 22L16 8L12 2Z" fill="url(#gem-complete)" />
    <Path d="M12 2L4 8H8L12 2Z" fill="#10b981" />
    <Path d="M12 2L16 8H20L12 2Z" fill="#059669" />
    <Path d="M4 8L8 8L12 22L4 8Z" fill="#047857" />
    <Path d="M20 8L16 8L12 22L20 8Z" fill="#065f46" />
    {/* Shine effect */}
    <Rect x="10" y="4" width="4" height="12" fill="url(#gem-shine)" opacity="0.7" />
  </Svg>
);

// Cracked shield - for partial completion
export const PartialShieldIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="shield-partial" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#fbbf24" />
        <Stop offset="50%" stopColor="#f59e0b" />
        <Stop offset="100%" stopColor="#d97706" />
      </LinearGradient>
      <LinearGradient id="shield-partial-shine" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </LinearGradient>
    </Defs>
    <Path d="M12 2L4 5V11C4 16 7 20 12 21C17 20 20 16 20 11V5L12 2Z" fill="url(#shield-partial)" />
    {/* Crack lines */}
    <Path d="M11 6L10 10L11 14" stroke="#92400e" strokeWidth="1" opacity="0.6" />
    <Path d="M13 8L14 12L13 16" stroke="#92400e" strokeWidth="1" opacity="0.6" />
    {/* Shine */}
    <Ellipse cx="9" cy="8" rx="2" ry="3" fill="url(#shield-partial-shine)" />
  </Svg>
);

// Broken gem - for missed days
export const BrokenGemIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="gem-broken" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f87171" />
        <Stop offset="50%" stopColor="#ef4444" />
        <Stop offset="100%" stopColor="#dc2626" />
      </LinearGradient>
    </Defs>
    {/* Broken pieces */}
    <Path d="M12 2L10 6L8 8L10 12L12 2Z" fill="url(#gem-broken)" opacity="0.8" />
    <Path d="M12 3L14 7L16 8L14 12L12 3Z" fill="url(#gem-broken)" opacity="0.7" />
    <Path d="M9 14L11 18L12 22L10 18L9 14Z" fill="#dc2626" opacity="0.6" />
    <Path d="M15 14L13 18L12 22L14 18L15 14Z" fill="#b91c1c" opacity="0.5" />
    {/* Crack lines */}
    <Path d="M12 8L11 12L12 16" stroke="#7f1d1d" strokeWidth="1" />
  </Svg>
);

// Empty slot - for future or untracked days
export const EmptySlotIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="8" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.5" />
  </Svg>
);

// Today's quest marker
export const QuestMarkerIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="quest-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#818cf8" />
        <Stop offset="50%" stopColor="#6366f1" />
        <Stop offset="100%" stopColor="#4f46e5" />
      </LinearGradient>
    </Defs>
    <Circle cx="12" cy="12" r="9" fill="url(#quest-grad)" />
    <Circle cx="12" cy="12" r="6" fill="#ffffff" opacity="0.3" />
    <Text x="12" y="16" fontSize="12" fill="#ffffff" textAnchor="middle" fontWeight="bold">
      !
    </Text>
  </Svg>
);
