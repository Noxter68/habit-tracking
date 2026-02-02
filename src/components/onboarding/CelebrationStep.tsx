import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Target, Zap, ChevronRight } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import tw from '../../lib/tailwind';
import { GoalId } from './GoalStep';

interface CelebrationStepProps {
  gradient: string[];
  selectedGoals: GoalId[];
  selectedHabitName: string | null;
  onStart: () => void;
}

const CelebrationStep: React.FC<CelebrationStepProps> = ({
  selectedGoals,
  selectedHabitName,
  onStart,
}) => {
  const { t } = useTranslation();
  const goalKey = selectedGoals.length > 0 ? selectedGoals[0] : 'routines';

  // Animations
  const titleOpacity = useSharedValue(0);
  const card1Opacity = useSharedValue(0);
  const card2Opacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);
  const ctaScale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance
    titleOpacity.value = withTiming(1, { duration: 400 });
    card1Opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    card2Opacity.value = withDelay(350, withTiming(1, { duration: 400 }));
    ctaOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    ctaScale.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.bezier(0.2, 0.8, 0.2, 1.1) }));
    // Subtle pulse on CTA
    pulseScale.value = withDelay(1100, withRepeat(
      withTiming(1.03, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));
  }, []);

  const animatedTitle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));
  const animatedCard1 = useAnimatedStyle(() => ({ opacity: card1Opacity.value }));
  const animatedCard2 = useAnimatedStyle(() => ({ opacity: card2Opacity.value }));
  const animatedCta = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ scale: ctaScale.value }],
  }));
  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleStart = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStart();
  };

  return (
    <View style={tw`items-center gap-8`}>
      {/* Title */}
      <Animated.View style={[tw`items-center gap-2`, animatedTitle]}>
        <Text style={tw`text-4xl font-black text-white text-center`}>
          {t('onboarding.celebration.title')}
        </Text>
        <Text style={tw`text-base text-white/60 text-center leading-6 max-w-[280px]`}>
          {t('onboarding.celebration.subtitle')}
        </Text>
      </Animated.View>

      {/* Recap cards */}
      <View style={tw`w-full gap-3`}>
        <Animated.View
          style={[
            tw`flex-row items-center gap-4 rounded-2xl px-5 py-4`,
            {
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(16, 185, 129, 0.3)',
            },
            animatedCard1,
          ]}
        >
          <View style={[tw`w-11 h-11 rounded-xl items-center justify-center`, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Target size={22} color="#6ee7b7" strokeWidth={1.8} />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-xs text-white/50`}>{t('onboarding.celebration.goalLabel')}</Text>
            <Text style={tw`text-base font-bold text-white mt-0.5`}>
              {t(`onboarding.goals.options.${goalKey}`)}
            </Text>
          </View>
        </Animated.View>

        {selectedHabitName && (
          <Animated.View
            style={[
              tw`flex-row items-center gap-4 rounded-2xl px-5 py-4`,
              {
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.3)',
              },
              animatedCard2,
            ]}
          >
            <View style={[tw`w-11 h-11 rounded-xl items-center justify-center`, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Zap size={22} color="#60a5fa" strokeWidth={1.8} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-xs text-white/50`}>{t('onboarding.celebration.habitLabel')}</Text>
              <Text style={tw`text-base font-bold text-white mt-0.5`}>{selectedHabitName}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Big CTA with pulse */}
      <Animated.View style={[tw`w-full`, animatedCta]}>
        <Animated.View style={animatedPulse}>
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              tw`w-full h-16 rounded-full flex-row items-center justify-center gap-3`,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#fff',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 10,
              },
            ]}
          >
            <Text style={tw`text-lg font-black text-purple-900`}>
              {t('onboarding.celebration.cta')}
            </Text>
            <ChevronRight size={20} color="#581c87" strokeWidth={2.5} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default CelebrationStep;
