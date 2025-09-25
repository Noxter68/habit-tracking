// src/components/HabitCard.tsx
import React, { useCallback, useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Circle, Flame, Trophy, Star, Sparkles, TrendingUp, Target, ChevronRight, Zap } from 'lucide-react-native';
import { Habit, DailyTaskProgress } from '@/types';
import { getCategoryIcon } from '@/utils/categoryIcons';
import tw from '@/lib/tailwind';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onPress: () => void;
  index?: number;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onPress, index = 0 }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const cardElevation = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const progressAnimation = useSharedValue(0);
  const xpOpacity = useSharedValue(0);

  const today = new Date().toISOString().split('T')[0];
  const todayTasks: DailyTaskProgress = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };

  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const allTasksCompleted = completedTasksToday === totalTasks && totalTasks > 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;

  const categoryData = getCategoryIcon(habit.category, habit.type);
  const CategoryIcon = categoryData.icon;

  // Calculate XP
  const calculateXP = useCallback((): number => {
    let xp = 0;
    if (allTasksCompleted || todayTasks.allCompleted) xp += 50;
    else xp += Math.floor((completedTasksToday / Math.max(totalTasks, 1)) * 30);
    if (habit.currentStreak >= 7) xp += 20;
    if (habit.currentStreak >= 30) xp += 30;
    return xp;
  }, [allTasksCompleted, completedTasksToday, totalTasks, habit.currentStreak, todayTasks.allCompleted]);

  const currentXP = useMemo(() => calculateXP(), [calculateXP]);

  // Get tier colors based on streak
  const getStreakTier = useCallback(() => {
    if (habit.currentStreak >= 100) return { gradient: ['#78350f', '#451a03'], label: 'Legendary', icon: '👑' };
    if (habit.currentStreak >= 50) return { gradient: ['#92400e', '#78350f'], label: 'Master', icon: '🏆' };
    if (habit.currentStreak >= 30) return { gradient: ['#b45309', '#92400e'], label: 'Expert', icon: '⭐' };
    if (habit.currentStreak >= 14) return { gradient: ['#d97706', '#b45309'], label: 'Adept', icon: '🔥' };
    if (habit.currentStreak >= 7) return { gradient: ['#f59e0b', '#d97706'], label: 'Novice', icon: '✨' };
    if (habit.currentStreak >= 3) return { gradient: ['#fbbf24', '#f59e0b'], label: 'Beginner', icon: '🌱' };
    return { gradient: ['#fcd34d', '#fbbf24'], label: 'Starting', icon: '🌟' };
  }, [habit.currentStreak]);

  const streakTier = useMemo(() => getStreakTier(), [getStreakTier]);

  // Enhanced animation styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: interpolate(cardElevation.value, [0, 1], [0, -2]) }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [
      {
        scale: interpolate(glowOpacity.value, [0, 1], [0.95, 1.05], Extrapolate.CLAMP),
      },
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progressAnimation.value, 5)}%`,
  }));

  const xpAnimatedStyle = useAnimatedStyle(() => ({
    opacity: xpOpacity.value,
    transform: [
      {
        translateY: interpolate(xpOpacity.value, [0, 1], [10, 0], Extrapolate.CLAMP),
      },
    ],
  }));

  // Initialize animations
  React.useEffect(() => {
    cardElevation.value = withSpring(allTasksCompleted || todayTasks.allCompleted ? 1 : 0);

    // Animate progress bar smoothly
    progressAnimation.value = withSpring(totalTasks === 0 && todayTasks.allCompleted ? 100 : taskProgress, {
      damping: 20,
      stiffness: 90,
      mass: 1,
    });
  }, [allTasksCompleted, todayTasks.allCompleted, taskProgress, totalTasks]);

  // Animate XP display when XP changes
  React.useEffect(() => {
    if (currentXP > 0) {
      xpOpacity.value = withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 500 }));
    }
  }, [currentXP]);

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

  const isCompleted = todayTasks.allCompleted || (totalTasks === 0 && todayTasks.allCompleted);

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
              elevation: isCompleted ? 6 : 3,
            },
          ]}
        >
          {/* Main Content */}
          <View style={tw`p-5`}>
            {/* Header Section */}
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center flex-1`}>
                {/* Category Icon with gradient background */}
                <LinearGradient colors={['rgba(251, 191, 36, 0.15)', 'rgba(245, 158, 11, 0.08)']} style={tw`w-12 h-12 rounded-2xl items-center justify-center mr-3.5 border border-amber-200/30`}>
                  {CategoryIcon && <CategoryIcon size={24} color={categoryData.color || '#d97706'} strokeWidth={2} />}
                </LinearGradient>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-bold text-gray-900`} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <View style={tw`flex-row items-center gap-2 mt-1`}>
                    <Text style={tw`text-xs text-gray-600 font-medium`}>{habit.category}</Text>
                    <View style={tw`w-1 h-1 bg-gray-400 rounded-full`} />
                    <Text style={tw`text-xs text-gray-600 font-medium`}>{habit.type === 'good' ? 'Build' : 'Break'}</Text>
                  </View>
                </View>

                {/* Navigate Arrow */}
                <ChevronRight size={20} color="#d1d5db" strokeWidth={2} style={tw`ml-2`} />
              </View>
            </View>

            {/* Streak & XP Section */}
            {(habit.currentStreak > 0 || currentXP > 0) && (
              <View style={tw`flex-row items-center gap-2 mb-3`}>
                {habit.currentStreak > 0 && (
                  <LinearGradient colors={streakTier.gradient} style={tw`px-3 py-1.5 rounded-xl flex-row items-center gap-1.5`}>
                    <Flame size={14} color="#ffffff" />
                    <Text style={tw`text-xs font-bold text-white`}>{habit.currentStreak} day streak</Text>
                  </LinearGradient>
                )}

                {currentXP > 0 && (
                  <Animated.View style={xpAnimatedStyle}>
                    <View style={tw`bg-amber-50/50 border border-amber-200/30 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5`}>
                      <Sparkles size={12} color="#d97706" />
                      <Text style={tw`text-xs font-bold text-amber-800`}>+{currentXP} XP today</Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            )}

            {/* Progress Section - Refined */}
            <View style={tw`mb-4`}>
              <View style={tw`flex-row items-center justify-between mb-2`}>
                <View style={tw`flex-row items-center gap-1.5`}>
                  <Target size={12} color="#9ca3af" />
                  <Text style={tw`text-xs font-medium text-gray-600`}>Daily Progress</Text>
                </View>
                <Text style={tw`text-xs font-bold text-amber-700`}>
                  {completedTasksToday}/{totalTasks || 1}
                </Text>
              </View>

              {/* Refined Progress Bar */}
              <View style={tw`flex-row items-center gap-2`}>
                <View style={tw`flex-1 h-2 bg-gray-100/80 rounded-full overflow-hidden`}>
                  <Animated.View style={[tw`h-full`, progressBarStyle]}>
                    <LinearGradient
                      colors={
                        progressAnimation.value === 100 || (totalTasks === 0 && isCompleted) ? ['#f59e0b', '#d97706'] : progressAnimation.value >= 50 ? ['#fbbf24', '#f59e0b'] : ['#fde68a', '#fcd34d']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={tw`h-full`}
                    />
                  </Animated.View>
                </View>
                <Animated.Text style={[tw`text-xs font-bold text-amber-700 min-w-[35px] text-right`, xpAnimatedStyle]}>
                  {totalTasks === 0 && isCompleted ? '100' : Math.round(taskProgress)}%
                </Animated.Text>
              </View>
            </View>

            {/* Action Row with Stats and Complete Button */}
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

              {/* Enhanced Complete Button */}
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

            {/* Achievement Indicators */}
            {(habit.currentStreak >= 7 || (taskProgress === 100 && totalTasks > 0)) && (
              <View style={tw`flex-row items-center gap-2 mt-3 pt-3 border-t border-amber-100/30`}>
                {habit.currentStreak >= 7 && (
                  <View style={tw`flex-row items-center gap-1`}>
                    <Star size={12} color="#d97706" fill="#d97706" />
                    <Text style={tw`text-xs font-semibold text-amber-700`}>Week Warrior</Text>
                  </View>
                )}
                {habit.currentStreak >= 30 && (
                  <View style={tw`flex-row items-center gap-1`}>
                    <Trophy size={12} color="#92400e" fill="#92400e" />
                    <Text style={tw`text-xs font-semibold text-amber-800`}>Monthly Master</Text>
                  </View>
                )}
                {taskProgress === 100 && totalTasks > 0 && (
                  <View style={tw`flex-row items-center gap-1`}>
                    <Zap size={12} color="#d97706" />
                    <Text style={tw`text-xs font-semibold text-amber-700`}>All Tasks Done!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
