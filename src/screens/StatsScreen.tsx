// src/screens/StatsScreen.tsx
import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import { LinearGradient } from 'expo-linear-gradient';

const StatsScreen: React.FC = () => {
  const { habits } = useHabits();

  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return {
        totalActiveHabits: 0,
        totalCompletions: 0,
        currentMaxStreak: 0,
        bestOverallStreak: 0,
        averageCompletion: 0,
        totalDaysTracked: 0,
        perfectDays: 0,
        consistency: 0,
        buildingHabits: 0,
        quittingHabits: 0,
        todayCompleted: 0,
        weeklyAverage: 0,
        monthlyGoal: 0,
        longestHabit: null,
      };
    }

    // Get unique dates across all habits
    const allDates = new Set<string>();
    habits.forEach((habit) => {
      habit.completedDays.forEach((date) => allDates.add(date));
    });

    // Calculate perfect days (all habits completed)
    const perfectDays = Array.from(allDates).filter((date) => {
      return habits.every((habit) => habit.completedDays.includes(date));
    }).length;

    // Today's completions
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = habits.filter((h) => h.completedDays.includes(today)).length;

    // Weekly average
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });
    const weeklyCompletions = last7Days.reduce((acc, date) => {
      return acc + habits.filter((h) => h.completedDays.includes(date)).length;
    }, 0);
    const weeklyAverage = Math.round((weeklyCompletions / (habits.length * 7)) * 100);

    // Calculate consistency score (last 30 days)
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const completionsLast30 = last30Days.reduce((acc, date) => {
      return acc + habits.filter((h) => h.completedDays.includes(date)).length;
    }, 0);
    const possibleCompletions = habits.length * 30;
    const consistency = possibleCompletions > 0 ? Math.round((completionsLast30 / possibleCompletions) * 100) : 0;

    // Find longest running habit
    const longestHabit = habits.reduce((longest, habit) => {
      if (!longest || habit.completedDays.length > longest.completedDays.length) {
        return habit;
      }
      return longest;
    }, null as (typeof habits)[0] | null);

    return {
      totalActiveHabits: habits.length,
      totalCompletions: habits.reduce((sum, h) => sum + h.completedDays.length, 0),
      currentMaxStreak: Math.max(...habits.map((h) => h.currentStreak), 0),
      bestOverallStreak: Math.max(...habits.map((h) => h.bestStreak), 0),
      averageCompletion: Math.round(habits.reduce((sum, h) => sum + (h.completedDays.length / h.totalDays) * 100, 0) / habits.length),
      totalDaysTracked: allDates.size,
      perfectDays,
      consistency,
      buildingHabits: habits.filter((h) => h.type === 'good').length,
      quittingHabits: habits.filter((h) => h.type === 'bad').length,
      todayCompleted,
      weeklyAverage,
      monthlyGoal: Math.round((consistency / 100) * 30),
      longestHabit,
    };
  }, [habits]);

  // Milestone calculation
  const getMilestone = () => {
    const streak = stats.currentMaxStreak;
    const milestones = [
      { days: 100, message: '🏆 Century Club! 1 Month Free Premium!', reward: true },
      { days: 66, message: "🧠 Habit Master! Science says it's automatic now!", reward: false },
      { days: 30, message: '🌟 30 Day Champion! 50% off next month!', reward: true },
      { days: 21, message: "💪 3 Weeks Strong! You're unstoppable!", reward: false },
      { days: 14, message: '🔥 Two Week Warrior! Keep pushing!', reward: false },
      { days: 7, message: '✨ One Week Wonder! Great start!', reward: false },
      { days: 5, message: "🚀 5 Day Starter! You're building momentum!", reward: false },
      { days: 3, message: '🌱 Just Getting Started! Every journey begins with a single step.', reward: false },
    ];

    return milestones.find((m) => streak >= m.days) || { days: 0, message: 'Start your journey today! 🌅', reward: false };
  };

  const milestone = getMilestone();

  // Empty state
  if (habits.length === 0) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50`}>
        <View style={tw`flex-1 items-center justify-center px-8`}>
          <View style={tw`w-28 h-28 bg-gray-100 rounded-3xl items-center justify-center mb-5`}>
            <Text style={tw`text-5xl`}>📊</Text>
          </View>
          <Text style={tw`text-2xl font-semibold text-gray-900 mb-2 text-center`}>No Statistics Yet</Text>
          <Text style={tw`text-base text-gray-500 text-center leading-relaxed`}>Start tracking your first habit to see your progress and unlock achievements</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-4`}>
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-3`}>
          <Text style={tw`text-2xl font-bold text-gray-900`}>Your Progress</Text>
          <Text style={tw`text-sm text-gray-600 mt-1`}>{stats.totalDaysTracked} days of growth</Text>
        </View>

        {/* Motivational Quote */}
        <View style={tw`px-5 pb-4`}>
          <LinearGradient colors={['#fef3c7', '#fde68a']} style={tw`rounded-2xl p-4`}>
            <Text style={tw`text-sm font-medium text-amber-900 leading-5`}>"Success is the sum of small efforts repeated day in and day out."</Text>
            <Text style={tw`text-xs text-amber-700 mt-1`}>— Robert Collier</Text>
          </LinearGradient>
        </View>

        {/* Milestone Card */}
        {milestone.days > 0 && (
          <View style={tw`px-5 pb-4`}>
            <LinearGradient colors={milestone.reward ? ['#10b981', '#059669'] : ['#6366f1', '#4f46e5']} style={tw`rounded-2xl p-4`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-white font-semibold text-base`}>{milestone.days} Day Milestone!</Text>
                  <Text style={tw`text-white/90 text-xs mt-1 leading-4`}>{milestone.message.replace(/[🏆🧠🌟💪🔥✨🚀🌱]/g, '')}</Text>
                </View>
                <Text style={tw`text-3xl ml-3`}>{milestone.reward ? '🎁' : '⭐'}</Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Primary Stats - 2x2 Grid */}
        <View style={tw`px-5 pb-4`}>
          <View style={tw`flex-row flex-wrap -mx-1.5`}>
            <View style={tw`w-1/2 px-1.5 pb-3`}>
              <Pressable style={tw`bg-white rounded-xl p-4 shadow-sm active:scale-98`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-2xl`}>🔥</Text>
                  <Text style={tw`text-2xl font-bold text-gray-900`}>{stats.currentMaxStreak}</Text>
                </View>
                <Text style={tw`text-xs text-gray-500`}>Current Streak</Text>
              </Pressable>
            </View>

            <View style={tw`w-1/2 px-1.5 pb-3`}>
              <Pressable style={tw`bg-white rounded-xl p-4 shadow-sm active:scale-98`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-2xl`}>🏆</Text>
                  <Text style={tw`text-2xl font-bold text-gray-900`}>{stats.bestOverallStreak}</Text>
                </View>
                <Text style={tw`text-xs text-gray-500`}>Best Streak</Text>
              </Pressable>
            </View>

            <View style={tw`w-1/2 px-1.5 pb-3`}>
              <Pressable style={tw`bg-white rounded-xl p-4 shadow-sm active:scale-98`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-2xl`}>✅</Text>
                  <Text style={tw`text-2xl font-bold text-gray-900`}>{stats.totalCompletions}</Text>
                </View>
                <Text style={tw`text-xs text-gray-500`}>Total Done</Text>
              </Pressable>
            </View>

            <View style={tw`w-1/2 px-1.5 pb-3`}>
              <Pressable style={tw`bg-white rounded-xl p-4 shadow-sm active:scale-98`}>
                <View style={tw`flex-row items-center justify-between mb-2`}>
                  <Text style={tw`text-2xl`}>💎</Text>
                  <Text style={tw`text-2xl font-bold text-gray-900`}>{stats.perfectDays}</Text>
                </View>
                <Text style={tw`text-xs text-gray-500`}>Perfect Days</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Consistency Score */}
        <View style={tw`px-5 pb-4`}>
          <View style={tw`bg-white rounded-xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <View>
                <Text style={tw`text-base font-semibold text-gray-900`}>30-Day Consistency</Text>
                <Text style={tw`text-xs text-gray-500 mt-0.5`}>Keep it above 80% for rewards</Text>
              </View>
              <Text style={tw`text-2xl font-bold text-indigo-600`}>{stats.consistency}%</Text>
            </View>
            <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
              <View
                style={[
                  tw`h-full rounded-full`,
                  {
                    width: `${stats.consistency}%`,
                    backgroundColor: stats.consistency >= 80 ? '#10b981' : stats.consistency >= 60 ? '#3b82f6' : stats.consistency >= 40 ? '#f59e0b' : '#ef4444',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Secondary Stats - 3 Column Grid */}
        <View style={tw`px-5 pb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Today's Progress</Text>
          <View style={tw`flex-row -mx-1`}>
            <View style={tw`flex-1 px-1`}>
              <View style={tw`bg-white rounded-xl p-3 shadow-sm items-center`}>
                <Text style={tw`text-xl font-bold text-blue-600`}>
                  {stats.todayCompleted}/{stats.totalActiveHabits}
                </Text>
                <Text style={tw`text-xs text-gray-500 mt-1`}>Today</Text>
              </View>
            </View>

            <View style={tw`flex-1 px-1`}>
              <View style={tw`bg-white rounded-xl p-3 shadow-sm items-center`}>
                <Text style={tw`text-xl font-bold text-green-600`}>{stats.weeklyAverage}%</Text>
                <Text style={tw`text-xs text-gray-500 mt-1`}>Week Avg</Text>
              </View>
            </View>

            <View style={tw`flex-1 px-1`}>
              <View style={tw`bg-white rounded-xl p-3 shadow-sm items-center`}>
                <Text style={tw`text-xl font-bold text-purple-600`}>{stats.monthlyGoal}</Text>
                <Text style={tw`text-xs text-gray-500 mt-1`}>Month Goal</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Habit Types */}
        <View style={tw`px-5 pb-4`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Habit Types</Text>
          <View style={tw`flex-row gap-2`}>
            <View style={tw`flex-1 bg-white rounded-xl p-3 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`text-xl font-bold text-green-600`}>{stats.buildingHabits}</Text>
                  <Text style={tw`text-xs text-gray-600 mt-0.5`}>Building</Text>
                </View>
                <Text style={tw`text-2xl`}>🌱</Text>
              </View>
            </View>

            <View style={tw`flex-1 bg-white rounded-xl p-3 shadow-sm`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`text-xl font-bold text-red-600`}>{stats.quittingHabits}</Text>
                  <Text style={tw`text-xs text-gray-600 mt-0.5`}>Quitting</Text>
                </View>
                <Text style={tw`text-2xl`}>🚫</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Champion Habit */}
        {stats.longestHabit && (
          <View style={tw`px-5 pb-2`}>
            <View style={tw`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4`}>
              <Text style={tw`text-xs font-semibold text-indigo-700 mb-1`}>CHAMPION HABIT</Text>
              <Text style={tw`text-base font-semibold text-gray-900`}>{stats.longestHabit.name}</Text>
              <Text style={tw`text-xs text-gray-600 mt-1`}>
                {stats.longestHabit.completedDays.length} days completed • {stats.longestHabit.currentStreak} day streak
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;
