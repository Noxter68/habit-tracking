// src/components/premium/RingChart.tsx
import React from 'react';
import { View, Text, Dimensions, ScrollView } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import tw from '@/lib/tailwind';
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
  if (!data || !data.summary) {
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
      <View style={tw`p-5`}>
        {/* Main Ring Chart */}
        <View style={tw`items-center mb-5`}>
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
              <Text style={tw`text-5xl font-bold text-stone-800`}>{safeData.summary.percentage}%</Text>
              <Text style={tw`text-sm text-sand-600 mt-1`}>Overall Progress</Text>
              <View style={tw`mt-2`}>
                <Text style={tw`text-xs text-sand-600 text-center`}>{safeData.summary.completed} completed</Text>
                <Text style={tw`text-xs text-sand-600 text-center`}>{safeData.summary.perfectDays} perfect days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Habits Breakdown */}
        {habits.length > 0 && (
          <View>
            <Text style={tw`text-xs font-bold text-stone-700 uppercase tracking-wider mb-3`}>Habits Breakdown</Text>
            <ScrollView style={tw`max-h-48`} showsVerticalScrollIndicator={true}>
              {habitProgress.map((habit, index) => (
                <View key={index} style={[tw`mb-3 pb-3`, index < habitProgress.length - 1 && tw`border-b border-sand-100`]}>
                  <View style={tw`flex-row items-center justify-between mb-1`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <Text style={tw`text-sm text-stone-800 font-semibold mr-2`} numberOfLines={1}>
                        {habit.name}
                      </Text>
                      {habit.trend === 'up' && <TrendingUp size={14} color="#6B7280" />}
                      {habit.trend === 'down' && <TrendingDown size={14} color="#d6cec1" />}
                      {habit.trend === 'stable' && <Minus size={14} color="#a89885" />}
                    </View>
                    <Text style={tw`text-sm font-bold text-stone-700 ml-2`}>{habit.percentage}%</Text>
                  </View>

                  <View style={tw`flex-row items-center justify-between mb-2`}>
                    <Text style={tw`text-xs text-sand-600`}>
                      {habit.completedDays}/{habit.totalDays} days
                    </Text>
                    {habit.currentStreak > 0 && <Text style={tw`text-xs text-sand-600`}>🔥 {habit.currentStreak} streak</Text>}
                  </View>

                  {/* Progress bar */}
                  <View style={[tw`h-1.5 rounded-full overflow-hidden`, { backgroundColor: 'rgba(168, 152, 133, 0.2)' }]}>
                    <LinearGradient
                      colors={habit.percentage >= 70 ? ['#9CA3AF', '#6B7280'] : ['#D1D5DB', '#9CA3AF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[tw`h-full`, { width: `${Math.min(habit.percentage, 100)}%` }]}
                    />
                  </View>

                  {habit.endGoal && <Text style={tw`text-xs text-sand-600 mt-1`}>Goal: {habit.endGoal} days</Text>}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

export default RingChart;
