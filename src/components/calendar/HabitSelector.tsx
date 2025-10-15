import React from 'react';
import { ScrollView, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';

interface HabitSelectorProps {
  habits: Habit[];
  selectedHabit: Habit | null;
  onSelectHabit: (habit: Habit) => void;
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ habits, selectedHabit, onSelectHabit }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2 px-5 py-4`}>
    {habits.map((habit, index) => {
      const isActive = selectedHabit?.id === habit.id;
      const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);

      return (
        <Animated.View key={habit.id} entering={FadeIn.delay(index * 50)}>
          <Pressable
            onPress={() => onSelectHabit(habit)}
            style={({ pressed }) => [tw`px-4 py-2.5 rounded-xl ${isActive ? 'bg-sand border-2 border-sand-300' : 'bg-sand-100'}`, pressed && tw`opacity-70`]}
          >
            <Text style={tw`text-sm font-semibold ${isActive ? 'text-stone-800' : 'text-stone-600'}`}>{habit.name}</Text>
            <Text style={tw`text-xs ${isActive ? 'text-stone-600' : 'text-stone-500'} mt-0.5`}>
              {habit.currentStreak} days • {tier.name}
            </Text>
          </Pressable>
        </Animated.View>
      );
    })}
  </ScrollView>
);

export default HabitSelector;
