// src/components/HabitCard.tsx
import React, { useState, createElement } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolate, withSequence } from 'react-native-reanimated';
import {
  Dumbbell,
  Heart,
  Apple,
  BookOpen,
  Zap,
  Brain,
  Moon,
  Droplets,
  Ban,
  Cigarette,
  ShoppingBag,
  Smartphone,
  Clock,
  ThumbsDown,
  Beer,
  Bed,
  Flame,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Check,
  Circle,
  CheckCircle2,
  Timer,
  Target,
} from 'lucide-react-native';
import tw from '../lib/tailwind';
import { Habit } from '../types';
import { getTasksForCategory } from '../utils/habitHelpers';
import { LinearGradient } from 'react-native-svg';
import { StatsIcons } from './icons/StatsIcons';

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onPress: () => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onToggleTask, onPress }) => {
  const [expanded, setExpanded] = useState(false);
  const scale = useSharedValue(1);
  const chevronRotation = useSharedValue(0);

  if (!habit) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const allTasksCompleted = completedTasksToday === totalTasks && totalTasks > 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  // Get category icon and color with Lucide icons
  const getCategoryData = () => {
    const categories: Record<string, { icon: any; color: string; bgColor: string }> = {
      fitness: { icon: Dumbbell, color: '#ef4444', bgColor: '#fef2f2' },
      health: { icon: Heart, color: '#ec4899', bgColor: '#fdf2f8' },
      nutrition: { icon: Apple, color: '#84cc16', bgColor: '#f7fee7' },
      learning: { icon: BookOpen, color: '#3b82f6', bgColor: '#eff6ff' },
      productivity: { icon: Zap, color: '#f59e0b', bgColor: '#fef3c7' },
      mindfulness: { icon: Brain, color: '#8b5cf6', bgColor: '#f3e8ff' },
      sleep: { icon: Moon, color: '#6366f1', bgColor: '#eef2ff' },
      hydration: { icon: Droplets, color: '#06b6d4', bgColor: '#ecfeff' },
      smoking: { icon: Cigarette, color: '#dc2626', bgColor: '#fef2f2' },
      'junk-food': { icon: Ban, color: '#f97316', bgColor: '#fff7ed' },
      shopping: { icon: ShoppingBag, color: '#ec4899', bgColor: '#fdf2f8' },
      'screen-time': { icon: Smartphone, color: '#6b7280', bgColor: '#f9fafb' },
      procrastination: { icon: Clock, color: '#f59e0b', bgColor: '#fef3c7' },
      'negative-thinking': { icon: ThumbsDown, color: '#7c3aed', bgColor: '#f3e8ff' },
      alcohol: { icon: Beer, color: '#ca8a04', bgColor: '#fef9c3' },
      oversleeping: { icon: Bed, color: '#64748b', bgColor: '#f8fafc' },
    };
    return categories[habit.category] || { icon: Target, color: '#6b7280', bgColor: '#f9fafb' };
  };

  const categoryData = getCategoryData();
  const CategoryIcon = categoryData.icon;
  const HabitTypeIcon = habit.type === 'good' ? TrendingUp : TrendingDown;

  const availableTasks = getTasksForCategory(habit.category, habit.type);

  const handleTaskToggle = (taskId: string) => {
    if (onToggleTask) {
      onToggleTask(habit.id, today, taskId);
    }
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
    chevronRotation.value = withSpring(expanded ? 0 : 180);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  // Get progress color
  const getProgressColor = () => {
    if (allTasksCompleted) return '#10b981';
    if (taskProgress >= 75) return '#3b82f6';
    if (taskProgress >= 50) return '#6366f1';
    if (taskProgress >= 25) return '#f59e0b';
    return '#e5e7eb';
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <Pressable onPress={handleToggleExpanded} onPressIn={handlePressIn} onPressOut={handlePressOut} style={tw`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm`}>
        {/* Main Card Content */}
        <View style={tw`p-4`}>
          <View style={tw`flex-row items-start justify-between`}>
            {/* Left Side - Info */}
            <View style={tw`flex-1 mr-3`}>
              <View style={tw`flex-row items-center mb-2`}>
                <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: categoryData.bgColor }]}>
                  {createElement(CategoryIcon, {
                    size: 20,
                    color: categoryData.color,
                    strokeWidth: 2,
                  })}
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-bold text-gray-900`} numberOfLines={1}>
                    {habit.name || 'Unnamed Habit'}
                  </Text>
                  <View style={tw`flex-row items-center mt-0.5`}>
                    {createElement(HabitTypeIcon, {
                      size: 12,
                      color: habit.type === 'good' ? '#10b981' : '#ef4444',
                      strokeWidth: 2.5,
                    })}
                    <Text style={tw`text-xs text-gray-500 ml-1`}>{habit.type === 'good' ? 'Building' : 'Quitting'}</Text>
                  </View>
                </View>
              </View>

              {/* Streak & Stats Row */}
              <View style={tw`flex-row items-center gap-2`}>
                {habit.currentStreak > 0 && (
                  <LinearGradient colors={['#fff7ed', '#fef3c7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-2.5 py-1 rounded-lg flex-row items-center border border-amber-200`}>
                    <StatsIcons.Flame size={12} />
                    <Text style={tw`text-xs font-bold text-amber-700 ml-1.5`}>
                      {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''}
                    </Text>
                  </LinearGradient>
                )}
                {totalTasks > 0 && (
                  <View style={tw`flex-row items-center`}>
                    <StatsIcons.Activity size={12} />
                    <Text style={tw`text-xs text-gray-500 ml-1`}>{totalTasks} tasks</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Right Side - Modern Progress Circle */}
            <Pressable onPress={() => onToggleDay(habit.id, today)} style={tw`items-center`}>
              <View style={tw`relative w-16 h-16`}>
                {/* Background Circle */}
                <View style={tw`absolute inset-0 border-2 border-gray-100 rounded-full`} />

                {/* Progress Arc (simplified - should use SVG for real arc) */}
                <View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      borderWidth: 2,
                      borderColor: getProgressColor(),
                      opacity: taskProgress > 0 ? 1 : 0.3,
                      transform: [{ rotate: '-90deg' }],
                    },
                  ]}
                />

                {/* Center Content */}
                <View style={tw`absolute inset-0 items-center justify-center`}>
                  {allTasksCompleted ? (
                    <CheckCircle2 size={24} color="#10b981" strokeWidth={2.5} />
                  ) : (
                    <View>
                      <Text style={tw`text-sm font-bold text-gray-900 text-center`}>{completedTasksToday}</Text>
                      <Text style={tw`text-xs text-gray-500`}>/{totalTasks}</Text>
                    </View>
                  )}
                </View>
              </View>

              {allTasksCompleted && <Text style={tw`text-xs text-green-600 font-bold mt-1`}>Complete!</Text>}
            </Pressable>
          </View>

          {/* Enhanced Progress Bar */}
          <View style={tw`mt-4 mb-1`}>
            <View style={tw`h-1.5 bg-gray-100 rounded-full overflow-hidden`}>
              <Animated.View
                entering={FadeIn.duration(500)}
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${taskProgress}%`,
                    backgroundColor: getProgressColor(),
                  },
                ]}
              />
            </View>
          </View>

          {/* Expand Indicator */}
          {totalTasks > 0 && (
            <View style={tw`flex-row items-center justify-center pt-2`}>
              <Text style={tw`text-xs text-gray-400 mr-1`}>{expanded ? 'Hide' : 'Show'} tasks</Text>
              <Animated.View style={chevronStyle}>
                <ChevronDown size={14} color="#9ca3af" strokeWidth={2} />
              </Animated.View>
            </View>
          )}
        </View>

        {/* Expanded Tasks Section */}
        {expanded && habit.tasks && habit.tasks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(200)} style={tw`border-t border-gray-100 bg-gray-50`}>
            <View style={tw`px-4 py-3`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Today's Tasks</Text>
                <View style={tw`px-2 py-0.5 bg-white rounded-full`}>
                  <Text style={tw`text-xs font-medium text-gray-600`}>
                    {completedTasksToday}/{totalTasks}
                  </Text>
                </View>
              </View>

              {habit.tasks.map((taskId, index) => {
                const task = availableTasks.find((t) => t.id === taskId);
                if (!task) return null;

                const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

                return (
                  <Animated.View key={taskId} entering={FadeIn.delay(index * 50)}>
                    <EnhancedTaskItem task={task} isCompleted={isCompleted} onToggle={() => handleTaskToggle(taskId)} />
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

// Enhanced Task Item with better checkbox
const EnhancedTaskItem: React.FC<{
  task: any;
  isCompleted: boolean;
  onToggle: () => void;
}> = ({ task, isCompleted, onToggle }) => {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const checkOpacity = useSharedValue(isCompleted ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(isCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
    checkOpacity.value = withTiming(isCompleted ? 1 : 0, { duration: 200 });
  }, [isCompleted]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkboxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[tw`flex-row items-center p-3 rounded-xl mb-2`, isCompleted ? tw`bg-white border border-green-200` : tw`bg-white/70 border border-gray-200`]}
      >
        {/* Enhanced Checkbox */}
        <View style={tw`relative w-6 h-6 mr-3`}>
          <View style={[tw`absolute inset-0 rounded-md border-2`, isCompleted ? tw`border-green-500 bg-green-500` : tw`border-gray-300 bg-white`]} />

          <Animated.View style={[tw`absolute inset-0 items-center justify-center`, checkboxStyle]}>
            <Check size={16} color="#ffffff" strokeWidth={3} />
          </Animated.View>
        </View>

        {/* Task Info */}
        <View style={tw`flex-1`}>
          <Text style={[tw`text-sm font-semibold`, isCompleted ? tw`text-gray-900` : tw`text-gray-700`]}>{task.name}</Text>
          {task.duration && (
            <View style={tw`flex-row items-center mt-1`}>
              <Timer size={10} color="#9ca3af" strokeWidth={2} />
              <Text style={tw`text-xs text-gray-400 ml-1`}>{task.duration}</Text>
            </View>
          )}
        </View>

        {/* Task Status Indicator */}
        {isCompleted && (
          <View style={tw`ml-2`}>
            <CheckCircle2 size={18} color="#10b981" strokeWidth={2} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
