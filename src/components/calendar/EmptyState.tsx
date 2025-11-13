// src/components/calendar/EmptyState.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateHabit }) => {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeIn} style={tw`flex-1 items-center justify-center px-8`}>
      <View style={tw`w-24 h-24 bg-sand-100 rounded-full items-center justify-center mb-6`}>
        <Plus size={40} color="#9ca3af" strokeWidth={2} />
      </View>

      <Text style={tw`text-2xl font-bold text-stone-800 mb-2`}>{t('calendar.emptyState.title')}</Text>
      <Text style={tw`text-base text-sand-500 text-center mb-8`}>{t('calendar.emptyState.description')}</Text>

      <Pressable onPress={onCreateHabit} style={({ pressed }) => [tw`px-8 py-4 rounded-2xl`, pressed && tw`opacity-80`]}>
        <LinearGradient colors={['#9CA3AF', '#6B7280']} style={tw`px-8 py-4 rounded-2xl`}>
          <Text style={tw`text-white font-bold text-base`}>{t('calendar.emptyState.button')}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default EmptyState;
