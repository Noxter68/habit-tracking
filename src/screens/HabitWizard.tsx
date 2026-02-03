// src/screens/HabitWizard.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ImageBackground, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
import { getCategoryName } from '../utils/habitHelpers';
import { NotificationService } from '../services/notificationService';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { useAuth } from '@/context/AuthContext';
import Logger from '@/utils/logger';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitWizard'>;

const HabitWizard: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { t } = useTranslation();
  const { addHabit } = useHabits();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [previousCategory, setPreviousCategory] = useState<string | undefined>();

  const [isCustomHabit, setIsCustomHabit] = useState(false);
  const [customHabitName, setCustomHabitName] = useState('');
  const [customHabitIcon, setCustomHabitIcon] = useState('');
  const [customTasks, setCustomTasks] = useState<string[]>(['']);

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

  const totalSteps = useMemo(() => (isCustomHabit ? 7 : 6), [isCustomHabit]);
  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  useEffect(() => {
    const notificationStep = isCustomHabit ? 7 : 6;
    if (step === notificationStep) {
      NotificationService.registerForPushNotifications();
    }
  }, [step, isCustomHabit]);

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
    if (step === 1 && !habitData.type) {
      Alert.alert(t('wizard.alerts.selectType.title'), t('wizard.alerts.selectType.message'));
      return;
    }

    if (step === 2) {
      if (!isCustomHabit && !habitData.category) {
        Alert.alert(t('wizard.alerts.selectCategory.title'), t('wizard.alerts.selectCategory.message'));
        return;
      }
    }

    if (step === 3 && isCustomHabit) {
      if (customHabitName.trim().length === 0) {
        Alert.alert(t('wizard.alerts.habitNameRequired.title'), t('wizard.alerts.habitNameRequired.message'));
        return;
      }
      if (!customHabitIcon) {
        Alert.alert(t('wizard.alerts.iconRequired.title'), t('wizard.alerts.iconRequired.message'));
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4 && isCustomHabit) {
      const validTasks = customTasks.filter((t) => t.trim() !== '');
      if (validTasks.length === 0) {
        Alert.alert(t('wizard.alerts.tasksRequired.title'), t('wizard.alerts.tasksRequired.message'));
        return;
      }
      setHabitData((prev) => ({ ...prev, tasks: validTasks }));
      setStep(5);
      return;
    }

    if (step === 3 && !isCustomHabit) {
      if (!habitData.tasks || habitData.tasks.length === 0) {
        Alert.alert(t('wizard.alerts.selectTasks.title'), t('wizard.alerts.selectTasks.message'));
        return;
      }
    }

    if (isLastStep) {
      await createHabit();
      return;
    }

    setStep(step + 1);
  }, [step, habitData, isCustomHabit, customHabitName, customHabitIcon, customTasks, isLastStep, t]);

  const createHabit = async () => {
    setIsCreating(true);

    try {
      const habitName = isCustomHabit ? customHabitName : getCategoryName(habitData.category!, habitData.type!);
      const tasks = habitData.tasks || [];

      const newHabit: Habit = {
        id: Date.now().toString(),
        name: habitName,
        type: habitData.type || 'good',
        category: isCustomHabit ? 'custom' : habitData.category || 'health',
        tasks: tasks,
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
              Alert.alert(t('wizard.alerts.notificationsEnabled.title'), t('wizard.alerts.notificationsEnabled.message'), [{ text: t('wizard.alerts.notificationsEnabled.button') }]);
            }
          } else {
            newHabit.notifications = false;
            Alert.alert(t('wizard.alerts.notificationsDisabled.title'), t('wizard.alerts.notificationsDisabled.message'), [{ text: t('wizard.alerts.notificationsDisabled.button') }]);
          }
        }
      }

      await addHabit(newHabit);
      navigation.replace('MainTabs');
    } catch (error) {
      setIsCreating(false);
      Alert.alert(t('wizard.alerts.error.title'), t('wizard.alerts.error.message'));
      Logger.error('Error creating habit:', error);
    }
  };

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isCustomHabit) {
      if (step === 3) {
        setIsCustomHabit(false);
        setCustomHabitName('');
        setCustomHabitIcon('');
        setCustomTasks(['']);
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

  const handleExit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(t('wizard.alerts.exitWizard.title'), t('wizard.alerts.exitWizard.message'), [
      {
        text: t('wizard.alerts.exitWizard.cancel'),
        style: 'cancel',
      },
      {
        text: t('wizard.alerts.exitWizard.confirm'),
        style: 'destructive',
        onPress: () => {
          navigation.navigate('MainTabs', { screen: 'Dashboard' });
        },
      },
    ]);
  }, [navigation, t]);

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
              onSelect={(frequency, customDays) => setHabitData((prev) => ({ ...prev, frequency, customDays }))}
            />
          );
        case 6:
          return (
            <GoalSetting
              hasEndGoal={habitData.hasEndGoal || false}
              endGoalDays={habitData.endGoalDays}
              onChange={(hasEndGoal, days) => {
                // Si "Default 61 Days" est sélectionné (hasEndGoal=false), on stocke quand même 61 dans endGoalDays
                const effectiveDays = hasEndGoal ? days : 61;
                setHabitData((prev) => ({ ...prev, hasEndGoal, endGoalDays: effectiveDays, totalDays: effectiveDays || 61 }));
              }}
            />
          );
        case 7:
          return (
            <NotificationSetup
              enabled={habitData.notifications || false}
              time={habitData.notificationTime}
              onChange={(enabled, time) => setHabitData((prev) => ({ ...prev, notifications: enabled, notificationTime: time }))}
            />
          );
        default:
          return null;
      }
    }

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
              // Si "Default 61 Days" est sélectionné (hasEndGoal=false), on stocke quand même 61 dans endGoalDays
              const effectiveDays = hasEndGoal ? days : 61;
              setHabitData((prev) => ({ ...prev, hasEndGoal, endGoalDays: effectiveDays, totalDays: effectiveDays || 61 }));
            }}
          />
        );
      case 5:
        return (
          <FrequencySelector
            selected={habitData.frequency || 'daily'}
            customDays={habitData.customDays}
            onSelect={(frequency, customDays) => setHabitData((prev) => ({ ...prev, frequency, customDays }))}
          />
        );
      case 6:
        return (
          <NotificationSetup
            enabled={habitData.notifications || false}
            time={habitData.notificationTime}
            onChange={(enabled, time) => setHabitData((prev) => ({ ...prev, notifications: enabled, notificationTime: time }))}
          />
        );
      default:
        return null;
    }
  }, [step, isCustomHabit, habitData, customHabitName, customHabitIcon, customTasks, handleCreateCustom]);

  return (
    <ImageBackground source={require('../../assets/interface/variante-purple-background.png')} style={styles.background} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <View style={tw`flex-1`}>
          {/* Header - Exit & Back Buttons */}
          <View style={tw`px-6 pt-2 flex-row items-center ${isFirstStep ? 'justify-between' : 'justify-start'}`}>
            {/* Exit Button - Only visible on first step - with depth */}
            {isFirstStep && (
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 0,
                    right: 0,
                    bottom: -4,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 16,
                    width: 48,
                    height: 48,
                  }}
                />
                <Pressable
                  onPress={handleExit}
                  disabled={isCreating}
                  style={({ pressed }) => [
                    tw`w-12 h-12 items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 16,
                      transform: pressed ? [{ translateY: 2 }] : [{ translateY: 0 }],
                    },
                  ]}
                >
                  <X size={24} color="#ffffff" strokeWidth={2.5} />
                </Pressable>
              </View>
            )}

            {/* Back Button - Only visible when not on first step - with depth */}
            {!isFirstStep && (
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    left: 0,
                    right: 0,
                    bottom: -4,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: 16,
                    width: 48,
                    height: 48,
                  }}
                />
                <Pressable
                  onPress={handleBack}
                  disabled={isCreating}
                  style={({ pressed }) => [
                    tw`w-12 h-12 items-center justify-center`,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 16,
                      transform: pressed ? [{ translateY: 2 }] : [{ translateY: 0 }],
                    },
                  ]}
                >
                  <ChevronLeft size={24} color="#ffffff" strokeWidth={2.5} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView ref={scrollViewRef} style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`flex-grow`}>
            <View style={tw`flex-1`}>{renderStep()}</View>
          </ScrollView>

          {/* Progress Dots + Continue Button */}
          <View style={tw`px-6 pb-8`}>
            {/* Progress Dots */}
            <View style={tw`flex-row justify-center gap-2 mb-6`}>
              {Array.from({ length: totalSteps }).map((_, index) => (
                <View key={index} style={[tw`h-2 rounded-full transition-all`, index + 1 === step ? tw`w-8 bg-white` : tw`w-2 bg-white/30`]} />
              ))}
            </View>

            {/* Continue Button - with depth effect */}
            <View style={{ position: 'relative' }}>
              {/* Shadow layer for depth */}
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 0,
                  right: 0,
                  bottom: -4,
                  backgroundColor: isCreating ? 'rgba(0, 0, 0, 0.15)' : 'rgba(88, 28, 135, 0.5)',
                  borderRadius: 16,
                }}
              />
              <Pressable
                onPress={handleNext}
                disabled={isCreating}
                style={({ pressed }) => [
                  tw`py-4 px-8`,
                  {
                    backgroundColor: isCreating ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.98)',
                    borderRadius: 16,
                    transform: pressed && !isCreating ? [{ translateY: 2 }] : [{ translateY: 0 }],
                  },
                ]}
              >
                <Text style={[tw`text-lg font-bold text-center`, { color: isCreating ? 'rgba(88, 28, 135, 0.5)' : '#7c3aed' }]}>
                  {isCreating ? t('wizard.navigation.creating') : isLastStep ? t('wizard.navigation.createHabit') : t('wizard.navigation.continue')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export default HabitWizard;
