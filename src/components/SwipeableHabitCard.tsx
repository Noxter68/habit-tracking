// src/components/SwipeableHabitCard.tsx
// ✅ WITH HAPTIC FEEDBACK

import React, { useRef } from 'react';
import { View, Text, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

import { Habit } from '../types';
import HabitCard from './habits/HabitCard';
import { HapticFeedback } from '@/utils/haptics'; // ✅ Import

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

interface SwipeableHabitCardProps {
  habit: Habit;
  onDelete: (habitId: string) => void;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask?: (habitId: string, date: string, taskId: string) => void;
  onPress?: () => void;
  index?: number;
}

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({ habit, onDelete, onToggleDay, onToggleTask, onPress, index = 0 }) => {
  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleGestureEvent = RNAnimated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true });

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX < SWIPE_THRESHOLD) {
        // ✅ Medium haptic for delete action
        HapticFeedback.medium();

        // Show delete confirmation with gamified messaging
        Alert.alert(
          '⚠️ Remove Habit',
          `Are you sure you want to stop tracking "${habit.name}"?\n\nYou'll lose:\n• ${habit.currentStreak} day streak\n• Progress towards achievements`,
          [
            {
              text: 'Keep Habit',
              onPress: () => {
                HapticFeedback.light(); // ✅ Light haptic for cancel
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
              text: 'Remove',
              onPress: () => {
                HapticFeedback.medium(); // ✅ Medium haptic for confirmation
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
        // Snap back - no haptic needed (natural action)
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

  // ✅ Create wrapped onPress with haptic
  const handlePress = onPress
    ? () => {
        HapticFeedback.light();
        onPress();
      }
    : undefined;

  return (
    <View style={tw`relative`}>
      {/* Delete Background */}
      <RNAnimated.View style={[tw`absolute inset-0 justify-center items-end pr-6 rounded-2xl overflow-hidden`, { opacity: deleteOpacity }]}>
        <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
        <View style={tw`bg-sand/20 rounded-xl p-3`}>
          <Trash2 size={24} color="#ffffff" />
        </View>
      </RNAnimated.View>

      {/* Swipeable Habit Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]} failOffsetY={[-5, 5]}>
        <RNAnimated.View style={[{ transform: [{ translateX }] }, tw`bg-sand rounded-2xl`]}>
          <HabitCard
            habit={habit}
            onToggleDay={onToggleDay}
            onToggleTask={onToggleTask}
            onPress={handlePress} // ✅ With haptic
            index={index}
          />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableHabitCard;
