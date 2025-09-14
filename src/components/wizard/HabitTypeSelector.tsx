import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface HabitTypeCardsProps {
  selected?: HabitType;
  onSelect: (type: HabitType) => void;
}

const HabitTypeCards: React.FC<HabitTypeCardsProps> = ({ selected, onSelect }) => {
  return (
    <View style={tw`px-6`}>
      <Text style={tw`text-2xl font-semibold text-slate-700 mb-2`}>Let's get started</Text>
      <Text style={tw`text-slate-600 mb-8`}>What would you like to do?</Text>

      <View style={tw`gap-4`}>
        {/* Build Good Habit Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable
            onPress={() => onSelect('good')}
            style={({ pressed }) => [tw`bg-white rounded-2xl p-6 border-2`, selected === 'good' ? tw`border-teal-500 bg-teal-50` : tw`border-slate-200`, pressed && tw`opacity-95`]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-16 h-16 bg-teal-100 rounded-2xl items-center justify-center mr-4`}>
                <Text style={tw`text-3xl`}>🌱</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-semibold text-slate-800 mb-1`}>Build a Good Habit</Text>
                <Text style={tw`text-slate-600`}>Start something positive for your life</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Quit Bad Habit Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable
            onPress={() => onSelect('bad')}
            style={({ pressed }) => [tw`bg-white rounded-2xl p-6 border-2`, selected === 'bad' ? tw`border-red-500 bg-red-50` : tw`border-slate-200`, pressed && tw`opacity-95`]}
          >
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-16 h-16 bg-red-100 rounded-2xl items-center justify-center mr-4`}>
                <Text style={tw`text-3xl`}>🚫</Text>
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-semibold text-slate-800 mb-1`}>Quit a Bad Habit</Text>
                <Text style={tw`text-slate-600`}>Break free from something holding you back</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
};

export default HabitTypeCards;
