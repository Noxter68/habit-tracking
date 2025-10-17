// src/components/wizard/HabitTypeSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, ShieldOff, Target, CheckCircle2, XCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';
import { habitTypes, quotes, tips } from '../../utils/habitHelpers';

interface HabitTypeCardsProps {
  selected?: HabitType;
  onSelect: (type: HabitType) => void;
}

// Get icon for habit type with better semantic meaning
const getIcon = (type: HabitType) => {
  return type === 'good' ? CheckCircle2 : XCircle;
};

// Get quote based on selection
const getQuote = (type?: HabitType) => {
  if (type === 'good') return quotes.good;
  if (type === 'bad') return quotes.bad;
  return quotes.start;
};

const HabitTypeCards: React.FC<HabitTypeCardsProps> = ({ selected, onSelect }) => {
  const currentQuote = getQuote(selected);

  return (
    <View style={tw`px-5`}>
      {/* Hero Section with Quote Integrated */}
      <View style={tw`mb-5`}>
        <LinearGradient colors={['#8b5cf6', '#7c3aed', '#6d28d9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
          <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Begin Your Journey</Text>
          <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>Every expert was once a beginner. Your transformation starts with a single choice.</Text>

          {/* Integrated Quote */}
          <View style={tw`border-t border-white/20 pt-3 mt-1`}>
            <Text style={tw`text-xs text-white/70 italic leading-5`}>"{currentQuote.text}"</Text>
            <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {currentQuote.author}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Type Cards */}
      <View style={tw`gap-4 mb-6`}>
        {habitTypes.map((type, index) => {
          const Icon = getIcon(type.id);
          const isSelected = selected === type.id;

          return (
            <Animated.View key={type.id} entering={FadeInDown.delay(index * 100).duration(500)}>
              <Pressable onPress={() => onSelect(type.id)} style={({ pressed }) => [tw`rounded-3xl overflow-hidden`, pressed && tw`opacity-90`]}>
                <LinearGradient
                  colors={isSelected ? type.gradient : ['#F9FAFB', '#F3F4F6']}
                  style={[tw`p-5 rounded-3xl`, isSelected ? { borderWidth: 2, borderColor: type.gradient[1] + 'CC' } : { borderWidth: 1, borderColor: '#D1D5DB' }]}
                >
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      {/* Icon Container */}
                      <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center mr-4`, isSelected ? tw`bg-white/20` : tw`bg-quartz-100`]}>
                        <Icon size={28} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                      </View>

                      {/* Text Content */}
                      <View style={tw`flex-1`}>
                        <Text style={[tw`text-lg font-semibold mb-1`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{type.title}</Text>
                        <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/90` : tw`text-quartz-600`]}>{type.subtitle}</Text>
                      </View>
                    </View>

                    {/* Selection Indicator */}
                    <View style={[tw`w-6 h-6 rounded-full border-2`, isSelected ? tw`border-white bg-white/30` : tw`border-quartz-300 bg-transparent`]}>
                      {isSelected && <View style={tw`w-2.5 h-2.5 bg-white rounded-full m-auto`} />}
                    </View>
                  </View>

                  {/* Expanded Description when selected */}
                  {isSelected && (
                    <Animated.View entering={FadeInDown.duration(300)}>
                      <Text style={tw`text-sm text-white/85 mt-3 leading-5`}>{type.description}</Text>
                    </Animated.View>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Professional Tip Section - Simplified without icon */}
      <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 border border-sky-200`}>
        <Text style={tw`text-sm font-semibold text-white mb-1.5`}>{tips.habitType[0].title}</Text>
        <Text style={tw`text-sm text-white leading-5`}>{tips.habitType[0].content}</Text>
      </LinearGradient>
    </View>
  );
};

export default HabitTypeCards;
