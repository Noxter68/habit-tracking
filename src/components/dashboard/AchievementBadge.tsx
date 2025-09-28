// src/components/dashboard/AchievementBadge.tsx
import React from 'react';
import { Pressable, View, Image } from 'react-native';
import { Crown } from 'lucide-react-native';
import tw from '../../lib/tailwind';

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
        style={({ pressed }) => [tw`w-14 h-14 bg-quartz-100 rounded-2xl items-center justify-center overflow-hidden border border-quartz-200 shadow-sm`, pressed && tw`scale-95`]}
      >
        <Image source={achievement.image} style={{ width: size, height: size }} resizeMode="cover" />
      </Pressable>
    );
  }

  // Fallback to Crown icon
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [tw`w-14 h-14 bg-quartz-100 rounded-2xl items-center justify-center border border-quartz-200 shadow-sm`, pressed && tw`scale-95`]}>
      <Crown size={24} color="#d97706" />
    </Pressable>
  );
};

export default AchievementBadge;
