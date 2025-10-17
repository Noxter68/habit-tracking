// src/components/wizard/FrequencySelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, CalendarDays, CalendarRange, TrendingUp } from 'lucide-react-native';
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
      icon: CalendarRange,
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
        <View style={tw`gap-4 mb-6`}>
          {frequencies.map((frequency, index) => {
            const Icon = frequency.icon;
            const isSelected = selected === frequency.id;

            return (
              <Animated.View key={frequency.id} entering={FadeInDown.delay(index * 100).duration(500)}>
                <Pressable onPress={() => onSelect(frequency.id)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
                  <LinearGradient
                    colors={isSelected ? [frequency.gradient[0] + 'E6', frequency.gradient[1]] : ['#FAFAFA', '#F5F5F5']}
                    style={[tw`p-5`, isSelected ? { borderWidth: 2, borderColor: frequency.gradient[1] + 'DD' } : { borderWidth: 2, borderColor: '#E5E7EB' }]}
                  >
                    <View style={tw`flex-row items-start justify-between mb-3`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, isSelected ? tw`bg-white/25` : tw`bg-quartz-50`]}>
                          <Icon size={24} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={2} />
                        </View>

                        <View style={tw`flex-1`}>
                          <Text style={[tw`text-lg font-semibold mb-0.5`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{frequency.title}</Text>
                          <Text style={[tw`text-sm`, isSelected ? tw`text-white/80` : tw`text-quartz-600`]}>{frequency.subtitle}</Text>
                        </View>
                      </View>

                      <View style={[tw`w-6 h-6 rounded-full border-2`, isSelected ? tw`border-white bg-white/30` : tw`border-quartz-300`]}>
                        {isSelected && <View style={tw`w-2.5 h-2.5 bg-white rounded-full m-auto`} />}
                      </View>
                    </View>

                    <Text style={[tw`text-sm leading-5 mb-2`, isSelected ? tw`text-white/90` : tw`text-quartz-600`]}>{frequency.description}</Text>

                    {isSelected && (
                      <View style={tw`bg-white/10 rounded-lg px-3 py-2 mt-2`}>
                        <Text style={tw`text-xs text-white/90 font-medium`}>✨ {frequency.stats}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Custom Days Selector (if custom selected) */}
        {selected === 'custom' && (
          <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-6`}>
            <Text style={tw`text-sm font-medium text-quartz-700 mb-3`}>Select days of the week:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const isSelected = customDays?.includes(index);
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      const newDays = isSelected ? customDays?.filter((d) => d !== index) : [...(customDays || []), index];
                      onSelect('custom', newDays);
                    }}
                    style={[tw`px-4 py-3 rounded-xl`, isSelected ? tw`bg-purple-500` : tw`bg-quartz-100`]}
                  >
                    <Text style={[tw`text-sm font-semibold`, isSelected ? tw`text-white` : tw`text-quartz-600`]}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Professional Tip */}
        <View style={tw`bg-emerald-50 rounded-2xl p-4 border-l-3 border-l-emerald-500`}>
          <View style={tw`flex-row items-center mb-2`}>
            <TrendingUp size={18} color="#059669" strokeWidth={2} style={tw`mr-2`} />
            <Text style={tw`text-sm font-semibold text-emerald-900`}>{tips.frequency[0].title}</Text>
          </View>
          <Text style={tw`text-sm text-emerald-800 leading-5`}>
            {selected === 'daily'
              ? tips.frequency[0].content
              : selected === 'weekly'
              ? tips.frequency[1].content
              : 'Custom schedules are perfect for working around existing commitments and building sustainable routines.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default FrequencySelector;
