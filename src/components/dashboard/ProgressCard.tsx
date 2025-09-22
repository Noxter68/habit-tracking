// src/components/dashboard/ProgressCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring, interpolate, Extrapolate } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { ProgressStatus } from '../../utils/progressStatus';
import { useNavigation } from '@react-navigation/native';
import { ProgressZenIcon } from '../icons/ProgressionZenIcon';

interface ProgressCardProps {
  status: ProgressStatus;
  completionRate: number;
  habitsCompleted: number;
  totalHabits: number;
  totalCompletions: number;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ status, completionRate, habitsCompleted, totalHabits, totalCompletions }) => {
  const navigation = useNavigation();

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring(`${completionRate}%`, {
      damping: 15,
      stiffness: 100,
    }),
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(completionRate, [0, 100], [0.95, 1], Extrapolate.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[tw`px-5 pb-4`, scaleStyle]}>
      <View style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
        {/* Compact Header */}
        <View style={tw`flex-row items-center mb-3`}>
          <ProgressZenIcon size={28} />

          <View style={tw`flex-1 ml-2.5`}>
            <View style={tw`flex-row items-center`}>
              <Text style={tw`text-sm font-bold text-gray-900`}>
                {habitsCompleted}/{totalHabits} completed
              </Text>
              <Text style={[tw`text-sm font-bold ml-2`, completionRate === 100 ? tw`text-green-600` : completionRate >= 50 ? tw`text-indigo-600` : tw`text-gray-500`]}>· {completionRate}%</Text>
            </View>
            <Text style={tw`text-xs text-gray-500 mt-0.5`}>{status.message}</Text>
          </View>
        </View>

        {/* Ultra Slim Progress Bar */}
        <View style={tw`h-0.5 bg-gray-100 rounded-full overflow-hidden`}>
          <Animated.View style={[tw`h-full rounded-full`, { backgroundColor: status.colors[0] }, progressStyle]} />
        </View>

        {/* Minimal Stats Link */}
        <Pressable onPress={() => navigation.navigate('Stats' as never)} style={({ pressed }) => [tw`flex-row items-center justify-end mt-2.5`, pressed && tw`opacity-70`]}>
          <Text style={tw`text-xs text-gray-400`}>
            All time: <Text style={tw`font-semibold text-gray-600`}>{totalCompletions}</Text> →
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default ProgressCard;
