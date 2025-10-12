// src/components/stats/ConsistencyChart.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';

interface ConsistencyChartProps {
  consistency: number;
  period: 'week' | 'month' | 'all';
}

const ConsistencyChart: React.FC<ConsistencyChartProps> = ({ consistency, period }) => {
  const getConsistencyColor = () => {
    if (consistency >= 80) return { colors: ['#10b981', '#059669'], icon: '🔥' };
    if (consistency >= 60) return { colors: ['#3b82f6', '#2563eb'], icon: '💪' };
    if (consistency >= 40) return { colors: ['#f59e0b', '#d97706'], icon: '📈' };
    return { colors: ['#ef4444', '#dc2626'], icon: '💡' };
  };

  const { colors, icon } = getConsistencyColor();
  const periodLabel = period === 'week' ? '7-Day' : period === 'month' ? '30-Day' : 'Overall';

  return (
    <View style={tw`bg-sand rounded-2xl p-5 shadow-sm border border-slate-100`}>
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <View>
          <Text style={tw`text-base font-semibold text-slate-900`}>{periodLabel} Consistency</Text>
          <Text style={tw`text-xs text-slate-500 mt-1`}>
            {consistency >= 80 ? 'Outstanding performance!' : consistency >= 60 ? 'Good progress, keep going!' : consistency >= 40 ? 'Room for improvement' : "Let's build momentum!"}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-3xl font-bold text-slate-900 mr-1`}>{consistency}%</Text>
          <Text style={tw`text-2xl`}>{icon}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={tw`h-3 bg-slate-100 rounded-full overflow-hidden`}>
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${Math.max(consistency, 5)}%` }]} />
      </View>

      {/* Milestone Markers */}
      <View style={tw`flex-row justify-between mt-2`}>
        <Text style={tw`text-xs text-slate-400`}>0%</Text>
        <Text style={tw`text-xs text-slate-400`}>40%</Text>
        <Text style={tw`text-xs text-slate-400`}>60%</Text>
        <Text style={tw`text-xs text-slate-400`}>80%</Text>
        <Text style={tw`text-xs text-slate-400`}>100%</Text>
      </View>
    </View>
  );
};

export default ConsistencyChart;
