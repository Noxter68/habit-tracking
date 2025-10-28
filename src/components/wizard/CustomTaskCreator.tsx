// src/components/wizard/CustomTaskCreator.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Lightbulb, Plus, X } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface CustomTaskCreatorProps {
  habitType: HabitType;
  habitName: string;
  tasks: string[]; // ✅ Changed from CustomTask[] to string[]
  onTasksChange: (tasks: string[]) => void; // ✅ Changed from CustomTask[] to string[]
}

const CustomTaskCreator: React.FC<CustomTaskCreatorProps> = ({ habitType, habitName, tasks, onTasksChange }) => {
  const maxTasks = 3;
  const gradientColors = habitType === 'good' ? ['#fbbf24', '#f59e0b'] : ['#8b5cf6', '#7c3aed'];
  const primaryColor = habitType === 'good' ? '#fbbf24' : '#8b5cf6';
  const lightBg = habitType === 'good' ? '#fef3c7' : '#ede9fe';
  const darkColor = habitType === 'good' ? '#f59e0b' : '#7c3aed';

  // ✅ Add task - simple string
  const addTask = () => {
    if (tasks.length < maxTasks) {
      onTasksChange([...tasks, '']);
    }
  };

  // ✅ Remove task
  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      const newTasks = tasks.filter((_, i) => i !== index);
      onTasksChange(newTasks);
    }
  };

  // ✅ Update task - direct string assignment
  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    onTasksChange(newTasks);
  };

  // ✅ Count completed tasks
  const completedTasks = tasks.filter((t) => t.trim() !== '').length;

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={tw`flex-1`}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
          {/* Header */}
          <Animated.View entering={FadeInUp.duration(400)} style={tw`mb-5`}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
              <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Define Your Tasks</Text>
              <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>
                Create {maxTasks} specific daily actions for <Text style={tw`font-semibold`}>"{habitName}"</Text>
              </Text>

              <View style={tw`border-t border-white/20 pt-3 mt-1`}>
                <Text style={tw`text-xs text-white/70 italic leading-5`}>"Break down your goals into small, actionable steps. Progress compounds."</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Progress Indicator */}
          <Animated.View entering={FadeInUp.duration(400)} style={tw`mb-6`}>
            <View style={tw`flex-row items-center justify-between mb-2.5`}>
              <Text style={tw`text-sm font-medium text-stone-600`}>Tasks Created</Text>
              <Text style={tw`text-xs font-semibold text-stone-700`}>
                {completedTasks} of {maxTasks}
              </Text>
            </View>
            <View style={[tw`h-1.5 rounded-full overflow-hidden`, { backgroundColor: '#f5f5f5' }]}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${(completedTasks / maxTasks) * 100}%`,
                    backgroundColor: primaryColor,
                  },
                ]}
              />
            </View>
          </Animated.View>

          {/* Task Input Cards */}
          <View style={tw`gap-3.5 mb-5`}>
            {tasks.map((task, index) => (
              <Animated.View key={index} entering={FadeInDown.duration(300)}>
                <View style={[tw`bg-white rounded-2xl p-4.5`, { borderWidth: 1, borderColor: '#e5e7eb' }]}>
                  {/* Task Header */}
                  <View style={tw`flex-row items-center justify-between mb-3.5`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: lightBg }]}>
                        <Text style={[tw`text-sm font-bold`, { color: darkColor }]}>{index + 1}</Text>
                      </View>
                      <Text style={tw`text-base font-semibold text-stone-800`}>Task {index + 1}</Text>
                    </View>
                    {tasks.length > 1 && (
                      <Pressable onPress={() => removeTask(index)} style={({ pressed }) => [tw`w-8 h-8 bg-stone-50 rounded-xl items-center justify-center`, pressed && tw`bg-stone-100`]}>
                        <X size={16} color="#9ca3af" strokeWidth={2} />
                      </Pressable>
                    )}
                  </View>

                  {/* Task Name Input - ✅ Simplified */}
                  <View style={tw`mb-3.5`}>
                    <Text style={tw`text-sm font-medium text-stone-700 mb-2`}>Action</Text>
                    <TextInput
                      style={[
                        tw`px-4 py-4 text-base text-stone-800 rounded-xl`,
                        {
                          backgroundColor: '#fafafa',
                          borderWidth: 1,
                          borderColor: '#f0f0f0',
                        },
                      ]}
                      placeholder={habitType === 'good' ? `e.g., Write for 10 minutes` : `e.g., Go for a walk instead`}
                      placeholderTextColor="#9ca3af"
                      value={task} // ✅ Direct string value
                      onChangeText={(text) => updateTask(index, text)} // ✅ Direct update
                      maxLength={50}
                      returnKeyType="done"
                    />
                    <Text style={tw`text-xs text-stone-400 mt-1.5 text-right`}>{task.length}/50</Text>
                  </View>

                  {/* Completion Indicator */}
                  {task.trim() !== '' && (
                    <View style={[tw`flex-row items-center mt-3.5 pt-3.5`, { borderTopWidth: 1, borderTopColor: '#f5f5f5' }]}>
                      <CheckCircle2 size={16} color="#10b981" strokeWidth={2} style={tw`mr-2`} />
                      <Text style={tw`text-xs text-emerald-600 font-medium`}>Task complete</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Add Task Button */}
          {tasks.length < maxTasks && (
            <Animated.View entering={FadeInDown.duration(300)} style={tw`mb-5`}>
              <Pressable onPress={addTask} style={({ pressed }) => [tw`rounded-2xl bg-white p-5 items-center justify-center`, { borderWidth: 1, borderColor: '#e5e7eb' }, pressed && tw`bg-stone-50`]}>
                <View style={tw`w-12 h-12 bg-stone-100 rounded-full items-center justify-center mb-2.5`}>
                  <Plus size={22} color="#6B7280" strokeWidth={2.5} />
                </View>
                <Text style={tw`text-sm font-medium text-stone-700`}>Add Task {tasks.length + 1}</Text>
                <Text style={tw`text-xs text-stone-500 mt-1`}>Optional</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Tasks Summary */}
          {completedTasks === maxTasks && (
            <Animated.View entering={FadeInDown.duration(300)} style={tw`mb-5`}>
              <View style={[tw`rounded-2xl p-5`, { backgroundColor: '#fafafa', borderWidth: 1, borderColor: '#e5e7eb' }]}>
                <View style={tw`flex-row items-center mb-4`}>
                  <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: lightBg }]}>
                    <CheckCircle2 size={18} color={darkColor} strokeWidth={2.5} />
                  </View>
                  <Text style={tw`text-base font-semibold text-stone-800`}>Your Daily Commitment</Text>
                </View>

                <View style={tw`gap-2.5`}>
                  {tasks
                    .filter((t) => t.trim() !== '') // ✅ Direct string filtering
                    .map((task, index) => (
                      <View key={index} style={[tw`rounded-xl p-3.5`, { backgroundColor: 'white', borderWidth: 1, borderColor: '#f0f0f0' }]}>
                        <Text style={tw`text-sm font-medium text-stone-800 mb-1`}>
                          {index + 1}. {task} {/* ✅ Direct string display */}
                        </Text>
                      </View>
                    ))}
                </View>

                <View style={[tw`mt-4 pt-4`, { borderTopWidth: 1, borderTopColor: '#f0f0f0' }]}>
                  <Text style={tw`text-xs text-stone-600 leading-5`}>
                    {habitType === 'good'
                      ? `Completing these ${maxTasks} tasks daily will help you build this positive habit.`
                      : `Tracking these ${maxTasks} alternatives will help you overcome this habit.`}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Helpful Tip */}
          <View style={[tw`rounded-2xl p-4 border border-amber-200`, { backgroundColor: '#fef3c7' }]}>
            <View style={tw`flex-row items-center mb-2`}>
              <Lightbulb size={18} color="#78350f" strokeWidth={2} style={tw`mr-2`} />
              <Text style={tw`text-sm font-semibold text-amber-900`}>Task Design Tips</Text>
            </View>
            <Text style={tw`text-sm text-amber-800 leading-5`}>
              Make tasks specific, measurable, and achievable. Include time estimates when possible.
              {habitType === 'bad' && " For habits you're quitting, frame tasks as positive replacements."}
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default React.memo(CustomTaskCreator);
