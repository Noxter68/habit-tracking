// screens/StatsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Calendar, Target, BarChart3, TrendingUp } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { format } from 'date-fns';

// Import components
import PremiumStatsSection from '@/components/premium/PremiumStatsSection';
import { useHabits } from '@/context/HabitContext';
import { useStats } from '@/context/StatsContext';
import { useAuth } from '@/context/AuthContext';

type TimeRange = 'week' | 'month' | '4weeks';

const StatsScreen: React.FC = () => {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, refreshHabits } = useHabits();
  const { stats, refreshStats } = useStats();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshStats(true)]);
    setRefreshing(false);
  };

  if (habitsLoading) {
    return (
      <View style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#a89885" />
      </View>
    );
  }

  const totalCompletions = habits?.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0) || 0;
  const avgCompletion = habits?.length > 0 ? Math.round((totalCompletions / (habits.length * 30)) * 100) : 0;
  const currentStreak = Math.max(...(habits?.map((h) => h.currentStreak || 0) || [0]));

  return (
    <LinearGradient colors={['#faf9f7', '#f5f2ed', '#e8e3db']} style={tw`flex-1`}>
      <ScrollView style={tw`flex-1 mt-8`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a89885" />}>
        {/* Header Section */}
        <View style={tw`px-6 pt-6 pb-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View>
              <Text style={tw`text-3xl font-bold text-stone-800`}>Statistics</Text>
              <Text style={tw`text-sm text-sand-600 mt-1`}>{format(new Date(), 'EEEE, MMMM d')}</Text>
            </View>
            <View
              style={[
                tw`rounded-full px-4 py-2`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
            >
              <LinearGradient colors={['#9CA3AF', '#6B7280']} style={tw`absolute inset-0 rounded-full`} />
              <Text style={tw`text-xs text-white font-bold`}>Level {stats?.level || 1}</Text>
            </View>
          </View>
        </View>

        {/* Premium Analytics Section */}
        <View style={tw`px-6 mb-6`}>
          <PremiumStatsSection habits={habits} selectedRange={selectedRange} onRangeChange={setSelectedRange} />
        </View>

        {/* Quick Stats Grid */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-xs font-semibold text-sand-700 uppercase tracking-wider mb-3`}>Overview</Text>
          <View style={tw`flex-row flex-wrap gap-3`}>
            {/* Completion Rate */}
            <View
              style={[
                tw`flex-1 min-w-[47%] rounded-2xl p-4 bg-white`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`w-10 h-10 bg-sand-100 rounded-xl items-center justify-center`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    },
                  ]}
                >
                  <TrendingUp size={20} color="#a89885" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{avgCompletion}%</Text>
                  <Text style={tw`text-xs text-sand-600`}>Completion</Text>
                </View>
              </View>
            </View>

            {/* Best Streak */}
            <View
              style={[
                tw`flex-1 min-w-[47%] rounded-2xl p-4 bg-white`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`w-10 h-10 bg-sand-100 rounded-xl items-center justify-center`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    },
                  ]}
                >
                  <Text style={tw`text-lg`}>🔥</Text>
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{currentStreak}</Text>
                  <Text style={tw`text-xs text-sand-600`}>Best Streak</Text>
                </View>
              </View>
            </View>

            {/* Total XP */}
            <View
              style={[
                tw`flex-1 min-w-[47%] rounded-2xl p-4 bg-white`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`w-10 h-10 bg-sand-100 rounded-xl items-center justify-center`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    },
                  ]}
                >
                  <Award size={20} color="#a89885" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{stats?.totalXP || 0}</Text>
                  <Text style={tw`text-xs text-sand-600`}>Total XP</Text>
                </View>
              </View>
            </View>

            {/* Active Habits */}
            <View
              style={[
                tw`flex-1 min-w-[47%] rounded-2xl p-4 bg-white`,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                },
              ]}
            >
              <View style={tw`flex-row items-center gap-3`}>
                <View
                  style={[
                    tw`w-10 h-10 bg-sand-100 rounded-xl items-center justify-center`,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                    },
                  ]}
                >
                  <Target size={20} color="#a89885" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-2xl font-bold text-stone-800`}>{habits?.length || 0}</Text>
                  <Text style={tw`text-xs text-sand-600`}>Active Quests</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Achievements Section */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-xs font-semibold text-sand-700 uppercase tracking-wider mb-3`}>Milestones</Text>
          <View
            style={[
              tw`rounded-2xl p-5 bg-white`,
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              },
            ]}
          >
            <View style={tw`flex-row justify-around`}>
              <View style={tw`items-center`}>
                <View style={tw`w-12 h-12 bg-sand-100 rounded-full items-center justify-center mb-2`}>
                  <Award size={20} color="#a89885" />
                </View>
                <Text style={tw`text-xl font-bold text-stone-800`}>{totalCompletions}</Text>
                <Text style={tw`text-xs text-sand-600 mt-1`}>Completions</Text>
              </View>

              <View style={tw`items-center`}>
                <View style={tw`w-12 h-12 bg-sand-100 rounded-full items-center justify-center mb-2`}>
                  <Calendar size={20} color="#a89885" />
                </View>
                <Text style={tw`text-xl font-bold text-stone-800`}>{stats?.perfectDays || 0}</Text>
                <Text style={tw`text-xs text-sand-600 mt-1`}>Perfect Days</Text>
              </View>

              <View style={tw`items-center`}>
                <View style={tw`w-12 h-12 bg-sand-100 rounded-full items-center justify-center mb-2`}>
                  <BarChart3 size={20} color="#a89885" />
                </View>
                <Text style={tw`text-xl font-bold text-stone-800`}>Level {stats?.level || 1}</Text>
                <Text style={tw`text-xs text-sand-600 mt-1`}>Current</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Level Progress */}
        <View style={tw`px-6 mb-8`}>
          <View
            style={[
              tw`rounded-2xl p-5 bg-white`,
              {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              },
            ]}
          >
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <Text style={tw`text-xs font-semibold text-sand-700 uppercase tracking-wider`}>Level Progress</Text>
              <Text style={tw`text-xs text-sand-600`}>
                {stats?.xp || 0} / {stats?.xpForNextLevel || 100} XP
              </Text>
            </View>
            <View
              style={[
                tw`h-3 rounded-full overflow-hidden`,
                {
                  backgroundColor: 'rgba(168, 152, 133, 0.2)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                },
              ]}
            >
              <LinearGradient
                colors={['#9CA3AF', '#6B7280']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[tw`h-full rounded-full`, { width: `${((stats?.xp || 0) / (stats?.xpForNextLevel || 100)) * 100}%` }]}
              />
            </View>
          </View>
        </View>

        <View style={tw`h-8`} />
      </ScrollView>
    </LinearGradient>
  );
};

export default StatsScreen;
