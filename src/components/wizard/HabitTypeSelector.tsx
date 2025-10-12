import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, ShieldOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      gradient: ['#E5E7EB', '#D1D5DB'], // quartz-100 to quartz-200
      selectedGradient: ['#9CA3AF', '#6B7280'], // quartz-300 to quartz-400
    },
    {
      id: 'bad' as HabitType,
      title: 'Quit a Bad Habit',
      subtitle: 'Break free from what holds you back',
      icon: ShieldOff,
      gradient: ['#D1D5DB', '#9CA3AF'], // quartz-200 to quartz-300
      selectedGradient: ['#6B7280', '#4B5563'], // quartz-400 to quartz-500
    },
  ];

  return (
    <View style={tw`px-5`}>
      {/* Header with subtle gradient */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Let's Get Started</Text>
        <Text style={tw`text-quartz-600 leading-5`}>Choose your path to personal growth</Text>
      </View>

      {/* Cards */}
      <View style={tw`gap-3`}>
        {habitTypes.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selected === type.id;

          return (
            <Animated.View key={type.id} entering={FadeInDown.delay(index * 100).duration(600)}>
              <Pressable onPress={() => onSelect(type.id)} style={({ pressed }) => [tw`rounded-3xl overflow-hidden`, pressed && tw`opacity-90`]}>
                <LinearGradient colors={isSelected ? type.selectedGradient : type.gradient} style={tw`border border-quartz-200`}>
                  <ImageBackground
                    source={require('../../../assets/interface/quartz-texture.png')}
                    style={tw`p-5`}
                    imageStyle={{ opacity: isSelected ? 0.3 : 0.1, borderRadius: 24 }}
                    resizeMode="cover"
                  >
                    <View style={tw`flex-row items-center justify-between`}>
                      <View style={tw`flex-row items-center flex-1`}>
                        {/* Icon Container */}
                        <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, isSelected ? tw`bg-sand/30` : tw`bg-quartz-50/50`]}>
                          <Icon size={24} color={isSelected ? '#FFFFFF' : '#4B5563'} strokeWidth={1.5} />
                        </View>

                        {/* Text Content */}
                        <View style={tw`flex-1`}>
                          <Text style={[tw`text-base font-medium mb-1`, isSelected ? tw`text-white` : tw`text-quartz-800`]}>{type.title}</Text>
                          <Text style={[tw`text-sm leading-5`, isSelected ? tw`text-white/80` : tw`text-quartz-600`]}>{type.subtitle}</Text>
                        </View>
                      </View>

                      {/* Selection Indicator */}
                      <View style={[tw`w-6 h-6 rounded-full border-2`, isSelected ? tw`border-white bg-sand/20` : tw`border-quartz-300 bg-quartz-50/50`]}>
                        {isSelected && <View style={tw`w-2.5 h-2.5 bg-sand rounded-full m-auto`} />}
                      </View>
                    </View>
                  </ImageBackground>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {/* Helper Section with Quartz Texture */}
      <View style={tw`mt-6 bg-quartz-50 rounded-2xl overflow-hidden`}>
        <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: 0.05, borderRadius: 16 }} resizeMode="cover">
          <Text style={tw`text-xs font-medium text-quartz-500 uppercase tracking-wider mb-2`}>Quick Tip</Text>
          <Text style={tw`text-sm text-quartz-700 leading-5`}>Most people start with building good habits. You can always track multiple habits of both types.</Text>
        </ImageBackground>
      </View>
    </View>
  );
};

export default HabitTypeCards;
