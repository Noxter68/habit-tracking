// src/components/habits/TasksCard.tsx
import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, withSpring, withTiming, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { Circle, CheckCircle2, Clock, ArrowRight, Loader2, PauseCircle } from 'lucide-react-native';
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
  processingTasks: Set<string>;
  xpEarnedTasks: Set<string>;
  tier: HabitTier;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>; // ✅ NEW PROP
}

const TaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  isProcessing: boolean;
  hasEarnedXP: boolean;
  theme: any;
  onPress: () => void;
  index: number;
  isPaused?: boolean; // ✅ NEW
  pausedUntil?: string; // ✅ NEW
}> = ({ task, isCompleted, isProcessing, hasEarnedXP, theme, onPress, index, isPaused, pausedUntil }) => {
  const scale = useSharedValue(1);
  const xpScale = useSharedValue(hasEarnedXP ? 1 : 0);
  const rotation = useSharedValue(0);
  const hasAnimated = React.useRef(hasEarnedXP);

  React.useEffect(() => {
    if (hasEarnedXP && !hasAnimated.current) {
      hasAnimated.current = true;
      xpScale.value = 0;
      xpScale.value = withSpring(1, {
        damping: 10,
        stiffness: 500,
        mass: 0.6,
      });
    }
  }, [hasEarnedXP]);

  const handlePressIn = () => {
    // ✅ No animation if paused
    if (isPaused) return;
    scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
    rotation.value = withSpring(-1, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    // ✅ No animation if paused
    if (isPaused) return;
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
    rotation.value = withSpring(0, { damping: 20, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: xpScale.value }],
    opacity: interpolate(xpScale.value, [0, 1], [0, 1], Extrapolate.CLAMP),
  }));

  const taskId = typeof task === 'string' ? task : task.id;

  // ✅ Format pause date
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
    return `until ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isProcessing || isCompleted || isPaused} // ✅ Disable if paused
      entering={FadeInDown.delay(index * 50).springify()}
      style={[
        tw`flex-row items-center p-4 rounded-2xl mb-2.5 border shadow-sm`,
        animatedStyle,
        // ✅ Gray background for paused, otherwise normal
        isPaused ? tw`bg-stone-50` : isCompleted ? tw`bg-stone-50` : tw`bg-white`,
        {
          borderColor: isPaused
            ? '#d6d3d1' // ✅ Gray border for paused
            : isCompleted
            ? theme.accent + '30'
            : '#e7e5e4',
        },
      ]}
    >
      {/* Status Icon */}
      <View style={tw`w-6 h-6 mr-3.5 items-center justify-center`}>
        {isPaused ? (
          // ✅ Pause icon for paused tasks
          <PauseCircle size={24} color="#9ca3af" strokeWidth={2.5} />
        ) : isProcessing ? (
          <Loader2 size={24} color={theme.accent} strokeWidth={2.5} />
        ) : isCompleted ? (
          <CheckCircle2 size={24} color={theme.accent} strokeWidth={2.5} fill={theme.accent + '20'} />
        ) : (
          <Circle size={24} color="#d6d3d1" strokeWidth={2} />
        )}
      </View>

      {/* Task Name & Pause Label */}
      <View style={tw`flex-1`}>
        <Text
          style={[
            tw`text-sm font-medium`,
            isPaused
              ? tw`text-stone-400` // ✅ Muted text for paused
              : isCompleted
              ? tw`text-stone-400 line-through`
              : tw`text-stone-800`,
          ]}
          numberOfLines={2}
        >
          {typeof task === 'string' ? task : task.name}
        </Text>

        {/* ✅ Pause date label */}
        {isPaused && pausedUntil && <Text style={tw`text-xs text-stone-400 mt-1`}>Paused {formatPausedDate(pausedUntil)}</Text>}
      </View>

      {/* XP Badge with Bounce - Only show if not paused */}
      {!isPaused && isCompleted && hasEarnedXP && (
        <Animated.View style={xpAnimatedStyle}>
          <LinearGradient colors={theme.gradient} style={tw`px-3 py-1.5 rounded-full mr-2`} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={tw`text-xs font-bold text-white`}>+XP</Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Duration or Status Icon - Don't show if paused */}
      {!isPaused && typeof task === 'object' && task.duration && !isCompleted ? (
        <View style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl`, { backgroundColor: theme.accent + '10' }]}>
          <Clock size={13} color={theme.accent} />
          <Text style={[tw`text-xs font-semibold`, { color: theme.accent }]}>{task.duration}</Text>
        </View>
      ) : (
        !isPaused &&
        !isCompleted && (
          <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: theme.accent + '15' }]}>
            <ArrowRight size={16} color={theme.accent} strokeWidth={2.5} />
          </View>
        )
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
  processingTasks,
  xpEarnedTasks,
  tier,
  pausedTasks = {}, // ✅ DEFAULT EMPTY OBJECT
}) => {
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
        const isProcessing = processingTasks.has(`${habitId}-${today}-${taskId}`);
        const hasEarnedXP = xpEarnedTasks.has(`${habitId}-${today}-${taskId}`);

        const isPaused = !!pausedTasks[taskId];
        const pausedInfo = pausedTasks[taskId];

        return (
          <TaskItem
            key={`task-${taskId}`}
            task={task}
            isCompleted={isCompleted}
            isProcessing={isProcessing}
            hasEarnedXP={hasEarnedXP}
            theme={theme}
            onPress={() => onToggleTask(taskId)}
            index={idx}
            isPaused={isPaused} // ✅ NEW PROP
            pausedUntil={pausedInfo?.pausedUntil} // ✅ NEW PROP
          />
        );
      })}
    </View>
  );
};
