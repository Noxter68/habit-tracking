import React from 'react';
import { View, Image } from 'react-native';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';

interface AchievementBadgeProps {
  level: number;
  achievement: Achievement | undefined;
  isUnlocked: boolean;
  size?: number;
  showLock?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, isUnlocked, size = 60, showLock = true }) => {
  if (!achievement) return null;

  return (
    <View style={tw`relative`}>
      <Image
        source={isUnlocked ? achievement.image : require('../../../assets/achievements/locked.png')}
        style={{
          width: size,
          height: size,
          opacity: isUnlocked ? 1 : 0.6,
        }}
        resizeMode="contain"
      />
    </View>
  );
};
