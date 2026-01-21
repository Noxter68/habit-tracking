/**
 * DashboardTaskItem.tsx
 *
 * Compact task component for the Dashboard.
 * Duolingo-style design with 3D effect via shadow.
 */

import React, { memo, useRef, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolateColor,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { PauseCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tailwind';
import { tierThemes } from '@/utils/tierTheme';
import { HabitTier } from '@/services/habitProgressionService';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  onPress: () => void;
  disabled?: boolean;
  tierAccent: string;
  tierName?: HabitTier;
  isWeekLocked?: boolean;
  allowUncheck?: boolean;
  compact?: boolean;
}

const DashboardTaskItemComponent: React.FC<DashboardTaskItemProps> = ({
  task,
  isCompleted,
  isPaused = false,
  onPress,
  disabled = false,
  tierAccent,
  tierName = 'Crystal',
  isWeekLocked = false,
  allowUncheck = false,
  compact = false,
}) => {
  const showAsCompleted = isCompleted || isWeekLocked;
  const theme = tierThemes[tierName];

  // Press animation
  const translateY = useSharedValue(0);

  // Completion animation (0 = not completed, 1 = completed)
  const completionProgress = useDerivedValue(() => {
    return showAsCompleted ? 1 : 0;
  }, [showAsCompleted]);

  // Checkmark Lottie animation
  const checkmarkRef = useRef<LottieView>(null);
  const wasCompletedOnMount = useRef(showAsCompleted);
  const prevCompleted = useRef(showAsCompleted);

  useEffect(() => {
    if (prevCompleted.current !== showAsCompleted && showAsCompleted) {
      // Play animation when transitioning from uncompleted to completed
      checkmarkRef.current?.reset();
      checkmarkRef.current?.play();
    }
    prevCompleted.current = showAsCompleted;
  }, [showAsCompleted]);

  const handlePressIn = () => {
    if (isPaused || disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateY.value = withTiming(4, { duration: 50 });
  };

  const handlePressOut = () => {
    if (isPaused || disabled) return;
    translateY.value = withTiming(0, { duration: 80 });
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    shadowOffset: { width: 0, height: 4 - translateY.value },
  }));

  // Animated text color
  const animatedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      completionProgress.value,
      [0, 1],
      [tierAccent, '#ffffff']
    ),
  }));

  // Animated background opacity (white fades out, gradient fades in)
  const animatedWhiteBgStyle = useAnimatedStyle(() => ({
    opacity: 1 - completionProgress.value,
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: completionProgress.value,
  }));

  return (
    <View style={compact ? tw`mb-1.5` : tw`mb-2.5`}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isPaused || disabled || (showAsCompleted && !allowUncheck)}
        style={[
          compact ? tw`rounded-xl` : tw`rounded-2xl`,
          {
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 0,
            elevation: 4,
          },
          animatedContainerStyle,
        ]}
      >
        <View style={compact ? tw`rounded-xl overflow-hidden` : tw`rounded-2xl overflow-hidden`}>
          {/* White background (visible when uncompleted) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isPaused ? '#f5f5f4' : '#ffffff',
                borderRadius: compact ? 12 : 16,
              },
              animatedWhiteBgStyle,
            ]}
          />

          {/* Gradient (visible when completed) */}
          <AnimatedLinearGradient
            colors={[theme.gradient[0], theme.gradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: compact ? 12 : 16,
              },
              animatedGradientStyle,
            ]}
          />

          {/* Content */}
          <View style={compact ? tw`flex-row items-center justify-between px-3 py-2` : tw`flex-row items-center justify-between px-4 py-3`}>
            {/* Checkmark or Pause icon */}
            {isPaused ? (
              <View style={compact ? tw`mr-2` : tw`mr-2.5`}>
                <PauseCircle size={compact ? 16 : 18} color="#a8a29e" strokeWidth={2} />
              </View>
            ) : (
              <View
                style={[
                  compact ? tw`w-5 h-5 mr-2 items-center justify-center rounded-full` : tw`w-7 h-7 mr-3 items-center justify-center rounded-full`,
                  {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 3,
                  },
                ]}
              >
                {showAsCompleted ? (
                  <LottieView
                    ref={checkmarkRef}
                    source={require('../../../assets/animations/blue-checkmark.json')}
                    autoPlay={!wasCompletedOnMount.current}
                    loop={false}
                    progress={wasCompletedOnMount.current ? 1 : 0}
                    style={compact ? { width: 26, height: 26 } : { width: 34, height: 34 }}
                    colorFilters={[
                      { keypath: 'Shape Layer 1', color: tierAccent },
                      { keypath: 'trait', color: tierAccent },
                      { keypath: 'trait 2', color: tierAccent },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      compact ? tw`w-4 h-4 rounded-full` : tw`w-5 h-5 rounded-full`,
                      { backgroundColor: '#ffffff', borderWidth: 2, borderColor: tierAccent },
                    ]}
                  />
                )}
              </View>
            )}

            <View style={tw`flex-1 min-w-0`}>
              <Animated.Text
                style={[
                  compact ? tw`text-xs font-semibold` : tw`text-sm font-semibold`,
                  isPaused ? tw`text-stone-400` : animatedTextStyle,
                ]}
                numberOfLines={1}
              >
                {task.name}
              </Animated.Text>
            </View>

            {!compact && !isPaused && task.duration && !showAsCompleted && (
              <View style={[tw`px-2.5 py-1 rounded-xl ml-3`, { backgroundColor: tierAccent + '18' }]}>
                <Text style={[tw`text-xs font-bold`, { color: tierAccent }]}>{task.duration}</Text>
              </View>
            )}
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
};

export const DashboardTaskItem = memo(DashboardTaskItemComponent, (prev, next) => {
  return (
    prev.task.id === next.task.id &&
    prev.isCompleted === next.isCompleted &&
    prev.isPaused === next.isPaused &&
    prev.tierAccent === next.tierAccent &&
    prev.tierName === next.tierName &&
    prev.isWeekLocked === next.isWeekLocked &&
    prev.allowUncheck === next.allowUncheck &&
    prev.compact === next.compact
  );
});

export default DashboardTaskItem;
