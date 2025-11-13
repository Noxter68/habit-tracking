// src/components/habits/HabitCard.tsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Circle, Flame } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
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

export const HabitCard: React.FC<HabitCardProps> = ({ habit, completedToday, onPress, index, pausedTasks = {} }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  // Calculate tier reactively
  const { tier } = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  }, [habit.currentStreak]);

  const theme = tierThemes[tier.name];
  const totalTasks = habit.tasks?.length || 0;
  const today = getTodayString();
  const todayTasks = habit.dailyTasks?.[today];

  const isWeekly = habit.frequency === 'weekly';

  // For weekly habits, count ALL tasks completed THIS WEEK
  const completedTasks = useMemo(() => {
    if (!isWeekly) {
      return todayTasks?.completedTasks?.length || 0;
    }

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

  // Format streak display with separated number and unit
  const getStreakData = (): { count: number; unit: string } => {
    const count = habit.currentStreak;

    switch (habit.frequency) {
      case 'daily':
        return { count, unit: t('habits.dayStreak', { count }) };
      case 'weekly':
        return { count, unit: t('habits.weekStreak', { count }) };
      case 'monthly':
        return { count, unit: t('habits.monthStreak', { count }) };
      default:
        return { count, unit: t('habits.dayStreak', { count }) };
    }
  };

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

  const streakData = getStreakData();

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <Pressable onPress={handlePress}>
        <ImageBackground source={theme.texture} style={tw`rounded-2xl overflow-hidden`} imageStyle={tw`rounded-2xl opacity-70`} resizeMode="cover">
          <LinearGradient colors={[theme.gradient[0] + 'e6', theme.gradient[1] + 'dd', theme.gradient[2] + 'cc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-4`}>
            {/* Gem Icon */}
            <View style={tw`absolute top-3 right-3 z-10`}>
              <Image source={getGemIcon(tier.name)} style={tw`w-12 h-12`} resizeMode="contain" />
            </View>

            {/* Header */}
            <View style={tw`mb-3 pr-14`}>
              <Text numberOfLines={1} style={tw`text-xl font-bold text-white mb-0.5`}>
                {habit.name}
              </Text>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-xs text-white/70 font-medium capitalize`}>{habit.type === 'good' ? t('habits.building') : t('habits.quitting')}</Text>
                {isWeekly && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>
                      {weekCompleted ? t('habits.resetsIn', { count: daysUntilReset, unit: 'd' }) : t('habits.daysLeft', { count: daysUntilReset })}
                    </Text>
                  </>
                )}
                {!isWeekly && !completedToday && hoursUntilReset > 0 && (
                  <>
                    <View style={tw`w-1 h-1 rounded-full bg-white/50`} />
                    <Text style={tw`text-xs text-white/70 font-medium`}>{t('habits.resetsIn', { count: hoursUntilReset, unit: 'h' })}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Progress Section */}
            <View style={tw`mb-3`}>
              <View style={tw`h-2.5 bg-white/20 rounded-full overflow-hidden mb-2`}>
                <View style={[tw`h-full bg-white rounded-full`, { width: `${taskProgress}%` }]} />
              </View>

              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  {isCompleted ? <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} fill="rgba(255,255,255,0.3)" /> : <Circle size={14} color="#fff" strokeWidth={2} />}
                  <Text style={tw`text-xs font-semibold text-white/90`}>{isWeekly ? t('habits.weeklyTasks') : t('habits.todaysTasks')}</Text>
                </View>
                <Text style={tw`text-xs font-bold text-white`}>
                  {completedTasks}/{activeTasks}
                </Text>
              </View>
            </View>

            {/* Stats Footer */}
            <View style={tw`flex-row items-center justify-between pt-3 border-t border-white/20`}>
              <View>
                <Text style={tw`text-xs text-white/70 font-medium mb-1`}>{t('habits.streak')}</Text>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Flame size={22} color="#FFFFFF" strokeWidth={2} fill="rgba(255, 255, 255, 0.2)" />
                  <View style={tw`flex-row items-baseline gap-1`}>
                    <Text style={tw`text-2xl font-black text-white`}>{streakData.count}</Text>
                    <Text style={tw`text-sm font-semibold text-white/80`}>{streakData.unit}</Text>
                  </View>
                </View>
              </View>

              <View style={[tw`px-3 py-1.5 rounded-xl border border-white/30`, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Text style={tw`text-xs font-black text-white`}>{tier.name}</Text>
              </View>
            </View>

            {/* Paused Tasks Notice */}
            {pausedTaskCount > 0 && (
              <View style={tw`mt-3 pt-3 border-t border-white/20`}>
                <Text style={tw`text-xs text-white/70`}>{t('habits.tasksPaused', { count: pausedTaskCount })}</Text>
              </View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};
