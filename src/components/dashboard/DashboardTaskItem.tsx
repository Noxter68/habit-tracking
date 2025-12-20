/**
 * DashboardTaskItem.tsx
 *
 * Composant de tâche compact pour le Dashboard.
 * Réutilise les animations 3D style Duolingo de TaskCheckItem.
 */

import React, { useRef, memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Circle, PauseCircle, CheckCircle2 } from 'lucide-react-native';
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

const DashboardTaskItemComponent: React.FC<DashboardTaskItemProps> = ({
  task,
  isCompleted,
  isPaused = false,
  onPress,
  disabled = false,
  tierAccent,
  isWeekLocked = false,
}) => {
  const showAsCompleted = isCompleted || isWeekLocked;

  // Press animation
  const pressY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Checkmark animation
  const checkScale = useSharedValue(showAsCompleted ? 1 : 0);
  const lottieRef = useRef<LottieView>(null);
  const prevCompleted = React.useRef(showAsCompleted);
  const [showLottie, setShowLottie] = React.useState(false);

  // Animate checkmark on completion change
  React.useEffect(() => {
    if (prevCompleted.current !== showAsCompleted) {
      checkScale.value = withSpring(showAsCompleted ? 1 : 0, {
        damping: 12,
        stiffness: 400,
      });

      if (showAsCompleted) {
        setShowLottie(true);
        lottieRef.current?.reset();
        lottieRef.current?.play();
      } else {
        setShowLottie(false);
      }

      prevCompleted.current = showAsCompleted;
    }
  }, [showAsCompleted]);

  const handlePressIn = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    pressY.value = withSpring(2, { damping: 20, stiffness: 600, mass: 0.3 });
    scale.value = withSpring(0.98, { damping: 20, stiffness: 600, mass: 0.3 });
  };

  const handlePressOut = () => {
    if (isPaused || isCompleted || disabled || isWeekLocked) return;
    pressY.value = withSpring(0, { damping: 15, stiffness: 400, mass: 0.5 });
    scale.value = withSpring(1, { damping: 15, stiffness: 400, mass: 0.5 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressY.value }, { scale: scale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
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
        {
          backgroundColor: showAsCompleted
            ? 'rgba(255, 255, 255, 0.95)'
            : isPaused
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(255, 255, 255, 0.85)',
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
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: showAsCompleted || isPaused ? 1 : 3,
        },
      ]}
    >
      {/* Checkbox */}
      <View style={tw`mr-2.5 w-5 h-5 items-center justify-center`}>
        {showAsCompleted ? (
          showLottie ? (
            <Animated.View style={[tw`items-center justify-center`, checkmarkStyle]}>
              <LottieView
                ref={lottieRef}
                source={require('../../../assets/animations/blue-checkmark.json')}
                autoPlay
                loop={false}
                speed={1.2}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
                colorFilters={[
                  { keypath: 'Shape Layer 1.Ellipse 1.Fill 1', color: tierAccent },
                  { keypath: 'trait.Shape Layer 1.Shape 1.Stroke 1', color: tierAccent },
                ]}
              />
            </Animated.View>
          ) : (
            <CheckCircle2 size={20} color={tierAccent} strokeWidth={2.5} fill={tierAccent + '30'} />
          )
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

export const DashboardTaskItem = memo(DashboardTaskItemComponent, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.isCompleted === next.isCompleted &&
    prev.isPaused === next.isPaused &&
    prev.tierAccent === next.tierAccent &&
    prev.isWeekLocked === next.isWeekLocked
  );
});

export default DashboardTaskItem;
