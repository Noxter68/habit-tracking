import React, { useState, useEffect, useCallback } from 'react';
import { View, Pressable, Text, StatusBar, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, Easing, runOnJS } from 'react-native-reanimated';
import { ChevronRight, ChevronLeft, Brain } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';
import { NotificationService } from '@/services/notificationService';

import WelcomeStep from '../components/onboarding/WelcomeStep';
import GoalStep, { GoalId } from '../components/onboarding/GoalStep';
import MotivationStep, { ChallengeId } from '../components/onboarding/MotivationStep';
import LoadingPlanStep from '../components/onboarding/LoadingPlanStep';
import QuickHabitStep from '../components/onboarding/QuickHabitStep';
import NotificationStep from '../components/onboarding/NotificationStep';
import CelebrationStep from '../components/onboarding/CelebrationStep';
import UsernameStep from '../components/onboarding/UsernameStep';
import SocialProofStep from '../components/onboarding/SocialProofStep';
import ImpactStep from '../components/onboarding/ImpactStep';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

type StepId = 'welcome' | 'socialProof' | 'username' | 'goals' | 'motivation' | 'loadingPlan' | 'impact' | 'quickHabit' | 'notifications' | 'celebration';

interface StepConfig {
  id: StepId;
  gemColor: string;
  gemSource: any;
  // Some steps handle their own navigation (notifications)
  hasCustomNav?: boolean;
  // Use app icon instead of gem
  isAppIcon?: boolean;
  // Use custom icon instead of gem image
  useCustomIcon?: boolean;
}

const STEPS: StepConfig[] = [
  {
    id: 'welcome',
    gemColor: '#8b5cf6',
    gemSource: require('../../assets/icon/icon_app.png'),
    isAppIcon: true,
  },
  {
    id: 'socialProof',
    gemColor: '#f59e0b',
    gemSource: require('../../assets/interface/gems/topaz-gem.png'),
  },
  {
    id: 'impact',
    gemColor: '#8b5cf6',
    gemSource: require('../../assets/interface/gems/amethyst-gem.png'),
    useCustomIcon: true,
  },
  {
    id: 'goals',
    gemColor: '#f59e0b',
    gemSource: require('../../assets/interface/gems/topaz-gem.png'),
  },
  {
    id: 'motivation',
    gemColor: '#ef4444',
    gemSource: require('../../assets/interface/gems/ruby-gem.png'),
  },
  {
    id: 'loadingPlan',
    gemColor: '#8b5cf6',
    gemSource: require('../../assets/interface/gems/amethyst-gem.png'),
  },
  {
    id: 'quickHabit',
    gemColor: '#10b981',
    gemSource: require('../../assets/interface/gems/jade-gem.png'),
  },
  {
    id: 'notifications',
    gemColor: '#3b82f6',
    gemSource: require('../../assets/interface/gems/crystal-gem.png'),
    hasCustomNav: true,
  },
  {
    id: 'username',
    gemColor: '#ec4899',
    gemSource: require('../../assets/interface/gems/ruby-gem.png'),
  },
  {
    id: 'celebration',
    gemColor: '#10b981',
    gemSource: require('../../assets/interface/gems/jade-gem.png'),
    hasCustomNav: true,
  },
];

