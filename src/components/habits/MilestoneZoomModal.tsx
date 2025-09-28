// src/components/habits/MilestoneZoomModal.tsx
import React from 'react';
import { View, Text, Modal, Pressable, Dimensions, Image } from 'react-native';
import tw from '@/lib/tailwind';
import { HabitMilestone } from '@/services/habitProgressionService';

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
  if (!milestone) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={tw`flex-1 bg-black/90 items-center justify-center`} onPress={onClose}>
        <View style={tw`w-full px-8`}>
          <View style={tw`items-center`}>
            {/* Large milestone icon */}
            <View style={[tw`w-48 h-48 rounded-3xl items-center justify-center mb-6`, isUnlocked ? tw`bg-stone-100` : tw`bg-gray-800`]}>
              <Image source={tierIcons[milestoneIndex as keyof typeof tierIcons]} style={[tw`w-60 h-60`, !isUnlocked && tw`opacity-40`]} resizeMode="contain" />
            </View>

            {/* Milestone title */}
            <Text style={tw`text-white text-2xl font-bold text-center`}>{milestone.title}</Text>

            {/* Milestone description */}
            <Text style={tw`text-gray-300 text-base mt-2 text-center`}>{milestone.description}</Text>

            {/* Info badges */}
            <View style={tw`flex-row gap-3 mt-4`}>
              <View style={tw`bg-stone-900/30 rounded-full px-4 py-2`}>
                <Text style={tw`text-stone-100 text-sm font-medium`}>Day {milestone.days}</Text>
              </View>
              <View style={tw`bg-stone-900/30 rounded-full px-4 py-2`}>
                <Text style={tw`text-stone-100 text-sm font-medium`}>+{milestone.xpReward} XP</Text>
              </View>
            </View>

            {/* Status */}
            <View style={tw`mt-4`}>
              {isUnlocked ? <Text style={tw`text-green-400 text-sm font-semibold`}>✓ Achieved</Text> : <Text style={tw`text-gray-400 text-sm`}>Locked - Requires {milestone.days} day streak</Text>}
            </View>

            <Text style={tw`text-gray-500 text-xs mt-6`}>Tap anywhere to close</Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
