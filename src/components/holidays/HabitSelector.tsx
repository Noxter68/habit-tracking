// src/components/holidays/HabitSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
        <Text style={tw`text-sm text-gray-500 text-center`}>No active habits</Text>
      </View>
    );
  }

  return (
    <View style={tw`gap-3`}>
      <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
        Select habits to freeze ({selectedHabits.size} of {habits.length} selected)
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
                    backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.08)' : 'white',
                    borderColor: isSelected ? '#f59e0b' : '#e5e7eb',
                  },
                  pressed && tw`scale-[0.98]`,
                ]}
              >
                {/* Checkbox */}
                <View
                  style={[
                    tw`w-6 h-6 rounded-lg items-center justify-center mr-3`,
                    {
                      backgroundColor: isSelected ? '#f59e0b' : 'transparent',
                      borderWidth: 2,
                      borderColor: isSelected ? '#f59e0b' : '#cbd5e1',
                    },
                  ]}
                >
                  {isSelected && <Check size={16} color="white" strokeWidth={3} />}
                </View>

                {/* Habit Info */}
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-sm font-semibold mb-0.5`, { color: isSelected ? '#d97706' : '#1f2937' }]}>{habit.name}</Text>
                  <Text style={tw`text-xs text-gray-500`}>
                    {habit.tasks.length} task{habit.tasks.length !== 1 ? 's' : ''} • {habit.currentStreak} day streak
                  </Text>
                </View>

                {/* Streak Badge */}
                {habit.currentStreak > 0 && (
                  <View style={tw`bg-amber-50 px-2.5 py-1 rounded-full`}>
                    <Text style={tw`text-xs font-bold text-amber-600`}>🔥 {habit.currentStreak}</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Summary */}
      {selectedHabits.size > 0 && (
        <View style={tw`bg-amber-50 rounded-xl p-3 mt-2`}>
          <Text style={tw`text-xs text-amber-700 text-center`}>
            ✓ {selectedHabits.size} habit{selectedHabits.size !== 1 ? 's' : ''} selected for freezing
          </Text>
        </View>
      )}
    </View>
  );
};
