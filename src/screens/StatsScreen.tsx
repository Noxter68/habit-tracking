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
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  const totalCompletions = habits?.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0) || 0;
  const avgCompletion = habits?.length > 0 ? Math.round((totalCompletions / (habits.length * 30)) * 100) : 0;
  const currentStreak = Math.max(...(habits?.map((h) => h.currentStreak || 0) || [0]));

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F7' }}>
      <ScrollView style={{ flex: 1, marginTop: 32 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9333EA" />}>
        {/* Elegant Header Section */}
        <LinearGradient colors={['#F5F3FF', '#EDE9FE', '#FAF9F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#9333EA', letterSpacing: 2 }}>YOUR PROGRESS</Text>
            </View>
            <Text style={{ fontSize: 40, fontWeight: '900', color: '#1F2937', letterSpacing: -1.5, textAlign: 'center' }}>Statistics</Text>
            <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 6, textAlign: 'center' }}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>

          {/* Level Badge - Amethyst Gradient */}
          <View style={{ alignItems: 'center' }}>
            <LinearGradient
              colors={['#9333EA', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 20,
                shadowColor: '#9333EA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
              }}
            >
              <Text style={{ fontSize: 14, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1, textAlign: 'center' }}>LEVEL {stats?.level || 1}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Premium Analytics Section */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <PremiumStatsSection habits={habits} selectedRange={selectedRange} onRangeChange={setSelectedRange} />
        </View>

        {/* Quick Stats Grid - Vibrant Cards */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={18} color="#9333EA" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#9333EA', letterSpacing: 1.5 }}>OVERVIEW</Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {/* Completion Rate - Amethyst */}
            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#9333EA',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <LinearGradient
                  colors={['#9333EA', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#1F2937' }}>{avgCompletion}%</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Completion</Text>
                </View>
              </View>
            </View>

            {/* Best Streak - Ruby */}
            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#DC2626',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#1F2937' }}>{currentStreak}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Best Streak</Text>
                </View>
              </View>
            </View>

            {/* Total XP - Crystal */}
            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#06B6D4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#1F2937' }}>{stats?.totalXP || 0}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Total XP</Text>
                </View>
              </View>
            </View>

            {/* Active Habits - Quartz */}
            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 18,
                shadowColor: '#EC4899',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Target size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#1F2937' }}>{habits?.length || 0}</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>Active Quests</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Achievements Section - Rainbow Gradient Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Award size={18} color="#9333EA" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#9333EA', letterSpacing: 1.5 }}>MILESTONES</Text>
          </View>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              shadowColor: '#9333EA',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <LinearGradient
                  colors={['#9333EA', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Award size={22} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937' }}>{totalCompletions}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' }}>Completions</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Calendar size={22} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937' }}>{stats?.perfectDays || 0}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' }}>Perfect Days</Text>
              </View>

              <View style={{ alignItems: 'center' }}>
                <LinearGradient
                  colors={['#06B6D4', '#0891B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <BarChart3 size={22} color="#FFFFFF" />
                </LinearGradient>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1F2937' }}>L{stats?.level || 1}</Text>
                <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, fontWeight: '600' }}>Current</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Level Progress - Amethyst Gradient Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
          <LinearGradient
            colors={['#9333EA', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              shadowColor: '#9333EA',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 }}>LEVEL PROGRESS</Text>
              <Text style={{ fontSize: 12, color: '#E9D5FF', fontWeight: '600' }}>
                {stats?.xp || 0} / {stats?.xpForNextLevel || 100} XP
              </Text>
            </View>
            <View
              style={{
                height: 12,
                borderRadius: 6,
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            >
              <LinearGradient
                colors={['#F0ABFC', '#FFFFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: '100%',
                  borderRadius: 6,
                  width: `${((stats?.xp || 0) / (stats?.xpForNextLevel || 100)) * 100}%`,
                }}
              />
            </View>
          </LinearGradient>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

export default StatsScreen;
