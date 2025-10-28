// src/screens/HabitWizard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';
import { Habit, HabitType } from '../types';
import { useHabits } from '../context/HabitContext';
import { RootStackParamList } from '../../App';

import HabitTypeCards from '@/components/wizard/HabitTypeSelector';
import HabitCategorySelector from '../components/wizard/HabitCategorySelector';
import CustomHabitCreator from '../components/wizard/CustomHabitCreator';
import CustomTaskCreator from '../components/wizard/CustomTaskCreator';
import TaskSelector from '../components/wizard/TaskSelector';
import GoalSetting from '../components/wizard/GoalSetting';
import FrequencySelector from '../components/wizard/FrequencySelector';
import NotificationSetup from '../components/wizard/NotificationSetup';
import ProgressIndicator from '../components/ProgressIndicator';
import { getCategoryName } from '../utils/habitHelpers';
import { NotificationService } from '../services/notificationService';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { useAuth } from '@/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitWizard'>;

const HabitWizard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { addHabit } = useHabits();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [previousCategory, setPreviousCategory] = useState<string | undefined>();

  // Custom habit state - ✅ SIMPLIFIED: Just string array
  const [isCustomHabit, setIsCustomHabit] = useState(false);
  const [customHabitName, setCustomHabitName] = useState('');
  const [customHabitIcon, setCustomHabitIcon] = useState('');
  const [customTasks, setCustomTasks] = useState<string[]>(['']); // ✅ Changed from CustomTask[] to string[]

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

  // Memoized calculations
  const totalSteps = useMemo(() => (isCustomHabit ? 7 : 6), [isCustomHabit]);
  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;

  // Scroll to top when step changes
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  // Request notification permissions when reaching notification step
  useEffect(() => {
    const notificationStep = isCustomHabit ? 7 : 6;
    if (step === notificationStep) {
      NotificationService.registerForPushNotifications();
    }
  }, [step, isCustomHabit]);

  // Reset tasks when category changes (for standard habits)
  useEffect(() => {
    if (habitData.category && habitData.category !== previousCategory && !isCustomHabit) {
      setHabitData((prev) => ({ ...prev, tasks: [] }));
      setPreviousCategory(habitData.category);
    }
  }, [habitData.category, previousCategory, isCustomHabit]);

  const handleCreateCustom = useCallback(() => {
    setIsCustomHabit(true);
    setHabitData((prev) => ({ ...prev, category: 'custom' }));
    setStep(3);
  }, []);

  const handleNext = useCallback(async () => {
    // Step 1: Habit Type Selection
    if (step === 1 && !habitData.type) {
      Alert.alert('Please select', 'Choose whether you want to build or quit a habit');
      return;
    }

    // Step 2: Category Selection (or custom creation trigger)
    if (step === 2) {
      if (!isCustomHabit && !habitData.category) {
        Alert.alert('Please select', 'Choose a category for your habit');
        return;
      }
    }

    // Step 3: Custom Habit Creation (name & icon)
    if (step === 3 && isCustomHabit) {
      if (customHabitName.trim().length === 0) {
        Alert.alert('Habit name required', 'Please enter a name for your habit');
        return;
      }
      if (!customHabitIcon) {
        Alert.alert('Icon required', 'Please select an icon for your habit');
        return;
      }
      setStep(4);
      return;
    }

    // Step 4: Custom Task Creation - ✅ SIMPLIFIED
    if (step === 4 && isCustomHabit) {
      const validTasks = customTasks.filter((t) => t.trim() !== '');
      if (validTasks.length === 0) {
        Alert.alert('Tasks required', 'Please create at least one task for your habit');
        return;
      }
      // ✅ Store task names directly
      setHabitData((prev) => ({ ...prev, tasks: validTasks }));
      setStep(5);
      return;
    }

    // Step 3 (standard): Task Selection - only for standard habits
    if (step === 3 && !isCustomHabit) {
      if (!habitData.tasks || habitData.tasks.length === 0) {
        Alert.alert('Please select', 'Choose at least one task to track');
        return;
      }
    }

    // Final step: Create habit
    if (isLastStep) {
      await createHabit();
      return;
    }

    // Move to next step
    setStep(step + 1);
  }, [step, habitData, isCustomHabit, customHabitName, customHabitIcon, customTasks, isLastStep]);

  const createHabit = async () => {
    setIsCreating(true);

    try {
      const habitName = isCustomHabit ? customHabitName : getCategoryName(habitData.category!, habitData.type!);

      // ✅ SIMPLIFIED: Both habit types now store tasks the same way
      // For custom habits, tasks are already stored as string[] in habitData.tasks
      // For pre-defined habits, tasks are also string[]
      const tasks = habitData.tasks || [];

      console.log('📝 Creating habit with tasks:', tasks);

      const newHabit: Habit = {
        id: Date.now().toString(),
        name: habitName,
        type: habitData.type || 'good',
        category: isCustomHabit ? 'custom' : habitData.category || 'health',
        tasks: tasks, // ✅ Simple string array for both types
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
        ...(isCustomHabit && {
          customIcon: customHabitIcon,
          isCustom: true,
        }),
      };

      if (user?.id) {
        const { isFirstHabit, permissionRequested, permissionGranted } = await NotificationPreferencesService.handleFirstHabitCreation(user.id);

        if (isFirstHabit && permissionRequested) {
          if (permissionGranted) {
            if (habitData.notifications) {
              Alert.alert('Notifications Enabled! 🔔', "You'll receive reminders to help you stay on track with your new habit.", [{ text: 'Great!' }]);
            }
          } else {
            newHabit.notifications = false;
            Alert.alert('Notifications Disabled', 'You can enable notifications later in Settings if you change your mind.', [{ text: 'OK' }]);
          }
        }
      }

      await addHabit(newHabit);

      if (newHabit.notifications && newHabit.notificationTime && user) {
        await NotificationService.scheduleSmartHabitNotifications(newHabit, user?.id);
      }

      navigation.replace('MainTabs');
    } catch (error) {
      setIsCreating(false);
      Alert.alert('Error', 'Failed to create habit. Please try again.');
      console.error('Error creating habit:', error);
    }
  };

  const handleBack = useCallback(() => {
    if (isCustomHabit) {
      if (step === 3) {
        setIsCustomHabit(false);
        setCustomHabitName('');
        setCustomHabitIcon('');
        setCustomTasks(['']); // ✅ Reset to empty string array
        setStep(2);
      } else if (step > 1) {
        setStep(step - 1);
      } else {
        navigation.goBack();
      }
    } else {
      if (step > 1) {
        setStep(step - 1);
      } else {
        navigation.goBack();
      }
    }
  }, [step, isCustomHabit, navigation]);

  const renderStep = useCallback(() => {
    if (isCustomHabit) {
      switch (step) {
        case 1:
          return <HabitTypeCards selected={habitData.type} onSelect={(type) => setHabitData((prev) => ({ ...prev, type }))} />;
        case 2:
          return (
            <HabitCategorySelector
              habitType={habitData.type!}
              selected={habitData.category}
              onSelect={(category) => setHabitData((prev) => ({ ...prev, category }))}
              onCreateCustom={handleCreateCustom}
            />
          );
        case 3:
          return <CustomHabitCreator habitType={habitData.type!} habitName={customHabitName} selectedIcon={customHabitIcon} onNameChange={setCustomHabitName} onIconSelect={setCustomHabitIcon} />;
        case 4:
          return <CustomTaskCreator habitType={habitData.type!} habitName={customHabitName} tasks={customTasks} onTasksChange={setCustomTasks} />;
        case 5:
          return (
            <FrequencySelector
              selected={habitData.frequency || 'daily'}
              customDays={habitData.customDays}
              onSelect={(frequency, customDays) => {
                setHabitData((prev) => ({ ...prev, frequency, customDays }));
              }}
            />
          );
        case 6:
          return (
            <GoalSetting
              hasEndGoal={habitData.hasEndGoal || false}
              endGoalDays={habitData.endGoalDays}
              onChange={(hasEndGoal, days) => {
                setHabitData((prev) => ({
                  ...prev,
                  hasEndGoal,
                  endGoalDays: days,
                  totalDays: days || 61,
                }));
              }}
            />
          );
        case 7:
          return (
            <NotificationSetup
              enabled={habitData.notifications || false}
              time={habitData.notificationTime}
              onChange={(enabled, time) => {
                setHabitData((prev) => ({ ...prev, notifications: enabled, notificationTime: time }));
              }}
            />
          );
        default:
          return null;
      }
    }

    // Standard habit flow
    switch (step) {
      case 1:
        return <HabitTypeCards selected={habitData.type} onSelect={(type) => setHabitData((prev) => ({ ...prev, type }))} />;
      case 2:
        return (
          <HabitCategorySelector
            habitType={habitData.type!}
            selected={habitData.category}
            onSelect={(category) => setHabitData((prev) => ({ ...prev, category }))}
            onCreateCustom={handleCreateCustom}
          />
        );
      case 3:
        return (
          <TaskSelector category={habitData.category!} habitType={habitData.type!} selectedTasks={habitData.tasks || []} onSelectTasks={(tasks) => setHabitData((prev) => ({ ...prev, tasks }))} />
        );
      case 4:
        return (
          <GoalSetting
            hasEndGoal={habitData.hasEndGoal || false}
            endGoalDays={habitData.endGoalDays}
            onChange={(hasEndGoal, days) => {
              setHabitData((prev) => ({
                ...prev,
                hasEndGoal,
                endGoalDays: days,
                totalDays: days || 61,
              }));
            }}
          />
        );
      case 5:
        return (
          <FrequencySelector
            selected={habitData.frequency || 'daily'}
            customDays={habitData.customDays}
            onSelect={(frequency, customDays) => {
              setHabitData((prev) => ({ ...prev, frequency, customDays }));
            }}
          />
        );
      case 6:
        return (
          <NotificationSetup
            enabled={habitData.notifications || false}
            time={habitData.notificationTime}
            onChange={(enabled, time) => {
              setHabitData((prev) => ({ ...prev, notifications: enabled, notificationTime: time }));
            }}
          />
        );
      default:
        return null;
    }
  }, [step, isCustomHabit, habitData, customHabitName, customHabitIcon, customTasks, handleCreateCustom]);

  // Memoize gradient colors
  const gradientColors = useMemo(() => {
    if (step === 1) return ['#8b5cf6', '#7c3aed'];
    if (step === 2) return habitData.type === 'good' ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626'];
    if (isCustomHabit && (step === 3 || step === 4)) return habitData.type === 'good' ? ['#06b6d4', '#0891b2'] : ['#f97316', '#ea580c'];
    if ((isCustomHabit && step === 5) || (!isCustomHabit && step === 3)) return habitData.type === 'good' ? ['#fbbf24', '#f59e0b'] : ['#8b5cf6', '#7c3aed'];
    if ((isCustomHabit && step === 6) || (!isCustomHabit && step === 4)) return ['#ef4444', '#dc2626'];
    if (!isCustomHabit && step === 5) return ['#06b6d4', '#0891b2'];
    if ((isCustomHabit && step === 7) || (!isCustomHabit && step === 6)) return ['#fbbf24', '#f59e0b'];
    return ['#8b5cf6', '#7c3aed'];
  }, [step, habitData.type, isCustomHabit]);

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`} edges={['top']}>
      <View style={tw`flex-1`}>
        {/* Header with Progress */}
        <View style={tw`px-5 py-4`}>
          <ProgressIndicator current={step} total={totalSteps} />
        </View>

        {/* Content */}
        <ScrollView ref={scrollViewRef} style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-4 mt-4`}>
          <View style={tw`flex-1`}>{renderStep()}</View>
        </ScrollView>

        {/* Navigation Footer */}
        <View style={tw`bg-white border-t border-quartz-200 pb-0`}>
          <View style={tw`px-5 pt-4 pb-2`}>
            <View style={tw`flex-row gap-3`}>
              {/* Back/Cancel Button */}
              <Pressable
                onPress={handleBack}
                disabled={isCreating}
                style={({ pressed }) => [tw`flex-1 py-4 rounded-2xl bg-stone-100 border border-stone-200`, pressed && tw`opacity-80`, isCreating && tw`opacity-50`]}
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
                <LinearGradient colors={gradientColors} style={tw`absolute inset-0`} />
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
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HabitWizard;
