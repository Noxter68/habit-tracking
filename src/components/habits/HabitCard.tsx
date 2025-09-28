// src/components/habits/HabitCard.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { HabitProgressionService, HabitTier } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';

import { Habit, DailyTaskProgress } from '@/types';

interface HabitCardProps {
  habit: Habit;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask?: (habitId: string, date: string, taskId: string) => void;
  onPress?: () => void;
  index?: number;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onToggleDay, onToggleTask, onPress, index = 0 }) => {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  const completeStateScale = useSharedValue(1);

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
  const isCompleted = todayTasks.allCompleted || (totalTasks === 0 && todayTasks.allCompleted);

  const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const currentTier = tier.name;
  const tierProgressPercent = progress;

  // Get theme for current tier
  const theme = tierThemes[currentTier];

  // Get gem icon based on tier
  const getGemIcon = () => {
    switch (currentTier) {
      case 'Ruby':
        return require('../../../assets/interface/gems/ruby-gem.png');
      case 'Amethyst':
        return require('../../../assets/interface/gems/amethyst-gem.png');
      case 'Crystal':
      default:
        return require('../../../assets/interface/gems/crystal-gem.png');
    }
  };

  const multiplier = tier.multiplier;
  const currentXP = useMemo(() => {
    const baseXP = totalTasks > 0 ? completedTasksCount * 10 : isCompleted ? 20 : 0;
    const streakBonus = habit.currentStreak > 7 ? 10 : habit.currentStreak > 3 ? 5 : 0;
    const totalXP = (baseXP + streakBonus) * multiplier;
    return totalXP;
  }, [completedTasksCount, totalTasks, isCompleted, habit.currentStreak, multiplier]);

  // Animations
  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, []);

  useEffect(() => {
    progressAnimation.value = withTiming(taskProgress, { duration: 300 });
  }, [taskProgress]);

  useEffect(() => {
    if (isCompleted) {
      glowOpacity.value = withSequence(withTiming(1, { duration: 200 }), withTiming(0.3, { duration: 300 }));
      completeStateScale.value = withSequence(withSpring(1.02, { damping: 10 }), withSpring(1, { damping: 15 }));
    } else {
      glowOpacity.value = withTiming(0, { duration: 200 });
      completeStateScale.value = withSpring(1);
    }
  }, [isCompleted]);

  const handlePress = useCallback(() => {
    scale.value = withSequence(withSpring(0.98, { damping: 15 }), withSpring(1, { damping: 15 }));
    onPress?.();
  }, [onPress]);

  const handleToggle = useCallback(() => {
    const date = today;
    if (totalTasks > 0 && !isCompleted) {
      return; // Don't toggle if tasks aren't complete
    }
    onToggleDay(habit.id, date);
  }, [today, habit.id, onToggleDay, totalTasks, isCompleted]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * completeStateScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={animatedCardStyle}>
      <Pressable onPress={handlePress}>
        <ImageBackground source={theme.texture} style={tw`rounded-2xl overflow-hidden`} imageStyle={tw`rounded-2xl opacity-70`} resizeMode="cover">
          <LinearGradient
            colors={[
              theme.gradient[0] + 'e6', // Slightly more opaque
              theme.gradient[1] + 'dd',
              theme.gradient[2] + 'cc',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`p-4`}
          >
            {/* Gem Icon - Absolute Position Top Right */}
            <View style={tw`absolute top-3 right-3 z-10`}>
              <Image source={getGemIcon()} style={tw`w-12 h-12`} resizeMode="contain" />
            </View>

            {/* Header - Title and Building Type */}
            <View style={tw`mb-3 pr-14`}>
              <Text numberOfLines={1} style={tw`text-xl font-bold text-white mb-0.5`}>
                {habit.name}
              </Text>
              <Text style={tw`text-xs text-white/70 font-medium`}>Building</Text>
            </View>

            {/* Streak Info */}
            <View style={tw`mb-3`}>
              <View style={tw`flex-row items-baseline gap-1`}>
                <Text style={tw`text-3xl font-black text-white`}>{habit.currentStreak}</Text>
                <Text style={tw`text-sm text-white/80 font-medium`}>day streak</Text>
              </View>

              {/* XP if earned */}
              {currentXP > 0 && isCompleted && (
                <View style={tw`mt-1`}>
                  <Text style={tw`text-xs text-white/90 font-bold`}>+{currentXP} XP earned</Text>
                </View>
              )}
            </View>

            {/* Tasks Progress (if any) */}
            {totalTasks > 0 && (
              <View style={tw`mb-3`}>
                <View style={tw`flex-row justify-between items-center mb-1.5`}>
                  <Text style={tw`text-xs text-white/90 font-medium`}>Daily Progress</Text>
                  <Text style={tw`text-xs text-white font-bold`}>{Math.round(taskProgress)}%</Text>
                </View>

                <View style={tw`h-1.5 bg-white/20 rounded-full overflow-hidden`}>
                  <Animated.View style={progressBarStyle}>
                    <View style={tw`h-full bg-white/50 rounded-full`} />
                  </Animated.View>
                </View>

                <Text style={tw`text-[10px] text-white/70 mt-1`}>
                  {completedTasksCount} of {totalTasks} tasks completed
                </Text>
              </View>
            )}

            {/* Bottom Row - Tier Info and Completion */}
            <View style={tw`flex-row items-center justify-between`}>
              {/* Tier Progress */}
              <View style={tw`flex-1 mr-3`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                  <Text style={tw`text-[10px] text-white/70 font-medium uppercase tracking-wider`}>{currentTier} Tier</Text>
                  <Text style={tw`text-[10px] text-white/90 font-bold`}>{Math.round(tierProgressPercent)}%</Text>
                </View>
                <View style={tw`h-1 bg-white/20 rounded-full overflow-hidden`}>
                  <View style={[tw`h-full bg-white/40 rounded-full`, { width: `${tierProgressPercent}%` }]} />
                </View>
                {multiplier > 1 && <Text style={tw`text-[10px] text-white/90 font-bold mt-1`}>{multiplier}x XP Multiplier</Text>}
              </View>
            </View>

            {/* Glow Effect for completed state */}
            {isCompleted && (
              <Animated.View style={[tw`absolute inset-0 rounded-2xl`, glowStyle]} pointerEvents="none">
                <LinearGradient colors={['rgba(255,255,255,0.15)', 'transparent']} style={tw`w-full h-full rounded-2xl`} />
              </Animated.View>
            )}
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

export default HabitCard;
