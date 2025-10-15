import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from '@/lib/tailwind';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateHabit }) => (
  <Animated.View entering={FadeIn} style={tw`flex-1 items-center justify-center px-8`}>
    <View style={tw`w-24 h-24 bg-sand-100 rounded-full items-center justify-center mb-6`}>
      <Plus size={40} color="#9ca3af" strokeWidth={2} />
    </View>

    <Text style={tw`text-2xl font-bold text-stone-800 mb-2`}>No Habits Yet</Text>
    <Text style={tw`text-base text-sand-500 text-center mb-8`}>Start your journey by creating your first habit</Text>

    <Pressable onPress={onCreateHabit} style={({ pressed }) => [tw`px-8 py-4 rounded-2xl`, pressed && tw`opacity-80`]}>
      <LinearGradient colors={['#9CA3AF', '#6B7280']} style={tw`px-8 py-4 rounded-2xl`}>
        <Text style={tw`text-white font-bold text-base`}>Create Your First Habit</Text>
      </LinearGradient>
    </Pressable>
  </Animated.View>
);

export default EmptyState;
