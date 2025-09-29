// src/components/wizard/TaskSelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, Circle, Sparkles } from 'lucide-react-native';
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

  // Progress indicator component
  const SelectionProgress = () => {
    const percentage = (selectedTasks.length / maxTasks) * 100;
    return (
      <Animated.View entering={FadeInUp.duration(500)} style={tw`mb-6`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <Text style={tw`text-sm font-medium text-quartz-600`}>Tasks Selected</Text>
          <View style={tw`bg-quartz-200 rounded-full px-3 py-1`}>
            <Text style={tw`text-xs font-semibold text-quartz-700`}>
              {selectedTasks.length} of {maxTasks}
            </Text>
          </View>
        </View>
        <View style={tw`h-2 bg-quartz-100 rounded-full overflow-hidden`}>
          <LinearGradient colors={['#9CA3AF', '#6B7280']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${percentage}%` }]} />
        </View>
        {selectedTasks.length === maxTasks && (
          <View style={tw`flex-row items-center mt-2`}>
            <Sparkles size={14} color="#6B7280" style={tw`mr-1`} />
            <Text style={tw`text-xs text-quartz-600 font-light`}>Maximum tasks selected - Great balance!</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={tw`flex-1`}>
      {/* Header */}
      <View style={tw`px-6 mb-4`}>
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Define Your Actions</Text>
        <Text style={tw`text-quartz-600 leading-5`}>Choose specific daily tasks that will help you {habitType === 'good' ? 'build' : 'break'} this habit</Text>
      </View>

      {/* Selection Progress */}
      <View style={tw`px-6`}>
        <SelectionProgress />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-20`}>
        {availableTasks.map((task, index) => {
          const isSelected = selectedTasks.includes(task.id);
          const isDisabled = !isSelected && selectedTasks.length >= maxTasks;

          return (
            <Animated.View key={task.id} entering={FadeInDown.delay(index * 60).duration(500)} style={tw`mb-3`}>
              <Pressable
                onPress={() => toggleTask(task.id)}
                disabled={isDisabled}
                style={({ pressed }) => [tw`rounded-3xl overflow-hidden`, isDisabled && tw`opacity-40`, pressed && !isDisabled && tw`scale-[0.98]`]}
              >
                <LinearGradient colors={isSelected ? ['#9CA3AF', '#6B7280'] : ['#F3F4F6', '#E5E7EB']} style={tw`border border-quartz-200`}>
                  <ImageBackground
                    source={require('../../../assets/interface/quartz-texture.png')}
                    style={tw`p-4`}
                    imageStyle={{
                      opacity: isSelected ? 0.15 : 0.03,
                      borderRadius: 24,
                    }}
                    resizeMode="cover"
                  >
                    <View style={tw`flex-row items-start`}>
                      {/* Icon Container */}
                      <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center mr-4`, isSelected ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                        <Text style={tw`text-2xl`}>{task.icon}</Text>
                      </View>

                      {/* Content */}
                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-start justify-between`}>
                          <View style={tw`flex-1 mr-3`}>
                            <Text style={[tw`text-base font-medium mb-1`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{task.name}</Text>
                            <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/85` : tw`text-quartz-600`]}>{task.description}</Text>

                            {/* Task Meta Info */}
                            <View style={tw`flex-row items-center mt-2 gap-3`}>
                              {task.duration && (
                                <View style={[tw`px-2 py-1 rounded-lg`, isSelected ? tw`bg-white/15` : tw`bg-quartz-100`]}>
                                  <Text style={[tw`text-xs font-light`, isSelected ? tw`text-white` : tw`text-quartz-600`]}>⏱ {task.duration}</Text>
                                </View>
                              )}
                              {task.difficulty && (
                                <View style={[tw`px-2 py-1 rounded-lg`, isSelected ? tw`bg-white/15` : tw`bg-quartz-100`]}>
                                  <Text style={[tw`text-xs font-light`, isSelected ? tw`text-white` : tw`text-quartz-600`]}>{task.difficulty}</Text>
                                </View>
                              )}
                            </View>
                          </View>

                          {/* Selection Indicator */}
                          <View style={tw`mt-1`}>
                            {isSelected ? <CheckCircle size={24} color="#ffffff" strokeWidth={2} /> : <Circle size={24} color={isDisabled ? '#D1D5DB' : '#9CA3AF'} strokeWidth={1.5} />}
                          </View>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Info Card */}
        {selectedTasks.length === 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={tw`mt-4`}>
            <View style={tw`bg-quartz-50 rounded-2xl overflow-hidden`}>
              <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: 0.05, borderRadius: 16 }} resizeMode="cover">
                <Text style={tw`text-sm font-medium text-quartz-700 mb-1`}>Pro Tip</Text>
                <Text style={tw`text-xs text-quartz-600 leading-5`}>Start with 1-2 easy tasks to build momentum. You can always add more tasks as you progress.</Text>
              </ImageBackground>
            </View>
          </Animated.View>
        )}

        {/* Selected Tasks Summary */}
        {selectedTasks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500)} style={tw`mt-6`}>
            <LinearGradient colors={['#6B7280', '#4B5563']} style={tw`rounded-3xl overflow-hidden`}>
              <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-5`} imageStyle={{ opacity: 0.2, borderRadius: 24 }} resizeMode="cover">
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={tw`w-8 h-8 bg-white/20 rounded-lg items-center justify-center mr-3`}>
                    <Sparkles size={16} color="#ffffff" strokeWidth={2} />
                  </View>
                  <Text style={tw`text-base font-medium text-white`}>Your Daily Commitment</Text>
                </View>

                <View style={tw`space-y-2`}>
                  {selectedTasks.map((taskId, index) => {
                    const task = availableTasks.find((t) => t.id === taskId);
                    return task ? (
                      <Animated.View key={taskId} entering={FadeInDown.delay(index * 100).duration(400)} style={tw`flex-row items-center bg-white/10 rounded-xl p-3`}>
                        <Text style={tw`text-lg mr-3`}>{task.icon}</Text>
                        <View style={tw`flex-1`}>
                          <Text style={tw`text-sm font-medium text-white`}>{task.name}</Text>
                          {task.duration && <Text style={tw`text-xs text-white/70 mt-0.5`}>{task.duration} daily</Text>}
                        </View>
                      </Animated.View>
                    ) : null;
                  })}
                </View>

                <View style={tw`mt-4 pt-3 border-t border-white/20`}>
                  <Text style={tw`text-xs text-white/80 font-light leading-5`}>
                    {habitType === 'good'
                      ? `Completing these ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} daily will help you build this positive habit.`
                      : `Tracking these ${selectedTasks.length} alternative${selectedTasks.length > 1 ? 's' : ''} will help you overcome this habit.`}
                  </Text>
                </View>
              </ImageBackground>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

export default TaskSelector;
