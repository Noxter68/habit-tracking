// src/components/dashboard/EnhancedHabitCard.tsx
import React, { useState, createElement } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, CheckCircle2, Timer, ChevronRight } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Habit } from '../../types';
import { getTasksForCategory } from '../../utils/habitHelpers';
import { ProgressCircleIcon, StreakFlameIcon } from '../icons/CustomIcons';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface EnhancedHabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onPress: () => void;
}

const EnhancedHabitCard: React.FC<EnhancedHabitCardProps> = ({ habit, onToggleDay, onToggleTask, onPress }) => {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };

  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const allTasksCompleted = completedTasksToday === totalTasks && totalTasks > 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  const categoryData = getCategoryIcon(habit.category, habit.type);
  const CategoryIcon = categoryData.icon;
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
    <Animated.View style={animatedStyle}>
      <Pressable onPress={() => setExpanded(!expanded)} onPressIn={handlePressIn} onPressOut={handlePressOut} style={tw`bg-white rounded-2xl overflow-hidden shadow-sm`}>
        {/* Main Card Content */}
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-center justify-between`}>
            {/* Left Side - Compact Info */}
            <View style={tw`flex-1 mr-3`}>
              <View style={tw`flex-row items-center mb-2`}>
                <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-2.5`, { backgroundColor: categoryData.bgColor }]}>
                  {createElement(CategoryIcon, {
                    size: 18,
                    color: categoryData.color,
                    strokeWidth: 2,
                  })}
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-sm font-bold text-gray-900`} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  {habit.currentStreak > 0 && (
                    <View style={tw`flex-row items-center mt-0.5`}>
                      <StreakFlameIcon size={12} />
                      <Text style={tw`text-xs font-medium text-amber-600 ml-1`}>{habit.currentStreak} days</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Right Side - Progress Indicator */}
            <View style={tw`flex-row items-center`}>
              {/* Task Count Badge */}
              {totalTasks > 0 && !allTasksCompleted && (
                <View style={tw`mr-3`}>
                  <View style={[tw`px-2.5 py-1 rounded-lg`, taskProgress > 0 ? tw`bg-indigo-50 border border-indigo-200` : tw`bg-gray-50 border border-gray-200`]}>
                    <Text style={[tw`text-xs font-bold`, taskProgress > 0 ? tw`text-indigo-600` : tw`text-gray-600`]}>
                      {completedTasksToday}/{totalTasks}
                    </Text>
                  </View>
                </View>
              )}

              {/* Completion Button */}
              <Pressable
                onPress={() => onToggleDay(habit.id, today)}
                style={({ pressed }) => [tw`w-10 h-10 rounded-xl items-center justify-center`, allTasksCompleted ? tw`bg-green-500` : tw`bg-gray-100 border border-gray-200`, pressed && tw`scale-95`]}
              >
                {allTasksCompleted ? <CheckCircle2 size={20} color="#ffffff" strokeWidth={2.5} /> : <ProgressCircleIcon size={32} progress={taskProgress} />}
              </Pressable>
            </View>
          </View>

          {/* Task List Toggle */}
          {totalTasks > 0 && (
            <Pressable onPress={() => setExpanded(!expanded)} style={tw`flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100`}>
              <Text style={tw`text-xs font-medium text-gray-500`}>{expanded ? 'Hide' : 'View'} Tasks</Text>
              <ChevronRight size={14} color="#6b7280" style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />
            </Pressable>
          )}
        </View>

        {/* Expanded Tasks Section */}
        {expanded && habit.tasks && habit.tasks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(200)} style={tw`border-t border-gray-100 bg-gray-50/50 px-4 pb-4 pt-3`}>
            {habit.tasks.map((taskId, index) => {
              const task = availableTasks.find((t) => t.id === taskId);
              if (!task) return null;

              const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

              return <TaskItem key={taskId} task={task} isCompleted={isCompleted} onToggle={() => handleTaskToggle(taskId)} delay={index * 50} />;
            })}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Compact Task Item
const TaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  onToggle: () => void;
  delay: number;
}> = ({ task, isCompleted, onToggle, delay }) => {
  const scale = useSharedValue(1);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={containerStyle}>
      <Pressable
        onPress={onToggle}
        onPressIn={() => (scale.value = withSpring(0.95))}
        onPressOut={() => (scale.value = withSpring(1))}
        style={[tw`flex-row items-center py-2.5 px-3 rounded-xl mb-1.5`, isCompleted ? tw`bg-green-50` : tw`bg-white`]}
      >
        {/* Checkbox */}
        <View style={[tw`w-5 h-5 rounded-md border-2 mr-3 items-center justify-center`, isCompleted ? tw`bg-green-500 border-green-500` : tw`bg-white border-gray-300`]}>
          {isCompleted && <Check size={12} color="#ffffff" strokeWidth={3} />}
        </View>

        {/* Task Info */}
        <View style={tw`flex-1`}>
          <Text style={[tw`text-sm font-medium`, isCompleted ? tw`text-gray-700` : tw`text-gray-900`]}>{task.name}</Text>
          {task.duration && (
            <View style={tw`flex-row items-center mt-0.5`}>
              <Timer size={10} color="#9ca3af" strokeWidth={2} />
              <Text style={tw`text-xs text-gray-400 ml-1`}>{task.duration}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default EnhancedHabitCard;
