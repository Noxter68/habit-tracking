// src/components/dashboard/AchievementBadge.tsx
import React from 'react';
import { Pressable, View, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';

interface AchievementBadgeProps {
  achievement?: any;
  size?: number;
  onPress?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, size = 56, onPress }) => {
  // If there's an achievement image, use it
  if (achievement?.image) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: 56,
          height: 56,
          borderRadius: 16,
          overflow: 'hidden',
          transform: [{ scale: pressed ? 0.95 : 1 }],
          shadowColor: '#9333EA',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        })}
      >
        <LinearGradient
          colors={['#F5F3FF', '#EDE9FE']}
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

  // Fallback to Crown icon with gradient
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 56,
        height: 56,
        borderRadius: 16,
        transform: [{ scale: pressed ? 0.95 : 1 }],
        shadowColor: '#9333EA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      })}
    >
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: 'rgba(147, 51, 234, 0.2)',
          borderRadius: 16,
        }}
      >
        <Crown size={28} color="#9333EA" strokeWidth={2.5} />
      </LinearGradient>
    </Pressable>
  );
};

export default AchievementBadge;
