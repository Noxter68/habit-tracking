// src/components/wizard/FrequencySelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CalendarDays, CalendarClock, Award, Sparkles } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { quotes, tips } from '../../utils/habitHelpers';

interface FrequencySelectorProps {
  selected: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  onSelect: (frequency: 'daily' | 'weekly' | 'custom', customDays?: number[]) => void;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ selected, customDays, onSelect }) => {
  const frequencies = [
    {
      id: 'daily' as const,
      title: 'Daily',
      subtitle: 'Every single day',
      description: 'Build consistency with daily practice',
      icon: Calendar,
      gradient: ['#10b981', '#059669'],
      stats: '2.5x more likely to stick',
    },
    {
      id: 'weekly' as const,
      title: 'Weekly',
      subtitle: 'Once per week',
      description: 'Perfect for reflection and planning',
      icon: CalendarDays,
      gradient: ['#3b82f6', '#2563eb'],
      stats: 'Great for recovery-based habits',
    },
    {
      id: 'custom' as const,
      title: 'Custom Schedule',
      subtitle: 'Choose specific days',
      description: 'Flexible schedule around commitments',
      icon: CalendarClock,
      gradient: ['#8b5cf6', '#7c3aed'],
      stats: 'Adapt to your lifestyle',
    },
  ];

  return (
    <View style={tw`flex-1`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-5 pb-4`}>
        {/* Header with Quote Integrated */}
        <View style={tw`mb-5`}>
          <LinearGradient colors={['#06b6d4', '#0891b2']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
            <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Set Your Rhythm</Text>
            <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>How often do you want to practice this habit?</Text>

            {/* Integrated Quote */}
            <View style={tw`border-t border-white/20 pt-3 mt-1`}>
              <Text style={tw`text-xs text-white/70 italic leading-5`}>"{quotes.frequency.text}"</Text>
              <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {quotes.frequency.author}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Frequency Cards */}
        <View style={tw`gap-3 mb-6`}>
          {frequencies.map((frequency, index) => {
            const Icon = frequency.icon;
            const isSelected = selected === frequency.id;

            return (
              <Animated.View key={frequency.id} entering={FadeInDown.delay(index * 30).duration(400)}>
                <Pressable
                  onPress={() => onSelect(frequency.id)}
                  style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, { borderWidth: 1, borderColor: isSelected ? 'transparent' : '#e5e7eb' }, pressed && tw`opacity-90`]}
                >
                  <LinearGradient colors={isSelected ? [frequency.gradient[0], `${frequency.gradient[1]}dd`] : ['#ffffff', '#f9fafb']} style={tw`p-4`}>
                    <View style={tw`flex-row items-start`}>
                      {/* Icon Container */}
                      <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, isSelected ? tw`bg-white/25` : tw`bg-stone-100`]}>
                        <Icon size={24} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={2} />
                      </View>

                      {/* Text Content */}
                      <View style={tw`flex-1 mr-3 pt-0.5`}>
                        <Text style={[tw`text-base font-semibold mb-0.5`, isSelected ? tw`text-white` : tw`text-stone-800`]}>{frequency.title}</Text>
                        <Text style={[tw`text-sm leading-5 mb-1.5`, isSelected ? tw`text-white/90` : tw`text-stone-600`]}>{frequency.subtitle}</Text>
                        <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/85` : tw`text-stone-600`]}>{frequency.description}</Text>

                        {isSelected && (
                          <View style={tw`flex-row items-center mt-2`}>
                            <Sparkles size={12} color="#ffffff" strokeWidth={2} style={tw`mr-1.5`} />
                            <Text style={tw`text-xs text-white/90 font-medium`}>{frequency.stats}</Text>
                          </View>
                        )}
                      </View>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <View style={tw`w-5.5 h-5.5 rounded-full bg-white/30 items-center justify-center flex-shrink-0 mt-0.5`}>
                          <View style={tw`w-2 h-2 bg-white rounded-full`} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Custom Days Selector (if custom selected) */}
        {selected === 'custom' && (
          <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-6`}>
            <Text style={tw`text-sm font-medium text-stone-700 mb-3`}>Select days of the week:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const isDaySelected = customDays?.includes(index);
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      const newDays = isDaySelected ? customDays?.filter((d) => d !== index) : [...(customDays || []), index];
                      onSelect('custom', newDays);
                    }}
                    style={({ pressed }) => [tw`px-4 py-3 rounded-xl`, isDaySelected ? tw`bg-purple-500` : tw`bg-stone-100`, pressed && tw`opacity-80`]}
                  >
                    <Text style={[tw`text-sm font-semibold`, isDaySelected ? tw`text-white` : tw`text-stone-600`]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Professional Tip */}
        <LinearGradient colors={['#d1fae5', '#a7f3d0', '#6ee7b7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 border border-emerald-200`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Award size={18} color="#047857" strokeWidth={2} style={tw`mr-2`} />
            <Text style={tw`text-sm font-semibold text-emerald-900`}>{tips.frequency[0].title}</Text>
          </View>
          <Text style={tw`text-sm text-emerald-800 leading-5`}>
            {selected === 'daily'
              ? tips.frequency[0].content
              : selected === 'weekly'
              ? tips.frequency[1].content
              : 'Custom schedules are perfect for working around existing commitments and building sustainable routines.'}
          </Text>
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default FrequencySelector;
