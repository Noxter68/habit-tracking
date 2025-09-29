// src/components/modals/LevelUpCelebration.tsx
import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from '../achievements/AchievementBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpCelebrationProps {
  visible: boolean;
  onClose: () => void;
  newLevel: number;
  achievement: Achievement;
}

export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({ visible, onClose, newLevel, achievement }) => {
  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={tw`flex-1 bg-black/70 items-center justify-center`} onPress={onClose} activeOpacity={1}>
        {/* Main Container with simple fade */}
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={[tw`bg-white rounded-3xl p-6 items-center shadow-2xl`, { width: SCREEN_WIDTH - 80 }]}>
          {/* Level Up Label */}
          <View style={tw`bg-amber-500 rounded-full px-4 py-1.5 mb-4`}>
            <Text style={tw`text-white text-sm font-bold uppercase tracking-wider`}>LEVEL UP!</Text>
          </View>

          {/* Achievement Badge */}
          <View style={tw`mb-3`}>
            <AchievementBadge level={newLevel} achievement={achievement} isUnlocked={true} size={140} showLock={false} />
          </View>

          {/* Level Text */}
          <Text style={tw`text-2xl font-black text-gray-800 mb-1`}>Level {newLevel}</Text>

          {/* Achievement Title */}
          <Text style={tw`text-lg font-semibold text-gray-700 text-center mb-4`}>{achievement?.title || 'New Achievement'}</Text>

          {/* Tap to Continue */}
          <Text style={tw`text-xs text-gray-400 text-center`}>Tap to continue</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
