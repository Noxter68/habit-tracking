// src/components/premium/AreaChart.tsx
import React, { useState } from 'react';
import { View, ScrollView, Dimensions, Text, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import tw from '@/lib/tailwind';
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
    // Add details for each data point
    details?: Array<{
      label: string;
      tasks: { completed: number; total: number };
      habits: string[];
    }>;
  };
  period?: PeriodType;
}

const screenWidth = Dimensions.get('window').width;

const AreaChart: React.FC<AreaChartProps> = ({ data, period = 'week' }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || !data.datasets || data.datasets.length === 0 || !data.datasets[0].data) {
    return (
      <View
        style={[
          tw`rounded-2xl p-8 items-center justify-center bg-white`,
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          },
        ]}
      >
        <Text style={tw`text-sand-600 text-center text-sm`}>No data available</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`, // stone-400
    labelColor: (opacity = 1) => `rgba(168, 152, 133, ${opacity})`, // sand-500
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '0',
      stroke: '#6B7280',
    },
    fillShadowGradient: '#6B7280',
    fillShadowGradientOpacity: 0.08,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#f5f2ed',
      strokeWidth: 1,
    },
    paddingRight: 20,
  };

  const chartWidth = period === 'month' || period === '4weeks' ? Math.max(screenWidth - 64, data.labels.length * 50) : screenWidth - 64;

  const handleDataPointClick = (dataPoint: any) => {
    const index = data.labels.indexOf(dataPoint.dataset.label);
    setSelectedIndex(index);
  };

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
      onDataPointClick={handleDataPointClick}
    />
  );

  const selectedDetail = selectedIndex !== null && data.details?.[selectedIndex];

  return (
    <View
      style={[
        tw`rounded-2xl overflow-hidden bg-white`,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      ]}
    >
      <View style={tw`px-5 py-5`}>
        {period === 'month' || period === '4weeks' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`pb-2`}>
            {chart}
          </ScrollView>
        ) : (
          chart
        )}

        {/* Detail Panel when a point is selected */}
        {selectedDetail && (
          <View
            style={[
              tw`mt-4 rounded-xl p-4 bg-sand-50`,
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
              },
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-2`}>
              <Text style={tw`text-sm font-bold text-stone-800`}>{selectedDetail.label}</Text>
              <TouchableOpacity onPress={() => setSelectedIndex(null)}>
                <Text style={tw`text-xs text-sand-600`}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={tw`text-xs text-sand-700 mb-2`}>
              {selectedDetail.tasks.completed} of {selectedDetail.tasks.total} tasks completed
            </Text>

            {selectedDetail.habits.length > 0 && (
              <View style={tw`mt-2`}>
                <Text style={tw`text-xs font-semibold text-sand-600 mb-1`}>Active Habits:</Text>
                {selectedDetail.habits.map((habit, idx) => (
                  <Text key={idx} style={tw`text-xs text-sand-700 ml-2`}>
                    • {habit}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default AreaChart;
