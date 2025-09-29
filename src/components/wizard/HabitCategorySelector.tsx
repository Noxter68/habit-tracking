import React from 'react';
import { View, Text, ScrollView, Pressable, ImageBackground } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
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
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Choose a category</Text>
        <Text style={tw`text-quartz-600`}>{habitType === 'good' ? 'What area would you like to improve?' : 'What would you like to overcome?'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`} style={tw`flex-1`}>
        {categories.map((category, index) => (
          <Animated.View key={category.id} entering={FadeInDown.delay(index * 50).duration(500)} style={tw`mb-3`}>
            <Pressable onPress={() => onSelect(category.id)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
              <LinearGradient colors={selected === category.id ? ['#9CA3AF', '#6B7280'] : ['#F3F4F6', '#E5E7EB']} style={tw`border border-quartz-200`}>
                <View style={tw`p-4 flex-row items-center`}>
                  <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center mr-4`, selected === category.id ? tw`bg-white/20` : tw`bg-quartz-100`]}>
                    <Text style={tw`text-2xl`}>{category.icon}</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={[tw`text-lg font-medium`, selected === category.id ? tw`text-white` : tw`text-quartz-800`]}>{category.label}</Text>
                    <Text style={[tw`text-sm mt-1`, selected === category.id ? tw`text-white/80` : tw`text-quartz-600`]}>{category.description}</Text>
                  </View>
                  {selected === category.id && (
                    <View style={tw`w-6 h-6 rounded-full bg-white/20 items-center justify-center`}>
                      <Text style={tw`text-white text-xs`}>✓</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

export default HabitCategorySelector;
