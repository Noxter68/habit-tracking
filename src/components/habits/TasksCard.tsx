// src/components/habits/TasksCard.tsx
// Fixed: Smooth entry animations without jumping

import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue, withRepeat, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { Circle, CheckCircle2, Clock, Loader2, PauseCircle } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';
import { t } from 'i18next';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Task {
  id: string;
  name: string;
  description?: string;
  duration?: string;
}

interface TasksCardProps {
  tasks: Task[];
  todayTasks: { completedTasks: string[]; allCompleted: boolean };
  habitId: string;
  today: string;
  onToggleTask: (taskId: string) => Promise<void>;
  tier: HabitTier;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  isLoading?: boolean;
  loadingTaskId?: string | null;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  isWeekCompleted?: boolean;
}

const TaskItem: React.FC<{
  task: Task;
  isCompleted: boolean;
  theme: any;
  onPress: () => void;
  index: number;
  isPaused?: boolean;
  pausedUntil?: string;
  disabled?: boolean;
  isProcessing?: boolean;
  isWeekLocked?: boolean;
}> = ({ task, isCompleted, theme, onPress, index, isPaused, pausedUntil, disabled, isProcessing, isWeekLocked }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  // Smooth entry animation - subtle movement
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(6);

  React.useEffect(() => {
    // Cascade rapide avec mouvement subtil
    const delay = index * 50; // 50ms entre chaque task

    opacity.value = withDelay(delay, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }));
  }, [index]);

  React.useEffect(() => {
    if (isProcessing) {
      spinnerRotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
    } else {
      spinnerRotation.value = 0;
    }
  }, [isProcessing]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 600 });
    rotation.value = withSpring(-0.5, { damping: 15, stiffness: 600 });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 600 });
    rotation.value = withSpring(0, { damping: 15, stiffness: 600 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const formatPausedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('habitDetails.tasks.pausedToday');
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return t('habitDetails.tasks.pausedTomorrow');
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const showAsCompleted = isCompleted || isWeekLocked;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={showAsCompleted || isPaused || disabled}
      style={[
        tw`flex-row items-center p-4 rounded-2xl mb-2.5 border shadow-sm`,
        animatedStyle,
        isPaused ? tw`bg-stone-50` : showAsCompleted ? tw`bg-stone-50` : tw`bg-white`,
        {
          borderColor: isPaused ? '#d6d3d1' : showAsCompleted ? theme.accent + '30' : '#e7e5e4',
        },
      ]}
    >
      {/* Status Icon */}
      <View style={tw`w-6 h-6 mr-3.5 items-center justify-center shrink-0`}>
        {isProcessing ? (
          <Animated.View style={spinnerStyle}>
            <Loader2 size={24} color={theme.accent} strokeWidth={2.5} />
          </Animated.View>
        ) : isPaused ? (
          <PauseCircle size={24} color="#9ca3af" strokeWidth={2.5} />
        ) : showAsCompleted ? (
          <CheckCircle2 size={24} color={theme.accent} strokeWidth={2.5} fill={theme.accent + '20'} />
        ) : (
          <Circle size={24} color="#d6d3d1" strokeWidth={2} />
        )}
      </View>

      {/* Task Content */}
      <View style={tw`flex-1 min-w-0 mr-3`}>
        <Text style={[tw`text-sm font-semibold mb-0.5`, isPaused ? tw`text-stone-400` : showAsCompleted ? tw`text-stone-400 line-through` : tw`text-stone-800`]} numberOfLines={1}>
          {task.name}
        </Text>

        {task.description && (
          <Text style={[tw`text-xs mt-0.5`, isPaused ? tw`text-stone-400` : tw`text-stone-500`]} numberOfLines={1}>
            {task.description}
          </Text>
        )}

        {isPaused && pausedUntil && (
          <Text style={tw`text-xs text-stone-400 mt-1`}>
            {t('habitDetails.tasks.pausedUntil', {
              date: formatPausedDate(pausedUntil),
            })}
          </Text>
        )}
      </View>

      {/* Duration Badge */}
      {!isPaused && task.duration && !showAsCompleted && (
        <View style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0`, { backgroundColor: theme.accent + '10' }]}>
          <Clock size={13} color={theme.accent} />
          <Text style={[tw`text-xs font-semibold`, { color: theme.accent }]}>{task.duration}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

export const TasksCard: React.FC<TasksCardProps> = ({
  tasks,
  todayTasks,
  habitId,
  today,
  onToggleTask,
  tier,
  pausedTasks = {},
  isLoading = false,
  loadingTaskId = null,
  frequency = 'daily',
  isWeekCompleted = false,
}) => {
  const theme = tierThemes[tier];
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  const progressWidth = useSharedValue(0);
  const prevProgress = React.useRef(0);

  React.useEffect(() => {
    progressWidth.value = taskProgress;
    prevProgress.current = taskProgress;
  }, []);

  React.useEffect(() => {
    const roundedProgress = Math.round(taskProgress);
    const roundedPrev = Math.round(prevProgress.current);

    if (roundedProgress !== roundedPrev) {
      progressWidth.value = withSpring(taskProgress, {
        damping: 35,
        stiffness: 120,
        mass: 1,
        overshootClamping: true,
      });
      prevProgress.current = taskProgress;
    }
  }, [taskProgress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressWidth.value, 5)}%`,
  }));

  const getTitle = () => {
    switch (frequency) {
      case 'daily':
        return t('habitDetails.tasks.title');
      case 'weekly':
        return t('habitDetails.tasks.weeklyTitle');
      case 'custom':
        return t('habitDetails.tasks.customTitle');
      default:
        return t('habitDetails.tasks.title');
    }
  };

  return (
    <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-md border border-stone-100`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-base font-bold text-stone-800`}>{getTitle()}</Text>
        <View
          style={[
            tw`px-3 py-1.5 rounded-xl border`,
            {
              borderColor: theme.accent + '40',
              backgroundColor: theme.accent + '10',
            },
          ]}
        >
          <Text style={[tw`text-xs font-black`, { color: theme.accent }]}>
            {completedTasksToday}/{totalTasks}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={tw`h-3 bg-stone-100 rounded-full overflow-hidden mb-5`}>
        <Animated.View style={[tw`h-full`, progressAnimatedStyle]}>
          <ImageBackground source={theme.texture} style={tw`h-full w-full`} resizeMode="cover">
            <LinearGradient colors={theme.gradient.map((c) => c + 'dd')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full`} />
          </ImageBackground>
        </Animated.View>
      </View>

      {/* Task List */}
      {tasks.map((task, idx) => {
        const taskId = typeof task === 'string' ? task : task?.id || `task-${idx}`;
        const taskName = typeof task === 'string' ? task : task?.name || task;

        const taskObject =
          typeof task === 'object' && task.name
            ? task
            : {
                id: taskId,
                name: taskName,
                description: typeof task === 'object' ? task.description : undefined,
                duration: typeof task === 'object' ? task.duration : undefined,
              };

        const isCompleted = todayTasks.completedTasks.includes(taskId);
        const isPaused = !!pausedTasks[taskId];
        const pausedInfo = pausedTasks[taskId];
        const isProcessing = isLoading && loadingTaskId === taskId;
        const isWeekLocked = frequency === 'weekly' && isWeekCompleted;

        return (
          <TaskItem
            key={`task-${taskId}-${idx}`}
            task={taskObject}
            isCompleted={isCompleted}
            theme={theme}
            onPress={() => onToggleTask(taskId)}
            index={idx}
            isPaused={isPaused}
            pausedUntil={pausedInfo?.pausedUntil}
            disabled={isLoading}
            isProcessing={isProcessing}
            isWeekLocked={isWeekLocked}
          />
        );
      })}
    </View>
  );
};
