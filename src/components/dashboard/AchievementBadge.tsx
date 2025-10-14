// src/components/dashboard/AchievementBadge.tsx
import React from 'react';
import { Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

interface AchievementBadgeProps {
  achievement?: any;
  size?: number;
  onPress?: () => void;
  tierTheme?: TierTheme;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, size = 80, onPress, tierTheme }) => {
  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#F5F3FF', '#EDE9FE'],
    accent: '#9333EA',
  };

  const theme = tierTheme || defaultTheme;
  const lightGradient = [`${theme.accent}10`, `${theme.accent}08`];

  // If there's an achievement image, use it
  if (achievement?.image) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 80,
          height: 80,
          borderRadius: 16,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: theme.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        })}
      >
        <LinearGradient
          colors={lightGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={achievement.image} style={{ width: size, height: size }} resizeMode="cover" />
        </LinearGradient>
      </Pressable>
    );
  }

  // Fallback to Crown icon with tier-based gradient
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 16,
        transform: [{ scale: pressed ? 0.95 : 1 }],
        shadowColor: theme.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      })}
    >
      <LinearGradient
        colors={lightGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: `${theme.accent}30`,
          borderRadius: 16,
        }}
      >
        <Crown size={28} color={theme.accent} strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
};

export default AchievementBadge;
