import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, ShieldOff } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface HabitTypeCardsProps {
  selected?: HabitType;
  onSelect: (type: HabitType) => void;
}

const HabitTypeCards: React.FC<HabitTypeCardsProps> = ({ selected, onSelect }) => {
  const habitTypes = [
    {
      id: 'good' as HabitType,
      title: 'Build a Good Habit',
      subtitle: 'Start something positive for your life',
      icon: TrendingUp,
      color: '#10b981',
      bgColor: '#f0fdf4',
      borderColor: '#86efac',
    },
    {
      id: 'bad' as HabitType,
      title: 'Quit a Bad Habit',
      subtitle: 'Break free from what holds you back',
      icon: ShieldOff,
      color: '#ef4444',
      bgColor: '#fef2f2',
      borderColor: '#fca5a5',
    },
  ];

  return (
    <View style={tw`px-5`}>
      {/* Header */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>Let's Get Started</Text>
        <Text style={tw`text-gray-600 leading-5`}>Choose your path to personal growth</Text>
      </View>

      {/* Cards */}
      <View style={tw`gap-3`}>
        {habitTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <Animated.View key={type.id} entering={FadeInDown.delay(index * 100).duration(400)}>
              <Pressable
                onPress={() => onSelect(type.id)}
                style={({ pressed }) => [
                  tw`p-4 rounded-2xl border`,
                  isSelected ? { backgroundColor: type.bgColor, borderColor: type.borderColor, borderWidth: 2 } : tw`bg-white border-gray-200`,
                  pressed && tw`opacity-90`,
                ]}
              >
                <View style={tw`flex-row items-start justify-between`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    {/* Icon Container */}
                    <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3`, isSelected ? { backgroundColor: type.color + '20' } : tw`bg-gray-50`]}>
                      <Icon size={24} color={isSelected ? type.color : '#6b7280'} />
                    </View>

                    {/* Text Content */}
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-base font-semibold text-gray-900 mb-1`}>{type.title}</Text>
                      <Text style={tw`text-sm text-gray-600 leading-5`}>{type.subtitle}</Text>
                    </View>
                  </View>

                  {/* Radio Button */}
                  <View style={[tw`w-5 h-5 rounded-full border-2 ml-2`, isSelected ? { borderColor: type.color, backgroundColor: 'white' } : tw`border-gray-300`]}>
                    {isSelected && <View style={[tw`w-2 h-2 rounded-full m-auto`, { backgroundColor: type.color }]} />}
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Helper Section */}
      <View style={tw`mt-6 p-4 bg-gray-50 rounded-2xl`}>
        <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2`}>Quick Tip</Text>
        <Text style={tw`text-sm text-gray-700 leading-5`}>Most people start with building good habits. You can always track multiple habits of both types.</Text>
      </View>
    </View>
  );
};

export default HabitTypeCards;
