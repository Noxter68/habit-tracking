import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Award, Trophy } from 'lucide-react-native';
import { Achievement, TierName, UserAchievement } from '../../types/achievement.types';
import { AchievementCard } from './AchievementCard';
import { getTierGradient } from '../../utils/achievements';

interface TierSectionProps {
  tierName: TierName;
  tierIndex: number;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  isAchievementUnlocked: (achievement: Achievement) => boolean;
  onAchievementPress: (achievement: Achievement) => void;
}

export const TierSection: React.FC<TierSectionProps> = ({ tierName, tierIndex, achievements, userAchievements, isAchievementUnlocked, onAchievementPress }) => {
  const tierUnlockedCount = achievements.filter((a) => isAchievementUnlocked(a)).length;
  const tierTotalCount = achievements.length;
  const progress = tierTotalCount > 0 ? (tierUnlockedCount / tierTotalCount) * 100 : 0;
  const isCompleted = tierUnlockedCount === tierTotalCount;

  return (
    <Animated.View entering={FadeInDown.delay(tierIndex * 100).springify()} style={{ marginBottom: 24 }}>
      {/* Tier Header */}
      <LinearGradient
        colors={getTierGradient(tierName, isCompleted)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          marginHorizontal: 8,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: isCompleted ? '#b5bfb5' : '#e1e5e9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isCompleted && <Award size={18} color="#5a6b5a" />}
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isCompleted ? '#3e463e' : '#566070',
              }}
            >
              {tierName}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isCompleted ? '#4a564a' : '#6b7889',
              }}
            >
              {tierUnlockedCount}/{tierTotalCount}
            </Text>
            {isCompleted && <Trophy size={16} color="#738573" />}
          </View>
        </View>

        {/* Progress Bar */}
        <View
          style={{
            height: 6,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              height: '100%',
              backgroundColor: isCompleted ? '#91a091' : '#a8b4c1',
              borderRadius: 3,
              width: `${progress}%`,
            }}
          />
        </View>
      </LinearGradient>

      {/* Achievement Grid - Fixed Layout */}
      <View
        style={{
          paddingHorizontal: 8,
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -4, // Negative margin to compensate for card padding
        }}
      >
        {achievements.map((achievement, index) => {
          const isUnlocked = isAchievementUnlocked(achievement);
          const isFromBackend = userAchievements.some((ua) => ua?.title === achievement.title);

          return (
            <View
              key={`${achievement.id}=${achievement.title}`}
              style={{
                width: '49%', // Exactly 2 columns
                paddingHorizontal: 4, // Horizontal spacing between cards
                paddingVertical: 4, // Vertical spacing between rows
              }}
            >
              <AchievementCard achievement={achievement} isUnlocked={isUnlocked} isFromBackend={isFromBackend} index={index} onPress={onAchievementPress} />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};
