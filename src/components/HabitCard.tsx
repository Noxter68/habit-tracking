// src/components/HabitCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import tw from '../lib/tailwind';
import { Habit } from '../types';
import { getTasksForCategory } from '../utils/habitHelpers';

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onPress: () => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onToggleTask, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  // Null check for habit
  if (!habit) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  // Safe access to dailyTasks with default values
  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const allTasksCompleted = completedTasksToday === totalTasks && totalTasks > 0;

  // Safe access to completedDays and totalDays
  const completedDaysCount = habit.completedDays?.length || 0;
  const totalDays = habit.totalDays || 61;
  const progress = totalDays > 0 ? (completedDaysCount / totalDays) * 100 : 0;

  const getCategoryIcon = () => {
    const icons: Record<string, string> = {
      fitness: '💪',
      health: '🧘',
      nutrition: '🥗',
      learning: '📚',
      productivity: '⚡',
      mindfulness: '🧠',
      sleep: '😴',
      hydration: '💧',
      smoking: '🚭',
      'junk-food': '🍔',
      shopping: '🛍️',
      'screen-time': '📱',
      procrastination: '⏰',
      'negative-thinking': '💭',
      alcohol: '🍺',
      oversleeping: '🛏️',
    };
    return icons[habit.category] || '✨';
  };

  const availableTasks = getTasksForCategory(habit.category, habit.type);

  const handleTaskToggle = (taskId: string) => {
    if (onToggleTask) {
      onToggleTask(habit.id, today, taskId);
    }
  };

  const getCompletionMessage = () => {
    if (allTasksCompleted) {
      return { text: 'Perfect! All tasks completed! 🎉', color: 'text-teal-600' };
    } else if (completedTasksToday === totalTasks - 1 && totalTasks > 1) {
      return { text: 'So close! Just 1 more task to go! 💪', color: 'text-amber-600' };
    } else if (completedTasksToday > 0) {
      return { text: `Good progress! ${completedTasksToday}/${totalTasks} done`, color: 'text-blue-600' };
    }
    return { text: `${totalTasks} task${totalTasks !== 1 ? 's' : ''} to complete today`, color: 'text-slate-600' };
  };

  const message = getCompletionMessage();

  return (
    <View style={tw`bg-white rounded-xl shadow-sm mb-4`}>
      <Pressable onPress={() => setExpanded(!expanded)} style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View style={tw`flex-row items-center flex-1`}>
            <Text style={tw`text-2xl mr-3`}>{getCategoryIcon()}</Text>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-semibold text-slate-800`}>{habit.name || 'Unnamed Habit'}</Text>
              <Text style={[tw`text-sm font-medium`, tw`${message.color}`]}>{message.text}</Text>
            </View>
          </View>

          {/* Task Progress Circle */}
          <View style={tw`items-center`}>
            <View
              style={[
                tw`w-14 h-14 rounded-full items-center justify-center border-4`,
                allTasksCompleted ? tw`bg-teal-500 border-teal-500` : completedTasksToday > 0 ? tw`bg-amber-100 border-amber-400` : tw`bg-slate-100 border-slate-300`,
              ]}
            >
              <Text style={[tw`text-lg font-bold`, allTasksCompleted ? tw`text-white` : tw`text-slate-700`]}>
                {completedTasksToday}/{totalTasks}
              </Text>
            </View>
            <Text style={tw`text-xs text-slate-500 mt-1`}>{expanded ? 'Collapse' : 'Expand'}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`mb-3`}>
          <View style={tw`flex-row justify-between mb-1`}>
            <Text style={tw`text-sm text-slate-600`}>Overall Progress</Text>
            <Text style={tw`text-sm font-medium text-slate-700`}>
              {completedDaysCount}/{totalDays} days
            </Text>
          </View>
          <View style={tw`h-2 bg-slate-100 rounded-full overflow-hidden`}>
            <View style={[tw`h-full rounded-full`, habit.type === 'good' ? tw`bg-teal-500` : tw`bg-red-500`, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
          </View>
        </View>

        {/* Streak Info */}
        <View style={tw`flex-row justify-between`}>
          <Pressable onPress={onPress} style={tw`flex-1`}>
            <View>
              <Text style={tw`text-xs text-slate-500`}>Current Streak</Text>
              <Text style={tw`text-lg font-bold text-slate-800`}>{habit.currentStreak || 0} days</Text>
            </View>
          </Pressable>
          <View>
            <Text style={tw`text-xs text-slate-500`}>Best Streak</Text>
            <Text style={tw`text-lg font-bold text-slate-800`}>{habit.bestStreak || 0} days</Text>
          </View>
        </View>
      </Pressable>

      {/* Expanded Task List */}
      {expanded && habit.tasks && habit.tasks.length > 0 && (
        <Animated.View entering={FadeIn.duration(200)} style={tw`px-4 pb-4 border-t border-slate-100`}>
          <Text style={tw`text-sm font-semibold text-slate-700 mt-3 mb-2`}>Today's Tasks:</Text>

          {habit.tasks.map((taskId) => {
            const task = availableTasks.find((t) => t.id === taskId);
            if (!task) return null;

            const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

            return <TaskItem key={taskId} task={task} isCompleted={isCompleted} onToggle={() => handleTaskToggle(taskId)} />;
          })}

          {/* Motivational message for partial completion */}
          {completedTasksToday > 0 && !allTasksCompleted && (
            <View style={tw`mt-2 p-3 bg-amber-50 rounded-lg`}>
              <Text style={tw`text-sm text-amber-800 font-medium`}>
                {completedTasksToday === totalTasks - 1
                  ? "🎯 You're so close! Just one more task to complete your daily goal!"
                  : `💪 Great start! Keep going - ${totalTasks - completedTasksToday} more to go!`}
              </Text>
            </View>
          )}

          {/* Celebration for completion */}
          {allTasksCompleted && (
            <Animated.View entering={FadeIn.duration(300)} style={tw`mt-2 p-3 bg-teal-50 rounded-lg`}>
              <Text style={tw`text-sm text-teal-800 font-medium text-center`}>🎉 Amazing! You've completed all tasks for today! Keep up the great work!</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

// Simplified Task Item Component with better checkbox
const TaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ task, isCompleted, onToggle }) => {
  const checkOpacity = useSharedValue(isCompleted ? 1 : 0);

  React.useEffect(() => {
    checkOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 200 });
  }, [isCompleted]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [tw`flex-row items-center p-3 rounded-lg mb-2`, isCompleted ? tw`bg-teal-50` : tw`bg-slate-50`, pressed && tw`opacity-80`]}>
      {/* Better Checkbox Design */}
      <View style={tw`relative w-8 h-8 mr-3`}>
        {/* Empty checkbox */}
        {!isCompleted && <View style={tw`absolute inset-0 border-2 border-slate-300 rounded-lg`} />}

        {/* Filled checkbox */}
        <Animated.View style={[tw`absolute inset-0 bg-teal-500 rounded-lg items-center justify-center`, checkStyle]}>
          <Text style={tw`text-white text-base font-bold`}>✓</Text>
        </Animated.View>
      </View>

      <View style={tw`flex-1`}>
        <Text style={[tw`font-medium`, isCompleted ? tw`text-teal-800` : tw`text-slate-700`]}>
          {task.icon} {task.name}
        </Text>
        {task.duration && <Text style={tw`text-xs text-slate-500`}>⏱️ {task.duration}</Text>}
      </View>
    </Pressable>
  );
};

export default HabitCard;
