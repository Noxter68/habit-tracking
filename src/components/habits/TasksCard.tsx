// src/components/habits/TasksCard.tsx
// Fixed: Smooth entry animations without jumping
// Updated: Integrated task management icon
// Enhanced: Gamified styling with texture and gradient

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ImageBackground, Modal, FlatList, Animated as RNAnimated, Easing as RNEasing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Circle, PauseCircle, Settings2, Plus, X, Trash2 } from 'lucide-react-native';
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
  isWeekLocked?: boolean;
  totalTasks: number;
}> = ({ task, isCompleted, theme, onPress, index, isPaused, pausedUntil, disabled, isWeekLocked, totalTasks }) => {
  // Pour les habitudes weekly déjà complétées, afficher comme complété
  const showAsCompleted = isCompleted || isWeekLocked;

  // DUOLINGO-STYLE 3D PRESS ANIMATION
  // Vertical translation for "press down" effect
  const pressY = useSharedValue(0);

  // Shadow opacity reduces when pressed
  const shadowOpacity = useSharedValue(0.15);

  // Scale effect for tap feedback
  const scale = useSharedValue(1);

  // OPTIMISTIC UI: Checkmark animation scale (60fps native thread)
  // Utilise showAsCompleted pour inclure les weekly locked
  const checkScale = useSharedValue(showAsCompleted ? 1 : 0);

  // Lottie animation ref for checkmark
  const lottieRef = useRef<LottieView>(null);

  // Simple fade in on mount
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  }, []);

  // Track previous completed state to detect changes
  const prevCompleted = React.useRef(showAsCompleted);

  // INSTANT checkmark animation when completed changes
  React.useEffect(() => {
    checkScale.value = withSpring(showAsCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });

    // Play Lottie animation when task becomes completed (not on mount)
    if (showAsCompleted && !prevCompleted.current && lottieRef.current) {
      // Reset and play from start
      lottieRef.current.reset();
      lottieRef.current.play();
    }

    prevCompleted.current = showAsCompleted;
  }, [showAsCompleted]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;

    // Press down animation: move down 3px, reduce shadow, and scale down slightly
    pressY.value = withSpring(3, {
      damping: 20,
      stiffness: 600,
      mass: 0.3,
    });
    shadowOpacity.value = withTiming(0.05, { duration: 100 });
    scale.value = withSpring(0.97, {
      damping: 20,
      stiffness: 600,
      mass: 0.3,
    });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;

    // Release animation: spring back to original position
    pressY.value = withSpring(0, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });
  };

  // DUOLINGO-STYLE 3D ANIMATION
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: pressY.value },
      { scale: scale.value },
    ],
  }));

  // Checkmark scale animation (native 60fps)
  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  // Shadow animation for 3D depth effect
  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
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

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={showAsCompleted || isPaused || disabled}
      style={[
        tw`flex-row items-center p-4 rounded-xl mb-2`,
        animatedStyle,
        shadowStyle,
        {
          backgroundColor: showAsCompleted
            ? 'rgba(255, 255, 255, 0.95)'
            : isPaused
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.85)',
          // DUOLINGO-STYLE: Border bottom for 3D depth
          borderBottomWidth: showAsCompleted || isPaused ? 2 : 4,
          borderBottomColor: showAsCompleted
            ? 'rgba(200, 200, 200, 0.4)'
            : isPaused
              ? 'rgba(168, 162, 158, 0.3)'
              : theme.accent + '40',
          borderLeftWidth: 1.5,
          borderRightWidth: 1.5,
          borderTopWidth: 1.5,
          borderLeftColor: 'rgba(255, 255, 255, 0.4)',
          borderRightColor: 'rgba(255, 255, 255, 0.4)',
          borderTopColor: 'rgba(255, 255, 255, 0.4)',
          // Enhanced shadow for 3D effect
          shadowColor: showAsCompleted || isPaused ? '#000' : theme.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: showAsCompleted || isPaused ? 2 : 4,
        },
      ]}
    >
      {/* Checkbox - OPTIMISTIC UI with Lottie animation */}
      <View style={tw`mr-3 w-6 h-6 items-center justify-center`}>
        {showAsCompleted ? (
          <Animated.View
            style={[
              tw`items-center justify-center`,
              checkmarkStyle,
            ]}
          >
            <LottieView
              ref={lottieRef}
              source={require('../../../assets/animations/blue-checkmark.json')}
              autoPlay={true}
              loop={false}
              speed={1.2}
              style={{ width: 44, height: 44 }}
              resizeMode="contain"
              colorFilters={[
                {
                  keypath: 'Shape Layer 1.Ellipse 1.Fill 1',
                  color: theme.accent,
                },
                {
                  keypath: 'trait.Shape Layer 1.Shape 1.Stroke 1',
                  color: theme.accent,
                },
              ]}
              hardwareAccelerationAndroid
            />
          </Animated.View>
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

  // Optimistic progress tracking - ensures progress bar only moves forward
  const [optimisticProgress, setOptimisticProgress] = useState<number | null>(null);

  // Animation states
  const backgroundOpacity = React.useRef(new RNAnimated.Value(0)).current;
  const slideAnim = React.useRef(new RNAnimated.Value(1000)).current;

  useEffect(() => {
    if (showManageModal) {
      slideAnim.setValue(1000);
      RNAnimated.parallel([
        RNAnimated.timing(backgroundOpacity, {
          toValue: 0.5,
          duration: 250,
          useNativeDriver: true,
          easing: RNEasing.out(RNEasing.ease),
        }),
        RNAnimated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 9,
        }),
      ]).start();
    }
  }, [showManageModal, backgroundOpacity, slideAnim]);

  const handleCloseModal = () => {
    RNAnimated.parallel([
      RNAnimated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(slideAnim, {
        toValue: 1000,
        duration: 200,
        useNativeDriver: true,
        easing: RNEasing.in(RNEasing.ease),
      }),
    ]).start(() => {
      setShowManageModal(false);
    });
  };

  const handleAddTaskPress = () => {
    handleCloseModal();
    setTimeout(() => setShowCategoryPicker(true), 400);
  };

  const handleTasksUpdatedInternal = () => {
    setShowCategoryPicker(false);
    setShowManageModal(false);
    // Note: No need to refresh habits here - the context already handles updates
  };

  const handleTaskDeleted = () => {
    // Note: No need to refresh habits here - the context already handles updates
  };

  const totalTasks = tasks?.length || 0;
  const isWeekLocked = frequency === 'weekly' && isWeekCompleted;
  // Pour les habitudes weekly déjà complétées, afficher toutes les tâches comme complétées
  const completedTasksToday = isWeekLocked ? totalTasks : (todayTasks.completedTasks?.length || 0);

  // Wrapper for onToggleTask that updates optimistic progress
  const handleToggleTaskWithProgress = React.useCallback(async (taskId: string) => {
    const currentCompleted = todayTasks.completedTasks || [];
    const isCurrentlyCompleted = currentCompleted.includes(taskId);

    // Only update optimistic progress when completing (not uncompleting)
    if (!isCurrentlyCompleted) {
      const newCompletedCount = currentCompleted.length + 1;
      const newProgress = totalTasks > 0 ? (newCompletedCount / totalTasks) * 100 : 0;
      setOptimisticProgress(newProgress);
    }

    // Call the original toggle function
    await onToggleTask(taskId);
  }, [todayTasks.completedTasks, totalTasks, onToggleTask]);
  // Pour les habitudes weekly déjà complétées cette semaine, afficher 100%
  const serverProgress = isWeekLocked
    ? 100
    : totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  // OPTIMISTIC PROGRESS: Use optimistic value if available and greater than server value
  const taskProgress = isWeekLocked
    ? 100
    : optimisticProgress !== null && optimisticProgress > serverProgress
      ? optimisticProgress
      : serverProgress;

  // Clear optimistic progress when server catches up
  React.useEffect(() => {
    if (optimisticProgress !== null && serverProgress >= optimisticProgress) {
      setOptimisticProgress(null);
    }
  }, [serverProgress, optimisticProgress]);

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

  // Pour les habitudes weekly déjà complétées, considérer comme "all completed"
  const allCompleted = isWeekLocked || (completedTasksToday === totalTasks && totalTasks > 0);

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

        return (
          <TaskCheckItem
            key={`task-${taskId}-${idx}`}
            task={enrichedTask}
            isCompleted={isCompleted}
            theme={theme}
            onPress={() => handleToggleTaskWithProgress(taskId)}
            index={idx}
            isPaused={isPaused}
            pausedUntil={pausedInfo?.pausedUntil}
            disabled={false}
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
        <Modal visible={showManageModal} animationType="none" transparent onRequestClose={handleCloseModal}>
          <View style={tw`flex-1 justify-end`}>
            <RNAnimated.View
              style={[
                tw`absolute inset-0 bg-black`,
                { opacity: backgroundOpacity }
              ]}
            />
            <RNAnimated.View
              style={[
                {
                  transform: [{ translateY: slideAnim }],
                  height: '60%',
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  overflow: 'hidden',
                }
              ]}
            >
              <ImageBackground
                source={require('../../../assets/interface/textures/texture-white.png')}
                style={{ flex: 1 }}
                imageStyle={{ opacity: 0.6 }}
                resizeMode="cover"
              >
                <View style={tw`flex-1 bg-white/80`}>
                  {/* Header */}
                  <View style={tw`px-6 py-4 border-b border-stone-200`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-stone-900 text-xl font-bold`}>{t('taskManager.manageTitle')}</Text>
                        <Text style={tw`text-stone-500 text-xs mt-0.5`}>{t('taskManager.maxTasks')}</Text>
                      </View>
                      <Pressable onPress={handleCloseModal} style={tw`w-10 h-10 items-center justify-center rounded-xl bg-stone-100`}>
                        <X size={20} color="#57534e" />
                      </Pressable>
                    </View>
                  </View>

                  {/* Task List */}
                  <FlatList
                    data={tasks as TaskType[]}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={tw`p-5 pb-0`}
                    ListEmptyComponent={
                      <View style={tw`items-center justify-center py-12`}>
                        <View style={tw`w-16 h-16 rounded-full bg-stone-100 items-center justify-center mb-3`}>
                          <Trash2 size={28} color="#a8a29e" />
                        </View>
                        <Text style={tw`text-stone-900 font-bold text-base mb-1`}>{t('taskManager.noTasksTitle')}</Text>
                        <Text style={tw`text-stone-500 text-sm text-center px-8`}>{t('taskManager.noTasks')}</Text>
                      </View>
                    }
                    renderItem={({ item, index }) => (
                      <TaskManagerItem
                        task={item}
                        habitId={habitId}
                        habitCategory={habitCategory}
                        habitType={habitType}
                        onTaskDeleted={handleTaskDeleted}
                        tierColor={effectiveTierColor}
                        isFirst={index === 0}
                      />
                    )}
                    ItemSeparatorComponent={() => <View style={tw`h-2.5`} />}
                  />

                  {/* Add Task Button */}
                  <View style={tw`p-5 border-t border-stone-200 bg-white/80`}>
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
                      <LinearGradient colors={[theme.gradient[0], theme.gradient[1], theme.gradient[2]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Pressable onPress={handleAddTaskPress} style={tw`flex-row items-center justify-center py-3.5`}>
                          <Plus size={20} color="white" strokeWidth={2.5} />
                          <Text style={tw`text-white font-bold text-sm ml-2`}>{t('taskManager.addNewTask')}</Text>
                        </Pressable>
                      </LinearGradient>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </RNAnimated.View>
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
