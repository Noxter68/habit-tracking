/**
 * DashboardHabitCard.tsx
 *
 * Habit card for the Dashboard with inline tasks.
 * Allows validating tasks directly without navigating to HabitDetail.
 */

import React, { useMemo, memo, useCallback, useEffect } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import tw from '@/lib/tailwind';

import { Habit, HabitType } from '@/types';
import { tierThemes } from '@/utils/tierTheme';
import { HabitProgressionService } from '@/services/habitProgressionService';
import {
  getTodayString,
  isWeeklyHabitCompletedThisWeek,
  getWeeklyCompletedTasksCount,
} from '@/utils/dateHelpers';
import { getTasksForCategory } from '@/utils/habitHelpers';

import { DashboardCardHeader } from './DashboardCardHeader';
import { DashboardTaskItem } from './DashboardTaskItem';

interface Task {
  id: string;
  name: string;
  description?: string;
  duration?: string;
}

// Golden color for unclaimed milestones
const MILESTONE_GLOW_COLOR = '#f59e0b';

interface DashboardHabitCardProps {
  habit: Habit;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onNavigateToDetails: () => void;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  unlockedMilestonesCount?: number;
  hasUnclaimedMilestone?: boolean;
}

/**
 * Returns the translated habit name
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }
  return habit.name;
};

const DashboardHabitCardComponent: React.FC<DashboardHabitCardProps> = ({
  habit,
  onToggleTask,
  onNavigateToDetails,
  pausedTasks = {},
  unlockedMilestonesCount = 0,
  hasUnclaimedMilestone = false,
}) => {
  const { t } = useTranslation();
  const today = getTodayString();

  // Breathing animation for the glow shadow
  const glowOpacity = useSharedValue(0.7);

  useEffect(() => {
    if (hasUnclaimedMilestone) {
      // Breathing effect on glow shadow opacity
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [hasUnclaimedMilestone]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
  }));

  // Calculate tier
  const { tier } = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  }, [habit.currentStreak]);

  const theme = tierThemes[tier.name];
  const totalTasks = habit.tasks?.length || 0;
  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
  const isWeekly = habit.frequency === 'weekly';

  // Predefined tasks for translation enrichment
  const predefinedTasks = useMemo(() => {
    return getTasksForCategory(habit.category, habit.type as HabitType);
  }, [habit.category, habit.type]);

  // Enrich task with translations - memoized
  const getEnrichedTask = useCallback((task: Task): Task => {
    if (task.id.startsWith('custom-task-') || task.id.startsWith('custom_')) {
      return task;
    }
    const translatedTask = predefinedTasks.find((t) => t.id === task.id);
    if (translatedTask) {
      return {
        ...task,
        name: translatedTask.name || task.name,
        description: translatedTask.description || task.description,
        duration: translatedTask.duration || task.duration,
      };
    }
    return task;
  }, [predefinedTasks]);

  // Calculate completed tasks
  const completedTasks = useMemo(() => {
    if (!isWeekly) {
      return todayTasks?.completedTasks?.length || 0;
    }
    return getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
  }, [habit, isWeekly, todayTasks]);

  // Check if week is complete for weekly habits
  const isWeekCompleted = isWeekly
    ? isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt)
    : false;

  // Count paused tasks
  const pausedTaskCount = Object.keys(pausedTasks).filter((taskId) =>
    habit.tasks.some((t) => (typeof t === 'string' ? t : t.id) === taskId)
  ).length;

  const activeTasks = totalTasks - pausedTaskCount;
  const taskProgress = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;

  // Handler for toggling a task
  // Note: Don't memoize to avoid stale closures with taskIds
  const handleTaskToggle = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleTask(habit.id, today, taskId);
  };

  // Handler for navigation - memoized
  const handleNavigate = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateToDetails();
  }, [onNavigateToDetails]);

  return (
    <View>
      {/* Golden breathing glow for unclaimed milestone */}
      {hasUnclaimedMilestone && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -6,
              left: -6,
              right: -6,
              bottom: -6,
              borderRadius: 22,
              // Main glow via shadow
              shadowColor: MILESTONE_GLOW_COLOR,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 28,
              elevation: 16,
              // Semi-transparent background
              backgroundColor: 'rgba(245, 158, 11, 0.18)',
            },
            animatedGlowStyle,
          ]}
        />
      )}

      {/* Card container with shadow */}
      <View style={{ position: 'relative' }}>
        {/* Shadow layer for depth effect */}
        <View
          style={{
            position: 'absolute',
            top: 3,
            left: 0,
            right: 0,
            bottom: -3,
            backgroundColor: theme.gradient[2],
            borderRadius: 16,
          }}
        />
        <View style={tw`rounded-2xl overflow-hidden`}>
          <ImageBackground
            source={theme.texture}
            style={tw`rounded-2xl`}
            imageStyle={tw`rounded-2xl opacity-80`}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[theme.gradient[0] + 'e8', theme.gradient[1] + 'e0', theme.gradient[2] + 'd8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`p-4`}
            >
              {/* Decorative gradient overlay */}
              <View style={tw`absolute inset-0 opacity-15`}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`w-full h-full`}
                />
              </View>

              {/* Header: Gem, Name, Streak, Chevron */}
              <DashboardCardHeader
                habitName={getTranslatedHabitName(habit, t)}
                tierName={tier.name}
                currentStreak={habit.currentStreak}
                frequency={habit.frequency}
                unlockedMilestonesCount={unlockedMilestonesCount}
                hasUnclaimedMilestone={hasUnclaimedMilestone}
                onNavigate={handleNavigate}
              />

              {/* Progress Bar */}
              <View style={tw`mb-3`}>
                <View
                  style={{
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {taskProgress > 0 && (
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.max(taskProgress, 10)}%`,
                        borderRadius: 6,
                        backgroundColor: '#ffffff',
                        // Subtle border for depth effect
                        borderBottomWidth: 2,
                        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  )}
                </View>
                <View style={tw`flex-row items-center justify-between mt-1.5`}>
                  <Text style={tw`text-[10px] font-semibold text-white/70`}>
                    {isWeekly ? t('habits.weeklyTasks') : t('habits.todaysTasks')}
                  </Text>
                  <Text style={tw`text-[11px] font-bold text-white`}>
                    {completedTasks}/{activeTasks}
                  </Text>
                </View>
              </View>

              {/* Task List */}
              <View>
                {habit.tasks.map((task, idx) => {
                  const taskId = typeof task === 'string' ? task : task.id;
                  const taskObject: Task =
                    typeof task === 'string'
                      ? { id: task, name: task }
                      : { id: task.id, name: task.name, description: task.description, duration: task.duration };

                  const enrichedTask = getEnrichedTask(taskObject);
                  const isCompleted = todayTasks.completedTasks.includes(taskId);
                  const isPaused = !!pausedTasks[taskId];

                  return (
                    <DashboardTaskItem
                      key={`task-${taskId}-${idx}`}
                      task={enrichedTask}
                      isCompleted={isCompleted}
                      isPaused={isPaused}
                      onPress={() => handleTaskToggle(taskId)}
                      tierAccent={theme.accent}
                      tierName={tier.name}
                      isWeekLocked={isWeekCompleted}
                    />
                  );
                })}
              </View>

              {/* Paused tasks notification */}
              {pausedTaskCount > 0 && (
                <View
                  style={[
                    tw`mt-2 pt-2 flex-row items-center gap-2`,
                    { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.15)' },
                  ]}
                >
                  <View style={tw`w-2 h-2 rounded-full bg-amber-400`} />
                  <Text style={tw`text-[10px] text-white/70 font-medium`}>
                    {t('habits.tasksPaused', { count: pausedTaskCount })}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </ImageBackground>
        </View>
      </View>
    </View>
  );
};

// Shallow comparator for pausedTasks (avoids expensive JSON.stringify)
const arePausedTasksEqual = (
  prev: Record<string, { pausedUntil: string; reason?: string }>,
  next: Record<string, { pausedUntil: string; reason?: string }>
): boolean => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;
  return prevKeys.every(key => key in next);
};

// Comparator for completedTasks - compares IDs, not just length
const areCompletedTasksEqual = (
  prev: string[] | undefined,
  next: string[] | undefined
): boolean => {
  if (!prev && !next) return true;
  if (!prev || !next) return false;
  if (prev.length !== next.length) return false;
  // Compare IDs (order may differ so we use Set)
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  if (prevSet.size !== nextSet.size) return false;
  for (const id of prevSet) {
    if (!nextSet.has(id)) return false;
  }
  return true;
};

// Memoize to avoid re-renders during scroll
export const DashboardHabitCard = memo(DashboardHabitCardComponent, (prev, next) => {
  // Re-render only if important data changes
  const prevTodayTasks = prev.habit.dailyTasks?.[getTodayString()];
  const nextTodayTasks = next.habit.dailyTasks?.[getTodayString()];

  // Compare tasks (IDs only for performance)
  const prevTaskIds = prev.habit.tasks?.map((t) => (typeof t === 'string' ? t : t.id)).join(',') || '';
  const nextTaskIds = next.habit.tasks?.map((t) => (typeof t === 'string' ? t : t.id)).join(',') || '';

  return (
    prev.habit.id === next.habit.id &&
    prev.habit.currentStreak === next.habit.currentStreak &&
    prev.unlockedMilestonesCount === next.unlockedMilestonesCount &&
    prev.hasUnclaimedMilestone === next.hasUnclaimedMilestone &&
    prevTaskIds === nextTaskIds &&
    areCompletedTasksEqual(prevTodayTasks?.completedTasks, nextTodayTasks?.completedTasks) &&
    arePausedTasksEqual(prev.pausedTasks || {}, next.pausedTasks || {})
  );
});

export default DashboardHabitCard;
