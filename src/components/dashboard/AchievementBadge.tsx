// src/components/dashboard/AchievementBadge.tsx
import React from 'react';
import { Pressable, Image, View } from 'react-native';
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

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, size = 100, onPress, tierTheme }) => {
  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#F5F3FF', '#EDE9FE'],
    accent: '#9333EA',
  };

  const theme = tierTheme || defaultTheme;

  // If there's an achievement image, show it without border
  if (achievement?.image) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: size,
          height: size,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        {/* Gradient glow behind the image */}
        <View
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 20,
          }}
        >
          <LinearGradient
            colors={[`${theme.accent}20`, `${theme.accent}10`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 20,
            }}
          />
        </View>

        {/* Image on top - no border, no container */}
        <Image
          source={achievement.image}
          style={{
            width: size,
            height: size,
            zIndex: 10,
          }}
          resizeMode="contain"
        />
      </Pressable>
    );
  }

  // Fallback to Crown icon with minimal styling
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      <LinearGradient
        colors={[`${theme.accent}15`, `${theme.accent}10`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
        }}
      >
        <Crown size={28} color={theme.accent} strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
};

export default AchievementBadge;
