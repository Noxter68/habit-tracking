import React, { useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Calendar, Target, Lightbulb } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Frequency } from '../../types';

interface FrequencySelectorProps {
  selected: Frequency;
  customDays?: string[];
  onSelect: (frequency: Frequency, customDays?: string[]) => void;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ selected, customDays, onSelect }) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(customDays || []);
  const scaleAnim = new Animated.Value(1);

  const frequencies = [
    {
      id: 'daily',
      label: 'Every Day',
      description: 'Build consistency with daily practice',
      icon: Sun,
      badge: 'Most Popular',
      color: ['#6366f1', '#4f46e5'],
    },
    {
      id: 'weekly',
      label: 'Weekly',
      description: 'Perfect for weekly reviews or routines',
      icon: Calendar,
      badge: null,
      color: ['#8b5cf6', '#7c3aed'],
    },
    {
      id: 'custom',
      label: 'Custom Days',
      description: 'Choose specific days that work for you',
      icon: Target,
      badge: 'Flexible',
      color: ['#ec4899', '#db2777'],
    },
  ];

  const weekDays = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' },
  ];

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
    setSelectedDays(newDays);
    if (selected === 'custom') {
      onSelect('custom', newDays);
    }
  };

  const handleFrequencySelect = (frequency: Frequency) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    onSelect(frequency, frequency === 'custom' ? selectedDays : undefined);
  };

  const getFrequencyStats = (freq: string) => {
    switch (freq) {
      case 'daily':
        return '7 days/week';
      case 'weekly':
        return '1 day/week';
      case 'custom':
        return selectedDays.length > 0 ? `${selectedDays.length} days/week` : 'Select days';
      default:
        return '';
    }
  };

  return (
    <View style={tw`px-5`}>
      {/* Header */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>How Often?</Text>
        <Text style={tw`text-gray-600 leading-5`}>Set a schedule that fits your lifestyle</Text>
      </View>

      {/* Frequency Cards */}
      <View style={tw`gap-3 mb-4`}>
        {frequencies.map((freq) => {
          const isSelected = selected === freq.id;
          const Icon = freq.icon;

          return (
            <Animated.View key={freq.id} style={{ transform: [{ scale: isSelected ? scaleAnim : 1 }] }}>
              <Pressable onPress={() => handleFrequencySelect(freq.id as Frequency)} style={({ pressed }) => [tw`overflow-hidden rounded-2xl`, pressed && tw`opacity-90`]}>
                {isSelected ? (
                  <LinearGradient colors={freq.color} style={tw`p-4`}>
                    <FrequencyCardContent freq={freq} Icon={Icon} isSelected={true} stats={getFrequencyStats(freq.id)} />
                  </LinearGradient>
                ) : (
                  <View style={tw`bg-white border border-gray-200 p-4`}>
                    <FrequencyCardContent freq={freq} Icon={Icon} isSelected={false} stats={getFrequencyStats(freq.id)} />
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Custom Days Selector */}
      {selected === 'custom' && (
        <Animated.View
          entering={{
            from: { opacity: 0, translateY: -10 },
            to: { opacity: 1, translateY: 0 },
          }}
          style={tw`bg-white rounded-2xl p-4 border border-gray-100`}
        >
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <Text style={tw`text-sm font-semibold text-gray-700`}>Select Your Days</Text>
            {selectedDays.length > 0 && (
              <View style={tw`bg-pink-50 px-2 py-1 rounded-lg`}>
                <Text style={tw`text-xs font-medium text-pink-700`}>{selectedDays.length} selected</Text>
              </View>
            )}
          </View>

          <View style={tw`flex-row flex-wrap gap-2`}>
            {weekDays.map((day) => {
              const isSelected = selectedDays.includes(day.short);

              return (
                <Pressable
                  key={day.short}
                  onPress={() => toggleDay(day.short)}
                  style={({ pressed }) => [tw`flex-1 min-w-20 py-3 rounded-xl border`, isSelected ? tw`bg-pink-50 border-pink-400` : tw`bg-gray-50 border-gray-200`, pressed && tw`opacity-80`]}
                >
                  <View style={tw`items-center`}>
                    <Text style={[tw`text-xs font-bold`, isSelected ? tw`text-pink-700` : tw`text-gray-700`]}>{day.short.toUpperCase()}</Text>
                    <View style={tw`mt-1`}>
                      <View style={[tw`w-3 h-3 rounded-full border`, isSelected ? tw`bg-pink-500 border-pink-500` : tw`bg-white border-gray-300`]} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedDays.length === 0 && (
            <View style={tw`mt-3 p-3 bg-stone-50 rounded-xl`}>
              <Text style={tw`text-xs text-stone-800 text-center`}>Tap to select at least one day</Text>
            </View>
          )}

          {selectedDays.length === 7 && (
            <View style={tw`mt-3 p-3 bg-green-50 rounded-xl`}>
              <Text style={tw`text-xs text-green-800 text-center font-medium`}>All days selected! Consider using "Every Day" option instead</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Info Section */}
      <View style={tw`mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4`}>
        <View style={tw`flex-row items-start`}>
          <View style={tw`w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3`}>
            <Lightbulb size={16} color="#4f46e5" />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-indigo-900 mb-1`}>Consistency Tip</Text>
            <Text style={tw`text-xs text-indigo-700 leading-5`}>
              {selected === 'daily'
                ? 'Daily habits are 2.5x more likely to stick. Even 5 minutes daily beats longer weekly sessions.'
                : selected === 'weekly'
                ? 'Weekly habits work best for reflection, planning, or activities that need recovery time.'
                : 'Custom schedules are perfect for working around existing commitments. Start with 3-4 days for best results.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Helper component for card content
const FrequencyCardContent: React.FC<{
  freq: any;
  Icon: any;
  isSelected: boolean;
  stats: string;
}> = ({ freq, Icon, isSelected, stats }) => (
  <View>
    <View style={tw`flex-row items-start justify-between mb-2`}>
      <View style={tw`flex-row items-center flex-1`}>
        <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, isSelected ? tw`bg-white/20` : tw`bg-gray-50`]}>
          <Icon size={20} color={isSelected ? '#ffffff' : '#6b7280'} />
        </View>
        <View style={tw`flex-1`}>
          <View style={tw`flex-row items-center`}>
            <Text style={[tw`text-lg font-semibold`, isSelected ? tw`text-white` : tw`text-gray-900`]}>{freq.label}</Text>
            {freq.badge && (
              <View style={[tw`ml-2 px-2 py-0.5 rounded-full`, isSelected ? tw`bg-white/20` : tw`bg-indigo-100`]}>
                <Text style={[tw`text-xs font-medium`, isSelected ? tw`text-white` : tw`text-indigo-700`]}>{freq.badge}</Text>
              </View>
            )}
          </View>
          <Text style={[tw`text-sm mt-0.5`, isSelected ? tw`text-white/90` : tw`text-gray-600`]}>{freq.description}</Text>
        </View>
      </View>

      {/* Radio Button */}
      <View style={[tw`w-5 h-5 rounded-full border-2 ml-2`, isSelected ? tw`border-white bg-white` : tw`border-gray-300`]}>
        {isSelected && <View style={tw`w-2 h-2 bg-indigo-600 rounded-full m-auto`} />}
      </View>
    </View>

    {/* Stats Bar */}
    <View style={[tw`mt-2 px-3 py-1.5 rounded-lg self-start`, isSelected ? tw`bg-white/20` : tw`bg-gray-50`]}>
      <Text style={[tw`text-xs font-medium`, isSelected ? tw`text-white` : tw`text-gray-600`]}>{stats}</Text>
    </View>
  </View>
);

export default FrequencySelector;
