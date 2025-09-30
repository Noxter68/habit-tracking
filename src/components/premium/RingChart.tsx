import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import tw from 'twrnc';
import { Habit } from '@/types';

interface RingChartProps {
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
}

const screenWidth = Dimensions.get('window').width;

const RingChart: React.FC<RingChartProps> = ({ data, habits = [], period = 'week' }) => {
  // Validate data and provide defaults
  if (!data || !data.summary) {
    return (
      <View style={tw`bg-white rounded-3xl p-8 shadow-sm items-center justify-center`}>
        <Text style={tw`text-quartz-400 text-center`}>No data available</Text>
      </View>
    );
  }

  const safeData = {
    data: data.data && data.data.length > 0 ? data.data : [0, 0, 1],
    colors: data.colors || ['#9CA3AF', '#D1D5DB', '#E5E7EB'],
    summary: {
      percentage: data.summary?.percentage || 0,
      completed: data.summary?.completed || 0,
      total: Math.max(data.summary?.total || 1, 1),
      perfectDays: data.summary?.perfectDays || 0,
    },
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1, index?: number) => {
      const colors = safeData.colors;
      return colors[index || 0] || colors[0];
    },
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  // Calculate habit-specific progress
  const habitProgress = habits.map((habit) => {
    const totalDays = habit.totalDays || 1;
    const completedDays = habit.completedDays?.length || 0;
    const percentage = Math.round((completedDays / totalDays) * 100);

    // Calculate trend
    const recentDays = 7;
    const recentCompletions =
      habit.completedDays?.filter((date) => {
        const dayDiff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return dayDiff <= recentDays;
      }).length || 0;

    const expectedRecent = Math.min(recentDays, totalDays);
    const recentRate = (recentCompletions / expectedRecent) * 100;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentRate > percentage + 10) trend = 'up';
    else if (recentRate < percentage - 10) trend = 'down';

    return {
      name: habit.name,
      percentage,
      completedDays,
      totalDays,
      currentStreak: habit.currentStreak || 0,
      trend,
      endGoal: habit.hasEndGoal ? habit.endGoalDays : null,
    };
  });

  return (
    <View style={tw`bg-white rounded-3xl shadow-sm overflow-hidden`}>
      <LinearGradient colors={['#F3F4F6', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tw`p-4`}>
        {/* Main Ring Chart */}
        <View style={tw`items-center mb-4`}>
          <View style={tw`relative`}>
            <ProgressChart
              data={{ data: safeData.data }}
              width={screenWidth * 0.6}
              height={screenWidth * 0.6}
              strokeWidth={24}
              radius={screenWidth * 0.22}
              chartConfig={chartConfig}
              hideLegend={true}
              style={{
                borderRadius: 16,
              }}
            />
            <View style={tw`absolute inset-0 items-center justify-center`}>
              <Text style={tw`text-5xl font-bold text-quartz-700`}>{safeData.summary.percentage}%</Text>
              <Text style={tw`text-base text-quartz-500 mt-1`}>Overall Progress</Text>
              <View style={tw`mt-2`}>
                <Text style={tw`text-sm text-quartz-400`}>{safeData.summary.completed} completed</Text>
                <Text style={tw`text-sm text-quartz-400`}>{safeData.summary.perfectDays} perfect days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Habits Breakdown */}
        {habits.length > 0 && (
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm font-semibold text-quartz-600 mb-3`}>Habits Breakdown</Text>
            <ScrollView style={tw`max-h-48`} showsVerticalScrollIndicator={true}>
              {habitProgress.map((habit, index) => (
                <View key={index} style={tw`mb-3 pb-3 ${index < habitProgress.length - 1 ? 'border-b border-quartz-100' : ''}`}>
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <Text style={tw`text-sm text-quartz-700 font-medium mr-2`} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      {habit.trend === 'up' && <TrendingUp size={14} color="#10B981" />}
                      {habit.trend === 'down' && <TrendingDown size={14} color="#EF4444" />}
                      {habit.trend === 'stable' && <Minus size={14} color="#9CA3AF" />}
                    </View>
                    <Text style={tw`text-sm font-bold text-quartz-600 ml-2`}>{habit.percentage}%</Text>
                  </View>
                  <View style={tw`flex-row items-center justify-between`}>
                    <Text style={tw`text-xs text-quartz-400`}>
                      {habit.completedDays}/{habit.totalDays} days
                    </Text>
                    {habit.currentStreak > 0 && <Text style={tw`text-xs text-quartz-500`}>🔥 {habit.currentStreak} streak</Text>}
                  </View>
                  {/* Progress bar */}
                  <View style={tw`mt-2 h-1.5 bg-quartz-100 rounded-full overflow-hidden`}>
                    <LinearGradient
                      colors={habit.percentage >= 70 ? ['#9CA3AF', '#6B7280'] : ['#D1D5DB', '#9CA3AF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[tw`h-full`, { width: `${Math.min(habit.percentage, 100)}%` }]}
                    />
                  </View>
                  {habit.endGoal && <Text style={tw`text-xs text-quartz-400 mt-1`}>Goal: {habit.endGoal} days</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

export default RingChart;
