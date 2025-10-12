import React from 'react';
import { View, ScrollView, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import tw from 'twrnc';
import { PeriodType } from '@/utils/premiumStatsCalculation';

interface AreaChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color: (opacity?: number) => string;
      strokeWidth: number;
    }>;
    legend: string[];
  };
  period?: PeriodType;
}

const screenWidth = Dimensions.get('window').width;

const AreaChart: React.FC<AreaChartProps> = ({ data, period = 'week' }) => {
  if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0].data) {
    return (
      <View style={tw`bg-sand rounded-3xl p-12 shadow-lg items-center justify-center`}>
        <Text style={tw`text-stone-300 text-center`}>No data available</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '3',
      strokeWidth: '0',
      stroke: '#000000',
    },
    fillShadowGradient: '#000000',
    fillShadowGradientOpacity: 0.05,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#F3F4F6',
      strokeWidth: 0.5,
    },
    paddingRight: 0,
  };

  const chartWidth = period === 'month' || period === '4weeks' ? Math.max(screenWidth - 40, data.labels.length * 50) : screenWidth - 40;

  const chart = (
    <LineChart
      data={data}
      width={chartWidth}
      height={200}
      chartConfig={chartConfig}
      bezier
      style={{
        marginLeft: -20,
        paddingRight: 0,
        borderRadius: 16,
      }}
      withInnerLines={true}
      withOuterLines={false}
      withVerticalLabels={true}
      withHorizontalLabels={true}
      withShadow={false}
      yAxisSuffix="%"
      fromZero
      yAxisInterval={1}
      segments={4}
    />
  );

  return (
    <View style={tw`bg-sand rounded-3xl shadow-lg overflow-hidden`}>
      <View style={tw`px-5 py-6`}>
        <Text style={tw`text-xs uppercase tracking-wider text-stone-300 mb-6`}>Trend</Text>
        {period === 'month' || period === '4weeks' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`pb-2`}>
            {chart}
          </ScrollView>
        ) : (
          chart
        )}
      </View>
    </View>
  );
};

export default AreaChart;
