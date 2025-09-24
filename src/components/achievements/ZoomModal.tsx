import React from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import tw from '../../lib/tailwind';
import { Achievement } from '../../types/achievement.types';
import { AchievementBadge } from './AchievementBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ZoomModalProps {
  visible: boolean;
  onClose: () => void;
  currentLevel: number;
  currentTitle: Achievement | undefined;
}

export const ZoomModal: React.FC<ZoomModalProps> = ({ visible, onClose, currentLevel, currentTitle }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tw`flex-1 bg-black/90 items-center justify-center`} onPress={onClose}>
        <View style={tw`w-full px-8`}>
          <View style={tw`items-center`}>
            <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={SCREEN_WIDTH - 64} showLock={false} />
            <Text style={tw`text-achievement-amber-100 text-xl font-bold mt-6 text-center`}>{currentTitle?.title}</Text>
            <View style={tw`flex-row gap-3 mt-3`}>
              <View style={tw`bg-achievement-amber-900/30 rounded-full px-3 py-1.5`}>
                <Text style={tw`text-achievement-amber-100 text-sm font-medium`}>Level {currentLevel}</Text>
              </View>
              <View style={tw`bg-achievement-amber-900/30 rounded-full px-3 py-1.5`}>
                <Text style={tw`text-achievement-amber-100 text-sm font-medium`}>{currentTitle?.tier || 'Novice'}</Text>
              </View>
            </View>
            <Text style={tw`text-achievement-amber-200/50 text-xs mt-4`}>Tap anywhere to close</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
