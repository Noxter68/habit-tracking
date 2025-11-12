// src/components/wizard/CustomTaskCreator.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Plus, X, CheckCircle2 } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface CustomTaskCreatorProps {
  habitType: HabitType;
  habitName: string;
  tasks: string[];
  onTasksChange: (tasks: string[]) => void;
}

const CustomTaskCreator: React.FC<CustomTaskCreatorProps> = ({ habitType, habitName, tasks, onTasksChange }) => {
  const { t } = useTranslation();
  const maxTasks = 3;

  const addTask = () => {
    if (tasks.length < maxTasks) {
      onTasksChange([...tasks, '']);
    }
  };

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      onTasksChange(tasks.filter((_, i) => i !== index));
    }
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    onTasksChange(newTasks);
  };

  const completedTasks = tasks.filter((t) => t.trim() !== '').length;

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`} keyboardShouldPersistTaps="always">
        {/* Header */}
        <View style={tw`mb-8`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>{t('wizard.customTaskCreator.title')}</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>{t('wizard.customTaskCreator.subtitle', { habitName })}</Text>

          <View style={tw`mt-4 bg-white/10 rounded-xl px-4 py-2 self-center`}>
            <Text style={tw`text-sm text-white/90`}>
              {t('wizard.customTaskCreator.tasksDefined', {
                count: completedTasks,
                max: maxTasks,
              })}
            </Text>
          </View>
        </View>

        {/* Task Inputs */}
        <View style={tw`gap-4 mb-6`}>
          {tasks.map((task, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(index * 50).duration(300)}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`flex-1 bg-white/15 border-2 border-white/20 rounded-2xl px-5 py-4 flex-row items-center`}>
                  <CheckCircle2 size={20} color="rgba(255, 255, 255, 0.5)" strokeWidth={2} style={tw`mr-3`} />
                  <TextInput
                    value={task}
                    onChangeText={(value) => updateTask(index, value)}
                    placeholder={t('wizard.customTaskCreator.taskPlaceholder', {
                      number: index + 1,
                    })}
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    style={tw`flex-1 text-white text-base`}
                    maxLength={60}
                  />
                </View>

                {tasks.length > 1 && (
                  <Pressable
                    onPress={() => removeTask(index)}
                    style={({ pressed }) => [tw`w-12 h-12 rounded-xl bg-white/15 items-center justify-center border-2 border-white/20`, pressed && tw`opacity-70`]}
                  >
                    <X size={20} color="#ffffff" strokeWidth={2} />
                  </Pressable>
                )}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Add Task Button */}
        {tasks.length < maxTasks && (
          <Pressable onPress={addTask} style={({ pressed }) => [tw`bg-white/15 border-2 border-white/20 rounded-2xl py-4 flex-row items-center justify-center mb-6`, pressed && tw`opacity-70`]}>
            <Plus size={20} color="#ffffff" strokeWidth={2} style={tw`mr-2`} />
            <Text style={tw`text-white font-semibold`}>{t('wizard.customTaskCreator.addAnotherTask')}</Text>
          </Pressable>
        )}

        {/* Progress Preview */}
        {completedTasks > 0 && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={tw`bg-emerald-500/20 border-2 border-emerald-400/30 rounded-2xl p-5`}>
              <View style={tw`flex-row items-center mb-3`}>
                <CheckCircle2 size={20} color="#10b981" strokeWidth={2} style={tw`mr-2`} />
                <Text style={tw`text-white font-semibold`}>{t('wizard.customTaskCreator.tasksPreview')}</Text>
              </View>
              {tasks
                .filter((t) => t.trim() !== '')
                .map((task, index) => (
                  <View key={index} style={tw`flex-row items-center mb-2`}>
                    <View style={tw`w-2 h-2 rounded-full bg-emerald-400 mr-3`} />
                    <Text style={tw`text-sm text-white/90 flex-1`}>{task}</Text>
                  </View>
                ))}
            </View>
          </Animated.View>
        )}

        {/* Tip */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>{t('wizard.customTaskCreator.tip')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CustomTaskCreator;
