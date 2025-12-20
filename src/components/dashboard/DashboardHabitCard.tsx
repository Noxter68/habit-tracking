/**
 * DashboardHabitCard.tsx
 *
 * Carte d'habitude pour le Dashboard avec tâches inline.
 * Permet de valider les tâches directement sans naviguer vers HabitDetail.
 */

import React, { useMemo } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tailwind';

import { Habit, HabitType, Task as TaskType } from '@/types';
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

interface DashboardHabitCardProps {
  habit: Habit;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onNavigateToDetails: () => void;
  index: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  unlockedMilestonesCount?: number;
}

/**
 * Retourne le nom traduit de l'habitude
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }
  return habit.name;
};

export const DashboardHabitCard: React.FC<DashboardHabitCardProps> = ({
  habit,
  onToggleTask,
  onNavigateToDetails,
  index,
  pausedTasks = {},
  unlockedMilestonesCount = 0,
}) => {
  const { t } = useTranslation();
  const today = getTodayString();

  // Calcul du tier
  const { tier } = useMemo(() => {
    return HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  }, [habit.currentStreak]);

  const theme = tierThemes[tier.name];
  const totalTasks = habit.tasks?.length || 0;
  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
  const isWeekly = habit.frequency === 'weekly';

  // Tâches prédéfinies pour enrichir les traductions
  const predefinedTasks = useMemo(() => {
    return getTasksForCategory(habit.category, habit.type as HabitType);
  }, [habit.category, habit.type]);

  // Enrichir une tâche avec les traductions
  const getEnrichedTask = (task: Task): Task => {
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
  };

  // Calcul des tâches complétées
  const completedTasks = useMemo(() => {
    if (!isWeekly) {
      return todayTasks?.completedTasks?.length || 0;
    }
    return getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
  }, [habit, isWeekly, todayTasks]);

  // Check si la semaine est complète pour les weekly habits
  const isWeekCompleted = isWeekly
    ? isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt)
    : false;

  // Compte des tâches en pause
  const pausedTaskCount = Object.keys(pausedTasks).filter((taskId) =>
    habit.tasks.some((t) => (typeof t === 'string' ? t : t.id) === taskId)
  ).length;

  const activeTasks = totalTasks - pausedTaskCount;
  const taskProgress = activeTasks > 0 ? Math.round((completedTasks / activeTasks) * 100) : 0;

  // Handler pour toggle une tâche
  const handleTaskToggle = (taskId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleTask(habit.id, today, taskId);
  };

  // Handler pour navigation
  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigateToDetails();
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      {/* Card container with shadow */}
      <View
        style={[
          tw`rounded-2xl`,
          {
            shadowColor: theme.gradient[1],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
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
                onNavigate={handleNavigate}
              />

              {/* Progress Bar with Texture */}
              <View style={tw`mb-3`}>
                <View
                  style={[
                    tw`h-3 rounded-full overflow-hidden`,
                    {
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                      borderWidth: 1.5,
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                    },
                  ]}
                >
                  {taskProgress > 0 && (
                    <View
                      style={[
                        tw`h-full rounded-full`,
                        {
                          width: `${Math.max(taskProgress, 8)}%`,
                          backgroundColor: taskProgress === 100 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)',
                          shadowColor: '#fff',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: taskProgress === 100 ? 0.9 : 0.5,
                          shadowRadius: 6,
                        },
                      ]}
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
                      pausedUntil={pausedTasks[taskId]?.pausedUntil}
                      onPress={() => handleTaskToggle(taskId)}
                      tierAccent={theme.accent}
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
    </Animated.View>
  );
};

export default DashboardHabitCard;
