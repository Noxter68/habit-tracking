// src/components/SwipeableHabitCard.tsx
import React, { useRef } from 'react';
import { View, Text, Pressable, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import tw from '../lib/tailwind';
import HabitCard from './HabitCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

interface SwipeableHabitCardProps {
  habit: any;
  onDelete: (habitId: string) => void;
  onToggleDay: (habitId: string) => void;
  onToggleTask: (habitId: string, taskId: string) => void;
  onPress: () => void;
}

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({ habit, onDelete, onToggleDay, onToggleTask, onPress }) => {
  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleGestureEvent = RNAnimated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true });

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;

      if (translationX < SWIPE_THRESHOLD) {
        // Confirm deletion
        Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
          {
            text: 'Cancel',
            onPress: () => {
              RNAnimated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            },
            style: 'cancel',
          },
          {
            text: 'Delete',
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
        // Snap back
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={tw`relative`}>
      {/* Delete Background */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 bg-red-500 rounded-2xl flex-row items-center justify-end pr-6`,
          {
            opacity: deleteOpacity,
          },
        ]}
      >
        <Icon name="trash-2" size={24} color="white" />
      </RNAnimated.View>

      {/* Swipeable Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]}>
        <RNAnimated.View
          style={{
            transform: [{ translateX }],
          }}
        >
          <HabitCard habit={habit} onToggleDay={onToggleDay} onToggleTask={onToggleTask} onPress={onPress} />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableHabitCard;
