import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { Habit } from '@/types';

interface GlobalStatsProps {
  globalStats: {
    totalHabits: number;
    averageStreak: number;
    totalCompletions: number;
    totalXP: number;
    currentLevel: number;
    perfectDays: number;
  };
  habits: Habit[];
  onRefresh?: () => void;
}

const GlobalStats: React.FC<GlobalStatsProps> = ({ globalStats, habits, onRefresh }) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={tw`bg-white rounded-3xl px-5 py-6 shadow-lg`}>
        {/* Header */}
        <View style={tw`flex-row justify-between items-center mb-8`}>
          <Text style={tw`text-xs uppercase tracking-wider text-gray-400`}>Overview</Text>
          {onRefresh && (
            <TouchableOpacity onPress={onRefresh} style={tw`bg-gray-50 px-3 py-1 rounded-full`}>
              <Text style={tw`text-xs text-gray-500`}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Key Metrics - Grid with rounded corners */}
        <View style={tw`flex-row flex-wrap gap-3 mb-8`}>
          <View style={tw`flex-1 min-w-[47%] bg-gray-50 rounded-2xl p-5`}>
            <Text style={tw`text-3xl font-light text-black`}>{globalStats.totalHabits}</Text>
            <Text style={tw`text-xs text-gray-400 mt-2 uppercase tracking-wider`}>Habits</Text>
          </View>
          <View style={tw`flex-1 min-w-[47%] bg-gray-50 rounded-2xl p-5`}>
            <Text style={tw`text-3xl font-light text-black`}>{globalStats.averageStreak}</Text>
            <Text style={tw`text-xs text-gray-400 mt-2 uppercase tracking-wider`}>Avg Streak</Text>
          </View>
          <View style={tw`flex-1 min-w-[47%] bg-gray-50 rounded-2xl p-5`}>
            <Text style={tw`text-3xl font-light text-black`}>{globalStats.totalCompletions}</Text>
            <Text style={tw`text-xs text-gray-400 mt-2 uppercase tracking-wider`}>Completed</Text>
          </View>
          <View style={tw`flex-1 min-w-[47%] bg-gray-50 rounded-2xl p-5`}>
            <Text style={tw`text-3xl font-light text-black`}>{globalStats.perfectDays}</Text>
            <Text style={tw`text-xs text-gray-400 mt-2 uppercase tracking-wider`}>Perfect Days</Text>
          </View>
        </View>

        {/* Level & XP - Minimal Bar with rounded background */}
        <View style={tw`mb-8 bg-gray-50 rounded-2xl p-4`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text style={tw`text-xs text-gray-600`}>Level {globalStats.currentLevel}</Text>
            <Text style={tw`text-xs text-gray-400`}>{globalStats.totalXP} XP</Text>
          </View>
          <View style={tw`h-1 bg-gray-200 rounded-full overflow-hidden`}>
            <View style={[tw`h-1 bg-black rounded-full`, { width: '60%' }]} />
          </View>
        </View>

        {/* Habits List - Ultra Clean with rounded items */}
        <View>
          <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-4`}>Habits</Text>
          {habits.map((habit, index) => {
            const progress = habit.completedDays ? Math.round((habit.completedDays.length / Math.max(habit.totalDays, 1)) * 100) : 0;

            return (
              <View key={habit.id} style={tw`mb-4 bg-gray-50 rounded-2xl p-4`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                  <Text style={tw`text-sm text-gray-900`}>{habit.name}</Text>
                  <View style={tw`flex-row items-center gap-3`}>
                    {habit.currentStreak > 0 && (
                      <View style={tw`bg-black/10 px-2 py-1 rounded-full`}>
                        <Text style={tw`text-xs text-gray-600`}>{habit.currentStreak}d</Text>
                      </View>
                    )}
                    <Text style={tw`text-sm font-medium text-black`}>{progress}%</Text>
                  </View>
                </View>
                <View style={tw`h-1 bg-gray-200 rounded-full overflow-hidden`}>
                  <View style={[tw`h-1 bg-black rounded-full`, { width: `${Math.min(progress, 100)}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default GlobalStats;
