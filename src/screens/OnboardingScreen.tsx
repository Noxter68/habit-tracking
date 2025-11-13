import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import i18n from '../i18n';
import { useAuth } from '@/context/AuthContext';

import WelcomeStep from '../components/onboarding/WelcomeStep';
import XPStep from '../components/onboarding/XPStep';
import TierStep from '../components/onboarding/TierStep';
import SaverStep from '../components/onboarding/SaverStep';
import FeaturesStep from '../components/onboarding/FeaturesStep';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface StepConfig {
  id: string;
  component: React.ComponentType<{ gradient: string[] }>;
  gradient: string[];
  gemColor: string;
  gemSource: any;
}

const STEPS: StepConfig[] = [
  {
    id: 'welcome',
    component: WelcomeStep,
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    gemColor: '#60a5fa',
    gemSource: require('../../assets/interface/gems/crystal-gem.png'),
  },
  {
    id: 'xp',
    component: XPStep,
    gradient: ['#10b981', '#059669', '#047857'],
    gemColor: '#10b981',
    gemSource: require('../../assets/interface/gems/jade-gem.png'),
  },
  {
    id: 'tiers',
    component: TierStep,
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    gemColor: '#8b5cf6',
    gemSource: require('../../assets/interface/gems/amethyst-gem.png'),
  },
  {
    id: 'savers',
    component: SaverStep,
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    gemColor: '#ef4444',
    gemSource: require('../../assets/interface/gems/ruby-gem.png'),
  },
  {
    id: 'features',
    component: FeaturesStep,
    gradient: ['#f59e0b', '#d97706', '#b45309'],
    gemColor: '#f59e0b',
    gemSource: require('../../assets/interface/gems/topaz-gem.png'),
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { completeOnboarding } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 400 });
  }, [currentStep]);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleComplete();
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
    navigation.replace('HabitWizard');
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await completeOnboarding();
    navigation.replace('HabitWizard' as any);
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const step = STEPS[currentStep];
  const StepComponent = step.component;

  return (
    <ImageBackground source={require('../../assets/interface/purple-background-stars.png')} style={tw`flex-1`} resizeMode="cover">
      <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
      <StatusBar barStyle="light-content" />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header - Skip button and Progress dots on same line */}
        <View style={tw`px-6 pt-1`}>
          <View style={tw`flex-row justify-between items-center`}>
            {/* Empty spacer for symmetry */}
            <View style={tw`w-20`} />

            {/* Progress Indicators - Centered */}
            <View style={tw`flex-row gap-2`}>
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    tw`h-2 rounded-full`,
                    {
                      width: index === currentStep ? 24 : 8,
                      backgroundColor: index === currentStep ? 'white' : 'rgba(255, 255, 255, 0.3)',
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
              <Text style={tw`text-sm font-semibold text-white/90`}>{i18n.t('onboarding.skip')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Gem */}
        <Animated.View key={`gem-${currentStep}`} style={tw`items-center mt-4 mb-3`}>
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
        </Animated.View>

        {/* Main Content */}
        <Animated.View style={[animatedContentStyle, tw`flex-1 justify-center px-8`]}>
          <StepComponent gradient={step.gradient} />
        </Animated.View>

        {/* Bottom Navigation */}
        <View style={tw`px-8 pb-8 pt-8`}>
          {currentStep === 0 ? (
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
              <Text style={tw`text-base font-bold text-purple-900`}>{i18n.t('onboarding.continue')}</Text>
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
                style={({ pressed }) => [
                  tw`flex-1 h-14 rounded-full flex-row items-center justify-center gap-2`,
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
                <Text style={tw`text-base font-bold text-purple-900`}>{currentStep === STEPS.length - 1 ? i18n.t('onboarding.letsStart') : i18n.t('onboarding.continue')}</Text>
                <ChevronRight size={20} color="#581c87" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default OnboardingScreen;
