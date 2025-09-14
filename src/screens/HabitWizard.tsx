// src/screens/HabitWizard.tsx (Updated section without premium check)
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitWizard'>;

const HabitWizard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addHabit, habits } = useHabits();
  const [step, setStep] = useState(1);
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

  // Request notification permissions when reaching notification step
  useEffect(() => {
    if (step === 6) {
      NotificationService.registerForPushNotifications();
    }
  }, [step]);

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

      // Add habit to database
      await addHabit(newHabit);

      // Schedule notifications if enabled
      if (newHabit.notifications && newHabit.notificationTime) {
        await NotificationService.scheduleHabitNotifications(newHabit);
      }

      // Navigate to dashboard
      navigation.replace('MainTabs');
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
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4`}>
          <ProgressIndicator current={step} total={totalSteps} />
        </View>

        {/* Content */}
        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} key={step}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {/* Navigation */}
        <View style={tw`flex-row justify-between px-6 py-4 bg-white border-t border-slate-200`}>
          <Pressable onPress={handleBack} style={tw`px-6 py-3 rounded-xl bg-slate-100`}>
            <Text style={tw`text-slate-600 font-medium`}>{step === 1 ? 'Cancel' : 'Back'}</Text>
          </Pressable>

          <Pressable onPress={handleNext} style={({ pressed }) => [tw`px-8 py-3 rounded-xl bg-teal-600`, pressed && tw`bg-teal-700`]}>
            <Text style={tw`text-white font-medium`}>{step === totalSteps ? 'Create Habit' : 'Next'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HabitWizard;
