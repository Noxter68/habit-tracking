// src/components/calendar/HabitSelector.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { Habit } from '../../types';
import { MiniFlameIcon } from '../icons/MiniIcons';

interface HabitSelectorProps {
  habits: Habit[];
  selectedHabit: Habit | null;
  onSelectHabit: (habit: Habit) => void;
  getCategoryIcon: (category: string) => { icon: any; color: string };
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ habits, selectedHabit, onSelectHabit, getCategoryIcon }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-4 gap-2 py-2.5`} style={tw`max-h-14`}>
      {habits.map((habit, index) => {
        const categoryData = getCategoryIcon(habit.category);
        const isSelected = selectedHabit?.id === habit.id;
        const CategoryIcon = categoryData.icon;

        return (
          <Animated.View
            key={habit.id}
            entering={FadeInDown.delay(index * 15)
              .duration(200)
              .springify()}
          >
            <Pressable onPress={() => onSelectHabit(habit)} style={({ pressed }) => [pressed && tw`opacity-80`]}>
              {/* Matching the stats card style - rounded-lg instead of rounded-full */}
              <View style={[tw`px-3 py-2 rounded-lg flex-row items-center`, isSelected ? tw`bg-indigo-500` : tw`bg-white/80 border border-gray-200`]}>
                {/* Mini category icon with matching style */}
                <View style={tw`flex-row items-center`}>
                  <CategoryIcon size={14} color={isSelected ? '#ffffff' : categoryData.color} strokeWidth={2.5} />
                  <Text style={[tw`font-semibold text-sm ml-2`, isSelected ? tw`text-white` : tw`text-gray-700`]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                </View>

                {/* Streak indicator if has streak */}
                {habit.currentStreak > 0 && (
                  <View style={tw`flex-row items-center ml-2.5`}>
                    <MiniFlameIcon size={12} color={isSelected ? '#fbbf24' : '#f59e0b'} />
                    <Text style={[tw`text-sm ml-1 font-bold`, isSelected ? tw`text-white/90` : tw`text-orange-600`]}>{habit.currentStreak}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

export default HabitSelector;
