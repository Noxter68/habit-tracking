// src/screens/HabitWizard.tsx (Improved Navigation Section)
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { Habit, HabitType } from '../types';
import { useHabits } from '../context/HabitContext';
import { RootStackParamList } from '../../App';

import HabitCategorySelector from '../components/wizard/HabitCategorySelector';
import TaskSelector from '../components/wizard/TaskSelector';
import GoalSetting from '../components/wizard/GoalSetting';
import FrequencySelector from '../components/wizard/FrequencySelector';
import NotificationSetup from '../components/wizard/NotificationSetup';
import ProgressIndicator from '../components/ProgressIndicator';
import { getCategoryName } from '../utils/habitHelpers';
import { NotificationService } from '../services/notificationService';
import HabitTypeCards from '@/components/wizard/HabitTypeSelector';
import { LinearGradient } from 'expo-linear-gradient';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitWizard'>;

const HabitWizard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addHabit, habits } = useHabits();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [previousCategory, setPreviousCategory] = useState<string | undefined>();

  const [habitData, setHabitData] = useState<Partial<Habit>>({
    frequency: 'daily',
    notifications: false,
    currentStreak: 0,
    bestStreak: 0,
    completedDays: [],
    totalDays: 61,
    tasks: [],
    dailyTasks: {},
  });

  const totalSteps = 6;
  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;

  // Request notification permissions when reaching notification step
  useEffect(() => {
    if (step === 6) {
      NotificationService.registerForPushNotifications();
    }
  }, [step]);

  // CRITICAL FIX: Reset tasks when category changes
  useEffect(() => {
    if (habitData.category && habitData.category !== previousCategory) {
      // Category has changed, reset the tasks
      setHabitData((prev) => ({ ...prev, tasks: [] }));
      setPreviousCategory(habitData.category);
    }
  }, [habitData.category, previousCategory]);

  const handleNext = async () => {
    // Validation
    if (step === 1 && !habitData.type) {
      Alert.alert('Please select', 'Choose whether you want to build or quit a habit');
      return;
    }
    if (step === 2 && !habitData.category) {
      Alert.alert('Please select', 'Choose a category for your habit');
      return;
    }
    if (step === 3 && (!habitData.tasks || habitData.tasks.length === 0)) {
      Alert.alert('Please select', 'Choose at least one task to track');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsCreating(true);

      // Auto-generate name based on category and type
      const habitName = getCategoryName(habitData.category!, habitData.type!);

      // Create the habit
      const newHabit: Habit = {
        id: Date.now().toString(),
        name: habitName,
        type: habitData.type || 'good',
        category: habitData.category || 'health',
        tasks: habitData.tasks || [],
        dailyTasks: {},
        frequency: habitData.frequency || 'daily',
        notifications: habitData.notifications || false,
        notificationTime: habitData.notificationTime,
        hasEndGoal: habitData.hasEndGoal || false,
        endGoalDays: habitData.endGoalDays,
        totalDays: habitData.totalDays || 61,
        currentStreak: 0,
        bestStreak: 0,
        completedDays: [],
        createdAt: new Date(),
        customDays: habitData.customDays,
      };

      try {
        // Add habit to database
        await addHabit(newHabit);

        // Schedule notifications if enabled
        if (newHabit.notifications && newHabit.notificationTime) {
          await NotificationService.scheduleHabitNotifications(newHabit);
        }

        // Navigate to dashboard
        navigation.replace('MainTabs');
      } catch (error) {
        setIsCreating(false);
        Alert.alert('Error', 'Failed to create habit. Please try again.');
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <HabitTypeCards selected={habitData.type} onSelect={(type) => setHabitData({ ...habitData, type })} />;
      case 2:
        return <HabitCategorySelector habitType={habitData.type!} selected={habitData.category} onSelect={(category) => setHabitData({ ...habitData, category })} />;
      case 3:
        return <TaskSelector category={habitData.category!} habitType={habitData.type!} selectedTasks={habitData.tasks || []} onSelectTasks={(tasks) => setHabitData({ ...habitData, tasks })} />;
      case 4:
        return (
          <GoalSetting
            hasEndGoal={habitData.hasEndGoal || false}
            endGoalDays={habitData.endGoalDays}
            onChange={(hasEndGoal, days) => {
              setHabitData({
                ...habitData,
                hasEndGoal,
                endGoalDays: days,
                totalDays: days || 61,
              });
            }}
          />
        );
      case 5:
        return (
          <FrequencySelector
            selected={habitData.frequency || 'daily'}
            customDays={habitData.customDays}
            onSelect={(frequency, customDays) => {
              setHabitData({ ...habitData, frequency, customDays });
            }}
          />
        );
      case 6:
        return (
          <NotificationSetup
            enabled={habitData.notifications || false}
            time={habitData.notificationTime}
            onChange={(enabled, time) => {
              setHabitData({ ...habitData, notifications: enabled, notificationTime: time });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-5 py-4`}>
          <ProgressIndicator current={step} total={totalSteps} />
        </View>
        {/* Content */}
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-4`}>
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} key={step}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        <View style={tw`bg-quartz-50 border-t border-quartz-200`}>
          <ImageBackground source={require('../../assets/interface/quartz-texture.png')} style={tw`px-5 py-4`} imageStyle={{ opacity: 0.05 }} resizeMode="cover">
            <View style={tw`flex-row gap-3`}>
              {/* Back/Cancel Button */}
              <Pressable
                onPress={handleBack}
                disabled={isCreating}
                style={({ pressed }) => [tw`flex-1 py-4 rounded-2xl`, tw`bg-sand border border-quartz-200`, pressed && tw`opacity-80`, isCreating && tw`opacity-50`]}
              >
                <View style={tw`flex-row items-center justify-center`}>
                  {isFirstStep ? (
                    <>
                      <X size={18} color="#6B7280" style={tw`mr-2`} />
                      <Text style={tw`text-quartz-600 font-medium text-base`}>Cancel</Text>
                    </>
                  ) : (
                    <>
                      <ChevronLeft size={18} color="#6B7280" style={tw`mr-1.5`} />
                      <Text style={tw`text-quartz-600 font-medium text-base`}>Back</Text>
                    </>
                  )}
                </View>
              </Pressable>

              {/* Next/Create Button */}
              <Pressable onPress={handleNext} disabled={isCreating} style={({ pressed }) => [tw`flex-1 py-4 rounded-2xl overflow-hidden`, pressed && tw`opacity-90`, isCreating && tw`opacity-50`]}>
                <LinearGradient colors={isLastStep ? ['#9CA3AF', '#6B7280'] : ['#6B7280', '#4B5563']} style={tw`absolute inset-0`} />
                <View style={tw`flex-row items-center justify-center`}>
                  {isCreating ? (
                    <Text style={tw`text-white font-medium text-base`}>Creating...</Text>
                  ) : isLastStep ? (
                    <>
                      <Check size={18} color="#ffffff" style={tw`mr-2`} />
                      <Text style={tw`text-white font-medium text-base`}>Create Habit</Text>
                    </>
                  ) : (
                    <>
                      <Text style={tw`text-white font-medium text-base`}>Continue</Text>
                      <ChevronRight size={18} color="#ffffff" style={tw`ml-1.5`} />
                    </>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Step Indicator Text */}
            <View style={tw`mt-3 items-center`}>
              <Text style={tw`text-xs text-quartz-500 font-light`}>
                Step {step} of {totalSteps}
              </Text>
            </View>
          </ImageBackground>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HabitWizard;
