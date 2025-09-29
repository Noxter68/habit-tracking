import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../lib/tailwind';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total }) => {
  const progress = (current / total) * 100;

  return (
    <View style={tw`px-5 py-3`}>
      {/* Step Counter */}
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <Text style={tw`text-sm font-medium text-quartz-600`}>
          Step {current} of {total}
        </Text>
        <Text style={tw`text-sm text-quartz-500`}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`h-2 bg-quartz-100 rounded-full overflow-hidden`}>
        <LinearGradient colors={['#9CA3AF', '#6B7280']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
      </View>

      {/* Step Dots */}
      <View style={tw`flex-row justify-between mt-3`}>
        {Array.from({ length: total }).map((_, index) => (
          <View key={index} style={[tw`w-2 h-2 rounded-full`, index < current ? tw`bg-quartz-400` : index === current - 1 ? tw`bg-quartz-600` : tw`bg-quartz-200`]} />
        ))}
      </View>
    </View>
  );
};

export default ProgressIndicator;
