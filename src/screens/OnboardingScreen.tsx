// src/screens/OnboardingScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';

// Import steps
import WelcomeStep from '../components/onboarding/WelcomeStep';
import XPStep from '../components/onboarding/XPStep';
import TierStep from '../components/onboarding/TierStep';
import SaverStep from '../components/onboarding/SaverStep';
import FeaturesStep from '../components/onboarding/FeaturesStep';
import { useAuth } from '@/context/AuthContext';

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
  const [currentStep, setCurrentStep] = useState(0);

  const { completeOnboarding } = useAuth();

  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    // Reset opacity for fade in animation on step change
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 400 });
  }, [currentStep]);

  const goToNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < STEPS.length - 1) {
      goToNextStep();
    } else {
      await handleComplete();
    }
  };

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep > 0) {
      goToPrevStep();
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
    // Navigate to main tab navigator instead of Dashboard directly
    navigation.replace('HabitWizard' as any);
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const step = STEPS[currentStep];
  const StepComponent = step.component;

  return (
    <ImageBackground source={require('../../assets/interface/purple-background-stars.png')} style={tw`flex-1`} resizeMode="cover">
      {/* Overlay pour assombrir le fond */}
      <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />

      <StatusBar barStyle="light-content" />

      <SafeAreaView style={tw`flex-1`}>
        {/* Skip Button */}
        <View style={tw`flex-row justify-end px-6 pt-1`}>
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
            <Text style={tw`text-sm font-semibold text-white/90`}>Skip</Text>
          </Pressable>
        </View>

        {/* Progress Indicators */}
        <View style={tw`mt-3 flex-row justify-center gap-2 px-5`}>
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

        {/* Gemme avec shadow en haut */}
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(300)} key={`gem-${currentStep}`} style={tw`items-center mt-6 mb-4`}>
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
        <Animated.View style={[animatedContentStyle, tw`flex-1 justify-center px-8 pb-6`]}>
          <StepComponent gradient={step.gradient} />
        </Animated.View>

        {/* Bottom Navigation */}
        <View style={tw`px-8 pb-8`}>
          {currentStep === 0 ? (
            // Centré pour la première étape
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
              <Text style={tw`text-base font-bold text-purple-900`}>Continue</Text>
              <ChevronRight size={20} color="#581c87" strokeWidth={2.5} />
            </Pressable>
          ) : (
            // Avec bouton retour pour les autres étapes
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
                <Text style={tw`text-base font-bold text-purple-900`}>{currentStep === STEPS.length - 1 ? "Let's Start" : 'Continue'}</Text>
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
