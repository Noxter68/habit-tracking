// src/components/holiday/HabitSelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { HabitWithTasks } from '@/types/holiday.types';

interface HabitSelectorProps {
  habits: HabitWithTasks[];
  selectedHabits: Set<string>;
  onToggle: (habitId: string) => void;
}

export const HabitSelector: React.FC<HabitSelectorProps> = ({ habits, selectedHabits, onToggle }) => {
  if (habits.length === 0) {
    return (
      <View style={tw`bg-gray-50 rounded-2xl p-6 items-center`}>
        <Text style={tw`text-sm text-gray-500 text-center`}>No active habits to freeze</Text>
      </View>
    );
  }

  return (
    <View style={tw`gap-3`}>
      <Text style={tw`text-sm font-semibold text-sky-900 mb-1`}>
        Select habits to freeze ({selectedHabits.size} of {habits.length})
      </Text>

      <View style={tw`gap-2`}>
        {habits.map((habit, index) => {
          const isSelected = selectedHabits.has(habit.id);

          return (
            <Animated.View key={habit.id} entering={FadeInDown.delay(index * 50).duration(300)}>
              <Pressable
                onPress={() => onToggle(habit.id)}
                style={({ pressed }) => [
                  tw`flex-row items-center p-4 rounded-2xl border-2`,
                  {
                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'white',
                    borderColor: isSelected ? '#6366f1' : '#e5e7eb',
                  },
                  pressed && tw`scale-[0.98]`,
                ]}
              >
                {/* Checkbox */}
                <View
                  style={[
                    tw`w-6 h-6 rounded-lg items-center justify-center mr-3`,
                    {
                      backgroundColor: isSelected ? '#6366f1' : 'transparent',
                      borderWidth: 2,
                      borderColor: isSelected ? '#6366f1' : '#cbd5e1',
                    },
                  ]}
                >
                  {isSelected && <Check size={16} color="white" strokeWidth={3} />}
                </View>

                {/* Habit Info */}
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-semibold mb-0.5`, { color: isSelected ? '#4f46e5' : '#1f2937' }]}>{habit.name}</Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    {habit.tasks.length} {habit.tasks.length === 1 ? 'task' : 'tasks'} • {habit.currentStreak} day streak
                  </Text>
                </View>

                {/* Streak Badge */}
                {habit.currentStreak > 0 && (
                  <View
                    style={[
                      tw`px-3 py-1 rounded-full`,
                      {
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#f3f4f6',
                      },
                    ]}
                  >
                    <Text style={[tw`text-xs font-bold`, { color: isSelected ? '#4f46e5' : '#6b7280' }]}>🔥 {habit.currentStreak}</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Selection Summary */}
      {selectedHabits.size > 0 && (
        <View style={tw`bg-indigo-50 border border-indigo-200 rounded-2xl p-3 mt-2`}>
          <Text style={tw`text-xs text-indigo-700 text-center`}>
            ✓ {selectedHabits.size} {selectedHabits.size === 1 ? 'habit' : 'habits'} selected
          </Text>
        </View>
      )}
    </View>
  );
};
