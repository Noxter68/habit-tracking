// src/components/habits/MilestonesCard.tsx - AVEC TRADUCTIONS
import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { HabitMilestone } from '@/services/habitProgressionService';
import { MilestoneZoomModal } from './MilestoneZoomModal';
import { getTranslatedMilestone } from '@/i18n/milestoneTranslations';

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

const iconSizes = {
  0: { width: 80, height: 80 },
  1: { width: 80, height: 80 },
  2: { width: 80, height: 80 },
  3: { width: 80, height: 80 },
  4: { width: 80, height: 80 },
  5: { width: 80, height: 80 },
  6: { width: 80, height: 80 },
  7: { width: 80, height: 80 },
  8: { width: 80, height: 80 },
  9: { width: 80, height: 80 },
  10: { width: 50, height: 50 },
  11: { width: 50, height: 50 },
  12: { width: 50, height: 50 },
  13: { width: 50, height: 50 },
  14: { width: 50, height: 50 },
};

interface MilestonesCardProps {
  milestones: HabitMilestone[];
  currentStreak: number;
  unlockedMilestones: HabitMilestone[];
}

const MilestonesCard: React.FC<MilestonesCardProps> = ({ milestones, currentStreak, unlockedMilestones }) => {
  const { t, i18n } = useTranslation();
  const [selectedMilestone, setSelectedMilestone] = useState<{
    milestone: HabitMilestone;
    index: number;
    isUnlocked: boolean;
  } | null>(null);

  return (
    <>
      {/* Current Tier Badge */}
      <View style={[tw`rounded-2xl p-4 shadow-md border-2 mb-4`, unlockedMilestones.length > 0 ? tw`bg-white border-amber-200` : tw`bg-stone-50 border-stone-200`]}>
        <View style={tw`items-center`}>
          <View style={[tw`w-20 h-20 rounded-2xl items-center justify-center mb-3`, unlockedMilestones.length > 0 ? tw`bg-amber-100` : tw`bg-stone-100`]}>
            <Image
              source={tierIcons[unlockedMilestones.length > 0 ? unlockedMilestones.length - 1 : 0]}
              style={[{ width: 100, height: 100 }, unlockedMilestones.length === 0 && tw`opacity-40`]}
              resizeMode="contain"
            />
          </View>
          <Text style={[tw`text-sm font-bold uppercase tracking-wide`, unlockedMilestones.length > 0 ? tw`text-amber-700` : tw`text-stone-400`]}>
            {unlockedMilestones.length > 0 ? 'Current Tier' : 'Next Milestone'}
          </Text>
          <Text style={[tw`text-lg font-black mt-1`, unlockedMilestones.length > 0 ? tw`text-stone-800` : tw`text-stone-400`]}>
            {unlockedMilestones.length > 0
              ? getTranslatedMilestone(unlockedMilestones[unlockedMilestones.length - 1].title, i18n.language as 'en' | 'fr').title
              : getTranslatedMilestone(milestones[0]?.title || 'Getting Started', i18n.language as 'en' | 'fr').title}
          </Text>
          {unlockedMilestones.length === 0 && milestones[0] && (
            <Text style={tw`text-xs text-stone-400 mt-1`}>{t('habitDetails.milestones.daysAway', { count: milestones[0].days - currentStreak })}</Text>
          )}
        </View>
      </View>

      {/* Milestones List */}
      <View style={tw`bg-white rounded-3xl p-6 shadow-md border border-stone-100`}>
        {/* Header Section - Single Line */}
        <View style={tw`flex-row items-center justify-between mb-6`}>
          <Text style={tw`text-xl font-black text-stone-800`}>{t('habitDetails.milestones.title')}</Text>
          <Text style={tw`text-sm font-bold text-stone-500`}>
            {unlockedMilestones.length}/{milestones.length}
          </Text>
        </View>

        <View style={tw`gap-3`}>
          {milestones.map((milestone, idx) => {
            const isUnlocked = unlockedMilestones.some((m) => m.title === milestone.title);
            const isAchieved = currentStreak >= milestone.days || isUnlocked;
            const iconSize = iconSizes[idx as keyof typeof iconSizes] || { width: 20, height: 20 };

            // ✅ Get translated milestone
            const translatedMilestone = getTranslatedMilestone(milestone.title, i18n.language as 'en' | 'fr');

            // Calculate days away
            const daysAway = milestone.days - currentStreak;

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
                  style={({ pressed }) => [
                    tw`rounded-2xl p-4 border-2`,
                    isAchieved ? tw`bg-amber-50 border-amber-200` : tw`bg-stone-50 border-stone-200`,
                    pressed && tw`scale-98 opacity-80`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isAchieved ? 0.08 : 0.03,
                      shadowRadius: 4,
                      elevation: isAchieved ? 3 : 1,
                    },
                  ]}
                >
                  <View style={tw`flex-row items-center gap-4`}>
                    {/* Icon Container */}
                    <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center`, isAchieved ? tw`bg-amber-100` : tw`bg-stone-100`]}>
                      <Image source={tierIcons[idx as keyof typeof tierIcons]} style={[{ width: iconSize.width, height: iconSize.height }, !isAchieved && tw`opacity-30`]} resizeMode="contain" />
                    </View>

                    {/* Content */}
                    <View style={tw`flex-1`}>
                      {/* Title */}
                      <Text style={[tw`text-base font-bold mb-1`, isAchieved ? tw`text-stone-800` : tw`text-stone-400`]}>{translatedMilestone.title}</Text>

                      {/* Description */}
                      <Text style={[tw`text-xs mb-2`, isAchieved ? tw`text-stone-600` : tw`text-stone-400`]}>{translatedMilestone.description}</Text>

                      {/* Status Badge */}
                      <View style={tw`flex-row items-center gap-2`}>
                        {isAchieved ? (
                          <View style={tw`bg-amber-500 px-3 py-1 rounded-lg flex-row items-center gap-1.5`}>
                            <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={tw`text-white text-xs font-bold`}>{t('habitDetails.milestones.achieved', { xp: milestone.xpReward })}</Text>
                          </View>
                        ) : currentStreak > milestone.days ? (
                          <View style={tw`bg-stone-300 px-3 py-1 rounded-lg`}>
                            <Text style={tw`text-stone-600 text-xs font-bold`}>{t('habitDetails.milestones.missed')}</Text>
                          </View>
                        ) : (
                          <View style={tw`bg-stone-200 px-3 py-1 rounded-lg`}>
                            <Text style={tw`text-stone-600 text-xs font-bold`}>{t('habitDetails.milestones.daysAway', { count: daysAway })}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
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
