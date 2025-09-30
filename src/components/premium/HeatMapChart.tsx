import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import tw from 'twrnc';

interface HeatmapChartProps {
  data: {
    labels: string[];
    data: number[][];
    habitNames?: string[];
  };
  period?: string;
}

const screenWidth = Dimensions.get('window').width;

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, period = 'week' }) => {
  if (!data || !data.data || data.data.length === 0) {
    return (
      <View style={tw`bg-white rounded-3xl p-12 shadow-lg items-center justify-center`}>
        <Text style={tw`text-gray-400 text-center`}>No data available</Text>
      </View>
    );
  }

  const getColorForValue = (value: number): string => {
    if (value === 1) return '#000000'; // completed - black
    if (value === 0.5) return '#9CA3AF'; // partial - gray
    if (value === 0) return '#F3F4F6'; // missed - light gray
    return '#FFFFFF'; // no data - white
  };

  const cellSize = period === 'month' || period === '4weeks' ? 28 : 32;
  const chartWidth = Math.max(data.labels.length * (cellSize + 2) + 80, screenWidth - 40);

  const heatmapContent = (
    <View style={{ width: chartWidth }}>
      {/* Days header */}
      <View style={tw`flex-row mb-3 ml-20`}>
        {data.labels.map((label, index) => (
          <View key={index} style={[tw`items-center justify-center`, { width: cellSize + 2 }]}>
            <Text style={tw`text-xs text-gray-400`}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Heatmap grid with rounded cells */}
      {data.habitNames?.map((habitName, habitIndex) => (
        <View key={habitIndex} style={tw`flex-row mb-1`}>
          <View style={tw`w-20 justify-center pr-3`}>
            <Text style={tw`text-xs text-gray-600`} numberOfLines={1}>
              {habitName}
            </Text>
          </View>
          {data.data[habitIndex]?.map((value, dayIndex) => {
            const color = getColorForValue(value);
            return (
              <View
                key={dayIndex}
                style={[
                  tw`mx-0.5 rounded-lg`,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: color,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={tw`bg-white rounded-3xl shadow-lg overflow-hidden`}>
      <View style={tw`px-5 py-6`}>
        <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-6`}>Activity</Text>

        {period === 'month' || period === '4weeks' ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`pb-2`}>
            {heatmapContent}
          </ScrollView>
        ) : (
          heatmapContent
        )}

        {/* Minimal Legend with rounded backgrounds */}
        <View style={tw`flex-row gap-4 mt-8 justify-center`}>
          <View style={tw`flex-row items-center gap-2 bg-gray-50 px-3 py-2 rounded-full`}>
            <View style={tw`w-3 h-3 bg-black rounded-full`} />
            <Text style={tw`text-xs text-gray-600`}>Complete</Text>
          </View>
          <View style={tw`flex-row items-center gap-2 bg-gray-50 px-3 py-2 rounded-full`}>
            <View style={tw`w-3 h-3 bg-gray-400 rounded-full`} />
            <Text style={tw`text-xs text-gray-600`}>Partial</Text>
          </View>
          <View style={tw`flex-row items-center gap-2 bg-gray-50 px-3 py-2 rounded-full`}>
            <View style={tw`w-3 h-3 bg-gray-100 rounded-full`} />
            <Text style={tw`text-xs text-gray-600`}>Missed</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default HeatmapChart;
