import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { TrendingUp, Grid3X3, PieChart, LucideIcon } from 'lucide-react-native';
import tw from 'twrnc';
import { ChartType } from '@/utils/premiumStatsCalculation';

interface ChartTypeSelectorProps {
  selected: ChartType;
  onSelect: (type: ChartType) => void;
}

interface ChartTypeOption {
  id: ChartType;
  Icon: LucideIcon;
  label: string;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({ selected, onSelect }) => {
  const chartTypes: ChartTypeOption[] = [
    { id: 'area', Icon: TrendingUp, label: 'Trend' },
    { id: 'heatmap', Icon: Grid3X3, label: 'Heatmap' },
    { id: 'ring', Icon: PieChart, label: 'Summary' },
  ];

  return (
    <View style={tw`flex-row bg-white rounded-3xl p-2 shadow-lg`}>
      {chartTypes.map(({ id, Icon, label }) => (
        <TouchableOpacity key={id} onPress={() => onSelect(id)} style={tw`flex-1 items-center py-3 rounded-2xl ${selected === id ? 'bg-gray-100' : ''}`}>
          <Icon size={20} color={selected === id ? '#000000' : '#9CA3AF'} />
          <Text style={tw`mt-2 text-xs ${selected === id ? 'text-black font-bold' : 'text-gray-400'}`}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ChartTypeSelector;
