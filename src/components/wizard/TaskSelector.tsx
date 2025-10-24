// src/components/wizard/TaskSelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Lightbulb, Clock } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';
import { getTasksForCategory, quotes, tips } from '@/utils/habitHelpers';

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

  const gradientColors = habitType === 'good' ? ['#fbbf24', '#f59e0b'] : ['#8b5cf6', '#7c3aed'];

  return (
    <View style={tw`flex-1`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`}>
        {/* Header with Quote Integrated */}
        <View style={tw`mb-5`}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
            <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Define Your Actions</Text>
            <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>Choose specific daily tasks that will help you {habitType === 'good' ? 'build this habit' : 'overcome this pattern'}</Text>

            {/* Integrated Quote */}
            <View style={tw`border-t border-white/20 pt-3 mt-1`}>
              <Text style={tw`text-xs text-white/70 italic leading-5`}>"{quotes.tasks.text}"</Text>
              <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {quotes.tasks.author}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Indicator */}
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
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${(selectedTasks.length / maxTasks) * 100}%` }]} />
          </View>
          {selectedTasks.length === maxTasks && (
            <View style={tw`flex-row items-center mt-2`}>
              <Sparkles size={14} color={gradientColors[0]} style={tw`mr-1`} />
              <Text style={tw`text-xs text-quartz-600 font-light`}>Maximum tasks selected - Great balance!</Text>
            </View>
          )}
        </Animated.View>

        {/* Task Cards */}
        <View style={tw`gap-3 mb-6`}>
          {availableTasks.map((task, index) => {
            const isSelected = selectedTasks.includes(task.id);
            const isMaxed = selectedTasks.length >= maxTasks && !isSelected;
            const IconComponent = task.icon; // Get the icon component

            return (
              <Animated.View key={task.id} entering={FadeInDown.delay(index * 30).duration(400)}>
                <Pressable
                  onPress={() => !isMaxed && toggleTask(task.id)}
                  disabled={isMaxed}
                  style={({ pressed }) => [
                    tw`rounded-2xl overflow-hidden`,
                    { borderWidth: 1, borderColor: isSelected ? 'transparent' : '#e5e7eb' },
                    pressed && !isMaxed && tw`opacity-90`,
                    isMaxed && tw`opacity-50`,
                  ]}
                >
                  <LinearGradient colors={isSelected ? [gradientColors[0], `${gradientColors[1]}dd`] : ['#ffffff', '#f9fafb']} style={tw`p-4`}>
                    <View style={tw`flex-row items-center`}>
                      {/* Professional Icon Container */}
                      <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, isSelected ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                        <IconComponent size={24} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={2} />
                      </View>

                      {/* Text Content */}
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-base font-semibold mb-0.5`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{task.name}</Text>
                        <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/90` : tw`text-quartz-600`]}>{task.description}</Text>
                        {task.duration && (
                          <View style={tw`flex-row items-center mt-1`}>
                            <Clock size={12} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={2} style={tw`mr-1`} />
                            <Text style={[tw`text-xs`, isSelected ? tw`text-white/80` : tw`text-quartz-500`]}>{task.duration}</Text>
                          </View>
                        )}
                      </View>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <View style={tw`w-5.5 h-5.5 rounded-full bg-white/30 items-center justify-center`}>
                          <View style={tw`w-2 h-2 bg-white rounded-full`} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Selected Tasks Summary */}
        {selectedTasks.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500)} style={tw`mb-6`}>
            <LinearGradient colors={gradientColors} style={tw`rounded-3xl overflow-hidden p-5`}>
              <View style={tw`flex-row items-center mb-3`}>
                <View style={tw`w-8 h-8 bg-white/20 rounded-lg items-center justify-center mr-3`}>
                  <Sparkles size={16} color="#ffffff" strokeWidth={2} />
                </View>
                <Text style={tw`text-base font-semibold text-white`}>Your Daily Commitment</Text>
              </View>

              <View style={tw`gap-2`}>
                {selectedTasks.map((taskId, index) => {
                  const task = availableTasks.find((t) => t.id === taskId);
                  if (!task || !task.icon) return null;

                  const IconComponent = task.icon;

                  return (
                    <Animated.View key={taskId} entering={FadeInDown.delay(index * 100).duration(400)} style={tw`flex-row items-center bg-white/10 rounded-xl p-3`}>
                      <View style={tw`mr-3`}>
                        <IconComponent size={22} color="#ffffff" strokeWidth={1.5} />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-sm font-medium text-white`}>{task.name}</Text>
                        {task.duration && (
                          <View style={tw`flex-row items-center mt-0.5`}>
                            <Clock size={11} color="#ffffff" strokeWidth={2} style={tw`mr-1`} />
                            <Text style={tw`text-xs text-white/70`}>{task.duration} daily</Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>

              <View style={tw`mt-4 pt-3 border-t border-white/20`}>
                <Text style={tw`text-xs text-white/80 font-light leading-5`}>
                  {habitType === 'good'
                    ? `Completing these ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} daily will help you build this positive habit.`
                    : `Tracking these ${selectedTasks.length} alternative${selectedTasks.length > 1 ? 's' : ''} will help you overcome this habit.`}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Professional Tip */}
        <LinearGradient colors={['#fef3c7', '#fde68a', '#fcd34d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 border border-amber-200`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Lightbulb size={18} color="#78350f" strokeWidth={2} style={tw`mr-2`} />
            <Text style={tw`text-sm font-semibold text-amber-900`}>{tips.tasks[0].title}</Text>
          </View>
          <Text style={tw`text-sm text-amber-800 leading-5`}>{tips.tasks[0].content}</Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default TaskSelector;
