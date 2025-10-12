import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import tw from 'twrnc';
import { PeriodType } from '@/utils/premiumStatsCalculation';

interface PeriodSelectorProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
}

interface Period {
  id: PeriodType;
  label: string;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ selected, onSelect }) => {
  const periods: Period[] = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: '4weeks', label: '4 Weeks' },
  ];

  return (
    <View style={tw`flex-row bg-sand rounded-3xl p-1.5 shadow-lg`}>
      {periods.map((period) => (
        <TouchableOpacity key={period.id} onPress={() => onSelect(period.id)} style={tw`flex-1 py-3 px-4 rounded-2xl ${selected === period.id ? 'bg-sand-100' : ''}`}>
          <Text style={tw`text-center font-semibold ${selected === period.id ? 'text-black' : 'text-stone-300'} text-sm`}>{period.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default PeriodSelector;
