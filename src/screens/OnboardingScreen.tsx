import React, { useState, useEffect } from 'react';
import { View, Pressable, Text, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { ChevronRight, ChevronLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

import WelcomeStep from '../components/onboarding/WelcomeStep';
import XPStep from '../components/onboarding/XPStep';
import TierStep from '../components/onboarding/TierStep';
import SaverStep from '../components/onboarding/SaverStep';
import FeaturesStep from '../components/onboarding/FeaturesStep';
import UsernameStep from '../components/onboarding/UsernameStep';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

interface StepConfig {
  id: string;
  component: React.ComponentType<{
    gradient: string[];
    onUsernameChange?: (username: string, isValid: boolean) => void;
    onKeyboardVisibilityChange?: (isVisible: boolean) => void;
  }>;
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
  {
    id: 'username',
    component: UsernameStep,
    gradient: ['#ec4899', '#db2777', '#be185d'],
    gemColor: '#ec4899',
    gemSource: require('../../assets/interface/gems/ruby-gem.png'),
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { completeOnboarding, user } = useAuth();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Filtrer les steps selon le provider d'authentification
  // L'étape username n'est affichée que pour les utilisateurs Apple (qui n'ont pas choisi de username à l'inscription)
  const isAppleAuth = user?.app_metadata?.provider === 'apple';
  const steps = isAppleAuth ? STEPS : STEPS.filter(step => step.id !== 'username');

  const opacity = useSharedValue(0);
  const gemOpacity = useSharedValue(1);
  const gemScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  useEffect(() => {
    opacity.value = 0;
    opacity.value = withTiming(1, { duration: 400 });
    // Réinitialiser l'état du clavier quand on change de step
    gemOpacity.value = withTiming(1, { duration: 300 });
    gemScale.value = withTiming(1, { duration: 300 });
  }, [currentStep]);

  // Callback pour gérer la visibilité du clavier depuis UsernameStep
  const handleKeyboardVisibilityChange = (visible: boolean) => {
    setIsKeyboardVisible(visible);
    if (visible) {
      // Masquer la gemme quand le clavier apparaît
      gemOpacity.value = withTiming(0, { duration: 300 });
      gemScale.value = withTiming(0.8, { duration: 300 });
    } else {
      // Réafficher la gemme quand le clavier disparaît
      gemOpacity.value = withTiming(1, { duration: 300 });
      gemScale.value = withTiming(1, { duration: 300 });
    }
  };

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < steps.length - 1) {
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

    // Si on est sur le dernier step et que c'est l'étape username avec un pseudo valide, le sauvegarder en base de données
    const currentStepConfig = steps[currentStep];
    if (currentStepConfig.id === 'username' && isUsernameValid && username.trim()) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            username: username.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.id);

        if (error) {
          Logger.error('Error saving username:', error);
          // Continuer quand même vers le HabitWizard, l'utilisateur pourra mettre à jour son pseudo plus tard
        }
      } catch (error) {
        Logger.error('Exception saving username:', error);
      }
    }

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

  const animatedGemStyle = useAnimatedStyle(() => ({
    opacity: gemOpacity.value,
    transform: [{ scale: gemScale.value }],
  }));

  const step = steps[currentStep];
  const StepComponent = step.component;
  const isUsernameStep = step.id === 'username';
  const isLastStep = currentStep === steps.length - 1;

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
              {steps.map((_, index) => (
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
              <Text style={tw`text-sm font-semibold text-white/90`}>{t('onboarding.skip')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Gem - disparaît quand le clavier apparaît sur le step username */}
        <Animated.View
          key={`gem-${currentStep}`}
          style={[
            tw`items-center mt-4 mb-3`,
            isUsernameStep ? animatedGemStyle : {}
          ]}
        >
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

        {/* Contenu principal : affiche le composant de l'étape actuelle */}
        <Animated.View style={[animatedContentStyle, tw`flex-1 justify-center px-8`]}>
          <StepComponent
            gradient={step.gradient}
            onUsernameChange={(newUsername: string, isValid: boolean) => {
              setUsername(newUsername);
              setIsUsernameValid(isValid);
            }}
            onKeyboardVisibilityChange={isUsernameStep ? handleKeyboardVisibilityChange : undefined}
          />
        </Animated.View>

        {/* Navigation du bas : boutons pour naviguer entre les étapes */}
        <View style={tw`px-8 pb-8 pt-8`}>
          {currentStep === 0 ? (
            // Premier step : bouton pleine largeur sans retour arrière
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
              <Text style={tw`text-base font-bold text-purple-900`}>{t('onboarding.continue')}</Text>
              <ChevronRight size={20} color="#581c87" strokeWidth={2.5} />
            </Pressable>
          ) : (
            // Steps suivants : bouton retour + bouton continuer

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
                // Désactiver le bouton sur l'étape username si le pseudo n'est pas valide
                disabled={isUsernameStep && !isUsernameValid}
                style={({ pressed }) => [
                  tw`flex-1 h-14 rounded-full flex-row items-center justify-center gap-2`,
                  {
                    // Opacité réduite si le bouton est désactivé
                    backgroundColor: isUsernameStep && !isUsernameValid
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
                <Text style={[
                  tw`text-base font-bold`,
                  {
                    // Couleur atténuée si le bouton est désactivé
                    color: isUsernameStep && !isUsernameValid
                      ? 'rgba(88, 28, 135, 0.4)'
                      : '#581c87'
                  }
                ]}>
                  {isLastStep ? t('onboarding.letsStart') : t('onboarding.continue')}
                </Text>
                <ChevronRight
                  size={20}
                  color={isUsernameStep && !isUsernameValid ? 'rgba(88, 28, 135, 0.4)' : '#581c87'}
                  strokeWidth={2.5}
                />
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default OnboardingScreen;
