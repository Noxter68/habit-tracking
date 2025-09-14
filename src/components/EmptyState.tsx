import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '../lib/tailwind';

interface EmptyStateProps {
  onAddHabit: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddHabit }) => {
  return (
    <View style={tw`flex-1 items-center justify-center py-12`}>
      <Text style={tw`text-6xl mb-4`}>🌱</Text>
      <Text style={tw`text-xl font-semibold text-slate-700 mb-2`}>No habits yet</Text>
      <Text style={tw`text-slate-600 text-center mb-6 px-8`}>
        Start your journey to better habits.{'\n'}
        It takes 61 days to build a lasting change!
      </Text>
      <Pressable onPress={onAddHabit} style={({ pressed }) => [tw`bg-teal-600 px-8 py-3 rounded-full`, pressed && tw`bg-teal-700`]}>
        <Text style={tw`text-white font-medium text-lg`}>Create Your First Habit</Text>
      </Pressable>
    </View>
  );
};

export default EmptyState;