// Quick habit ID -> category/task mapping for creating the actual habit
const QUICK_HABIT_CONFIG: Record<string, { name: string; category: string; type: 'good' | 'bad'; taskName: string }> = {
  morning_routine: { name: 'Morning Routine', category: 'productivity', type: 'good', taskName: 'Morning routine' },
  drink_water: { name: 'Drink Water', category: 'hydration', type: 'good', taskName: 'Drink 8 glasses of water' },
  read_10_pages: { name: 'Read Daily', category: 'learning', type: 'good', taskName: 'Read 10 pages' },
  no_phone_morning: { name: 'No Phone Morning', category: 'mindfulness', type: 'good', taskName: 'No phone for first hour' },
  eat_healthy: { name: 'Eat Healthy', category: 'nutrition', type: 'good', taskName: 'Eat a healthy meal' },
  sleep_early: { name: 'Sleep Early', category: 'sleep', type: 'good', taskName: 'Be in bed by 11pm' },
  plan_my_day: { name: 'Plan My Day', category: 'productivity', type: 'good', taskName: 'Plan tomorrow\'s tasks' },
  focus_session: { name: 'Focus Session', category: 'productivity', type: 'good', taskName: 'Deep work session' },
  exercise_10min: { name: 'Exercise', category: 'fitness', type: 'good', taskName: '10 min workout' },
  meditate: { name: 'Meditate', category: 'mindfulness', type: 'good', taskName: '5 min meditation' },
};

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Onboarding'>>();
  const isReview = route.params?.isReview ?? false;
  const { completeOnboarding, user } = useAuth();
  const { addHabit } = useHabits();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedStep, setDisplayedStep] = useState(0);

  // Username state (Apple auth only)
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // New onboarding state
  const [selectedGoals, setSelectedGoals] = useState<GoalId[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Filter steps: username only for Apple auth on first onboarding (not review)
  const isAppleAuth = user?.app_metadata?.provider === 'apple';
  const showUsernameStep = isAppleAuth && !isReview;
  const steps = showUsernameStep ? STEPS : STEPS.filter((step) => step.id !== 'username');

  const opacity = useSharedValue(0);
  const gemOpacity = useSharedValue(1);
  const gemScale = useSharedValue(1);
  // Welcome screen: logo fades in first, then content + buttons after a delay
  const welcomeGemOpacity = useSharedValue(0);
  const welcomeContentOpacity = useSharedValue(0);
  const floatY = useSharedValue(0);
  const [initialAnimDone, setInitialAnimDone] = useState(false);

  useEffect(() => {
    // Gentle floating animation for the app icon
    floatY.value = withRepeat(
      withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // Initial welcome: logo first, then text + buttons
    welcomeGemOpacity.value = withTiming(1, { duration: 500 });
    welcomeContentOpacity.value = withDelay(400, withTiming(1, { duration: 500 }, (finished) => {
      if (finished) {
        runOnJS(setInitialAnimDone)(true);
      }
    }));
    // Set main opacity to 1 immediately (welcome uses its own animation)
    opacity.value = 1;
  }, []);

  useEffect(() => {
    if (currentStep === displayedStep) return;
    // Fade out everything, swap content while invisible, then fade in
    opacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(setDisplayedStep)(currentStep);
        opacity.value = withTiming(1, { duration: 300 });
      }
    });
  }, [currentStep]);

  const handleKeyboardVisibilityChange = (visible: boolean) => {
    setIsKeyboardVisible(visible);
    if (visible) {
      gemOpacity.value = withTiming(0, { duration: 300 });
      gemScale.value = withTiming(0.8, { duration: 300 });
    } else {
      gemOpacity.value = withTiming(1, { duration: 300 });
      gemScale.value = withTiming(1, { duration: 300 });
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleEnableNotifications = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const granted = await NotificationService.registerForPushNotifications();
      setNotificationsEnabled(granted);
    } catch (error) {
      Logger.error('Error requesting notification permission:', error);
    }
    // Move to next step regardless
    setCurrentStep((prev) => prev + 1);
  };

  const handleSkipNotifications = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(false);
    setCurrentStep((prev) => prev + 1);
  };

  const createQuickHabit = async () => {
    if (!selectedHabit || !user) return;

    const config = QUICK_HABIT_CONFIG[selectedHabit];
    if (!config) return;

    try {
      const newHabit = {
        id: Date.now().toString(),
        name: t(`onboarding.quickHabit.habits.${selectedHabit}.name`),
        type: config.type as 'good' | 'bad',
        category: config.category,
        tasks: [
          {
            id: `quick-task-${Date.now()}`,
            name: t(`onboarding.quickHabit.habits.${selectedHabit}.desc`),
          },
        ],
        dailyTasks: {},
        frequency: 'daily' as const,
        notifications: notificationsEnabled,
        notificationTime: '09:00',
        hasEndGoal: false,
        totalDays: 61,
        currentStreak: 0,
        bestStreak: 0,
        completedDays: [],
        createdAt: new Date(),
      };

      await addHabit(newHabit);
    } catch (error) {
      Logger.error('Error creating quick habit:', error);
    }
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Save username for Apple auth users (only on first onboarding, not review)
    if (!isReview && isAppleAuth && isUsernameValid && username.trim()) {
      try {
        await supabase
          .from('profiles')
          .update({
            username: username.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.id);
      } catch (error) {
        Logger.error('Exception saving username:', error);
      }
    }

    // Create the quick habit if one was selected
    await createQuickHabit();

    // Save onboarding goals/challenge to profile for future personalization
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_goals: selectedGoals,
          onboarding_challenge: selectedChallenge,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);
    } catch (error) {
      Logger.error('Error saving onboarding data:', error);
    }

    await completeOnboarding();
    navigation.replace('MainTabs');
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
    navigation.replace('MainTabs');
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedGemStyle = useAnimatedStyle(() => ({
    opacity: gemOpacity.value,
    transform: [{ scale: gemScale.value }],
  }));

  // Welcome-specific: staggered fade for logo then content
  const animatedWelcomeGem = useAnimatedStyle(() => ({
    opacity: welcomeGemOpacity.value,
  }));
  const animatedWelcomeContent = useAnimatedStyle(() => ({
    opacity: welcomeContentOpacity.value,
  }));
  const animatedFloat = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  // Use displayedStep for ALL visual elements to avoid mismatches during transitions
  const step = steps[displayedStep];
  const isUsernameStep = step.id === 'username';
  const isLastStep = displayedStep === steps.length - 1;
  const isNotificationStep = step.id === 'notifications';
  const hasCustomNav = step.hasCustomNav === true;
  const hideGem = step.id === 'goals' || step.id === 'motivation' || step.id === 'notifications' || step.id === 'loadingPlan' || step.id === 'socialProof' || step.id === 'quickHabit';
  // On first load, welcome uses staggered fade (logo first, then content)
  const useWelcomeAnim = step.id === 'welcome' && !initialAnimDone;

  // Determine if continue button should be disabled (use currentStep for responsiveness)
  const isContinueDisabled = (() => {
    const current = steps[currentStep];
    if (current.id === 'username') return !isUsernameValid;
    if (current.id === 'goals') return selectedGoals.length === 0;
    if (current.id === 'motivation') return selectedChallenge === null;
    if (current.id === 'quickHabit') return selectedHabit === null;
    if (current.id === 'loadingPlan') return !loadingComplete;
    return false;
  })();

  // Get the selected habit name for celebration step
  const selectedHabitName = selectedHabit
    ? t(`onboarding.quickHabit.habits.${selectedHabit}.name`)
    : null;

  const renderStepContent = () => {
    const commonProps = { gradient: [step.gemColor, step.gemColor, step.gemColor] };

    switch (step.id) {
      case 'welcome':
        return <WelcomeStep {...commonProps} />;
      case 'socialProof':
        return <SocialProofStep {...commonProps} />;
      case 'username':
        return (
          <UsernameStep
            {...commonProps}
            onUsernameChange={(newUsername: string, isValid: boolean) => {
              setUsername(newUsername);
              setIsUsernameValid(isValid);
            }}
            onKeyboardVisibilityChange={handleKeyboardVisibilityChange}
          />
        );
      case 'goals':
        return (
          <GoalStep
            {...commonProps}
            selectedGoals={selectedGoals}
            onGoalsChange={setSelectedGoals}
          />
        );
      case 'motivation':
        return (
          <MotivationStep
            {...commonProps}
            selectedChallenge={selectedChallenge}
            onChallengeChange={setSelectedChallenge}
          />
        );
      case 'loadingPlan':
        return (
          <LoadingPlanStep
            {...commonProps}
            selectedGoals={selectedGoals}
            selectedChallenge={selectedChallenge}
            onLoadingComplete={() => setLoadingComplete(true)}
          />
        );
      case 'impact':
        return <ImpactStep {...commonProps} />;
      case 'quickHabit':
        return (
          <QuickHabitStep
            {...commonProps}
            selectedGoals={selectedGoals}
            selectedHabit={selectedHabit}
            onHabitChange={setSelectedHabit}
          />
        );
      case 'notifications':
        return (
          <NotificationStep
            {...commonProps}
            selectedChallenge={selectedChallenge}
            onEnableNotifications={handleEnableNotifications}
            onSkipNotifications={handleSkipNotifications}
          />
        );
      case 'celebration':
        return (
          <CelebrationStep
            {...commonProps}
            selectedGoals={selectedGoals}
            selectedHabitName={selectedHabitName}
            onStart={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ImageBackground source={require('../../assets/interface/purple-background-stars.png')} style={tw`flex-1`} resizeMode="cover">
      <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header - Skip button and Progress dots */}
        <View style={tw`px-6 pt-1`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`w-20`} />

            {/* Progress Indicators */}
            <View style={tw`flex-row gap-2`}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    tw`h-2 rounded-full`,
                    {
                      width: index === displayedStep ? 24 : 8,
                      backgroundColor: index === displayedStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
                    },
                  ]}
                />
              ))}
            </View>

            {/* Skip Button */}
            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [
                tw`px-5 py-2.5 rounded-full`,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={tw`text-sm font-semibold text-white/90`}>{t('onboarding.skip')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Gem / App icon - hidden on content-heavy steps */}
        {!hideGem && (
        <Animated.View
          style={[
            tw`items-center mt-4 mb-3`,
            useWelcomeAnim ? animatedWelcomeGem : animatedContentStyle,
            isUsernameStep ? animatedGemStyle : {},
          ]}
        >
          {step.isAppIcon ? (
            <Animated.View
              style={[
                {
                  width: 225,
                  height: 225,
                  marginTop: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#8b5cf6',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.7,
                  shadowRadius: 24,
                  elevation: 18,
                },
                animatedFloat,
              ]}
            >
              <Image
                source={step.gemSource}
                style={{ width: 203, height: 203 }}
                contentFit="contain"
              />
            </Animated.View>
          ) : step.useCustomIcon ? (
            <View
              style={[
                tw`w-36 h-36 rounded-full items-center justify-center`,
                {
                  backgroundColor: `${step.gemColor}25`,
                  shadowColor: step.gemColor,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.5,
                  shadowRadius: 24,
                  elevation: 18,
                },
              ]}
            >
              <Brain size={64} color="#c4b5fd" strokeWidth={1.5} />
            </View>
          ) : (
            <View
              style={[
                tw`w-36 h-36 rounded-full items-center justify-center`,
                {
                  backgroundColor: `${step.gemColor}30`,
                  shadowColor: step.gemColor,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.7,
                  shadowRadius: 24,
                  elevation: 18,
                },
              ]}
            >
              <Image source={step.gemSource} style={{ width: 90, height: 90 }} contentFit="contain" />
            </View>
          )}
        </Animated.View>
        )}

        {/* Main content */}
        <Animated.View style={[useWelcomeAnim ? animatedWelcomeContent : animatedContentStyle, tw`flex-1 justify-center px-8`]}>
          {renderStepContent()}
        </Animated.View>

        {/* Navigation buttons - hidden for notification step (has its own buttons) */}
        {!hasCustomNav && (
          <Animated.View style={[useWelcomeAnim ? animatedWelcomeContent : animatedContentStyle, tw`px-8 pb-8 pt-8`]}>
            {displayedStep === 0 ? (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => [
                  tw`h-14 rounded-full flex-row items-center justify-center gap-2`,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    opacity: pressed ? 0.9 : 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  },
                ]}
              >
                <Text style={tw`text-base font-bold text-purple-900`}>
                  {t('onboarding.letsGo')}
                </Text>
                <ChevronRight size={20} color="#581c87" strokeWidth={2.5} />
              </Pressable>
            ) : (
              <View style={tw`flex-row justify-between items-center gap-4`}>
                <Pressable
                  onPress={handleBack}
                  style={({ pressed }) => [
                    tw`w-14 h-14 rounded-full items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      opacity: pressed ? 0.7 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    },
                  ]}
                >
                  <ChevronLeft size={26} color="white" strokeWidth={2.5} />
                </Pressable>

                <Pressable
                  onPress={handleNext}
                  disabled={isContinueDisabled}
                  style={({ pressed }) => [
                    tw`flex-1 h-14 rounded-full flex-row items-center justify-center gap-2`,
                    {
                      backgroundColor: isContinueDisabled
                        ? 'rgba(255, 255, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.95)',
                      opacity: pressed ? 0.9 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tw`text-base font-bold`,
                      {
                        color: isContinueDisabled
                          ? 'rgba(88, 28, 135, 0.4)'
                          : '#581c87',
                      },
                    ]}
                  >
                    {isLastStep ? t('onboarding.startJourney') : step.id === 'impact' ? t('onboarding.impact.cta') : step.id === 'loadingPlan' ? t('onboarding.loadingPlan.cta') : t('onboarding.continue')}
                  </Text>
                  <ChevronRight
                    size={20}
                    color={isContinueDisabled ? 'rgba(88, 28, 135, 0.4)' : '#581c87'}
                    strokeWidth={2.5}
                  />
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

export default OnboardingScreen;
