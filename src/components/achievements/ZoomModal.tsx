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
      <Pressable style={tw`flex-1 bg-black/85 items-center justify-center`} onPress={onClose}>
        <View style={tw`w-full px-8`}>
          <View style={tw`items-center`}>
            {/* Large Achievement Badge */}
            <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={SCREEN_WIDTH - 64} showLock={false} />

            {/* Achievement Title */}
            <Text style={tw`text-quartz-100 text-xl font-bold mt-6 text-center`}>{currentTitle?.title}</Text>

            {/* Level and Tier Pills */}
            <View style={tw`flex-row gap-3 mt-3`}>
              <View style={tw`bg-quartz-700/30 rounded-full px-3 py-1.5 border border-quartz-600/20`}>
                <Text style={tw`text-quartz-200 text-sm font-medium`}>Level {currentLevel}</Text>
              </View>
              <View style={tw`bg-quartz-700/30 rounded-full px-3 py-1.5 border border-quartz-600/20`}>
                <Text style={tw`text-quartz-200 text-sm font-medium`}>{currentTitle?.tier || 'Novice'}</Text>
              </View>
            </View>

            {/* Close Hint */}
            <Text style={tw`text-quartz-400/60 text-xs mt-4`}>Tap anywhere to close</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
