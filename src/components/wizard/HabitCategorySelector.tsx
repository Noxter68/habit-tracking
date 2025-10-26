// src/components/wizard/HabitCategorySelector.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Heart, Apple, BookOpen, Zap, Brain, Moon, Droplets, CigaretteOff, Scale, ShoppingCart, Smartphone, Clock, Smile, Wine, Bed, Target, Plus } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';
import { getCategories, quotes, tips } from '../../utils/habitHelpers';

interface HabitCategorySelectorProps {
  habitType: HabitType;
  selected?: string;
  onSelect: (category: string) => void;
  onCreateCustom: () => void;
}

const categoryIcons: Record<string, any> = {
  fitness: Dumbbell,
  health: Heart,
  nutrition: Apple,
  learning: BookOpen,
  productivity: Zap,
  mindfulness: Brain,
  sleep: Moon,
  hydration: Droplets,
  smoking: CigaretteOff,
  'junk-food': Scale,
  shopping: ShoppingCart,
  'screen-time': Smartphone,
  procrastination: Clock,
  'negative-thinking': Smile,
  alcohol: Wine,
  oversleeping: Bed,
};

const HabitCategorySelector: React.FC<HabitCategorySelectorProps> = ({ habitType, selected, onSelect, onCreateCustom }) => {
  const categories = getCategories(habitType);
  const gradientColors = habitType === 'good' ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626'];

  return (
    <View style={tw`flex-1`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`}>
        {/* Header */}
        <View style={tw`mb-5`}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
            <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Choose Your Focus</Text>
            <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>
              {habitType === 'good' ? 'Select the area where you want to grow and excel' : 'Identify what you want to overcome and transform'}
            </Text>

            <View style={tw`border-t border-white/20 pt-3 mt-1`}>
              <Text style={tw`text-xs text-white/70 italic leading-5`}>"{quotes.category.text}"</Text>
              <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {quotes.category.author}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Categories List - NO STAGGERED ANIMATIONS */}
        <View style={tw`gap-3 mb-4`}>
          {categories.map((category) => {
            const Icon = categoryIcons[category.id];
            const isSelected = selected === category.id;

            return (
              <Animated.View key={category.id} entering={FadeInDown.duration(300)}>
                <Pressable
                  onPress={() => onSelect(category.id)}
                  style={({ pressed }) => [
                    tw`rounded-2xl overflow-hidden`,
                    {
                      borderWidth: 1,
                      borderColor: isSelected ? 'transparent' : '#e5e7eb',
                      backgroundColor: isSelected ? category.color : '#ffffff',
                    },
                    pressed && tw`opacity-90`,
                  ]}
                >
                  <View style={tw`p-4`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, isSelected ? tw`bg-white/25` : { backgroundColor: `${category.color}15` }]}>
                        <Icon size={24} color={isSelected ? '#ffffff' : category.color} strokeWidth={2} />
                      </View>

                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-base font-semibold mb-0.5`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{category.label}</Text>
                        <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/90` : tw`text-quartz-600`]}>{category.description}</Text>
                      </View>

                      {isSelected && (
                        <View style={tw`w-5.5 h-5.5 rounded-full bg-white/30 items-center justify-center`}>
                          <View style={tw`w-2 h-2 bg-white rounded-full`} />
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Divider */}
        <View style={tw`flex-row items-center mb-4`}>
          <View style={tw`flex-1 h-px bg-quartz-200`} />
          <Text style={tw`px-4 text-xs text-quartz-500 font-medium`}>OR</Text>
          <View style={tw`flex-1 h-px bg-quartz-200`} />
        </View>

        {/* Create Custom Habit */}
        <Animated.View entering={FadeInDown.duration(300)} style={tw`mb-5`}>
          <Pressable onPress={onCreateCustom} style={({ pressed }) => [tw`rounded-2xl overflow-hidden bg-white`, { borderWidth: 1, borderColor: '#e5e7eb' }, pressed && tw`opacity-90`]}>
            <View style={tw`p-4`}>
              <View style={tw`flex-row items-center`}>
                <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, { backgroundColor: '#fbbf2415' }]}>
                  <Plus size={24} color="#f59e0b" strokeWidth={2} />
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-quartz-800 mb-0.5`}>Create Custom Habit</Text>
                  <Text style={tw`text-sm text-quartz-600 leading-5`}>{habitType === 'good' ? 'Build something unique to your goals' : 'Define your own habit to overcome'}</Text>
                </View>

                <View style={[tw`w-8 h-8 rounded-xl items-center justify-center`, { backgroundColor: '#fbbf2410' }]}>
                  <Target size={18} color="#f59e0b" strokeWidth={2} />
                </View>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Tip */}
        <View style={[tw`bg-sky-50 rounded-2xl p-4`, { borderLeftWidth: 3, borderLeftColor: '#0284c7' }]}>
          <View style={tw`flex-row items-center mb-2`}>
            <Target size={18} color="#0284c7" strokeWidth={2} style={tw`mr-2`} />
            <Text style={tw`text-sm font-semibold text-sky-900`}>{tips.category[0].title}</Text>
          </View>
          <Text style={tw`text-sm text-sky-800 leading-5`}>{tips.category[0].content}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default React.memo(HabitCategorySelector);
