// src/components/habits/MilestoneZoomModal.tsx
import React from 'react';
import { View, Text, Modal, Pressable, Dimensions, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { HabitMilestone } from '@/services/habitProgressionService';
import { getTranslatedMilestone } from '@/i18n/milestoneTranslations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Import all tier icons
const tierIcons = {
  0: require('../../../assets/tiers/tier-1/level-1.png'),
  1: require('../../../assets/tiers/tier-1/level-2.png'),
  2: require('../../../assets/tiers/tier-1/level-3.png'),
  3: require('../../../assets/tiers/tier-1/level-4.png'),
  4: require('../../../assets/tiers/tier-1/level-5.png'),
  5: require('../../../assets/tiers/tier-2/level-6.png'),
  6: require('../../../assets/tiers/tier-2/level-7.png'),
  7: require('../../../assets/tiers/tier-2/level-8.png'),
  8: require('../../../assets/tiers/tier-2/level-9.png'),
  9: require('../../../assets/tiers/tier-2/level-10.png'),
  10: require('../../../assets/tiers/tier-3/level-11.png'),
  11: require('../../../assets/tiers/tier-3/level-12.png'),
  12: require('../../../assets/tiers/tier-3/level-13.png'),
  13: require('../../../assets/tiers/tier-3/level-14.png'),
  14: require('../../../assets/tiers/tier-3/level-15.png'),
};

interface MilestoneZoomModalProps {
  visible: boolean;
  onClose: () => void;
  milestone: HabitMilestone | null;
  milestoneIndex: number;
  isUnlocked: boolean;
}

export const MilestoneZoomModal: React.FC<MilestoneZoomModalProps> = ({ visible, onClose, milestone, milestoneIndex, isUnlocked }) => {
  const { t, i18n } = useTranslation();

  if (!milestone) return null;

  // Get translated milestone
  const translatedMilestone = getTranslatedMilestone(milestone.title, i18n.language as 'en' | 'fr');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={tw`flex-1 bg-black/90 items-center justify-center px-6`} onPress={onClose}>
        <View style={tw`w-full max-w-sm`}>
          <Pressable style={tw`bg-slate-50 rounded-3xl p-8 shadow-2xl`} onPress={(e) => e.stopPropagation()}>
            {/* Large milestone icon - elevated above card */}
            <View style={tw`items-center -mt-20 mb-6`}>
              <View style={[tw`rounded-3xl shadow-xl items-center justify-center`, isUnlocked ? tw`bg-slate-50` : tw`bg-slate-200`]}>
                <Image source={tierIcons[milestoneIndex as keyof typeof tierIcons]} style={[tw`w-60 h-60`, !isUnlocked && tw`opacity-30`]} resizeMode="contain" />
              </View>
            </View>

            {/* Milestone title */}
            <Text style={tw`text-slate-900 text-2xl font-semibold text-center leading-tight`}>{translatedMilestone.title}</Text>

            {/* Milestone description */}
            <Text style={tw`text-slate-600 text-sm text-center mt-3 leading-relaxed`}>{translatedMilestone.description}</Text>

            {/* Info badges */}
            <View style={tw`flex-row gap-2 mt-6 justify-center`}>
              <View style={tw`bg-slate-100 rounded-full px-4 py-2`}>
                <Text style={tw`text-slate-700 text-sm font-medium`}>{t('habitDetails.milestoneZoomModal.day', { count: milestone.days })}</Text>
              </View>
              <View style={tw`bg-slate-100 rounded-full px-4 py-2`}>
                <Text style={tw`text-slate-700 text-sm font-medium`}>{t('habitDetails.milestoneZoomModal.xpReward', { xp: milestone.xpReward })}</Text>
              </View>
              {milestone.badge && (
                <View style={tw`bg-slate-100 rounded-full px-4 py-2`}>
                  <Text style={tw`text-slate-700 text-sm font-medium`}>{milestone.badge}</Text>
                </View>
              )}
            </View>

            {/* Status */}
            <View style={tw`mt-6 items-center`}>
              {isUnlocked ? (
                <View style={tw`bg-emerald-50 rounded-full px-4 py-2`}>
                  <Text style={tw`text-emerald-700 text-sm font-semibold`}>{t('habitDetails.milestoneZoomModal.achieved')}</Text>
                </View>
              ) : (
                <View style={tw`bg-slate-100 rounded-xl px-4 py-2`}>
                  <Text style={tw`text-slate-600 text-sm text-center`}>{t('habitDetails.milestoneZoomModal.locked', { days: milestone.days })}</Text>
                </View>
              )}
            </View>

            {/* Close Hint */}
            <Text style={tw`text-slate-400 text-xs text-center mt-6`}>{t('habitDetails.milestoneZoomModal.tapToClose')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};
