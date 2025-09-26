// src/components/habits/MilestonesCard.tsx
import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { HabitMilestone } from '@/services/habitProgressionService';
import { MilestoneZoomModal } from './MilestoneZoomModal';

// Import all tier icons explicitly
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

// Icon size mapping to ensure visual consistency
const iconSizes = {
  0: { width: 60, height: 60 }, // level-1
  1: { width: 60, height: 60 }, // level-2
  2: { width: 60, height: 60 }, // level-3
  3: { width: 60, height: 60 }, // level-4
  4: { width: 60, height: 60 }, // level-5
  5: { width: 60, height: 60 }, // level-6
  6: { width: 60, height: 60 }, // level-7
  7: { width: 60, height: 60 }, // level-8
  8: { width: 60, height: 60 }, // level-9
  9: { width: 60, height: 60 }, // level-10
  10: { width: 36, height: 36 }, // level-11
  11: { width: 36, height: 36 }, // level-12
  12: { width: 36, height: 36 }, // level-13
  13: { width: 36, height: 36 }, // level-14
  14: { width: 36, height: 36 }, // level-15 (biggest for final tier)
};

interface MilestonesCardProps {
  milestones: HabitMilestone[];
  currentStreak: number;
  unlockedMilestones: HabitMilestone[];
}

const MilestonesCard: React.FC<MilestonesCardProps> = ({ milestones, currentStreak, unlockedMilestones }) => {
  const [selectedMilestone, setSelectedMilestone] = useState<{
    milestone: HabitMilestone;
    index: number;
    isUnlocked: boolean;
  } | null>(null);

  return (
    <>
      <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
        <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Milestones</Text>

        {milestones.map((milestone, idx) => {
          const isUnlocked = unlockedMilestones.some((m) => m.title === milestone.title);
          const isAchieved = currentStreak >= milestone.days || isUnlocked;
          const iconSize = iconSizes[idx as keyof typeof iconSizes] || { width: 30, height: 30 };

          return (
            <Animated.View key={milestone.days} entering={FadeInDown.delay(idx * 50).springify()}>
              <Pressable
                onPress={() =>
                  setSelectedMilestone({
                    milestone,
                    index: idx,
                    isUnlocked: isAchieved,
                  })
                }
                style={({ pressed }) => [tw`flex-row items-center justify-between py-3.5 border-b border-gray-50 rounded-xl`, pressed && tw`bg-gray-50`]}
              >
                <View style={tw`flex-row items-center justify-between py-3.5 border-b border-gray-50`}>
                  <View style={tw`flex-row items-center flex-1 gap-3`}>
                    <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center`, isAchieved ? tw`bg-amber-100` : tw`bg-gray-100`]}>
                      <Image source={tierIcons[idx as keyof typeof tierIcons]} style={[{ width: iconSize.width, height: iconSize.height }, !isAchieved && tw`opacity-40`]} resizeMode="contain" />
                    </View>

                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-bold`, isAchieved ? tw`text-gray-900` : tw`text-gray-400`]}>{milestone.title}</Text>
                      <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                        {isAchieved ? `Achieved! +${milestone.xpReward} XP` : currentStreak > milestone.days ? 'Missed' : `${milestone.days - currentStreak} days away`}
                      </Text>
                    </View>
                  </View>
                  {isAchieved && (
                    <View style={tw`ml-3 bg-amber-50 rounded-full p-2`}>
                      <CheckCircle2 size={20} color="#d97706" strokeWidth={2.5} />
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Zoom Modal */}
      {selectedMilestone && (
        <MilestoneZoomModal
          visible={!!selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          milestone={selectedMilestone.milestone}
          milestoneIndex={selectedMilestone.index}
          isUnlocked={selectedMilestone.isUnlocked}
        />
      )}
    </>
  );
};

export default MilestonesCard;
