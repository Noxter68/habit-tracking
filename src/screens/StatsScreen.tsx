// src/screens/StatsScreen.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';

const StatsScreen: React.FC = () => {
  const { habits } = useHabits();

  // Calculate overall stats
  const totalHabits = habits.length;
  const totalCompletedDays = habits.reduce((sum, habit) => sum + habit.completedDays.length, 0);
  const averageStreak = habits.length > 0 ? Math.round(habits.reduce((sum, habit) => sum + habit.currentStreak, 0) / habits.length) : 0;
  const bestOverallStreak = Math.max(...habits.map((h) => h.bestStreak), 0);

  // Calculate completion rate
  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const rates = habits.map((habit) => (habit.completedDays.length / habit.totalDays) * 100);
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      fitness: '💪',
      health: '🧘',
      nutrition: '🥗',
      learning: '📚',
      productivity: '⚡',
      mindfulness: '🧠',
      sleep: '😴',
      hydration: '💧',
      smoking: '🚭',
      'junk-food': '🍔',
      shopping: '🛍️',
      'screen-time': '📱',
      procrastination: '⏰',
      'negative-thinking': '💭',
      alcohol: '🍺',
      oversleeping: '🛏️',
    };
    return icons[category] || '✨';
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4 bg-white border-b border-slate-200`}>
          <Text style={tw`text-2xl font-bold text-slate-800`}>Statistics</Text>
          <Text style={tw`text-slate-600 mt-1`}>Your habit tracking insights</Text>
        </View>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
          {habits.length === 0 ? (
            <View style={tw`flex-1 items-center justify-center py-20`}>
              <Text style={tw`text-6xl mb-4`}>📊</Text>
              <Text style={tw`text-xl font-semibold text-slate-700 mb-2`}>No data yet</Text>
              <Text style={tw`text-slate-600 text-center px-8`}>Start tracking habits to see your statistics</Text>
            </View>
          ) : (
            <View style={tw`px-6 py-4`}>
              {/* Overall Stats Grid */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Overall Progress</Text>
                <View style={tw`flex-row flex-wrap gap-3`}>
                  <View style={tw`flex-1 min-w-40 bg-white rounded-xl p-4`}>
                    <Text style={tw`text-3xl font-bold text-teal-600`}>{totalHabits}</Text>
                    <Text style={tw`text-sm text-slate-600 mt-1`}>Active Habits</Text>
                  </View>
                  <View style={tw`flex-1 min-w-40 bg-white rounded-xl p-4`}>
                    <Text style={tw`text-3xl font-bold text-blue-600`}>{totalCompletedDays}</Text>
                    <Text style={tw`text-sm text-slate-600 mt-1`}>Days Completed</Text>
                  </View>
                  <View style={tw`flex-1 min-w-40 bg-white rounded-xl p-4`}>
                    <Text style={tw`text-3xl font-bold text-purple-600`}>{averageStreak}</Text>
                    <Text style={tw`text-sm text-slate-600 mt-1`}>Avg. Streak</Text>
                  </View>
                  <View style={tw`flex-1 min-w-40 bg-white rounded-xl p-4`}>
                    <Text style={tw`text-3xl font-bold text-amber-600`}>{bestOverallStreak}</Text>
                    <Text style={tw`text-sm text-slate-600 mt-1`}>Best Streak</Text>
                  </View>
                </View>
              </View>

              {/* Completion Rate */}
              <View style={tw`bg-white rounded-xl p-4 mb-6`}>
                <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Average Completion Rate</Text>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`flex-1`}>
                    <View style={tw`h-8 bg-slate-100 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full`, { width: `${getCompletionRate()}%` }]} />
                    </View>
                  </View>
                  <Text style={tw`ml-4 text-2xl font-bold text-teal-600`}>{getCompletionRate()}%</Text>
                </View>
              </View>

              {/* Individual Habit Stats */}
              <View>
                <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Habit Breakdown</Text>
                {habits.map((habit) => {
                  const progress = (habit.completedDays.length / habit.totalDays) * 100;
                  return (
                    <View key={habit.id} style={tw`bg-white rounded-xl p-4 mb-3`}>
                      <View style={tw`flex-row items-center mb-3`}>
                        <Text style={tw`text-2xl mr-3`}>{getCategoryIcon(habit.category)}</Text>
                        <View style={tw`flex-1`}>
                          <Text style={tw`font-semibold text-slate-800`}>{habit.name}</Text>
                          <Text style={tw`text-sm text-slate-600`}>
                            {habit.type === 'good' ? 'Building' : 'Quitting'} • {habit.frequency}
                          </Text>
                        </View>
                      </View>

                      <View style={tw`flex-row justify-between mb-2`}>
                        <Text style={tw`text-sm text-slate-600`}>Progress</Text>
                        <Text style={tw`text-sm font-medium text-slate-700`}>
                          {habit.completedDays.length}/{habit.totalDays} days ({Math.round(progress)}%)
                        </Text>
                      </View>

                      <View style={tw`h-2 bg-slate-100 rounded-full overflow-hidden mb-3`}>
                        <View style={[tw`h-full rounded-full`, habit.type === 'good' ? tw`bg-teal-500` : tw`bg-red-500`, { width: `${progress}%` }]} />
                      </View>

                      <View style={tw`flex-row justify-between`}>
                        <View>
                          <Text style={tw`text-xs text-slate-500`}>Current</Text>
                          <Text style={tw`font-bold text-slate-800`}>{habit.currentStreak} days</Text>
                        </View>
                        <View>
                          <Text style={tw`text-xs text-slate-500`}>Best</Text>
                          <Text style={tw`font-bold text-slate-800`}>{habit.bestStreak} days</Text>
                        </View>
                        <View>
                          <Text style={tw`text-xs text-slate-500`}>Total</Text>
                          <Text style={tw`font-bold text-slate-800`}>{habit.completedDays.length} days</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Motivational Section */}
              <View style={tw`bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 mt-6 mb-4`}>
                <Text style={tw`text-lg font-semibold text-slate-800 mb-2`}>Keep Going! 💪</Text>
                <Text style={tw`text-slate-700`}>You're making great progress. Remember, it takes an average of 66 days to form a habit. Stay consistent and celebrate small wins!</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default StatsScreen;
