// components/achievements/TierSection.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, Lock, Sparkles } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Achievement } from '../../utils/achievements';

interface TierSectionProps {
  tierName: string;
  achievements: Achievement[];
  currentLevel: number;
  onAchievementPress: (achievement: Achievement) => void;
  index: number;
}

const tierGradients: Record<string, string[]> = {
  Novice: ['#fef3c7', '#fde68a'],
  'Rising Hero': ['#fed7aa', '#fdba74'],
  'Mastery Awakens': ['#fde68a', '#fb923c'],
  'Legendary Ascent': ['#fbbf24', '#f59e0b'],
  'Epic Mastery': ['#f59e0b', '#d97706'],
  'Mythic Glory': ['#d97706', '#92400e'],
};

export const TierSection: React.FC<TierSectionProps> = ({ tierName, achievements, currentLevel, onAchievementPress, index }) => {
  const unlockedCount = achievements.filter((a) => a.level <= currentLevel).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;
  const isCompleted = unlockedCount === totalCount;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={tw`mb-6`}>
      {/* Tier Header Card */}
      <LinearGradient
        colors={isCompleted ? tierGradients[tierName] : ['#fafaf9', '#f5f5f4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={tw`mx-2 rounded-2xl p-4 mb-3 border ${isCompleted ? 'border-amber-300' : 'border-gray-200'}`}
      >
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <View style={tw`flex-row items-center gap-2`}>
            {isCompleted && <Sparkles size={18} color="#92400e" />}
            <Text style={tw`text-base font-bold ${isCompleted ? 'text-amber-900' : 'text-gray-700'}`}>{tierName}</Text>
          </View>

          <View style={tw`flex-row items-center gap-2`}>
            <Text style={tw`text-sm font-semibold ${isCompleted ? 'text-amber-800' : 'text-gray-600'}`}>
              {unlockedCount}/{totalCount}
            </Text>
            {isCompleted && (
              <View style={tw`bg-amber-800 rounded-full px-2 py-0.5`}>
                <Text style={tw`text-xs font-bold text-white`}>Complete</Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`h-1.5 bg-white/50 rounded-full overflow-hidden`}>
          <LinearGradient colors={tierGradients[tierName]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
        </View>
      </LinearGradient>

      {/* Achievement Cards Grid */}
      <View style={tw`flex-row flex-wrap px-1`}>
        {achievements.map((achievement, idx) => (
          <AchievementCard key={achievement.level} achievement={achievement} isUnlocked={achievement.level <= currentLevel} index={idx} onPress={onAchievementPress} />
        ))}
      </View>
    </Animated.View>
  );
};

// Improved Achievement Card Component
const AchievementCard: React.FC<{
  achievement: Achievement;
  isUnlocked: boolean;
  index: number;
  onPress: (achievement: Achievement) => void;
}> = ({ achievement, isUnlocked, index, onPress }) => {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={tw`w-1/3 p-1.5`}>
      <Pressable onPress={() => onPress(achievement)} style={({ pressed }) => [tw`aspect-square`, pressed && tw`scale-95`]}>
        <LinearGradient
          colors={isUnlocked ? ['#fef3c7', '#fde68a'] : ['#fafaf9', '#e7e5e4']}
          style={tw`h-full rounded-2xl p-3 border ${isUnlocked ? 'border-amber-200' : 'border-gray-200'} relative overflow-hidden`}
        >
          {/* Background Pattern */}
          {isUnlocked && (
            <View style={tw`absolute inset-0`}>
              <View style={tw`absolute -top-8 -right-8 w-24 h-24 bg-amber-200/20 rounded-full`} />
              <View style={tw`absolute -bottom-4 -left-4 w-20 h-20 bg-amber-300/15 rounded-full`} />
            </View>
          )}

          {/* Lock Icon for Locked Items */}
          {!isUnlocked && (
            <View style={tw`absolute top-2 right-2 z-10`}>
              <View style={tw`bg-gray-300 rounded-full p-1`}>
                <Lock size={12} color="#6b7280" />
              </View>
            </View>
          )}

          {/* Achievement Image */}
          <View style={tw`flex-1 items-center justify-center mb-2`}>
            <Image
              source={isUnlocked ? achievement.image : require('../../../assets/achievements/locked.png')}
              style={{
                width: 65,
                height: 65,
                opacity: isUnlocked ? 1 : 0.4,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Level Badge */}
          <View style={tw`items-center`}>
            <View style={[tw`rounded-full px-2 py-0.5`, isUnlocked ? tw`bg-amber-700` : tw`bg-gray-300`]}>
              <Text style={[tw`text-[10px] font-bold`, isUnlocked ? tw`text-white` : tw`text-gray-600`]}>LV {achievement.level}</Text>
            </View>
          </View>

          {/* Title (shown on hover/press) */}
          <View style={tw`absolute inset-x-2 bottom-2`}>
            <Text style={[tw`text-[9px] text-center font-medium`, isUnlocked ? tw`text-amber-700` : tw`text-gray-500`]} numberOfLines={1}>
              {achievement.title}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// Updated main screen implementation
export const ImprovedTiersDisplay = () => {
  return (
    <View style={tw`px-2.5`}>
      {['Novice', 'Rising Hero', 'Mastery Awakens', 'Legendary Ascent', 'Epic Mastery', 'Mythic Glory'].map((tierName, tierIndex) => {
        const tierAchievements = filteredAchievements.filter((a) => a.tier === tierName);
        if (tierAchievements.length === 0) return null;

        return <TierSection key={tierName} tierName={tierName} achievements={tierAchievements} currentLevel={currentLevel} onAchievementPress={handleAchievementPress} index={tierIndex} />;
      })}
    </View>
  );
};

// Alternative: Collapsed/Expanded View
export const CollapsibleTierSection: React.FC<TierSectionProps & { defaultExpanded?: boolean }> = ({ tierName, achievements, currentLevel, onAchievementPress, index, defaultExpanded = true }) => {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const unlockedCount = achievements.filter((a) => a.level <= currentLevel).length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;
  const isCompleted = unlockedCount === totalCount;

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={tw`mb-4`}>
      {/* Collapsible Header */}
      <Pressable onPress={() => setIsExpanded(!isExpanded)} style={({ pressed }) => [tw`mx-2`, pressed && tw`opacity-80`]}>
        <LinearGradient
          colors={isCompleted ? tierGradients[tierName] : ['#fafaf9', '#f5f5f4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`rounded-2xl p-4 border ${isCompleted ? 'border-amber-300' : 'border-gray-200'}`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center gap-2 mb-2`}>
                {isCompleted && <Sparkles size={18} color="#92400e" />}
                <Text style={tw`text-base font-bold ${isCompleted ? 'text-amber-900' : 'text-gray-700'}`}>{tierName}</Text>
              </View>

              {/* Mini Progress Bar */}
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-amber-600 rounded-full`, { width: `${progress}%` }]} />
                </View>
                <Text style={tw`text-sm font-semibold ${isCompleted ? 'text-amber-800' : 'text-gray-600'}`}>
                  {unlockedCount}/{totalCount}
                </Text>
              </View>
            </View>

            <View style={tw`ml-3`}>
              <ChevronRight
                size={20}
                color={isCompleted ? '#92400e' : '#6b7280'}
                style={{
                  transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                }}
              />
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Expandable Content */}
      {isExpanded && (
        <Animated.View entering={FadeInDown.springify()} style={tw`flex-row flex-wrap px-1 mt-3`}>
          {achievements.map((achievement, idx) => (
            <AchievementCard key={achievement.level} achievement={achievement} isUnlocked={achievement.level <= currentLevel} index={idx} onPress={onAchievementPress} />
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
};
