// src/components/HabitCard.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
  const scale = useSharedValue(1);

  if (!habit) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const allTasksCompleted = completedTasksToday === totalTasks && totalTasks > 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable onPress={() => setExpanded(!expanded)} onPressIn={handlePressIn} onPressOut={handlePressOut} style={tw`bg-white rounded-2xl overflow-hidden`}>
        {/* Main Card Content */}
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-start justify-between`}>
            {/* Left Side - Info */}
            <View style={tw`flex-1 mr-3`}>
              <View style={tw`flex-row items-center mb-2`}>
                <View style={tw`w-8 h-8 bg-gray-50 rounded-lg items-center justify-center mr-2`}>
                  <Text style={tw`text-lg`}>{getCategoryIcon()}</Text>
                </View>
                <Text style={tw`text-base font-semibold text-gray-900 flex-1`} numberOfLines={1}>
                  {habit.name || 'Unnamed Habit'}
                </Text>
              </View>

              {/* Streak Badge */}
              <View style={tw`flex-row items-center`}>
                {habit.currentStreak > 0 && (
                  <View style={tw`bg-amber-50 px-2 py-1 rounded-lg flex-row items-center mr-2`}>
                    <Text style={tw`text-xs`}>🔥</Text>
                    <Text style={tw`text-xs font-semibold text-amber-700 ml-1`}>
                      {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                <Text style={tw`text-xs text-gray-400`}>{habit.type === 'good' ? 'Building' : 'Quitting'}</Text>
              </View>
            </View>

            {/* Right Side - Progress Ring */}
            <View style={tw`items-center`}>
              <View style={tw`relative w-14 h-14`}>
                {/* Background Circle */}
                <View style={tw`absolute inset-0 border-2 border-gray-100 rounded-full`} />

                {/* Progress Circle - Simplified for demo, use react-native-svg for actual implementation */}
                <View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      borderWidth: 2,
                      borderColor: allTasksCompleted ? '#10b981' : '#6366f1',
                      opacity: taskProgress / 100,
                    },
                  ]}
                />

                {/* Center Text */}
                <View style={tw`absolute inset-0 items-center justify-center`}>
                  <Text style={tw`text-sm font-bold text-gray-900`}>
                    {completedTasksToday}/{totalTasks}
                  </Text>
                </View>
              </View>

              {allTasksCompleted && <Text style={tw`text-xs text-green-600 font-medium mt-1`}>Done!</Text>}
            </View>
          </View>

          {/* Minimal Progress Indicator */}
          <View style={tw`mt-3`}>
            <View style={tw`h-1 bg-gray-100 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${taskProgress}%`,
                    backgroundColor: allTasksCompleted ? '#10b981' : taskProgress > 50 ? '#6366f1' : '#e5e7eb',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Expanded Tasks Section */}
        {expanded && habit.tasks && habit.tasks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(200)} style={tw`border-t border-gray-50 bg-gray-50/50`}>
            <View style={tw`px-4 py-3`}>
              <Text style={tw`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2`}>Tasks</Text>

              {habit.tasks.map((taskId, index) => {
                const task = availableTasks.find((t) => t.id === taskId);
                if (!task) return null;

                const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

                return (
                  <Animated.View key={taskId} entering={FadeIn.delay(index * 50)}>
                    <TaskItem task={task} isCompleted={isCompleted} onToggle={() => handleTaskToggle(taskId)} />
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Clean Task Item Component
const TaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ task, isCompleted, onToggle }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isCompleted ? 1 : 0);

  React.useEffect(() => {
    opacity.value = withTiming(isCompleted ? 1 : 0, { duration: 200 });
  }, [isCompleted]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: withSpring(isCompleted ? 1 : 0.8) }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable onPress={onToggle} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[tw`flex-row items-center p-3 rounded-xl mb-2`, isCompleted ? tw`bg-white` : tw`bg-white/50`]}>
        {/* Clean Checkbox */}
        <View style={tw`relative w-5 h-5 mr-3`}>
          <View style={[tw`absolute inset-0 border-2 rounded`, isCompleted ? tw`border-green-500` : tw`border-gray-300`]} />

          <Animated.View style={[tw`absolute inset-0 bg-green-500 rounded items-center justify-center`, checkStyle]}>
            <Text style={tw`text-white text-xs font-bold`}>✓</Text>
          </Animated.View>
        </View>

        {/* Task Info */}
        <View style={tw`flex-1`}>
          <Text style={[tw`text-sm font-medium`, isCompleted ? tw`text-gray-900` : tw`text-gray-600`]}>{task.name}</Text>
          {task.duration && <Text style={tw`text-xs text-gray-400 mt-0.5`}>{task.duration}</Text>}
        </View>

        {/* Task Icon */}
        <Text style={tw`text-base ml-2 opacity-60`}>{task.icon}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
