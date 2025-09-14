// src/components/wizard/TaskSelector.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';
import { getTasksForCategory } from '@/utils/habitHelpers';

interface TaskSelectorProps {
  category: string;
  habitType: HabitType;
  selectedTasks: string[];
  onSelectTasks: (tasks: string[]) => void;
}

const TaskSelector: React.FC<TaskSelectorProps> = ({ category, habitType, selectedTasks, onSelectTasks }) => {
  const availableTasks = getTasksForCategory(category, habitType);
  const maxTasks = 3;

  const toggleTask = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      // Remove task
      onSelectTasks(selectedTasks.filter((t) => t !== taskId));
    } else {
      // Add task if under limit
      if (selectedTasks.length < maxTasks) {
        onSelectTasks([...selectedTasks, taskId]);
      }
    }
  };

  return (
    <View style={tw`px-6`}>
      <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>Choose Your Daily Tasks</Text>
      <Text style={tw`text-slate-600 mb-2`}>Select up to {maxTasks} specific tasks to track daily</Text>
      <Text style={tw`text-sm text-slate-500 mb-6`}>
        {selectedTasks.length}/{maxTasks} selected
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {availableTasks.map((task, index) => {
          const isSelected = selectedTasks.includes(task.id);
          const isDisabled = !isSelected && selectedTasks.length >= maxTasks;

          return (
            <Animated.View key={task.id} entering={FadeInDown.delay(index * 50).duration(400)} style={tw`mb-3`}>
              <Pressable
                onPress={() => toggleTask(task.id)}
                disabled={isDisabled}
                style={({ pressed }) => [
                  tw`bg-white rounded-2xl p-4 border-2 flex-row items-center`,
                  isSelected ? (habitType === 'good' ? tw`border-teal-500 bg-teal-50` : tw`border-red-500 bg-red-50`) : tw`border-slate-200`,
                  isDisabled && tw`opacity-50`,
                  pressed && !isDisabled && tw`opacity-95`,
                ]}
              >
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, isSelected ? (habitType === 'good' ? tw`bg-teal-200` : tw`bg-red-200`) : tw`bg-slate-100`]}>
                  <Text style={tw`text-2xl`}>{task.icon}</Text>
                </View>

                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-semibold`, isSelected ? (habitType === 'good' ? tw`text-teal-900` : tw`text-red-900`) : tw`text-slate-800`]}>{task.name}</Text>
                  <Text style={tw`text-sm text-slate-600 mt-1`}>{task.description}</Text>
                  {task.duration && <Text style={tw`text-xs text-slate-500 mt-1`}>⏱️ {task.duration}</Text>}
                </View>

                {/* Checkbox indicator */}
                <View
                  style={[
                    tw`w-6 h-6 rounded-full border-2 items-center justify-center`,
                    isSelected ? (habitType === 'good' ? tw`bg-teal-500 border-teal-500` : tw`bg-red-500 border-red-500`) : tw`border-slate-300`,
                  ]}
                >
                  {isSelected && <Text style={tw`text-white text-xs`}>✓</Text>}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Selected Tasks Summary */}
      {selectedTasks.length > 0 && (
        <View style={[tw`mt-4 p-4 rounded-xl`, habitType === 'good' ? tw`bg-teal-50` : tw`bg-red-50`]}>
          <Text style={[tw`text-sm font-medium mb-2`, habitType === 'good' ? tw`text-teal-900` : tw`text-red-900`]}>Your daily commitment:</Text>
          {selectedTasks.map((taskId) => {
            const task = availableTasks.find((t) => t.id === taskId);
            return task ? (
              <Text key={taskId} style={tw`text-sm text-slate-700`}>
                • {task.name}
              </Text>
            ) : null;
          })}
        </View>
      )}
    </View>
  );
};

export default TaskSelector;
