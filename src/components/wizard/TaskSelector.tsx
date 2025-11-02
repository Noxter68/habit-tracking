// src/components/wizard/TaskSelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
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
      onSelectTasks(selectedTasks.filter((t) => t !== taskId));
    } else {
      if (selectedTasks.length < maxTasks) {
        onSelectTasks([...selectedTasks, taskId]);
      }
    }
  };

  return (
    <View style={tw`flex-1 justify-center`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-10`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>Choose Your Tasks</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>Select up to {maxTasks} daily actions to track</Text>

          {selectedTasks.length > 0 && (
            <Text style={tw`text-sm text-white/60 text-center mt-2`}>
              {selectedTasks.length} of {maxTasks} selected
            </Text>
          )}
        </View>

        {/* Tasks List */}
        <View style={tw`gap-3`}>
          {availableTasks.map((task, index) => {
            const isSelected = selectedTasks.includes(task.id);
            const Icon = task.icon;

            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(index * 30).duration(300)}>
                <Pressable
                  onPress={() => toggleTask(task.id)}
                  disabled={!isSelected && selectedTasks.length >= maxTasks}
                  style={({ pressed }) => [
                    tw`rounded-2xl p-5 flex-row items-center border-2 ${isSelected ? 'border-emerald-400/60' : 'border-white/10'}`,
                    { backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
                    !isSelected && selectedTasks.length >= maxTasks && tw`opacity-40`,
                    pressed && tw`opacity-80`,
                  ]}
                >
                  <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)' }]}>
                    <Icon size={24} color="#ffffff" strokeWidth={2} />
                  </View>

                  <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-base font-semibold text-white mb-0.5`}>{task.name}</Text>
                    <Text style={tw`text-sm text-white/70 leading-5 mb-1`}>{task.description}</Text>
                    <Text style={tw`text-xs text-white/50`}>{task.duration}</Text>
                  </View>

                  <View style={[tw`w-7 h-7 rounded-full items-center justify-center border-2`, isSelected ? tw`bg-emerald-500 border-emerald-400` : tw`border-white/30`]}>
                    {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Tip */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>Start small and build momentum{'\n'}You can always add more tasks later</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default TaskSelector;
