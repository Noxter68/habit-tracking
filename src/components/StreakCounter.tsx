// src/components/StreakCounter.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import tw from '../lib/tailwind';

interface StreakCounterProps {
  streak: number;
  compact?: boolean;
  showLabel?: boolean;
  lightMode?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ streak, compact = false, showLabel = true, lightMode = false }) => {
  const getStreakColor = () => {
    if (streak >= 30) return '#374151'; // Legendary - darkest gray
    if (streak >= 7) return '#4B5563'; // Epic - dark gray
    if (streak >= 3) return '#6B7280'; // Rare - medium gray
    return '#9CA3AF'; // Common - light gray
  };

  const getTextColor = () => {
    if (lightMode) return 'text-white';
    if (streak >= 30) return 'text-quartz-700';
    if (streak >= 7) return 'text-quartz-600';
    return 'text-quartz-500';
  };

  const getBgColor = () => {
    if (lightMode) return 'bg-sand/20';
    if (streak >= 30) return 'bg-quartz-100';
    if (streak >= 7) return 'bg-quartz-50';
    return 'bg-transparent';
  };

  if (compact) {
    return (
      <View style={tw`flex-row items-center gap-1 ${getBgColor()} ${streak >= 3 ? 'px-2 py-0.5 rounded-full' : ''}`}>
        <Flame size={14} color={lightMode ? '#ffffff' : getStreakColor()} />
        <Text style={tw`text-xs font-bold ${getTextColor()}`}>{streak}</Text>
        {showLabel && <Text style={tw`text-xs ${lightMode ? 'text-white/80' : 'text-quartz-400'}`}>{streak === 1 ? 'day' : 'days'}</Text>}
      </View>
    );
  }

  return (
    <View style={tw`flex-row items-center gap-2 bg-quartz-50 px-3 py-2 rounded-xl`}>
      <View style={tw`${streak >= 7 ? 'bg-quartz-200' : 'bg-quartz-100'} p-2 rounded-lg`}>
        <Flame size={20} color={getStreakColor()} />
      </View>
      <View>
        <Text style={tw`text-sm font-bold ${getTextColor()}`}>
          {streak} {streak === 1 ? 'Day' : 'Days'}
        </Text>
        {streak >= 7 && <Text style={tw`text-xs text-quartz-400`}>{streak >= 30 ? 'Legendary!' : 'On Fire!'}</Text>}
      </View>
    </View>
  );
};

export default StreakCounter;
