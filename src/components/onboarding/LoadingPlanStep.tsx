import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing, useAnimatedReaction, runOnJS, interpolateColor } from 'react-native-reanimated';
import { ListChecks, Target, Brain, CheckCircle2, Gauge } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../../lib/tailwind';
import { GoalId } from './GoalStep';
import { ChallengeId } from './MotivationStep';

interface LoadingPlanStepProps {
  gradient: string[];
  selectedGoals: GoalId[];
  selectedChallenge: ChallengeId | null;
  onLoadingComplete: () => void;
}

interface PlanItem {
  icon: React.ReactNode;
  labelKey: string;
  delay: number;
}

const PLAN_ITEMS: PlanItem[] = [
  { icon: <Target size={18} color="#3b82f6" strokeWidth={2} />, labelKey: 'analyzingGoals', delay: 0 },
  { icon: <Brain size={18} color="#8b5cf6" strokeWidth={2} />, labelKey: 'findingStrategy', delay: 1500 },
  { icon: <ListChecks size={18} color="#f59e0b" strokeWidth={2} />, labelKey: 'selectingHabits', delay: 3200 },
  { icon: <Gauge size={18} color="#10b981" strokeWidth={2} />, labelKey: 'optimizingProgress', delay: 5000 },
];

const TOTAL_DURATION = 6500;

const LoadingPlanStep: React.FC<LoadingPlanStepProps> = ({
  selectedGoals,
  selectedChallenge,
  onLoadingComplete,
}) => {
  const { t } = useTranslation();
  const progressWidth = useSharedValue(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [percentColor, setPercentColor] = useState('#ffffff');
  const [isComplete, setIsComplete] = useState(false);

  useAnimatedReaction(
    () => Math.round(progressWidth.value),
    (current) => {
      runOnJS(setDisplayPercent)(current);
      const color = interpolateColor(
        current,
        [0, 33, 34, 66, 67, 100],
        ['#ffffff', '#ffffff', '#f59e0b', '#f59e0b', '#6ee7b7', '#6ee7b7'],
      );
      runOnJS(setPercentColor)(color as string);
    },
  );

  useEffect(() => {
    // Animate progress bar with bursts and pauses like real data fetching
    progressWidth.value = withSequence(
      // Quick burst to 30%
      withTiming(30, { duration: 1000, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
      // Slow crawl to 45%
      withTiming(45, { duration: 1400, easing: Easing.bezier(0.1, 0.0, 0.9, 1) }),
      // Another burst to 68%
      withTiming(68, { duration: 900, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
      // Very slow crawl to 85% (feels like waiting for data)
      withTiming(85, { duration: 1600, easing: Easing.bezier(0.1, 0.0, 0.9, 1) }),
      // Final push to 100%
      withTiming(100, { duration: 1600, easing: Easing.bezier(0.3, 0.8, 0.2, 1) }),
    );

    // Mark items as completed one by one, glow + enable button on last item
    const timers: ReturnType<typeof setTimeout>[] = [];
    PLAN_ITEMS.forEach((item, index) => {
      const completeAt = item.delay + 1200;
      const t = setTimeout(() => {
        setCompletedItems((prev) => [...prev, prev.length]);
        // Activate glow and enable button when last item completes
        if (index === PLAN_ITEMS.length - 1) {
          setIsComplete(true);
          onLoadingComplete();
        }
      }, completeAt);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Staggered fade for each plan item
  const itemAnimations = PLAN_ITEMS.map((item) => {
    const opacity = useSharedValue(0);
    useEffect(() => {
      opacity.value = withDelay(item.delay, withTiming(1, { duration: 400 }));
    }, []);
    return useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));
  });

  const goalKey = selectedGoals.length > 0 ? selectedGoals[0] : 'routines';

  return (
    <View style={tw`items-center gap-8`}>
      <View style={tw`items-center gap-3`}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.loadingPlan.title')}
        </Text>
        <Text style={tw`text-base text-white/80 text-center leading-6 max-w-[300px]`}>
          {t('onboarding.loadingPlan.subtitle', {
            goal: t(`onboarding.goals.options.${goalKey}`).toLowerCase(),
          })}
        </Text>
      </View>

      {/* Percentage */}
      <Text style={[tw`text-4xl font-black text-center`, { color: percentColor }]}>
        {displayPercent}%
      </Text>

      {/* Progress bar */}
      <View
        style={[
          tw`w-full`,
          isComplete && {
            shadowColor: '#6ee7b7',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 16,
            elevation: 10,
          },
        ]}
      >
        <View
          style={[
            tw`w-full h-3 rounded-full overflow-hidden`,
            { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
          ]}
        >
          <Animated.View
            style={[
              tw`h-full rounded-full`,
              {
                backgroundColor: isComplete ? '#6ee7b7' : '#8b5cf6',
                shadowColor: isComplete ? '#6ee7b7' : '#8b5cf6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 8,
              },
              animatedProgressStyle,
            ]}
          />
        </View>
      </View>

      {/* Plan items */}
      <View style={tw`w-full gap-4`}>
        {PLAN_ITEMS.map((item, index) => {
          const isCompleted = completedItems.includes(index);
          return (
            <Animated.View
              key={item.labelKey}
              style={[
                itemAnimations[index],
                tw`flex-row items-center gap-3 px-4 py-3 rounded-2xl`,
                {
                  backgroundColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View
                style={[
                  tw`w-9 h-9 rounded-full items-center justify-center`,
                  {
                    backgroundColor: isCompleted
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} color="#6ee7b7" strokeWidth={2} />
                ) : (
                  item.icon
                )}
              </View>
              <Text
                style={[
                  tw`text-sm font-medium flex-1`,
                  { color: isCompleted ? '#6ee7b7' : 'rgba(255, 255, 255, 0.6)' },
                ]}
              >
                {t(`onboarding.loadingPlan.${item.labelKey}`)}
              </Text>
              {isCompleted && (
                <Text style={[tw`text-xs font-semibold`, { color: '#6ee7b7' }]}>✓</Text>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

export default LoadingPlanStep;
