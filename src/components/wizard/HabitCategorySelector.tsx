// src/components/wizard/HabitCategorySelector.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface HabitCategorySelectorProps {
  habitType: HabitType;
  selected?: string;
  onSelect: (category: string) => void;
}

const HabitCategorySelector: React.FC<HabitCategorySelectorProps> = ({ habitType, selected, onSelect }) => {
  const goodHabits = [
    { id: 'fitness', label: 'Fitness', icon: '💪', description: 'Exercise & workouts' },
    { id: 'health', label: 'Health', icon: '🧘', description: 'Wellness & meditation' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗', description: 'Healthy eating' },
    { id: 'learning', label: 'Learning', icon: '📚', description: 'Study & reading' },
    { id: 'productivity', label: 'Productivity', icon: '⚡', description: 'Focus & efficiency' },
    { id: 'mindfulness', label: 'Mindfulness', icon: '🧠', description: 'Mental clarity' },
    { id: 'sleep', label: 'Sleep', icon: '😴', description: 'Better rest' },
    { id: 'hydration', label: 'Hydration', icon: '💧', description: 'Drink more water' },
  ];

  const badHabits = [
    { id: 'smoking', label: 'Smoking', icon: '🚭', description: 'Quit tobacco' },
    { id: 'junk-food', label: 'Junk Food', icon: '🍔', description: 'Reduce unhealthy food' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️', description: 'Control spending' },
    { id: 'screen-time', label: 'Screen Time', icon: '📱', description: 'Reduce device usage' },
    { id: 'procrastination', label: 'Procrastination', icon: '⏰', description: 'Stop delaying' },
    { id: 'negative-thinking', label: 'Negativity', icon: '💭', description: 'Positive mindset' },
    { id: 'alcohol', label: 'Alcohol', icon: '🍺', description: 'Reduce drinking' },
    { id: 'oversleeping', label: 'Oversleeping', icon: '🛏️', description: 'Wake up earlier' },
  ];

  const categories = habitType === 'good' ? goodHabits : badHabits;

  return (
    <View style={tw`flex-1`}>
      <View style={tw`px-6 mb-4`}>
        <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>Choose a category</Text>
        <Text style={tw`text-slate-600`}>{habitType === 'good' ? 'What area would you like to improve?' : 'What would you like to overcome?'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`} style={tw`flex-1`}>
        {categories.map((category, index) => (
          <Animated.View key={category.id} entering={FadeInDown.delay(index * 50).duration(400)} style={tw`mb-3`}>
            <Pressable
              onPress={() => onSelect(category.id)}
              style={({ pressed }) => [
                tw`bg-white rounded-2xl p-4 border-2 flex-row items-center`,
                selected === category.id ? (habitType === 'good' ? tw`border-teal-500 bg-teal-50` : tw`border-red-500 bg-red-50`) : tw`border-slate-200`,
                pressed && tw`opacity-95`,
              ]}
            >
              <View style={[tw`w-14 h-14 rounded-xl items-center justify-center mr-4`, habitType === 'good' ? tw`bg-teal-100` : tw`bg-red-100`]}>
                <Text style={tw`text-2xl`}>{category.icon}</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-semibold text-slate-800`}>{category.label}</Text>
                <Text style={tw`text-sm text-slate-600 mt-1`}>{category.description}</Text>
              </View>
              {selected === category.id && (
                <View style={[tw`w-6 h-6 rounded-full items-center justify-center`, habitType === 'good' ? tw`bg-teal-500` : tw`bg-red-500`]}>
                  <Text style={tw`text-white text-xs`}>✓</Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HabitCategorySelector;
