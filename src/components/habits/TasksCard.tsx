// src/components/habits/TasksCard.tsx
import React from 'react';
import { View, Text, Pressable, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Circle, CheckCircle2, Clock, ArrowRight, PauseCircle, Loader2 } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TasksCardProps {
  tasks: any[];
  todayTasks: { completedTasks: string[]; allCompleted: boolean };
  habitId: string;
  today: string;
  onToggleTask: (taskId: string) => Promise<void>;
  tier: HabitTier;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  isLoading?: boolean;
  loadingTaskId?: string | null;
}

const TaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  theme: any;
  onPress: () => void;
  index: number;
  isPaused?: boolean;
  pausedUntil?: string;
  disabled?: boolean;
  isProcessing?: boolean;
}> = ({ task, isCompleted, theme, onPress, index, isPaused, pausedUntil, disabled, isProcessing }) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const spinnerRotation = useSharedValue(0);

  // Animate spinner rotation when processing
  React.useEffect(() => {
    if (isProcessing) {
      // Continuous rotation for spinner
      spinnerRotation.value = withRepeat(withTiming(360, { duration: 1000, easing: Easing.linear }), -1, false);
    } else {
      spinnerRotation.value = 0;
    }
  }, [isProcessing]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled) return;
    scale.value = withSpring(0.97, { damping: 15, stiffness: 600 });
    rotation.value = withSpring(-0.5, { damping: 15, stiffness: 600 });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 600 });
    rotation.value = withSpring(0, { damping: 15, stiffness: 600 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinnerRotation.value}deg` }],
  }));

  const taskId = typeof task === 'string' ? task : task.id;

  const formatPausedDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'until today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'until tomorrow';
    }
    return `until ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isCompleted || isPaused || disabled}
      entering={FadeInDown.delay(index * 50).springify()}
      style={[
        tw`flex-row items-center p-4 rounded-2xl mb-2.5 border shadow-sm`,
        animatedStyle,
        isPaused ? tw`bg-stone-50` : isCompleted ? tw`bg-stone-50` : tw`bg-white`,
        {
          borderColor: isPaused ? '#d6d3d1' : isCompleted ? theme.accent + '30' : '#e7e5e4',
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
        ) : isCompleted ? (
          <CheckCircle2 size={24} color={theme.accent} strokeWidth={2.5} fill={theme.accent + '20'} />
        ) : (
          <Circle size={24} color="#d6d3d1" strokeWidth={2} />
        )}
      </View>

      {/* Task Name & Pause Label */}
      <View style={tw`flex-1 min-w-0`}>
        <Text style={[tw`text-sm font-medium`, isPaused ? tw`text-stone-400` : isCompleted ? tw`text-stone-400 line-through` : tw`text-stone-800`]} numberOfLines={2}>
          {typeof task === 'string' ? task : task.name}
        </Text>

        {isPaused && pausedUntil && <Text style={tw`text-xs text-stone-400 mt-1`}>Paused {formatPausedDate(pausedUntil)}</Text>}
      </View>

      {/* Duration or Status Icon */}
      {!isPaused && typeof task === 'object' && task.duration && !isCompleted ? (
        <View style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0`, { backgroundColor: theme.accent + '10' }]}>
          <Clock size={13} color={theme.accent} />
          <Text style={[tw`text-xs font-semibold`, { color: theme.accent }]}>{task.duration}</Text>
        </View>
      ) : (
        !isPaused &&
        !isCompleted && (
          <View style={[tw`w-8 h-8 rounded-full items-center justify-center shrink-0`, { backgroundColor: theme.accent + '15' }]}>
            <ArrowRight size={16} color={theme.accent} strokeWidth={2.5} />
          </View>
        )
      )}
    </AnimatedPressable>
  );
};

export const TasksCard: React.FC<TasksCardProps> = ({ tasks, todayTasks, habitId, today, onToggleTask, tier, pausedTasks = {}, isLoading = false, loadingTaskId = null }) => {
  const theme = tierThemes[tier];
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  const progressWidth = useSharedValue(taskProgress);

  React.useEffect(() => {
    progressWidth.value = withSpring(taskProgress, {
      damping: 25,
      stiffness: 200,
    });
  }, [taskProgress]);

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressWidth.value, 5)}%`,
  }));

  return (
    <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-md border border-stone-100`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-base font-bold text-stone-800`}>Today's Tasks</Text>
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

      {/* Animated Progress Bar */}
      <View style={tw`h-3 bg-stone-100 rounded-full overflow-hidden mb-5`}>
        <Animated.View style={[tw`h-full`, progressAnimatedStyle]}>
          <ImageBackground source={theme.texture} style={tw`h-full w-full`} resizeMode="cover">
            <LinearGradient colors={theme.gradient.map((c) => c + 'dd')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full`} />
          </ImageBackground>
        </Animated.View>
      </View>

      {/* Task List */}
      {tasks.map((task, idx) => {
        const taskId = typeof task === 'string' ? task : task.id;
        const isCompleted = todayTasks.completedTasks.includes(taskId);
        const isPaused = !!pausedTasks[taskId];
        const pausedInfo = pausedTasks[taskId];
        const isProcessing = isLoading && loadingTaskId === taskId;

        return (
          <TaskItem
            key={`task-${taskId}`}
            task={task}
            isCompleted={isCompleted}
            theme={theme}
            onPress={() => onToggleTask(taskId)}
            index={idx}
            isPaused={isPaused}
            pausedUntil={pausedInfo?.pausedUntil}
            disabled={isLoading}
            isProcessing={isProcessing}
          />
        );
      })}
    </View>
  );
};
