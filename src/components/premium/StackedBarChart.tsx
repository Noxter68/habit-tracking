import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { StackedBarChart as RNStackedBarChart } from 'react-native-chart-kit';
import tw from 'twrnc';
import { PeriodType } from '@/utils/premiumStatsCalculation';

interface StackedBarChartProps {
  data: {
    labels: string[];
    legend: string[];
    data: number[][];
    barColors: string[];
  };
  period?: PeriodType;
}

const screenWidth = Dimensions.get('window').width;

const StackedBarChart: React.FC<StackedBarChartProps> = ({ data, period = 'week' }) => {
  // Validate data
  if (!data || !data.data || !data.labels || data.data.length === 0 || data.labels.length === 0) {
    return (
      <View style={tw`bg-sand rounded-3xl p-8 shadow-sm items-center justify-center`}>
        <Text style={tw`text-stone-400 text-center`}>No data available</Text>
      </View>
    );
  }

  // Ensure all data arrays are valid
  const safeData = {
    ...data,
    data: data.data.map((dayData) => {
      if (!Array.isArray(dayData)) return [0, 0, 0];
      return dayData.map((val) => (typeof val === 'number' ? val : 0));
    }),
    labels: data.labels || [],
    legend: data.legend || ['Completed', 'Partial', 'Missed'],
    barColors: data.barColors || ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    barPercentage: 0.7,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#F3F4F6',
      strokeWidth: 1,
    },
  };

  // Calculate chart width based on period
  const chartWidth = period === 'month' || period === '4weeks' ? Math.max(screenWidth - 48, safeData.labels.length * 80) : screenWidth - 48;

  const chart = (
    <RNStackedBarChart
      data={safeData}
      width={chartWidth}
      height={200}
      chartConfig={chartConfig}
      style={{
        borderRadius: 16,
        marginLeft: -10,
      }}
      withHorizontalLabels={true}
      withVerticalLabels={true}
    />
  );

  return (
    <View style={tw`bg-sand rounded-3xl p-4 shadow-sm`}>
      <View style={tw`flex-row justify-center mb-3 gap-4`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-3 h-3 bg-stone-300 rounded-full mr-2`} />
          <Text style={tw`text-stone-500 text-xs`}>Completed</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-3 h-3 bg-stone-200 rounded-full mr-2`} />
          <Text style={tw`text-stone-500 text-xs`}>Partial</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-3 h-3 bg-stone-100 rounded-full mr-2`} />
          <Text style={tw`text-stone-500 text-xs`}>Missed</Text>
        </View>
      </View>
      {period === 'month' || period === '4weeks' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={tw`pb-2`}>
          {chart}
        </ScrollView>
      ) : (
        chart
      )}
    </View>
  );
};

export default StackedBarChart;
