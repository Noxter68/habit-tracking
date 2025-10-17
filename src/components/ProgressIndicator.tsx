// src/components/ProgressIndicator.tsx
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

  // Jade gradient - always used
  const gradientColors = ['#10b981', '#059669'];

  return (
    <View>
      {/* Step Counter */}
      <View style={tw`flex-row items-center justify-between mb-3`}>
        <Text style={tw`text-sm font-medium text-quartz-600`}>
          Step {current} of {total}
        </Text>
        <Text style={tw`text-sm text-quartz-500`}>{Math.round(progress)}% Complete</Text>
      </View>

      {/* Progress Bar */}
      <View style={tw`h-2 bg-quartz-100 rounded-full overflow-hidden`}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${progress}%` }]} />
      </View>
    </View>
  );
};

export default ProgressIndicator;
