// src/components/SwipeableHabitCard.tsx
import React, { useRef } from 'react';
import { View, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw from '../lib/tailwind';

import { Habit } from '../types';
import { HapticFeedback } from '@/utils/haptics';
import { getTodayString } from '@/utils/dateHelpers';
import { HabitCard } from './habits/HabitCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

interface SwipeableHabitCardProps {
  habit: Habit;
  onDelete: (habitId: string) => void;
  onToggleDay?: (habitId: string, date: string) => void;
  onToggleTask?: (habitId: string, date: string, taskId: string) => void;
  onPress?: () => void;
  index?: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
}

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({ habit, onDelete, onToggleDay, onToggleTask, onPress, index = 0, pausedTasks = {} }) => {
  const { t } = useTranslation();
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const today = getTodayString();
  const todayTasks = habit.dailyTasks?.[today];
  const completedToday = todayTasks?.allCompleted || false;

  const handleGestureEvent = RNAnimated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true });

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: translation } = event.nativeEvent;

      if (translation < SWIPE_THRESHOLD) {
        HapticFeedback.medium();

        // Détermine le type de streak (day/week)
        const streakUnit = habit.frequency === 'weekly' ? 'week' : 'day';

        Alert.alert(
          t('dashboard.removeHabit'),
          t('dashboard.removeHabitConfirm', {
            name: habit.name,
            streak: habit.currentStreak,
          }),
          [
            {
              text: t('habits.keepHabit'),
              onPress: () => {
                HapticFeedback.light();
                RNAnimated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 40,
                  friction: 8,
                }).start();
              },
              style: 'cancel',
            },
            {
              text: t('common.delete'),
              onPress: () => {
                HapticFeedback.medium();
                RNAnimated.timing(translateX, {
                  toValue: -SCREEN_WIDTH,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  onDelete(habit.id);
                });
              },
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
      } else {
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      }
    }
  };

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handlePress = onPress
    ? () => {
        HapticFeedback.light();
        onPress();
      }
    : undefined;

  return (
    <View style={tw`relative`}>
      {/* Delete Background */}
      <RNAnimated.View style={[tw`absolute inset-0 justify-center items-end pr-6 rounded-3xl overflow-hidden`, { opacity: deleteOpacity }]}>
        <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
        <View style={tw`bg-white/20 rounded-xl p-3`}>
          <Trash2 size={24} color="#ffffff" />
        </View>
      </RNAnimated.View>

      {/* Swipeable Habit Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]} failOffsetY={[-5, 5]}>
        <RNAnimated.View style={[{ transform: [{ translateX }] }, tw`bg-transparent rounded-3xl`]}>
          <HabitCard habit={habit} completedToday={completedToday} onPress={handlePress} index={index} pausedTasks={pausedTasks} />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableHabitCard;
