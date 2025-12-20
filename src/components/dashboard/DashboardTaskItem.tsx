/**
 * DashboardTaskItem.tsx
 *
 * Composant de tâche compact pour le Dashboard.
 * Réutilise les animations 3D style Duolingo de TaskCheckItem.
 */

import React, { useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Circle, PauseCircle } from 'lucide-react-native';
import tw from '@/lib/tailwind';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Task {
  id: string;
  name: string;
  description?: string;
  duration?: string;
}

interface DashboardTaskItemProps {
  task: Task;
  isCompleted: boolean;
  isPaused?: boolean;
  pausedUntil?: string;
  onPress: () => void;
  disabled?: boolean;
  tierAccent: string;
  isWeekLocked?: boolean;
}

export const DashboardTaskItem: React.FC<DashboardTaskItemProps> = ({
  task,
  isCompleted,
  isPaused = false,
  onPress,
  disabled = false,
  tierAccent,
  isWeekLocked = false,
}) => {
  // Pour les habitudes weekly déjà complétées, afficher comme complété
  const showAsCompleted = isCompleted || isWeekLocked;

  // DUOLINGO-STYLE 3D PRESS ANIMATION
  const pressY = useSharedValue(0);
  const shadowOpacity = useSharedValue(0.15);
  const scale = useSharedValue(1);

  // Checkmark animation scale
  const checkScale = useSharedValue(showAsCompleted ? 1 : 0);

  // Lottie animation ref
  const lottieRef = useRef<LottieView>(null);

  // Simple fade in on mount
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  }, []);

  // Track previous completed state
  const prevCompleted = React.useRef(showAsCompleted);

  // INSTANT checkmark animation when completed changes
  React.useEffect(() => {
    checkScale.value = withSpring(showAsCompleted ? 1 : 0, {
      damping: 15,
      stiffness: 400,
      mass: 0.5,
    });

    // Play Lottie animation when task becomes completed
    if (showAsCompleted && !prevCompleted.current && lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }

    prevCompleted.current = showAsCompleted;
  }, [showAsCompleted]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;

    pressY.value = withSpring(2, { damping: 20, stiffness: 600, mass: 0.3 });
    shadowOpacity.value = withTiming(0.05, { duration: 100 });
    scale.value = withSpring(0.98, { damping: 20, stiffness: 600, mass: 0.3 });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;

    pressY.value = withSpring(0, { damping: 15, stiffness: 400, mass: 0.5 });
    shadowOpacity.value = withTiming(0.15, { duration: 150 });
    scale.value = withSpring(1, { damping: 15, stiffness: 400, mass: 0.5 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: pressY.value }, { scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={showAsCompleted || isPaused || disabled}
      style={[
        tw`flex-row items-center px-3 py-2.5 rounded-xl mb-1.5`,
        animatedStyle,
        shadowStyle,
        {
          backgroundColor: showAsCompleted
            ? 'rgba(255, 255, 255, 0.95)'
            : isPaused
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.85)',
          // 3D border effect
          borderBottomWidth: showAsCompleted || isPaused ? 2 : 3,
          borderBottomColor: showAsCompleted
            ? 'rgba(200, 200, 200, 0.4)'
            : isPaused
              ? 'rgba(168, 162, 158, 0.3)'
              : tierAccent + '40',
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderTopWidth: 1,
          borderLeftColor: 'rgba(255, 255, 255, 0.4)',
          borderRightColor: 'rgba(255, 255, 255, 0.4)',
          borderTopColor: 'rgba(255, 255, 255, 0.4)',
          shadowColor: showAsCompleted || isPaused ? '#000' : tierAccent,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: 6,
          elevation: showAsCompleted || isPaused ? 1 : 3,
        },
      ]}
    >
      {/* Checkbox */}
      <View style={tw`mr-2.5 w-5 h-5 items-center justify-center`}>
        {showAsCompleted ? (
          <Animated.View style={[tw`items-center justify-center`, checkmarkStyle]}>
            <LottieView
              ref={lottieRef}
              source={require('../../../assets/animations/blue-checkmark.json')}
              autoPlay={true}
              loop={false}
              speed={1.2}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
              colorFilters={[
                { keypath: 'Shape Layer 1.Ellipse 1.Fill 1', color: tierAccent },
                { keypath: 'trait.Shape Layer 1.Shape 1.Stroke 1', color: tierAccent },
              ]}
              hardwareAccelerationAndroid
            />
          </Animated.View>
        ) : isPaused ? (
          <PauseCircle size={20} color="#a8a29e" strokeWidth={2} />
        ) : (
          <Circle size={20} color={tierAccent + '80'} strokeWidth={2} />
        )}
      </View>

      {/* Task Name */}
      <View style={tw`flex-1 min-w-0`}>
        <Text
          style={[
            tw`text-[13px] font-semibold`,
            isPaused
              ? tw`text-stone-400`
              : showAsCompleted
                ? { color: tierAccent }
                : tw`text-stone-800`,
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
      </View>

      {/* Duration Badge */}
      {!isPaused && task.duration && !showAsCompleted && (
        <View style={[tw`px-2 py-0.5 rounded-md ml-2`, { backgroundColor: tierAccent + '20' }]}>
          <Text style={[tw`text-[10px] font-bold`, { color: tierAccent }]}>{task.duration}</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

export default DashboardTaskItem;
