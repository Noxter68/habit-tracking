import React from 'react';
import { View, Text, Modal, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={tw`flex-1 bg-slate-900/95 items-center justify-center px-6`} onPress={onClose}>
        <View style={tw`w-full max-w-sm`}>
          <Pressable style={tw`bg-slate-50 rounded-3xl p-8 shadow-2xl`} onPress={(e) => e.stopPropagation()}>
            {/* Achievement Badge */}
            <View style={tw`items-center -mt-20 mb-6`}>
              <View style={tw`bg-slate-50 rounded-full p-4 shadow-xl`}>
                <AchievementBadge level={currentLevel} achievement={currentTitle} isUnlocked={true} size={SCREEN_WIDTH * 0.45} showLock={false} />
              </View>
            </View>

            {/* Achievement Title */}
            <Text style={tw`text-slate-900 text-2xl font-semibold text-center leading-tight`}>{currentTitle?.title}</Text>

            {/* Description if available */}
            {currentTitle?.description && <Text style={tw`text-slate-600 text-sm text-center mt-3 leading-relaxed`}>{currentTitle.description}</Text>}

            {/* Level and Tier Pills */}
            <View style={tw`flex-row gap-2 mt-6 justify-center`}>
              <View style={tw`bg-slate-100 rounded-full px-4 py-2`}>
                <Text style={tw`text-slate-700 text-sm font-medium`}>{t('achievements.level', { level: currentLevel })}</Text>
              </View>
              <View style={tw`bg-slate-100 rounded-full px-4 py-2`}>
                <Text style={tw`text-slate-700 text-sm font-medium`}>{currentTitle?.tier || t('achievements.tiers.novice')}</Text>
              </View>
            </View>

            {/* Close Hint */}
            <Text style={tw`text-slate-400 text-xs text-center mt-6`}>{t('achievements.tapToClose')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
