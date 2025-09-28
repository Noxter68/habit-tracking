// src/components/habits/HabitCard.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming, interpolate } from 'react-native-reanimated';
import { CheckCircle2, Circle, Sparkles, Trophy } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { ColorValue } from 'react-native';
import { TierInfo, HabitProgressionService, HabitTier } from '@/services/habitProgressionService';

import { Habit, DailyTaskProgress } from '@/types';
import { getCategoryIcon } from '@/utils/categoryIcons';
import StreakCounter from '../StreakCounter';

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask?: (habitId: string, date: string, taskId: string) => void;
  onPress?: () => void;
  index?: number;
}

// Type-safe tier names
export type TierName = HabitTier;

// Quartz-themed achievement gradients
const achievementGradients: Record<HabitTier, readonly [ColorValue, ColorValue, ColorValue]> = {
  Crystal: ['#E5E7EB', '#D1D5DB', '#9CA3AF'], // Light grays
  Ruby: ['#9CA3AF', '#6B7280', '#4B5563'], // Medium grays
  Amethyst: ['#6B7280', '#4B5563', '#374151'], // Dark grays
};

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onToggleTask, onPress, index = 0 }) => {
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  const xpOpacity = useSharedValue(1);
  const completeStateScale = useSharedValue(1);

  const categoryData = getCategoryIcon(habit.category, habit.type);
  const CategoryIcon = categoryData.icon;

  // Get today's progress
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTasks: DailyTaskProgress = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };

  // Task progress calculations
  const completedTasksCount = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;
  const allTasksCompleted = totalTasks > 0 && completedTasksCount === totalTasks;
  const isCompleted = todayTasks.allCompleted || (totalTasks === 0 && todayTasks.allCompleted);

  const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const currentTier = tier.name;
  const tierProgressPercent = progress;

  const multiplier = tier.multiplier;
  const currentXP = useMemo(() => {
    const baseXP = totalTasks > 0 ? completedTasksCount * 10 : isCompleted ? 20 : 0;
    const streakBonus = habit.currentStreak > 7 ? 10 : habit.currentStreak > 3 ? 5 : 0;
    const totalXP = (baseXP + streakBonus) * multiplier;
    return Math.round(totalXP);
  }, [completedTasksCount, totalTasks, isCompleted, habit.currentStreak, multiplier]);

  // Animations
  useEffect(() => {
    progressAnimation.value = withSpring(taskProgress, { damping: 15 });
  }, [taskProgress]);

  useEffect(() => {
    if (allTasksCompleted) {
      completeStateScale.value = withSequence(withTiming(0.95, { duration: 100 }), withSpring(1, { damping: 8, stiffness: 200 }));
    }
  }, [allTasksCompleted]);

  const handleToggle = useCallback(async () => {
    buttonScale.value = withSequence(withTiming(0.9, { duration: 50 }), withSpring(1, { damping: 8, stiffness: 200 }));

    await onToggleDay(habit.id, today);

    if (isCompleted && currentXP > 0) {
      xpOpacity.value = withSequence(withTiming(0.5, { duration: 200 }), withTiming(1, { duration: 200 }));
    }
  }, [habit.id, today, isCompleted, currentXP, onToggleDay]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressBarWidth = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  const xpBadgeStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [{ scale: interpolate(xpOpacity.value, [0.5, 1], [1.1, 1]) }],
  }));

  const completeStateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeStateScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 50).springify()} style={[cardStyle]}>
      <Pressable onPress={onPress}>
        {/* Card Container with Quartz gradient */}
        <LinearGradient
          colors={isCompleted ? achievementGradients[currentTier] : ['#ffffff', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={tw`rounded-3xl p-4 border ${isCompleted ? 'border-quartz-400' : 'border-quartz-200'}`}
        >
          {/* Header Row */}
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center gap-3 flex-1`}>
              {/* Category Icon */}
              <View style={tw`w-12 h-12 bg-white bg-opacity-50 rounded-2xl items-center justify-center`}>
                <CategoryIcon size={24} color={isCompleted ? '#4B5563' : '#6B7280'} />
              </View>

              {/* Habit Info */}
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-bold ${isCompleted ? 'text-white' : 'text-quartz-700'}`}>{habit.name}</Text>
                <View style={tw`flex-row items-center gap-2 mt-0.5`}>
                  <StreakCounter streak={habit.currentStreak} compact lightMode={isCompleted} />
                  {currentXP > 0 && (
                    <Animated.View style={xpBadgeStyle}>
                      <View style={tw`bg-white bg-opacity-25 px-2 py-0.5 rounded-full`}>
                        <Text style={tw`text-xs font-bold text-white`}>+{currentXP} XP</Text>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>

            {/* Complete Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <Pressable onPress={handleToggle}>
                <View style={tw`p-1`}>{isCompleted ? <CheckCircle2 size={28} color="#ffffff" strokeWidth={2.5} /> : <Circle size={28} color="#9CA3AF" strokeWidth={2} />}</View>
              </Pressable>
            </Animated.View>
          </View>

          {/* Progress Section */}
          <View>
            {totalTasks > 0 &&
              (allTasksCompleted ? (
                <Animated.View style={completeStateStyle}>
                  <LinearGradient colors={['#6B7280', '#4B5563', '#374151']} style={tw`rounded-2xl p-3`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <View>
                          <Text style={tw`text-sm font-black text-white`}>Perfect Day!</Text>
                          <Text style={tw`text-[10px] text-white/80`}>All {totalTasks} tasks completed</Text>
                        </View>
                      </View>
                      <View style={tw`bg-white/20 px-3 py-1.5 rounded-xl`}>
                        <Text style={tw`text-sm font-bold text-white`}>100%</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>
              ) : (
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`h-3 bg-white/30 rounded-full overflow-hidden`}>
                      <Animated.View style={progressBarWidth}>
                        <LinearGradient
                          colors={progressAnimation.value >= 75 ? ['#4B5563', '#374151'] : progressAnimation.value >= 50 ? ['#6B7280', '#4B5563'] : ['#9CA3AF', '#6B7280']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={tw`h-full`}
                        />
                      </Animated.View>
                    </View>
                    <View style={tw`flex-row justify-between mt-1.5`}>
                      <Text style={tw`text-[10px] text-quartz-500`}>
                        {completedTasksCount}/{totalTasks} tasks
                      </Text>
                      <Text style={tw`text-[10px] font-bold text-quartz-600`}>{Math.round(taskProgress)}%</Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>

          {/* Gamified Stats Row */}
          <View style={tw`flex-row items-center justify-between mt-3`}>
            <View style={tw`flex-row gap-2`}>
              {/* Tier Badge */}
              <LinearGradient colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']} style={tw`px-3 py-2 rounded-xl border border-white/20`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <View>
                    <Text style={tw`text-[10px] text-quartz-600 font-medium`}>Tier</Text>
                    <Text style={tw`text-xs font-bold ${habit.currentStreak > 7 ? 'text-quartz-700' : 'text-quartz-500'}`}>{currentTier}</Text>
                  </View>
                  <Trophy size={16} color={habit.currentStreak > 7 ? '#4B5563' : '#9CA3AF'} />
                </View>
              </LinearGradient>

              {/* XP Multiplier if active */}
              {multiplier > 1 && (
                <View style={tw`bg-quartz-100 px-3 py-2 rounded-xl border border-quartz-200`}>
                  <View style={tw`flex-row items-center gap-1`}>
                    <Sparkles size={14} color="#6B7280" />
                    <Text style={tw`text-xs font-bold text-quartz-600`}>{multiplier}x XP</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Tier Progress */}
            <View style={tw`flex-row items-center gap-2`}>
              <View style={tw`w-16 h-1.5 bg-quartz-100 rounded-full overflow-hidden`}>
                <View style={[tw`h-full bg-quartz-400 rounded-full`, { width: `${tierProgressPercent}%` }]} />
              </View>
              <Text style={tw`text-[10px] text-quartz-500 font-medium`}>{Math.round(tierProgressPercent)}%</Text>
            </View>
          </View>

          {/* Glow Effect for completed state */}
          {isCompleted && (
            <Animated.View style={[tw`absolute inset-0 rounded-3xl`, glowStyle]} pointerEvents="none">
              <LinearGradient colors={['rgba(107, 114, 128, 0.1)', 'transparent']} style={tw`w-full h-full rounded-3xl`} />
            </Animated.View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
