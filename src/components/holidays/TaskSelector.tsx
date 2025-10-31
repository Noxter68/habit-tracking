// src/components/holidays/TaskSelector.tsx
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Check, ChevronDown, ChevronRight, Minus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { HabitWithTasks } from '@/types/holiday.types';
import { isHabitFullySelected, isHabitPartiallySelected } from '@/services/holidayModeService';

interface TaskSelectorProps {
  habits: HabitWithTasks[];
  selectedTasks: Map<string, Set<string>>;
  onToggleTask: (habitId: string, taskId: string) => void;
  onToggleAllTasks: (habitId: string) => void;
}

export const TaskSelector: React.FC<TaskSelectorProps> = ({ habits, selectedTasks, onToggleTask, onToggleAllTasks }) => {
  const [expandedHabits, setExpandedHabits] = useState<Set<string>>(new Set());

  const toggleExpanded = (habitId: string) => {
    setExpandedHabits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(habitId)) {
        newSet.delete(habitId);
      } else {
        newSet.add(habitId);
      }
      return newSet;
    });
  };

  const getTotalSelectedTasks = () => {
    let total = 0;
    selectedTasks.forEach((tasks) => {
      total += tasks.size;
    });
    return total;
  };

  if (habits.length === 0) {
    return (
      <View style={tw`bg-gray-50 rounded-2xl p-6 items-center`}>
        <Text style={tw`text-sm text-gray-500 text-center`}>No active habits with tasks</Text>
      </View>
    );
  }

  return (
    <View style={tw`gap-3`}>
      <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>Select tasks to freeze ({getTotalSelectedTasks()} tasks selected)</Text>

      <View style={tw`gap-2`}>
        {habits.map((habit, index) => {
          const isExpanded = expandedHabits.has(habit.id);
          const isPartial = isHabitPartiallySelected(habit.id, habit.tasks.length, selectedTasks);
          const isFullySelected = isHabitFullySelected(habit.id, habit.tasks.length, selectedTasks);
          const habitHasSelection = isPartial || isFullySelected;

          return (
            <Animated.View key={habit.id} entering={FadeInDown.delay(index * 50).duration(300)}>
              {/* Habit Header */}
              <Pressable
                onPress={() => toggleExpanded(habit.id)}
                style={({ pressed }) => [
                  tw`flex-row items-center p-4 rounded-2xl border-2`,
                  {
                    backgroundColor: habitHasSelection ? 'rgba(251, 191, 36, 0.08)' : 'white',
                    borderColor: habitHasSelection ? '#f59e0b' : '#e5e7eb',
                  },
                  pressed && tw`scale-[0.98]`,
                ]}
              >
                {/* Expand Icon */}
                <View style={tw`mr-3`}>
                  {isExpanded ? <ChevronDown size={20} color={habitHasSelection ? '#d97706' : '#6b7280'} /> : <ChevronRight size={20} color={habitHasSelection ? '#d97706' : '#6b7280'} />}
                </View>

                {/* Select All Checkbox */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleAllTasks(habit.id);
                  }}
                  style={tw`mr-3`}
                >
                  <View
                    style={[
                      tw`w-6 h-6 rounded-lg items-center justify-center`,
                      {
                        backgroundColor: isFullySelected ? '#f59e0b' : isPartial ? '#f59e0b' : 'transparent',
                        borderWidth: 2,
                        borderColor: habitHasSelection ? '#f59e0b' : '#cbd5e1',
                      },
                    ]}
                  >
                    {isFullySelected && <Check size={16} color="white" strokeWidth={3} />}
                    {isPartial && <Minus size={16} color="white" strokeWidth={3} />}
                  </View>
                </Pressable>

                {/* Habit Info */}
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-semibold mb-0.5`, { color: habitHasSelection ? '#d97706' : '#1f2937' }]}>{habit.name}</Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    {selectedTasks.get(habit.id)?.size || 0} of {habit.tasks.length} tasks
                  </Text>
                </View>
              </Pressable>

              {/* Expanded Task List */}
              {isExpanded && (
                <View style={tw`ml-4 mt-2 gap-2`}>
                  {habit.tasks.map((task) => {
                    const isTaskSelected = selectedTasks.get(habit.id)?.has(task.id) || false;

                    return (
                      <Pressable
                        key={task.id}
                        onPress={() => onToggleTask(habit.id, task.id)}
                        style={({ pressed }) => [
                          tw`flex-row items-center p-3 rounded-xl border`,
                          {
                            backgroundColor: isTaskSelected ? 'rgba(251, 191, 36, 0.05)' : 'white',
                            borderColor: isTaskSelected ? '#f59e0b' : '#e5e7eb',
                          },
                          pressed && tw`scale-[0.98]`,
                        ]}
                      >
                        {/* Checkbox */}
                        <View
                          style={[
                            tw`w-5 h-5 rounded-md items-center justify-center mr-3`,
                            {
                              backgroundColor: isTaskSelected ? '#f59e0b' : 'transparent',
                              borderWidth: 2,
                              borderColor: isTaskSelected ? '#f59e0b' : '#cbd5e1',
                            },
                          ]}
                        >
                          {isTaskSelected && <Check size={12} color="white" strokeWidth={3} />}
                        </View>

                        {/* Task Info */}
                        <View style={tw`flex-1`}>
                          <Text style={[tw`text-sm`, { color: isTaskSelected ? '#d97706' : '#374151' }]}>{task.name}</Text>
                          {task.description && <Text style={tw`text-xs text-gray-400 mt-0.5`}>{task.description}</Text>}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          );
        })}
      </View>

      {/* Selection Summary */}
      {getTotalSelectedTasks() > 0 && (
        <View style={tw`bg-amber-50 border border-amber-200 rounded-2xl p-3 mt-2`}>
          <Text style={tw`text-xs text-amber-700 text-center`}>
            ✓ {getTotalSelectedTasks()} {getTotalSelectedTasks() === 1 ? 'task' : 'tasks'} selected across {selectedTasks.size} {selectedTasks.size === 1 ? 'habit' : 'habits'}
          </Text>
        </View>
      )}
    </View>
  );
};
