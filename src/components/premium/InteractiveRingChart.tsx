import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import tw from 'twrnc';
import { Habit } from '@/types';

interface InteractiveRingChartProps {
  data: {
    data: number[];
    colors: string[];
    summary: {
      percentage: number;
      completed: number;
      total: number;
      perfectDays: number;
    };
  };
  habits?: Habit[];
  period?: string;
  dailyStats?: any[];
}

const screenWidth = Dimensions.get('window').width;

const InteractiveRingChart: React.FC<InteractiveRingChartProps> = ({ data, habits = [], period, dailyStats }) => {
  const [selectedHabitIndex, setSelectedHabitIndex] = useState<number | null>(null);
  const [displayData, setDisplayData] = useState(data);

  const habitProgress = useMemo(() => {
    return habits.map((habit, index) => {
      const totalDays = Math.max(habit.totalDays || 1, 1);
      const completedDays = habit.completedDays?.length || 0;
      const percentage = Math.round((completedDays / totalDays) * 100);

      let partialDays = 0;
      if (habit.dailyTasks) {
        Object.values(habit.dailyTasks).forEach((day) => {
          if (day.completedTasks && day.completedTasks.length > 0 && !day.allCompleted) {
            partialDays++;
          }
        });
      }

      return {
        name: habit.name,
        percentage,
        completedDays,
        partialDays,
        totalDays,
        currentStreak: habit.currentStreak || 0,
      };
    });
  }, [habits]);

  useEffect(() => {
    if (selectedHabitIndex !== null && habitProgress[selectedHabitIndex]) {
      const selected = habitProgress[selectedHabitIndex];
      const completedRatio = selected.completedDays / selected.totalDays;
      const partialRatio = selected.partialDays / selected.totalDays;
      const missedRatio = 1 - completedRatio - partialRatio;

      setDisplayData({
        data: [completedRatio, partialRatio, missedRatio],
        colors: ['#000000', '#E5E7EB', '#FAFAFA'],
        summary: {
          percentage: selected.percentage,
          completed: selected.completedDays,
          total: selected.totalDays,
          perfectDays: selected.completedDays,
        },
      });
    } else {
      setDisplayData(data);
    }
  }, [selectedHabitIndex, data, habitProgress]);

  if (!data || !data.summary) {
    return (
      <View style={tw`bg-white rounded-3xl p-12 shadow-lg items-center justify-center`}>
        <Text style={tw`text-gray-400 text-center`}>No data available</Text>
      </View>
    );
  }

  const safeData = {
    data: displayData.data && displayData.data.length > 0 ? displayData.data : [0, 0, 1],
    colors: displayData.colors || ['#000000', '#E5E7EB', '#FAFAFA'],
    summary: {
      percentage: displayData.summary?.percentage || 0,
      completed: displayData.summary?.completed || 0,
      total: Math.max(displayData.summary?.total || 1, 1),
      perfectDays: displayData.summary?.perfectDays || 0,
    },
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1, index?: number) => {
      const colors = safeData.colors;
      return colors[index || 0] || colors[0];
    },
    strokeWidth: 1,
    barPercentage: 0.5,
  };

  return (
    <View style={tw`bg-white rounded-3xl shadow-lg overflow-hidden`}>
      <View style={tw`px-5 py-6`}>
        {/* Minimalist Title */}
        <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-6`}>Summary</Text>

        {/* Habits - Minimal Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`mb-8`} contentContainerStyle={tw`gap-3`}>
          {habitProgress.map((habit, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedHabitIndex(selectedHabitIndex === index ? null : index)}
              activeOpacity={0.8}
              style={tw`${selectedHabitIndex === index ? 'bg-black' : 'bg-gray-50'} px-4 py-2 rounded-full`}
            >
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-xs font-medium ${selectedHabitIndex === index ? 'text-white' : 'text-gray-900'}`}>{habit.name}</Text>
                <Text style={tw`text-xs ${selectedHabitIndex === index ? 'text-white/80' : 'text-gray-500'}`}>{habit.percentage}%</Text>
                {habit.currentStreak > 0 && <Text style={tw`text-xs ${selectedHabitIndex === index ? 'text-white/60' : 'text-gray-400'}`}>• {habit.currentStreak}d</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ring Chart - Ultra Clean */}
        <View style={tw`items-center py-8`}>
          <View style={tw`relative`}>
            <ProgressChart
              data={{ data: safeData.data }}
              width={screenWidth * 0.6}
              height={screenWidth * 0.6}
              strokeWidth={2}
              radius={screenWidth * 0.25}
              chartConfig={chartConfig}
              hideLegend={true}
              style={{ marginVertical: 0 }}
            />
            <View style={tw`absolute inset-0 items-center justify-center`}>
              <Text style={tw`text-6xl font-light text-black`}>{safeData.summary.percentage}</Text>
              <Text style={tw`text-xs text-gray-400 mt-2 uppercase tracking-wider`}>
                {selectedHabitIndex !== null && habitProgress[selectedHabitIndex] ? habitProgress[selectedHabitIndex].name : 'Total'}
              </Text>
            </View>
          </View>
        </View>

        {/* Minimal Stats with rounded background */}
        <View style={tw`flex-row justify-center gap-4 bg-gray-50 rounded-2xl p-4`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-2xl font-light text-black`}>{safeData.summary.completed}</Text>
            <Text style={tw`text-xs text-gray-400 uppercase tracking-wider mt-1`}>Done</Text>
          </View>
          <View style={tw`w-px h-12 bg-gray-200 self-center`} />
          <View style={tw`items-center`}>
            <Text style={tw`text-2xl font-light text-black`}>{safeData.summary.total}</Text>
            <Text style={tw`text-xs text-gray-400 uppercase tracking-wider mt-1`}>Total</Text>
          </View>
          {safeData.summary.perfectDays > 0 && (
            <>
              <View style={tw`w-px h-12 bg-gray-200 self-center`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-2xl font-light text-black`}>{safeData.summary.perfectDays}</Text>
                <Text style={tw`text-xs text-gray-400 uppercase tracking-wider mt-1`}>Perfect</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default InteractiveRingChart;
