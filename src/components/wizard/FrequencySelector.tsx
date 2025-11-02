// src/components/wizard/FrequencySelector.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, CalendarDays, CalendarClock } from 'lucide-react-native';
import tw from '../../lib/tailwind';

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
      description: 'Build consistency',
      icon: Calendar,
    },
    {
      id: 'weekly' as const,
      title: 'Weekly',
      subtitle: 'Once per week',
      description: 'Perfect for planning',
      icon: CalendarDays,
    },
    {
      id: 'custom' as const,
      title: 'Custom',
      subtitle: 'Choose specific days',
      description: 'Flexible schedule',
      icon: CalendarClock,
    },
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={tw`flex-1 justify-center`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-10`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>Set Your Rhythm</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>How often will you practice this habit?</Text>
        </View>

        {/* Frequency Options */}
        <View style={tw`gap-3 mb-6`}>
          {frequencies.map((frequency, index) => {
            const Icon = frequency.icon;
            const isSelected = selected === frequency.id;

            return (
              <Animated.View key={frequency.id} entering={FadeInDown.delay(index * 30).duration(300)}>
                <Pressable
                  onPress={() => onSelect(frequency.id)}
                  style={({ pressed }) => [
                    tw`rounded-2xl p-5 flex-row items-center border-2 ${isSelected ? 'border-cyan-400/60' : 'border-white/10'}`,
                    { backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
                    pressed && tw`opacity-80`,
                  ]}
                >
                  <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.1)' }]}>
                    <Icon size={24} color="#ffffff" strokeWidth={2} />
                  </View>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-base font-semibold text-white mb-0.5`}>{frequency.title}</Text>
                    <Text style={tw`text-sm text-white/70 leading-5`}>{frequency.subtitle}</Text>
                    <Text style={tw`text-xs text-white/50 mt-1`}>{frequency.description}</Text>
                  </View>

                  {isSelected && (
                    <View style={tw`w-6 h-6 rounded-full bg-cyan-500 items-center justify-center`}>
                      <View style={tw`w-3 h-3 rounded-full bg-white`} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Custom Days Selector */}
        {selected === 'custom' && (
          <Animated.View entering={FadeInDown.duration(300)} style={tw`mb-6`}>
            <Text style={tw`text-sm font-medium text-white/90 mb-3`}>Select days:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {weekDays.map((day, index) => {
                const isDaySelected = customDays?.includes(index);
                return (
                  <Pressable
                    key={day}
                    onPress={() => {
                      const newDays = isDaySelected ? customDays?.filter((d) => d !== index) : [...(customDays || []), index];
                      onSelect('custom', newDays);
                    }}
                    style={({ pressed }) => [tw`px-5 py-3 rounded-xl ${isDaySelected ? 'bg-cyan-500' : 'bg-white/15'}`, pressed && tw`opacity-70`]}
                  >
                    <Text style={tw`text-sm font-semibold ${isDaySelected ? 'text-white' : 'text-white/70'}`}>{day}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Tip */}
        <View style={tw`mt-4`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>Daily habits are 2.5x more likely to stick{'\n'}Start small and build momentum</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default FrequencySelector;
