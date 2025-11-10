// src/components/dashboard/HabitCard.tsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Circle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { Habit } from '@/types';
import { RootStackParamList } from '@/navigation/types';
import { getTodayString, getLocalDateString, getHoursUntilMidnight } from '@/utils/dateHelpers';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HabitCardProps {
  habit: Habit;
  completedToday: boolean;
  onPress?: () => void;
  index: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
}

/**
 * Get gem icon based on tier
 */
const getGemIcon = (tier: string) => {
  switch (tier) {
    case 'Obsidian':
      return require('../../../assets/interface/gems/obsidian-gem.png');
    case 'Topaz':
      return require('../../../assets/interface/gems/topaz-gem.png');
    case 'Jade':
      return require('../../../assets/interface/gems/jade-gem.png');
    case 'Amethyst':
      return require('../../../assets/interface/gems/amethyst-gem.png');
    case 'Ruby':
      return require('../../../assets/interface/gems/ruby-gem.png');
    case 'Crystal':
    default:
      return require('../../../assets/interface/gems/crystal-gem.png');
  }
};

/**
 * Calculates when the next weekly reset occurs for a habit
 */
const getNextWeeklyReset = (createdAt: Date): Date => {
  const created = new Date(createdAt);
  const today = new Date();
  const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const weeksSinceCreation = Math.floor(daysSinceCreation / 7);

  const nextReset = new Date(created);
  nextReset.setDate(created.getDate() + (weeksSinceCreation + 1) * 7);

  return nextReset;
};

/**
 * Check if all tasks are completed this week for a weekly habit
 */
const isWeekCompleted = (habit: Habit): boolean => {
  if (habit.frequency !== 'weekly') return false;

  const created = new Date(habit.createdAt);
  const today = new Date();
  const daysSinceCreation = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeekStart = Math.floor(daysSinceCreation / 7) * 7;

  // Check all days in current week (7 days from week start)
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(created);
    checkDate.setDate(created.getDate() + currentWeekStart + i);
    const dateStr = getLocalDateString(checkDate);

    const dayData = habit.dailyTasks?.[dateStr];
    if (dayData?.allCompleted) {
      return true;
    }
  }

  return false;
};

/**
 * Format streak display based on frequency
 */
const formatStreakDisplay = (habit: Habit): string => {
  const streak = habit.currentStreak;

  switch (habit.frequency) {
    case 'daily':
      return streak === 1 ? '1 day' : `${streak} days`;
    case 'weekly':
      return streak === 1 ? '1 week' : `${streak} weeks`;
    case 'monthly':
      return streak === 1 ? '1 month' : `${streak} months`;
    case 'custom':
      return streak === 1 ? '1 day' : `${streak} days`;
    default:
      return `${streak}`;
  }
};

