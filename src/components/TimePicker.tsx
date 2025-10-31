// src/components/TimePicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Platform, Animated, PanResponder, Dimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

interface TimePickerProps {
  initialHour?: number;
  initialMinute?: number;
  onConfirm: (hour: number, minute: number) => void;
  onCancel: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

const TimePicker: React.FC<TimePickerProps> = ({ initialHour = 9, initialMinute = 0, onConfirm, onCancel }) => {
  // Create initial date with the provided time
  const getInitialDate = () => {
    const date = new Date();
    date.setHours(initialHour);
    date.setMinutes(initialMinute);
    date.setSeconds(0);
    return date;
  };

  const [selectedTime, setSelectedTime] = useState(getInitialDate());
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        dragY.setOffset(dragY._value);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        dragY.flattenOffset();

        if (gestureState.dy > SWIPE_THRESHOLD || gestureState.vy > SWIPE_VELOCITY_THRESHOLD) {
          handleCancel();
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 200,
            friction: 20,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const handleConfirm = () => {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();

    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onConfirm(hours, minutes);
      });
    });
  };

  const handleCancel = () => {
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onCancel();
      });
    });
  };

  const onChange = (event: any, date?: Date) => {
    if (date) {
      setSelectedTime(date);
    }
    if (Platform.OS === 'android') {
      if (event.type === 'set') {
        handleConfirm();
      } else if (event.type === 'dismiss') {
        handleCancel();
      }
    }
  };

  const formatDisplayTime = () => {
    const hours = selectedTime.getHours();
    const minutes = selectedTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const modalTransform = Animated.add(slideAnim, dragY);

  if (Platform.OS === 'android') {
    return <DateTimePicker value={selectedTime} mode="time" display="default" onChange={onChange} is24Hour={false} />;
  }

  // iOS - Direct render without Modal wrapper for better performance
  return (
    <View style={[tw`absolute inset-0`, { zIndex: 1000 }]}>
      {/* Animated overlay */}
      <Animated.View
        style={[
          tw`absolute inset-0`,
          {
            backgroundColor: 'black',
            opacity: Animated.multiply(fadeAnim, 0.5),
          },
        ]}
      >
        <Pressable style={tw`flex-1`} onPress={handleCancel} />
      </Animated.View>

      {/* Animated modal */}
      <Animated.View
        style={[
          tw`absolute bottom-0 left-0 right-0`,
          {
            transform: [{ translateY: modalTransform }],
          },
        ]}
      >
        <View style={tw`bg-white rounded-t-3xl shadow-2xl`}>
          {/* Swipeable header area */}
          <View {...panResponder.panHandlers}>
            {/* Handle */}
            <View style={tw`items-center pt-3 pb-2`}>
              <View style={tw`h-1 w-12 bg-stone-200 rounded-full`} />
            </View>

            {/* Header */}
            <View style={tw`flex-row items-center justify-between px-6 py-4`}>
              <Pressable onPress={handleCancel} style={({ pressed }) => [tw`px-4 py-2 -ml-4`, pressed && tw`opacity-50`]}>
                <Text style={tw`text-base text-stone-500`}>Cancel</Text>
              </Pressable>

              <Text style={tw`text-lg font-semibold text-stone-800`}>Select Time</Text>

              <Pressable onPress={handleConfirm} style={({ pressed }) => [pressed && tw`opacity-80`]}>
                <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-5 py-2 rounded-full`}>
                  <Text style={tw`text-white font-semibold`}>Done</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>

          {/* Display Time with Cyan gradient background */}
          <View style={tw`mx-6 mb-4 overflow-hidden rounded-2xl`}>
            <LinearGradient colors={['#06b6d4', '#0891b2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-4`}>
              <Text style={tw`text-center text-3xl font-bold text-white`}>{formatDisplayTime()}</Text>
            </LinearGradient>
          </View>

          {/* iOS Picker */}
          <View style={tw`px-6 pb-6`}>
            <View style={tw`bg-stone-50 rounded-2xl p-2`}>
              <DateTimePicker value={selectedTime} mode="time" display="spinner" onChange={onChange} style={{ height: 200 }} textColor="#57534e" locale="en" />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default TimePicker;
