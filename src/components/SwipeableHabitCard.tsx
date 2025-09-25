// src/components/SwipeableHabitCard.tsx
import React, { useRef } from 'react';
import { View, Text, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

import { Habit } from '../types';
import HabitCard from './habits/HabitCard';

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
        // Show delete confirmation with gamified messaging
        Alert.alert('⚠️ Remove Habit', `Are you sure you want to stop tracking "${habit.name}"?\n\nYou'll lose:\n• ${habit.currentStreak} day streak\n• Progress towards achievements`, [
          {
            text: 'Keep Habit',
            onPress: () => {
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
        ]);
      } else {
        // Snap back with spring animation
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
    inputRange: [-SCREEN_WIDTH * 0.3, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const deleteScale = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.3, 0],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  return (
    <View style={tw`relative mb-3`}>
      {/* Delete Background with Gradient */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 rounded-2xl overflow-hidden`,
          {
            opacity: deleteOpacity,
            transform: [{ scale: deleteScale }],
          },
        ]}
      >
        <LinearGradient colors={['#ef4444', '#dc2626', '#b91c1c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1 flex-row items-center justify-end pr-6`}>
          <View style={tw`items-center`}>
            <View style={tw`w-12 h-12 bg-white/20 rounded-xl items-center justify-center mb-1`}>
              <Trash2 size={24} color="#ffffff" strokeWidth={2.5} />
            </View>
            <Text style={tw`text-xs font-bold text-white`}>Delete</Text>
          </View>
        </LinearGradient>
      </RNAnimated.View>

      {/* Swipeable Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]} failOffsetY={[-5, 5]} shouldCancelWhenOutside={true}>
        <RNAnimated.View
          style={{
            transform: [{ translateX }],
          }}
        >
          <HabitCard habit={habit} onToggleDay={onToggleDay} onToggleTask={onToggleTask} onPress={onPress} index={index} />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableHabitCard;