export const HabitCard: React.FC<HabitCardProps> = ({ habit, completedToday, onPress, index, pausedTasks = {} }) => {
  const navigation = useNavigation<NavigationProp>();

  // Calculate tier reactively
  const { tier } = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  }, [habit.currentStreak]);

  const theme = tierThemes[tier.name];
  const totalTasks = habit.tasks?.length || 0;
  const today = getTodayString();
  const todayTasks = habit.dailyTasks?.[today];

  // Weekly habit specific logic
  const isWeekly = habit.frequency === 'weekly';

  // For weekly habits, count ALL tasks completed THIS WEEK (not just today)
  const completedTasks = useMemo(() => {
    if (!isWeekly) {
      return todayTasks?.completedTasks?.length || 0;
    }

    // For weekly: aggregate all completed tasks across the week
    const created = new Date(habit.createdAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const weekStart = Math.floor(daysSince / 7) * 7;

    const weekTasksCompleted = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(created);
      checkDate.setDate(created.getDate() + weekStart + i);
      const dateStr = getLocalDateString(checkDate);
      const dayData = habit.dailyTasks?.[dateStr];

      if (dayData?.completedTasks) {
        dayData.completedTasks.forEach((taskId: string) => weekTasksCompleted.add(taskId));
      }
    }

    return weekTasksCompleted.size;
  }, [habit, isWeekly, todayTasks]);

  const weekCompleted = isWeekly ? isWeekCompleted(habit) : false;
  const nextReset = isWeekly ? getNextWeeklyReset(habit.createdAt) : null;
  const daysUntilReset = nextReset ? Math.ceil((nextReset.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const hoursUntilReset = !isWeekly ? getHoursUntilMidnight() : 0;

  // Count paused tasks
  const pausedTaskCount = Object.keys(pausedTasks).filter((taskId) => habit.tasks.some((t) => (typeof t === 'string' ? t : t.id) === taskId)).length;

  const activeTasks = totalTasks - pausedTaskCount;
  const taskProgress = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;

  const isCompleted = isWeekly ? weekCompleted : completedToday;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onPress) {
      onPress();
    } else {
      navigation.navigate('HabitDetails', {
        habitId: habit.id,
        pausedTasks,
      });
    }
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Pressable onPress={handlePress}>
        <ImageBackground source={theme.texture} style={tw`rounded-2xl overflow-hidden`} imageStyle={tw`rounded-2xl opacity-70`} resizeMode="cover">
          <LinearGradient colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-4`}>
            {/* Gem Icon - Absolute Position Top Right */}
            <View style={tw`absolute top-3 right-3 z-10`}>
              <Image source={getGemIcon(tier.name)} style={tw`w-12 h-12`} resizeMode="contain" />
            </View>

            {/* Header - Title and Type */}
            <View style={tw`mb-3 pr-14`}>
              <Text numberOfLines={1} style={tw`text-xl font-bold text-white mb-0.5`}>
                {habit.name}
              </Text>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-xs text-white/70 font-medium capitalize`}>{habit.type === 'good' ? 'Building' : 'Quitting'}</Text>
                {isWeekly && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>{weekCompleted ? `Resets in ${daysUntilReset}d` : `${daysUntilReset}d left`}</Text>
                  </>
                )}
                {!isWeekly && !completedToday && hoursUntilReset > 0 && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>Resets in {hoursUntilReset}h</Text>
                  </>
                )}
              </View>
            </View>

            {/* Progress Section */}
            <View style={tw`mb-3`}>
              {/* Progress Bar */}
              <View style={tw`h-2.5 bg-white/20 rounded-full overflow-hidden mb-2`}>
                <View style={[tw`h-full bg-white rounded-full`, { width: `${taskProgress}%` }]} />
              </View>

              {/* Progress Text */}
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  {isCompleted ? <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} fill="rgba(255,255,255,0.3)" /> : <Circle size={14} color="#fff" strokeWidth={2} />}
                  <Text style={tw`text-xs font-semibold text-white/90`}>{isWeekly ? 'Weekly Tasks' : "Today's Tasks"}</Text>
                </View>
                <Text style={tw`text-xs font-bold text-white`}>
                  {completedTasks}/{activeTasks}
                </Text>
              </View>
            </View>

            {/* Stats Footer */}
            <View style={tw`flex-row items-center justify-between pt-3 border-t border-white/20`}>
              {/* Streak */}
              <View>
                <Text style={tw`text-xs text-white/70 font-medium mb-0.5`}>Streak</Text>
                <Text style={tw`text-lg font-black text-white`}>{formatStreakDisplay(habit)}</Text>
              </View>

              {/* Tier Badge */}
              <View style={[tw`px-3 py-1.5 rounded-xl border border-white/30`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={tw`text-xs font-black text-white`}>{tier.name}</Text>
              </View>
            </View>

            {/* Paused Tasks Notice */}
            {pausedTaskCount > 0 && (
              <View style={tw`mt-3 pt-3 border-t border-white/20`}>
                <Text style={tw`text-xs text-white/70`}>
                  {pausedTaskCount} task{pausedTaskCount !== 1 ? 's' : ''} paused
                </Text>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};
