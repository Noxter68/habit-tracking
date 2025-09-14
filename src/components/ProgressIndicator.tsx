import React from 'react';
import { View } from 'react-native';
import tw from '../lib/tailwind';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ current, total }) => {
  return (
    <View style={tw`flex-row gap-2`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[tw`flex-1 h-1 rounded-full`, i < current ? tw`bg-teal-500` : tw`bg-slate-200`]} />
      ))}
    </View>
  );
};

export default ProgressIndicator;
