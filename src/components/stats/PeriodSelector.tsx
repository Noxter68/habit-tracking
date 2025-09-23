// src/components/stats/PeriodSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from '../../lib/tailwind';

interface PeriodSelectorProps {
  selectedPeriod: 'week' | 'month' | 'all';
  onSelectPeriod: (period: 'week' | 'month' | 'all') => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selectedPeriod, onSelectPeriod }) => {
  const periods: Array<{ key: 'week' | 'month' | 'all'; label: string }> = [
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <View style={tw`bg-slate-100 rounded-2xl p-1 flex-row`}>
      {periods.map((period) => (
        <Pressable key={period.key} onPress={() => onSelectPeriod(period.key)} style={tw`flex-1`}>
          <View
            style={tw`
              px-4 py-2.5 rounded-xl
              ${selectedPeriod === period.key ? 'bg-white shadow-sm' : ''}
            `}
          >
            <Text
              style={tw`
                text-center text-sm font-semibold
                ${selectedPeriod === period.key ? 'text-slate-900' : 'text-slate-500'}
              `}
            >
              {period.label}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

export default PeriodSelector;
