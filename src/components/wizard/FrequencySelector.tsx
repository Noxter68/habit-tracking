import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '../../lib/tailwind';
import { Frequency } from '../../types';

interface FrequencySelectorProps {
  selected: Frequency;
  customDays?: string[];
  onSelect: (frequency: Frequency, customDays?: string[]) => void;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ selected, customDays, onSelect }) => {
  const frequencies = [
    { id: 'daily', label: 'Daily', description: 'Every day' },
    { id: 'weekly', label: 'Weekly', description: 'Once a week' },
    { id: 'custom', label: 'Custom', description: 'Choose specific days' },
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState<string[]>(customDays || []);

  const toggleDay = (day: string) => {
    const newDays = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
    setSelectedDays(newDays);
    if (selected === 'custom') {
      onSelect('custom', newDays);
    }
  };

  return (
    <View style={tw`px-6`}>
      <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>How often?</Text>
      <Text style={tw`text-slate-600 mb-6`}>Choose how frequently you want to track this habit</Text>

      <View style={tw`gap-3`}>
        {frequencies.map((freq) => (
          <Pressable
            key={freq.id}
            onPress={() => onSelect(freq.id as Frequency, freq.id === 'custom' ? selectedDays : undefined)}
            style={({ pressed }) => [tw`bg-white p-4 rounded-xl border-2`, selected === freq.id ? tw`border-teal-500 bg-teal-50` : tw`border-slate-200`, pressed && tw`bg-slate-50`]}
          >
            <Text style={tw`text-lg font-medium text-slate-700`}>{freq.label}</Text>
            <Text style={tw`text-slate-600 text-sm`}>{freq.description}</Text>
          </Pressable>
        ))}
      </View>

      {selected === 'custom' && (
        <View style={tw`mt-4 p-4 bg-white rounded-xl`}>
          <Text style={tw`text-slate-700 font-medium mb-3`}>Select days:</Text>
          <View style={tw`flex-row flex-wrap gap-2`}>
            {weekDays.map((day) => (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={({ pressed }) => [tw`px-4 py-2 rounded-lg border`, selectedDays.includes(day) ? tw`bg-teal-500 border-teal-500` : tw`bg-white border-slate-300`, pressed && tw`opacity-80`]}
              >
                <Text style={[tw`font-medium`, selectedDays.includes(day) ? tw`text-white` : tw`text-slate-700`]}>{day}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default FrequencySelector;
