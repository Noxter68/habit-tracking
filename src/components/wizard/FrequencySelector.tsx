import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ImageBackground } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, CalendarDays, Clock, Lightbulb } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';

interface FrequencySelectorProps {
  selected: string;
  customDays?: string[];
  onSelect: (frequency: string, customDays?: string[]) => void;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({ selected, customDays = [], onSelect }) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(customDays);
  const [showCustomDays, setShowCustomDays] = useState(selected === 'custom');

  const frequencies = [
    {
      id: 'daily',
      label: 'Every Day',
      description: 'Build strong momentum',
      icon: Calendar,
      gradient: ['#9CA3AF', '#6B7280'],
      stats: '2.5x more likely to succeed',
      badge: 'Recommended',
    },
    {
      id: 'weekly',
      label: 'Weekly',
      description: 'Once per week',
      icon: CalendarDays,
      gradient: ['#D1D5DB', '#9CA3AF'],
      stats: 'Good for reflection habits',
    },
    {
      id: 'custom',
      label: 'Custom Days',
      description: 'Choose specific days',
      icon: Clock,
      gradient: ['#E5E7EB', '#D1D5DB'],
      stats: 'Flexible scheduling',
    },
  ];

  const weekDays = [
    { id: 'monday', label: 'Monday', short: 'Mon' },
    { id: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { id: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { id: 'thursday', label: 'Thursday', short: 'Thu' },
    { id: 'friday', label: 'Friday', short: 'Fri' },
    { id: 'saturday', label: 'Saturday', short: 'Sat' },
    { id: 'sunday', label: 'Sunday', short: 'Sun' },
  ];

  const handleFrequencySelect = (frequencyId: string) => {
    if (frequencyId === 'custom') {
      setShowCustomDays(true);
      onSelect(frequencyId, selectedDays.length > 0 ? selectedDays : ['monday']);
    } else {
      setShowCustomDays(false);
      onSelect(frequencyId);
    }
  };

  const toggleDay = (dayId: string) => {
    const newDays = selectedDays.includes(dayId) ? selectedDays.filter((d) => d !== dayId) : [...selectedDays, dayId];
    setSelectedDays(newDays);
    onSelect('custom', newDays);
  };

  return (
    <View style={tw`px-5`}>
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Set Your Rhythm</Text>
        <Text style={tw`text-quartz-600 leading-5`}>How often will you practice this habit?</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {frequencies.map((freq, index) => {
          const Icon = freq.icon;
          const isSelected = selected === freq.id;

          return (
            <Animated.View key={freq.id} entering={FadeInDown.delay(index * 100).duration(500)} style={tw`mb-3`}>
              <Pressable onPress={() => handleFrequencySelect(freq.id)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
                <LinearGradient colors={isSelected ? freq.gradient : ['#F3F4F6', '#E5E7EB']} style={tw`border border-quartz-200`}>
                  <ImageBackground
                    source={require('../../../assets/interface/quartz-texture.png')}
                    style={tw`p-4`}
                    imageStyle={{ opacity: isSelected ? 0.2 : 0.05, borderRadius: 16 }}
                    resizeMode="cover"
                  >
                    <View style={tw`flex-row items-start justify-between`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, isSelected ? tw`bg-white/20` : tw`bg-quartz-100`]}>
                          <Icon size={20} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                        </View>
                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row items-center`}>
                            <Text style={[tw`text-lg font-medium`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{freq.label}</Text>
                            {freq.badge && (
                              <View style={[tw`ml-2 px-2 py-0.5 rounded-full`, isSelected ? tw`bg-white/20` : tw`bg-quartz-200`]}>
                                <Text style={[tw`text-xs font-medium`, isSelected ? tw`text-white` : tw`text-quartz-600`]}>{freq.badge}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[tw`text-sm mt-0.5`, isSelected ? tw`text-white/80` : tw`text-quartz-600`]}>{freq.description}</Text>
                        </View>
                      </View>

                      <View style={[tw`w-5 h-5 rounded-full border-2 ml-2`, isSelected ? tw`border-white bg-white/20` : tw`border-quartz-300`]}>
                        {isSelected && <View style={tw`w-2 h-2 bg-white rounded-full m-auto`} />}
                      </View>
                    </View>

                    <View style={[tw`mt-2 px-3 py-1.5 rounded-lg self-start`, isSelected ? tw`bg-white/10` : tw`bg-quartz-50`]}>
                      <Text style={[tw`text-xs font-light`, isSelected ? tw`text-white` : tw`text-quartz-600`]}>{freq.stats}</Text>
                    </View>
                  </ImageBackground>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}

        {showCustomDays && (
          <Animated.View entering={FadeInDown.duration(500)} style={tw`mt-4 mb-4`}>
            <Text style={tw`text-sm font-medium text-quartz-700 mb-3`}>Select days:</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {weekDays.map((day) => {
                const isSelected = selectedDays.includes(day.id);
                return (
                  <Pressable
                    key={day.id}
                    onPress={() => toggleDay(day.id)}
                    style={({ pressed }) => [tw`px-4 py-3 rounded-2xl border`, isSelected ? tw`bg-quartz-300 border-quartz-400` : tw`bg-quartz-50 border-quartz-200`, pressed && tw`opacity-80`]}
                  >
                    <Text style={[tw`text-xs font-medium`, isSelected ? tw`text-white` : tw`text-quartz-700`]}>{day.short.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        <View style={tw`mt-6 bg-quartz-50 rounded-2xl overflow-hidden`}>
          <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: 0.05, borderRadius: 16 }} resizeMode="cover">
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-8 h-8 bg-quartz-100 rounded-lg items-center justify-center mr-3`}>
                <Lightbulb size={16} color="#6B7280" strokeWidth={1.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-medium text-quartz-700 mb-1`}>Consistency Tip</Text>
                <Text style={tw`text-xs text-quartz-600 leading-5`}>
                  {selected === 'daily'
                    ? 'Daily habits are 2.5x more likely to stick. Even 5 minutes daily beats longer weekly sessions.'
                    : selected === 'weekly'
                    ? 'Weekly habits work best for reflection, planning, or activities that need recovery time.'
                    : 'Custom schedules are perfect for working around existing commitments.'}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>
    </View>
  );
};

export default FrequencySelector;
