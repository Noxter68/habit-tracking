/**
 * TaskCategoryPicker Component
 *
 * Modal for selecting predefined tasks or creating custom tasks
 * - Two-step flow: Select predefined OR Create custom
 * - Maximum 3 tasks per habit
 * - Filters out already-added tasks to prevent duplicates
 * - Tier-themed UI with gradient buttons
 * - Animated task cards with staggered entrance
 * - Custom task with name and duration fields
 * - Smart keyboard management (hides buttons when keyboard visible)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Modal, ScrollView, Pressable, Alert, TextInput, KeyboardAvoidingView, Platform, ImageBackground, Keyboard } from 'react-native';
import { X, Plus, Check, AlertCircle, Sparkles, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { HabitType } from '@/types';
import { getTaskDefinitions } from '@/utils/habitTasksDatabase';
import { tierThemes } from '@/utils/tierTheme';
import { HabitService } from '@/services/habitService';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface TaskCategoryPickerProps {
  visible: boolean;
  habitId: string;
  habitCategory: string;
  habitType: HabitType;
  currentTaskCount: number;
  currentTier: 'Crystal' | 'Ruby' | 'Amethyst';
  tierColor: string;
  existingTaskIds?: string[]; // ✅ NOUVEAU: Liste des IDs de tâches déjà ajoutées
  onClose: () => void;
  onTasksUpdated: () => void;
}

type Step = 'select' | 'custom';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_TASKS = 3;
const CUSTOM_TASK_MAX_LENGTH = 60;

// ============================================================================
// COMPONENT
// ============================================================================

const TaskCategoryPicker: React.FC<TaskCategoryPickerProps> = ({
  visible,
  habitId,
  habitCategory,
  habitType,
  currentTaskCount,
  currentTier,
  tierColor,
  existingTaskIds = [], // ✅ Valeur par défaut
  onClose,
  onTasksUpdated,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // ============================================================================
  // STATE
  // ============================================================================

  const [step, setStep] = useState<Step>('select');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customTaskName, setCustomTaskName] = useState('');
  const [customTaskDuration, setCustomTaskDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const tierTheme = tierThemes[currentTier] || tierThemes.Crystal;
  const remainingSlots = MAX_TASKS - currentTaskCount;
  const canAddTasks = remainingSlots > 0;

  // Get task definitions from database
  const taskDefinitions = useMemo(() => getTaskDefinitions(habitCategory, habitType), [habitCategory, habitType]);

  // ✅ FIX: Filtrer les tâches déjà ajoutées + traduire
  const availableTasks = useMemo(() => {
    return taskDefinitions
      .filter((task) => !existingTaskIds.includes(task.id)) // ✅ Exclure les tâches existantes
      .map((task) => {
        const translationPath = `habitHelpers.tasks.${habitCategory}.${habitType}.${task.translationKey}`;
        const taskData = t(translationPath, { returnObjects: true }) as any;

        return {
          id: task.id,
          name: taskData?.name || task.id,
          description: taskData?.description || '',
          duration: taskData?.duration || '',
          icon: task.icon,
        };
      });
  }, [taskDefinitions, habitCategory, habitType, existingTaskIds, t]);

  // ============================================================================
  // EFFECTS - KEYBOARD MANAGEMENT
  // ============================================================================

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setIsKeyboardVisible(true));

    const keyboardDidHideListener = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setIsKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // ============================================================================
  // HANDLERS - TASK SELECTION
  // ============================================================================

  const toggleTask = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== taskId));
    } else if (selectedTasks.length < remainingSlots) {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const handleConfirm = async () => {
    if (selectedTasks.length === 0) {
      Alert.alert(t('taskManager.alerts.noTasksSelected.title'), t('taskManager.alerts.noTasksSelected.message'));
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), t('auth.notAuthenticated'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Add each selected task
      for (const taskId of selectedTasks) {
        const taskData = availableTasks.find((t) => t.id === taskId);

        if (taskData) {
          await HabitService.addTask(habitId, user.id, {
            id: taskData.id,
            name: taskData.name,
            description: taskData.description,
            duration: taskData.duration,
            category: habitCategory,
          });
        }
      }

      onTasksUpdated();
      handleClose();

      Alert.alert(t('taskManager.alerts.tasksAdded.title'), t('taskManager.alerts.tasksAdded.message', { count: selectedTasks.length }));
    } catch (error) {
      console.error('❌ Error adding tasks:', error);
      Alert.alert(t('common.error'), t('taskManager.alerts.errorAddingTasks'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // HANDLERS - CUSTOM TASK
  // ============================================================================

  const handleCreateCustomTask = async () => {
    if (customTaskName.trim().length === 0) {
      Alert.alert(t('taskManager.alerts.customTaskEmpty.title'), t('taskManager.alerts.customTaskEmpty.message'));
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), t('auth.notAuthenticated'));
      return;
    }

    setIsSubmitting(true);

    try {
      const customTaskId = `custom_${Date.now()}`;

      // Format duration if provided
      const duration = customTaskDuration.trim() ? `${customTaskDuration} min` : '';

      await HabitService.addTask(habitId, user.id, {
        id: customTaskId,
        name: customTaskName.trim(),
        description: t('taskManager.customTaskLabel'),
        duration: duration,
        category: 'custom',
      });

      onTasksUpdated();
      handleClose();

      Alert.alert(t('taskManager.alerts.taskAdded.title'), t('taskManager.alerts.taskAdded.message'));
    } catch (error) {
      console.error('❌ Error creating custom task:', error);
      Alert.alert(t('common.error'), t('taskManager.alerts.errorAddingTask'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // HANDLERS - NAVIGATION
  // ============================================================================

  const handleClose = () => {
    if (!isSubmitting) {
      setStep('select');
      setSelectedTasks([]);
      setCustomTaskName('');
      setCustomTaskDuration('');
      Keyboard.dismiss();
      onClose();
    }
  };

  const handleBack = () => {
    if (!isSubmitting) {
      if (step === 'custom') {
        setStep('select');
        setCustomTaskName('');
        setCustomTaskDuration('');
        Keyboard.dismiss();
      } else {
        handleClose();
      }
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={tw`flex-1 bg-black/50`}>
          <ImageBackground source={require('../../../assets/interface/textures/texture-white.png')} style={tw`flex-1 mt-20 rounded-t-3xl overflow-hidden`} imageStyle={{ opacity: 0.6 }}>
            <View style={tw`flex-1 bg-white/80`}>
              {/* ============================================================ */}
              {/* HEADER */}
              {/* ============================================================ */}

              <View style={tw`p-6 border-b border-stone-200`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-stone-900 text-xl font-bold`}>{step === 'select' ? t('taskManager.selectTasks') : t('taskManager.createCustomTask')}</Text>

                  <Pressable onPress={handleClose} disabled={isSubmitting} style={tw`w-10 h-10 items-center justify-center rounded-full bg-stone-100`}>
                    <X size={20} color="#292524" />
                  </Pressable>
                </View>

                {/* Status Info */}
                {step === 'select' && (
                  <>
                    {canAddTasks ? (
                      <View style={tw`flex-row items-center mt-2`}>
                        <Text style={tw`text-stone-600 text-sm`}>
                          {t('taskManager.selectedCount', {
                            count: selectedTasks.length,
                            max: remainingSlots,
                          })}
                        </Text>
                      </View>
                    ) : (
                      <View style={[tw`flex-row items-center p-3 rounded-xl mt-2`, { backgroundColor: '#fef2f2' }]}>
                        <AlertCircle size={20} color="#dc2626" style={tw`mr-2`} />
                        <Text style={tw`flex-1 text-red-600 text-sm`}>{t('taskManager.maxTasksReached')}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* ============================================================ */}
              {/* CONTENT */}
              {/* ============================================================ */}

              <ScrollView contentContainerStyle={tw`p-4`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Pressable onPress={() => Keyboard.dismiss()}>
                  {step === 'select' ? (
                    /* SELECT STEP */
                    !canAddTasks ? (
                      /* Max Tasks Reached */
                      <View style={tw`items-center justify-center py-12`}>
                        <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: '#fef2f2' }]}>
                          <AlertCircle size={32} color="#dc2626" />
                        </View>
                        <Text style={tw`text-stone-900 text-lg font-bold text-center mb-2`}>{t('taskManager.limitReached.title')}</Text>
                        <Text style={tw`text-stone-600 text-center px-8 leading-6`}>{t('taskManager.limitReached.message')}</Text>
                      </View>
                    ) : availableTasks.length === 0 ? (
                      /* ✅ Toutes les tâches déjà ajoutées */
                      <View style={tw`items-center justify-center py-12`}>
                        <View style={[tw`w-16 h-16 rounded-full items-center justify-center mb-4`, { backgroundColor: '#dcfce7' }]}>
                          <Check size={32} color="#16a34a" />
                        </View>
                        <Text style={tw`text-stone-900 text-lg font-bold text-center mb-2`}>All Tasks Added!</Text>
                        <Text style={tw`text-stone-600 text-center px-8 leading-6 mb-6`}>You've added all available tasks for this category. Create a custom task instead.</Text>

                        <Pressable
                          onPress={() => setStep('custom')}
                          style={({ pressed }) => [tw`flex-row items-center px-6 py-3 rounded-xl`, { backgroundColor: `${tierColor}15` }, pressed && tw`opacity-70`]}
                        >
                          <Sparkles size={20} color={tierColor} style={tw`mr-2`} />
                          <Text style={[tw`font-semibold`, { color: tierColor }]}>{t('taskManager.createCustomTask')}</Text>
                        </Pressable>
                      </View>
                    ) : (
                      /* Task Selection */
                      <View style={tw`gap-3`}>
                        {/* Predefined Tasks */}
                        {availableTasks.map((task, index) => {
                          const isSelected = selectedTasks.includes(task.id);
                          const IconComponent = task.icon;
                          const isDisabled = !isSelected && selectedTasks.length >= remainingSlots;

                          return (
                            <Animated.View key={task.id} entering={FadeInDown.delay(index * 30).duration(300)}>
                              <Pressable
                                onPress={() => toggleTask(task.id)}
                                disabled={isDisabled || isSubmitting}
                                style={({ pressed }) => [
                                  tw`rounded-2xl p-4 flex-row items-center border-2`,
                                  {
                                    backgroundColor: isSelected ? `${tierColor}10` : 'white',
                                    borderColor: isSelected ? tierColor : '#e7e5e4',
                                  },
                                  (isDisabled || isSubmitting) && tw`opacity-40`,
                                  pressed && !isDisabled && !isSubmitting && tw`opacity-70`,
                                ]}
                              >
                                {/* Icon */}
                                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: isSelected ? `${tierColor}20` : '#f5f5f4' }]}>
                                  {IconComponent && <IconComponent size={24} color={tierColor} strokeWidth={2} />}
                                </View>

                                {/* Task Info */}
                                <View style={tw`flex-1 mr-3`}>
                                  <Text style={tw`text-base font-semibold text-stone-900 mb-1`}>{task.name}</Text>
                                  <Text style={tw`text-sm text-stone-600 leading-5 mb-1`}>{task.description}</Text>
                                  <Text style={tw`text-xs text-stone-500`}>{task.duration}</Text>
                                </View>

                                {/* Checkbox */}
                                <View
                                  style={[tw`w-7 h-7 rounded-full items-center justify-center border-2`, isSelected ? [{ backgroundColor: tierColor, borderColor: tierColor }] : tw`border-stone-300`]}
                                >
                                  {isSelected && <Check size={16} color="white" strokeWidth={3} />}
                                </View>
                              </Pressable>
                            </Animated.View>
                          );
                        })}

                        {/* Divider */}
                        <View style={tw`flex-row items-center my-4`}>
                          <View style={tw`flex-1 h-px bg-stone-200`} />
                          <Text style={tw`px-4 text-xs text-stone-400 font-medium`}>{t('common.or').toUpperCase()}</Text>
                          <View style={tw`flex-1 h-px bg-stone-200`} />
                        </View>

                        {/* Create Custom Task Button */}
                        <Pressable
                          onPress={() => setStep('custom')}
                          disabled={isSubmitting}
                          style={({ pressed }) => [
                            tw`rounded-2xl p-4 flex-row items-center border-2 border-stone-200`,
                            { backgroundColor: 'white' },
                            isSubmitting && tw`opacity-40`,
                            pressed && !isSubmitting && tw`opacity-70`,
                          ]}
                        >
                          <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: `${tierColor}15` }]}>
                            <Sparkles size={24} color={tierColor} strokeWidth={2} />
                          </View>

                          <View style={tw`flex-1`}>
                            <Text style={tw`text-base font-semibold text-stone-900 mb-1`}>{t('taskManager.createCustomTask')}</Text>
                            <Text style={tw`text-sm text-stone-600 leading-5`}>{t('taskManager.createCustomTaskDescription')}</Text>
                          </View>
                        </Pressable>
                      </View>
                    )
                  ) : (
                    /* CUSTOM STEP */
                    <View style={tw`pt-6 px-2`}>
                      {/* Icon Circle */}
                      <View style={tw`items-center mb-8`}>
                        <View style={[tw`w-20 h-20 rounded-full items-center justify-center`, { backgroundColor: `${tierColor}10` }]}>
                          <Sparkles size={36} color={tierColor} strokeWidth={2} />
                        </View>
                      </View>

                      {/* Task Name Input */}
                      <View style={tw`mb-4`}>
                        <Text style={tw`text-stone-900 font-semibold text-base mb-3`}>{t('taskManager.customTaskNameLabel')}</Text>

                        <View style={tw`bg-stone-50 rounded-2xl px-5 py-4 border border-stone-200`}>
                          <TextInput
                            value={customTaskName}
                            onChangeText={setCustomTaskName}
                            placeholder={t('taskManager.customTaskPlaceholder')}
                            placeholderTextColor="#a8a29e"
                            style={tw`text-base text-stone-900 py-1`}
                            maxLength={CUSTOM_TASK_MAX_LENGTH}
                            autoFocus
                            editable={!isSubmitting}
                            returnKeyType="next"
                            keyboardAppearance="light"
                          />
                        </View>

                        <Text style={tw`text-xs text-stone-400 mt-2 text-right`}>
                          {customTaskName.length}/{CUSTOM_TASK_MAX_LENGTH}
                        </Text>
                      </View>

                      {/* Duration Input */}
                      <View style={tw`mb-6`}>
                        <Text style={tw`text-stone-900 font-semibold text-base mb-3`}>{t('taskManager.customTaskDurationLabel')}</Text>

                        <View style={tw`bg-stone-50 rounded-2xl px-5 py-4 border border-stone-200 flex-row items-center`}>
                          <Clock size={20} color="#a8a29e" style={tw`mr-3`} />
                          <TextInput
                            value={customTaskDuration}
                            onChangeText={(text) => {
                              const numericText = text.replace(/[^0-9]/g, '');
                              setCustomTaskDuration(numericText);
                            }}
                            placeholder={t('taskManager.customTaskDurationPlaceholder')}
                            placeholderTextColor="#a8a29e"
                            style={tw`text-base text-stone-900 py-1 flex-1`}
                            keyboardType="number-pad"
                            keyboardAppearance="light"
                            maxLength={3}
                            editable={!isSubmitting}
                          />
                          <Text style={tw`text-stone-500 text-base ml-2`}>min</Text>
                        </View>

                        <Text style={tw`text-xs text-stone-400 mt-2`}>{t('taskManager.customTaskDurationHint')}</Text>
                      </View>

                      {/* Subtle Tip */}
                      <View style={tw`bg-stone-50 rounded-xl p-4`}>
                        <Text style={tw`text-sm text-stone-600 leading-6`}>
                          <Text style={tw`font-semibold`}>Tip:</Text> {t('taskManager.customTaskTip')}
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              </ScrollView>

              {/* ============================================================ */}
              {/* FOOTER BUTTONS */}
              {/* ============================================================ */}

              {canAddTasks && !isKeyboardVisible && (
                <View style={tw`p-6 border-t border-stone-200 gap-3`}>
                  {step === 'select' ? (
                    /* SELECT STEP BUTTONS */
                    <>
                      {/* Confirm Button */}
                      <View
                        style={{
                          borderRadius: 16,
                          overflow: 'hidden',
                          shadowColor: tierColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Pressable
                            onPress={handleConfirm}
                            disabled={selectedTasks.length === 0 || isSubmitting}
                            style={[tw`flex-row items-center justify-center py-4`, (selectedTasks.length === 0 || isSubmitting) && { opacity: 0.5 }]}
                          >
                            <Plus size={20} color="white" />
                            <Text style={tw`text-white font-semibold text-base ml-2`}>{isSubmitting ? t('common.loading') : t('taskManager.addTasks', { count: selectedTasks.length })}</Text>
                          </Pressable>
                        </LinearGradient>
                      </View>

                      {/* Cancel Button */}
                      <Pressable onPress={handleClose} disabled={isSubmitting} style={[tw`flex-row items-center justify-center py-4 rounded-2xl bg-stone-100`, isSubmitting && tw`opacity-40`]}>
                        <Text style={tw`text-stone-900 font-semibold text-base`}>{t('common.cancel')}</Text>
                      </Pressable>
                    </>
                  ) : (
                    /* CUSTOM STEP BUTTONS */
                    <>
                      {/* Create Button */}
                      <View
                        style={{
                          borderRadius: 16,
                          overflow: 'hidden',
                          shadowColor: tierColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                          <Pressable
                            onPress={handleCreateCustomTask}
                            disabled={customTaskName.trim().length === 0 || isSubmitting}
                            style={[tw`flex-row items-center justify-center py-4`, (customTaskName.trim().length === 0 || isSubmitting) && { opacity: 0.5 }]}
                          >
                            <Plus size={20} color="white" />
                            <Text style={tw`text-white font-semibold text-base ml-2`}>{isSubmitting ? t('common.loading') : t('taskManager.createTask')}</Text>
                          </Pressable>
                        </LinearGradient>
                      </View>

                      {/* Back Button */}
                      <Pressable onPress={handleBack} disabled={isSubmitting} style={[tw`flex-row items-center justify-center py-4 rounded-2xl bg-stone-100`, isSubmitting && tw`opacity-40`]}>
                        <Text style={tw`text-stone-900 font-semibold text-base`}>{t('common.back')}</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          </ImageBackground>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TaskCategoryPicker;
