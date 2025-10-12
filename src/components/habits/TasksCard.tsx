// src/components/habits/TasksCard.tsx
import React from 'react';
import { View, Text, Pressable, ImageBackground, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Circle, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';

interface TasksCardProps {
  tasks: any[];
  todayTasks: { completedTasks: string[]; allCompleted: boolean };
  habitId: string;
  today: string;
  onToggleTask: (taskId: string) => Promise<void>;
  processingTasks: Set<string>;
  xpEarnedTasks: Set<string>;
  tier: HabitTier;
}

export const TasksCard: React.FC<TasksCardProps> = ({ tasks, todayTasks, habitId, today, onToggleTask, processingTasks, xpEarnedTasks, tier }) => {
  const theme = tierThemes[tier];
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  return (
    <View style={tw`bg-sand rounded-3xl p-5 mb-4 shadow-sm border border-stone-100`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Text style={tw`text-base font-bold text-stone-800`}>Today's Tasks</Text>
        <View style={[tw`px-3 py-1.5 rounded-xl border`, { borderColor: theme.accent + '50', backgroundColor: theme.accent + '15' }]}>
          <Text style={[tw`text-xs font-black`, { color: theme.accent }]}>
            {completedTasksToday}/{totalTasks}
          </Text>
        </View>
      </View>

      {/* Progress Bar with texture */}
      <View style={tw`h-3 bg-sand-100 rounded-full overflow-hidden mb-4`}>
        <ImageBackground source={theme.texture} style={[tw`h-full`, { width: `${Math.max(taskProgress, 5)}%` }]} resizeMode="cover">
          <LinearGradient colors={theme.gradient.map((c) => c + 'cc')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full`} />
        </ImageBackground>
      </View>

      {/* Task List */}
      {tasks.map((task, idx) => {
        const taskId = typeof task === 'string' ? task : task.id;
        const isCompleted = todayTasks.completedTasks.includes(taskId);
        const isProcessing = processingTasks.has(`${habitId}-${today}-${taskId}`);
        const hasEarnedXP = xpEarnedTasks.has(`${habitId}-${today}-${taskId}`);

        return (
          <Animated.View key={`task-${taskId}`} entering={FadeInDown.delay(idx * 50).springify()}>
            <Pressable onPress={() => onToggleTask(taskId)} disabled={isProcessing || isCompleted} style={tw`flex-row items-center p-4 rounded-2xl mb-2.5 border bg-sand`}>
              {/* Status Icon */}
              <View style={tw`w-6 h-6 mr-3.5`}>
                {isProcessing ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : isCompleted ? (
                  <CheckCircle2 size={24} color={theme.accent} strokeWidth={2.5} />
                ) : (
                  <Circle size={24} color="#d1d5db" strokeWidth={2} />
                )}
              </View>

              {/* Task Name */}
              <Text style={[tw`text-sm flex-1 font-medium`, isCompleted ? tw`text-stone-300 line-through` : tw`text-gray-800`]}>{typeof task === 'string' ? task : task.name}</Text>

              {/* XP Badge */}
              {isCompleted && hasEarnedXP && (
                <LinearGradient colors={theme.gradient} style={tw`px-2.5 py-1.5 rounded-lg mr-2`}>
                  <Text style={tw`text-xs font-bold text-white`}>XP</Text>
                </LinearGradient>
              )}

              {/* Duration */}
              {typeof task === 'object' && task.duration && (
                <View style={[tw`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl`, { backgroundColor: theme.accent + '15' }]}>
                  <Clock size={13} color={theme.accent} />
                  <Text style={[tw`text-xs font-semibold`, { color: theme.accent }]}>{task.duration}</Text>
                </View>
              )}

              {/* Sparkle for active task */}
              {!isCompleted && <Sparkles size={18} color={theme.accent} />}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};
