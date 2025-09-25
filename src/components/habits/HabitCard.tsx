// src/components/habits/HabitCard.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming, interpolate } from 'react-native-reanimated';
import { CheckCircle2, Circle, Sparkles, Trophy, Star } from 'lucide-react-native';
import tw from '@/lib/tailwind';

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

  // Calculate current XP
  const currentXP = useMemo(() => {
    const baseXP = totalTasks > 0 ? completedTasksCount * 10 : isCompleted ? 20 : 0;
    const streakBonus = habit.currentStreak > 7 ? Math.floor(habit.currentStreak / 7) * 5 : 0;
    return baseXP + streakBonus;
  }, [completedTasksCount, totalTasks, isCompleted, habit.currentStreak]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const progressBarWidth = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
  }));

  const completeStateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completeStateScale.value }],
    opacity: interpolate(completeStateScale.value, [0.8, 1], [0.5, 1]),
  }));

  // Animate on completion state changes
  useEffect(() => {
    if (allTasksCompleted || isCompleted) {
      completeStateScale.value = withSequence(withTiming(1.1, { duration: 200 }), withSpring(1, { damping: 15, stiffness: 250 }));
    }
  }, [allTasksCompleted, isCompleted]); // Only state dependencies

  // Animate XP display
  React.useEffect(() => {
    if (currentXP > 0) {
      xpOpacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 500 }));
    }
  }, [currentXP]);

  useEffect(() => {
    const targetProgress = totalTasks === 0 && todayTasks.allCompleted ? 100 : taskProgress;

    progressAnimation.value = withSpring(targetProgress, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  }, [taskProgress, todayTasks.allCompleted, totalTasks]); // Minimal deps

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 250 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  }, []);

  const handleToggle = useCallback(
    (e: any) => {
      e.stopPropagation();
      buttonScale.value = withSequence(withTiming(0.9, { duration: 100 }), withSpring(1, { damping: 15, stiffness: 250 }));

      onToggleDay(habit.id, today);

      if (!todayTasks.allCompleted && (allTasksCompleted || totalTasks === 0)) {
        glowOpacity.value = withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 1200 }));
      }
    },
    [habit.id, today, todayTasks.allCompleted, allTasksCompleted, totalTasks, onToggleDay]
  );

  return (
    <Animated.View entering={FadeIn.delay(index * 80).springify()} style={[containerStyle, tw`mb-4`]}>
      {/* Glow effect for completion */}
      <Animated.View style={[tw`absolute inset-0 rounded-3xl`, glowStyle]} pointerEvents="none">
        <LinearGradient colors={['rgba(251, 191, 36, 0.3)', 'rgba(245, 158, 11, 0.2)', 'transparent']} style={tw`w-full h-full rounded-3xl`} />
      </Animated.View>

      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LinearGradient
          colors={
            isCompleted ? ['rgba(254, 243, 199, 0.4)', 'rgba(253, 230, 138, 0.3)', 'rgba(252, 211, 77, 0.2)'] : ['rgba(251, 191, 36, 0.08)', 'rgba(245, 158, 11, 0.04)', 'rgba(251, 191, 36, 0.02)']
          }
          style={[
            tw`rounded-3xl overflow-hidden border`,
            isCompleted ? tw`border-amber-300/40` : tw`border-amber-200/20`,
            {
              shadowColor: isCompleted ? '#d97706' : '#f59e0b',
              shadowOffset: { width: 0, height: isCompleted ? 6 : 3 },
              shadowOpacity: isCompleted ? 0.12 : 0.08,
              shadowRadius: isCompleted ? 14 : 10,
              elevation: isCompleted ? 8 : 4,
            },
          ]}
        >
          <View style={tw`p-5`}>
            {/* Header Row */}
            <View style={tw`flex-row items-start justify-between mb-3`}>
              {/* Habit Info */}
              <View style={tw`flex-1 mr-3`}>
                <View style={tw`flex-row items-center gap-2 mb-1`}>
                  <Text style={tw`text-base font-bold text-gray-900`}>{habit.name}</Text>
                  {allTasksCompleted && totalTasks > 0 && (
                    <Animated.View style={completeStateStyle}>
                      <View style={tw`bg-gradient-to-r from-amber-100 to-amber-200 px-2 py-1 rounded-lg`}>
                        <Text style={tw`text-[10px] font-black text-amber-800 uppercase`}>All Done!</Text>
                      </View>
                    </Animated.View>
                  )}
                </View>
                <View style={tw`flex-row items-center gap-2`}>
                  <View style={tw`flex-row items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg`}>
                    {CategoryIcon && <CategoryIcon size={13} color="#d97706" />}
                    <Text style={tw`text-xs text-amber-700 font-semibold`}>{habit.category}</Text>
                  </View>
                  {currentXP > 0 && (
                    <Animated.View style={[tw`flex-row items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg`, xpAnimatedStyle]}>
                      <Sparkles size={12} color="#d97706" />
                      <Text style={tw`text-xs font-bold text-amber-700`}>+{currentXP} XP</Text>
                    </Animated.View>
                  )}
                </View>
              </View>

              {/* Streak Counter */}
              <StreakCounter streak={habit.currentStreak} isActive={habit.currentStreak > 0} size="small" />
            </View>

            {/* Task Progress Section - Show special state when all complete */}
            <View style={tw`mb-3`}>
              {allTasksCompleted ? (
                <Animated.View style={completeStateStyle}>
                  <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} style={tw`rounded-2xl p-3`}>
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center gap-2`}>
                        <Trophy size={20} color="#ffffff" strokeWidth={2.5} />
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
                    <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden`}>
                      <Animated.View style={progressBarWidth}>
                        <LinearGradient
                          colors={progressAnimation.value >= 75 ? ['#f59e0b', '#d97706'] : progressAnimation.value >= 50 ? ['#fbbf24', '#f59e0b'] : ['#fde68a', '#fcd34d']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={tw`h-full`}
                        />
                      </Animated.View>
                    </View>
                    <View style={tw`flex-row justify-between mt-1.5`}>
                      <Text style={tw`text-[10px] text-gray-500`}>
                        {completedTasksCount}/{totalTasks} tasks
                      </Text>
                      <Text style={tw`text-[10px] font-bold text-amber-700`}>{Math.round(taskProgress)}%</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Action Row */}
            <View style={tw`flex-row items-center justify-between`}>
              {/* Mini Stats */}
              <View style={tw`flex-row gap-2`}>
                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`px-3 py-2 rounded-xl border border-amber-200/20`}>
                  <Text style={tw`text-xs text-gray-500`}>Best</Text>
                  <Text style={tw`text-sm font-bold text-gray-800`}>{habit.bestStreak}d</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`px-3 py-2 rounded-xl border border-amber-200/20`}>
                  <Text style={tw`text-xs text-gray-500`}>Total</Text>
                  <Text style={tw`text-sm font-bold text-gray-800`}>{habit.completedDays.length}d</Text>
                </LinearGradient>
              </View>

              {/* Complete Button */}
              <Pressable onPress={handleToggle} style={({ pressed }) => [pressed && tw`scale-95`]}>
                <Animated.View style={buttonAnimatedStyle}>
                  <LinearGradient
                    colors={isCompleted ? ['#f59e0b', '#d97706', '#b45309'] : ['rgba(251, 191, 36, 0.15)', 'rgba(245, 158, 11, 0.1)']}
                    style={tw`px-4 py-3 rounded-2xl flex-row items-center gap-2 border ${isCompleted ? 'border-amber-600/30' : 'border-amber-300/30'}`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={20} color="#ffffff" strokeWidth={2.5} />
                        <Text style={tw`text-sm font-bold text-white`}>Completed</Text>
                      </>
                    ) : (
                      <>
                        <Circle size={20} color="#d97706" strokeWidth={2} />
                        <Text style={tw`text-sm font-bold text-amber-800`}>{totalTasks > 0 ? 'Mark Done' : 'Complete'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </Animated.View>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
