// src/components/habits/TasksCard.tsx
// Fixed: Smooth entry animations without jumping
// Updated: Integrated task management icon
// Enhanced: Gamified styling with texture and gradient

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ImageBackground, Modal, FlatList, Animated as RNAnimated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring, useSharedValue, withRepeat, withTiming, Easing, withDelay } from 'react-native-reanimated';
import { Circle, CheckCircle2, Clock, Loader2, PauseCircle, Settings2, Plus, X, Trash2, Sparkles } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';
import { t } from 'i18next';
import { HabitType, Task as TaskType } from '@/types';
import { getTasksForCategory } from '@/utils/habitHelpers';
import TaskManagerItem from '@/components/tasks/TaskItem';
import TaskCategoryPicker from '@/components/tasks/TaskCategoryPicker';

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
  habitCategory: string;
  habitType: HabitType;
  today: string;
  onToggleTask: (taskId: string) => Promise<void>;
  tier: HabitTier;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  isLoading?: boolean;
  loadingTaskId?: string | null;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'custom';
  isWeekCompleted?: boolean;
  // Task management props
  onTasksUpdated?: () => void;
  tierColor?: string;
}

const TaskCheckItem: React.FC<{
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
  totalTasks: number;
}> = ({ task, isCompleted, theme, onPress, index, isPaused, pausedUntil, disabled, isProcessing, isWeekLocked, totalTasks }) => {
  const scale = useSharedValue(1);
  const spinnerRotation = useSharedValue(0);

  // Simple fade in
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);

  React.useEffect(() => {
    if (isProcessing) {
      spinnerRotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1, false);
    } else {
      spinnerRotation.value = 0;
    }
  }, [isProcessing]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const showAsCompleted = isCompleted || isWeekLocked;
  const isLast = index === totalTasks - 1;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={showAsCompleted || isPaused || disabled}
      style={[
        tw`flex-row items-center p-4 rounded-xl mb-2`,
        animatedStyle,
        {
          backgroundColor: showAsCompleted
            ? 'rgba(255, 255, 255, 0.95)'
            : isPaused
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.85)',
          borderWidth: 1.5,
          borderColor: showAsCompleted
            ? 'rgba(255, 255, 255, 0.9)'
            : 'rgba(255, 255, 255, 0.4)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
      ]}
    >
      {/* Checkbox */}
      <View style={tw`mr-3`}>
        {isProcessing ? (
          <Animated.View style={[tw`w-6 h-6 items-center justify-center`, spinnerStyle]}>
            <Loader2 size={20} color={theme.accent} strokeWidth={2.5} />
          </Animated.View>
        ) : showAsCompleted ? (
          <View
            style={[
              tw`w-6 h-6 rounded-full items-center justify-center`,
              {
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
              },
            ]}
          >
            <CheckCircle2 size={16} color="#fff" strokeWidth={3} fill="transparent" />
          </View>
        ) : isPaused ? (
          <PauseCircle size={24} color="#a8a29e" strokeWidth={2} />
        ) : (
          <Circle size={24} color={theme.accent + '80'} strokeWidth={2} />
        )}
      </View>

      {/* Task Content */}
      <View style={tw`flex-1 min-w-0`}>
        <Text
          style={[
            tw`text-sm font-semibold`,
            isPaused ? tw`text-stone-400` : showAsCompleted ? { color: theme.accent } : tw`text-stone-800`,
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>

        {task.description && (
          <Text
            style={[tw`text-xs mt-0.5`, isPaused ? tw`text-stone-300` : showAsCompleted ? tw`text-stone-500` : tw`text-stone-600`]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        )}

        {isPaused && pausedUntil && (
          <Text style={tw`text-[11px] text-amber-600 font-medium mt-1`}>
            {t('habitDetails.tasks.pausedUntil', { date: formatPausedDate(pausedUntil) })}
          </Text>
        )}
      </View>

      {/* Duration Badge */}
      {!isPaused && task.duration && !showAsCompleted && (
        <View style={[tw`px-2.5 py-1 rounded-lg ml-2`, { backgroundColor: theme.accent + '20' }]}>
          <Text style={[tw`text-[11px] font-bold`, { color: theme.accent }]}>{task.duration}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

export const TasksCard: React.FC<TasksCardProps> = ({
  tasks,
  todayTasks,
  habitId,
  habitCategory,
  habitType,
  today,
  onToggleTask,
  tier,
  pausedTasks = {},
  isLoading = false,
  loadingTaskId = null,
  frequency = 'daily',
  isWeekCompleted = false,
  onTasksUpdated,
  tierColor,
}) => {
  const theme = tierThemes[tier];
  const effectiveTierColor = tierColor || theme.accent;

  // Task management state
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const swipeAnim = useRef(new RNAnimated.Value(0)).current;

  // Swipe tutorial animation
  useEffect(() => {
    if (showManageModal && tasks.length > 0 && !showTutorial) {
      setShowTutorial(true);
      const swipeSequence = RNAnimated.sequence([
        RNAnimated.timing(swipeAnim, { toValue: -80, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(swipeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        RNAnimated.delay(200),
        RNAnimated.timing(swipeAnim, { toValue: -80, duration: 500, useNativeDriver: true }),
        RNAnimated.timing(swipeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]);
      swipeSequence.start();
    }
  }, [showManageModal, tasks.length, showTutorial, swipeAnim]);

  const handleAddTaskPress = () => {
    setShowManageModal(false);
    setTimeout(() => setShowCategoryPicker(true), 300);
  };

  const handleTasksUpdatedInternal = () => {
    setShowCategoryPicker(false);
    setShowManageModal(false);
    // Note: No need to refresh habits here - the context already handles updates
  };

  const handleTaskDeleted = () => {
    // Note: No need to refresh habits here - the context already handles updates
  };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  // Récupérer les tâches prédéfinies traduites pour enrichir les données
  const predefinedTasks = React.useMemo(
    () => getTasksForCategory(habitCategory, habitType),
    [habitCategory, habitType]
  );

  // Enrichir une tâche avec les traductions si c'est une tâche prédéfinie
  const getEnrichedTask = (task: Task): Task => {
    // Si c'est une tâche custom, retourner telle quelle
    if (task.id.startsWith('custom-task-') || task.id.startsWith('custom_')) {
      return task;
    }

    // Chercher dans les tâches prédéfinies traduites
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
  };

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

  const allCompleted = completedTasksToday === totalTasks && totalTasks > 0;

  return (
    <>
    {/* Outer container with shadow - wrapper needed for shadow to show with overflow:hidden */}
    <View
      style={[
        tw`rounded-2xl mb-4`,
        {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
          backgroundColor: theme.gradient[1], // Needed for shadow to render on iOS
        },
      ]}
    >
      <View style={tw`rounded-2xl overflow-hidden`}>
        <ImageBackground
          source={theme.texture}
          style={tw`rounded-2xl overflow-hidden`}
          imageStyle={tw`rounded-2xl opacity-70`}
          resizeMode="cover"
        >
        <LinearGradient
          colors={[theme.gradient[0] + 'e5', theme.gradient[1] + 'dd', theme.gradient[2] + 'd5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`p-4`}
        >
          {/* Decorative gradient overlay */}
          <View style={tw`absolute inset-0 opacity-10`}>
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`w-full h-full`}
            />
          </View>

          {/* Completed celebration effect */}
          {allCompleted && (
            <View
              style={[
                tw`absolute top-0 right-0 w-20 h-20`,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderBottomLeftRadius: 80,
                },
              ]}
            />
          )}

          {/* Header */}
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <View style={tw`flex-row items-center flex-1`}>
              <Text style={tw`text-base font-bold text-white`}>{getTitle()}</Text>
              <View
                style={[
                  tw`ml-2 px-2.5 py-1 rounded-xl`,
                  {
                    backgroundColor: allCompleted ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              >
                <Text style={[tw`text-xs font-black`, { color: allCompleted ? theme.gradient[1] : '#fff' }]}>
                  {completedTasksToday}/{totalTasks}
                </Text>
              </View>
            </View>
            {onTasksUpdated && (
              <Pressable
                onPress={() => setShowManageModal(true)}
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                ]}
              >
                <Settings2 size={16} color="#fff" strokeWidth={2.5} />
              </Pressable>
            )}
          </View>

          {/* Progress Bar with enhanced styling */}
          <View
            style={[
              tw`h-2.5 rounded-full overflow-hidden mb-4`,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            ]}
          >
            <Animated.View
              style={[
                tw`h-full rounded-full`,
                progressAnimatedStyle,
                {
                  backgroundColor: allCompleted ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                  shadowColor: '#fff',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: allCompleted ? 0.8 : 0.3,
                  shadowRadius: 4,
                },
              ]}
            />
          </View>

          {/* Task List */}
          <View>
            {tasks.map((task, idx) => {
        const taskId = typeof task === 'string' ? task : task?.id || `task-${idx}`;
        const taskName = typeof task === 'string' ? task : task?.name || taskId;

        const taskObject: Task =
          typeof task === 'object' && task.name
            ? task
            : {
                id: taskId,
                name: taskName,
                description: typeof task === 'object' ? task.description : undefined,
                duration: typeof task === 'object' ? task.duration : undefined,
              };

        // Enrichir la tâche avec les traductions si c'est une tâche prédéfinie
        const enrichedTask = getEnrichedTask(taskObject);

        const isCompleted = todayTasks.completedTasks.includes(taskId);
        const isPaused = !!pausedTasks[taskId];
        const pausedInfo = pausedTasks[taskId];
        const isProcessing = isLoading && loadingTaskId === taskId;
        const isWeekLocked = frequency === 'weekly' && isWeekCompleted;

        return (
          <TaskCheckItem
            key={`task-${taskId}-${idx}`}
            task={enrichedTask}
            isCompleted={isCompleted}
            theme={theme}
            onPress={() => onToggleTask(taskId)}
            index={idx}
            isPaused={isPaused}
            pausedUntil={pausedInfo?.pausedUntil}
            disabled={isLoading}
            isProcessing={isProcessing}
            isWeekLocked={isWeekLocked}
            totalTasks={totalTasks}
          />
            );
          })}
          </View>
        </LinearGradient>
        </ImageBackground>
      </View>
    </View>

    {/* Task Management Modal */}
    {onTasksUpdated && (
      <>
        <Modal visible={showManageModal} animationType="slide" transparent onRequestClose={() => setShowManageModal(false)}>
          <View style={tw`flex-1 bg-black/50`}>
            <ImageBackground
              source={require('../../../assets/interface/textures/texture-white.png')}
              style={{
                flex: 1,
                marginTop: 80,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: 'hidden',
              }}
              imageStyle={{
                opacity: 0.6,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
              resizeMode="cover"
            >
              <View style={tw`flex-1 bg-white/80`}>
                {/* Header */}
                <View style={tw`px-6 py-5 border-b border-stone-200`}>
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-stone-900 text-2xl font-bold`}>{t('taskManager.manageTitle')}</Text>
                      <Text style={tw`text-stone-500 text-sm mt-1`}>{t('taskManager.maxTasks')}</Text>
                    </View>
                    <Pressable onPress={() => setShowManageModal(false)} style={tw`w-10 h-10 items-center justify-center rounded-xl bg-stone-100`}>
                      <X size={20} color="#57534e" />
                    </Pressable>
                  </View>
                </View>

                {/* Task List */}
                <FlatList
                  data={tasks as TaskType[]}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={tw`p-5`}
                  ListEmptyComponent={
                    <View style={tw`items-center justify-center py-16`}>
                      <View style={tw`w-20 h-20 rounded-full bg-stone-100 items-center justify-center mb-4`}>
                        <Trash2 size={32} color="#a8a29e" />
                      </View>
                      <Text style={tw`text-stone-900 font-bold text-lg mb-2`}>{t('taskManager.noTasksTitle')}</Text>
                      <Text style={tw`text-stone-500 text-center px-8`}>{t('taskManager.noTasks')}</Text>
                    </View>
                  }
                  renderItem={({ item, index }) => (
                    <RNAnimated.View
                      style={{
                        transform: [{ translateX: index === 0 && showTutorial ? swipeAnim : 0 }],
                      }}
                    >
                      <TaskManagerItem
                        task={item}
                        habitId={habitId}
                        habitCategory={habitCategory}
                        habitType={habitType}
                        onTaskDeleted={handleTaskDeleted}
                        tierColor={effectiveTierColor}
                      />
                    </RNAnimated.View>
                  )}
                  ItemSeparatorComponent={() => <View style={tw`h-3`} />}
                />

                {/* Add Task Button */}
                <View style={tw`p-6 border-t border-stone-200`}>
                  <View
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      shadowColor: effectiveTierColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      <Pressable onPress={handleAddTaskPress} style={tw`flex-row items-center justify-center py-4`}>
                        <Plus size={22} color="white" strokeWidth={2.5} />
                        <Text style={tw`text-white font-bold text-base ml-2`}>{t('taskManager.addNewTask')}</Text>
                      </Pressable>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            </ImageBackground>
          </View>
        </Modal>

        {/* Task Category Picker Modal */}
        <TaskCategoryPicker
          visible={showCategoryPicker}
          habitId={habitId}
          habitCategory={habitCategory}
          habitType={habitType}
          currentTaskCount={tasks.length}
          currentTier={tier as 'Crystal' | 'Ruby' | 'Amethyst'}
          tierColor={effectiveTierColor}
          existingTaskIds={tasks.map((t) => t.id)}
          onClose={() => setShowCategoryPicker(false)}
          onTasksUpdated={handleTasksUpdatedInternal}
        />
      </>
    )}
    </>
  );
};
