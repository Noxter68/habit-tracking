import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { Sparkles, Target, Brain, CheckCircle2 } from 'lucide-react-native';
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
  { icon: <Brain size={18} color="#8b5cf6" strokeWidth={2} />, labelKey: 'findingStrategy', delay: 800 },
  { icon: <Sparkles size={18} color="#f59e0b" strokeWidth={2} />, labelKey: 'selectingHabits', delay: 1600 },
];

const TOTAL_DURATION = 3000;

const LoadingPlanStep: React.FC<LoadingPlanStepProps> = ({
  selectedGoals,
  selectedChallenge,
  onLoadingComplete,
}) => {
  const { t } = useTranslation();
  const progressWidth = useSharedValue(0);
  const [completedItems, setCompletedItems] = useState<number[]>([]);

  useEffect(() => {
    // Animate progress bar
    progressWidth.value = withTiming(100, {
      duration: TOTAL_DURATION,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Mark items as completed one by one
    PLAN_ITEMS.forEach((item, index) => {
      const completeAt = item.delay + 700;
      setTimeout(() => {
        setCompletedItems((prev) => [...prev, index]);
      }, completeAt);
    });

    // Auto-advance when done
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, TOTAL_DURATION + 400);

    return () => clearTimeout(timer);
  }, []);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Staggered fade for each plan item
  const itemAnimations = PLAN_ITEMS.map((item, index) => {
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

      {/* Progress bar */}
      <View style={tw`w-full`}>
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
                backgroundColor: '#8b5cf6',
                shadowColor: '#8b5cf6',
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
                    ? 'rgba(139, 92, 246, 0.15)'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
            >
              <View
                style={[
                  tw`w-9 h-9 rounded-full items-center justify-center`,
                  {
                    backgroundColor: isCompleted
                      ? 'rgba(139, 92, 246, 0.3)'
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                {isCompleted ? (
                  <CheckCircle2 size={18} color="#a78bfa" strokeWidth={2} />
                ) : (
                  item.icon
                )}
              </View>
              <Text
                style={[
                  tw`text-sm font-medium flex-1`,
                  { color: isCompleted ? '#c4b5fd' : 'rgba(255, 255, 255, 0.6)' },
                ]}
              >
                {t(`onboarding.loadingPlan.${item.labelKey}`)}
              </Text>
              {isCompleted && (
                <Text style={tw`text-xs font-semibold text-violet-400`}>✓</Text>
              )}
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

export default LoadingPlanStep;
