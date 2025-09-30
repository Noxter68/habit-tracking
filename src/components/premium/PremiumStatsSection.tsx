import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, BarChart3, Eye } from 'lucide-react-native';
import { format } from 'date-fns';
import tw from 'twrnc';
import PeriodSelector from './PeriodSelector';
import ChartTypeSelector from './ChartTypeSelector';
import AreaChart from './AreaChart';
import HeatmapChart from './HeatMapChart';
import InteractiveRingChart from './InteractiveRingChart';
import QuickStats from './QuickStats';
import { calculatePremiumStats, getChartData, PeriodType, ChartType, ChartData, PremiumStats } from '@/utils/premiumStatsCalculation';
import { Habit } from '@/types';

// Import your contexts and services
import { useHabits } from '@/context/HabitContext';
import { useStats } from '@/context/StatsContext';
import { useAuth } from '@/context/AuthContext';
import { HabitService } from '@/services/habitService';
import GlobalStats from './GlobalStats';

interface PremiumStatsSectionProps {
  habits?: Habit[];
}

const PremiumStatsSection: React.FC<PremiumStatsSectionProps> = ({ habits: propHabits }) => {
  // Get data from contexts
  const { user } = useAuth();
  const { habits: contextHabits, loading: habitsLoading, refreshHabits } = useHabits();
  const { stats: statsData, refreshStats } = useStats();

  const habits = propHabits || contextHabits || [];

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [selectedChart, setSelectedChart] = useState<ChartType>('area');
  const [showGlobalStats, setShowGlobalStats] = useState(false);
  const [stats, setStats] = useState<PremiumStats>(calculatePremiumStats([], 'week'));
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aggregatedStats, setAggregatedStats] = useState<any>(null);
  const [globalStats, setGlobalStats] = useState<any>(null);

  // Fetch aggregated stats from service
  const fetchAggregatedStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [habitStats, todayStats] = await Promise.all([HabitService.getAggregatedStats(user.id), HabitService.getTodayStats(user.id)]);

      setAggregatedStats({
        habitStats,
        todayStats,
      });

      if (!habits || habits.length === 0) {
        await refreshHabits();
      }

      if (!statsData) {
        await refreshStats(true);
      }
    } catch (error) {
      console.error('Error fetching aggregated stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, habits, statsData, refreshHabits, refreshStats]);

  useEffect(() => {
    fetchAggregatedStats();
  }, [fetchAggregatedStats]);

  useEffect(() => {
    if (!habits || habits.length === 0) {
      setStats(calculatePremiumStats([], selectedPeriod));
      setChartData(null);
      setGlobalStats(null);
      return;
    }

    const calculatedStats = calculatePremiumStats(habits, selectedPeriod);
    setStats(calculatedStats);

    const data = getChartData(calculatedStats, selectedChart as any, selectedPeriod);
    setChartData(data);

    // Calculate global stats
    const totalCompletions = aggregatedStats?.habitStats?.totalCompletions || habits.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0);

    const avgStreak = habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0) / Math.max(habits.length, 1);

    setGlobalStats({
      totalHabits: habits.length,
      averageStreak: Math.round(avgStreak),
      totalCompletions,
      totalXP: statsData?.totalXP || 0,
      currentLevel: statsData?.level || 1,
      perfectDays: aggregatedStats?.habitStats?.perfectDays || stats.summary.perfectDays,
    });
  }, [habits, selectedPeriod, selectedChart, aggregatedStats, statsData]);

  const renderChart = () => {
    if (!chartData && selectedChart !== 'heatmap') {
      return (
        <View style={tw`bg-white rounded-3xl p-12 shadow-lg items-center justify-center`}>
          <Text style={tw`text-quartz-400 text-center text-base`}>No data available for this period</Text>
        </View>
      );
    }

    try {
      switch (selectedChart) {
        case 'area':
          return <AreaChart data={chartData as any} period={selectedPeriod} />;
        case 'heatmap':
          // Generate heatmap data directly from habits and stats
          const heatmapData = {
            labels: stats.dailyStats.map((d) => format(d.date, 'd')),
            data: habits.map((habit) =>
              stats.dailyStats.map((day) => {
                const dayStr = format(day.date, 'yyyy-MM-dd');
                // Check if habit was created before this day
                const habitCreated = new Date(habit.createdAt);
                if (habitCreated > day.date) return -1; // Not created yet

                if (habit.completedDays?.includes(dayStr)) return 1;
                if (habit.dailyTasks?.[dayStr]?.completedTasks?.length > 0) return 0.5;
                return 0;
              })
            ),
            habitNames: habits.map((h) => h.name),
          };
          return <HeatmapChart data={heatmapData} period={selectedPeriod} />;
        case 'ring':
          return <InteractiveRingChart data={chartData as any} habits={habits} period={selectedPeriod} dailyStats={stats.dailyStats} />;
        default:
          return null;
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <View style={tw`bg-white rounded-3xl p-12 shadow-lg items-center justify-center`}>
          <Text style={tw`text-quartz-400 text-center`}>Unable to display chart</Text>
        </View>
      );
    }
  };

  if (loading || habitsLoading) {
    return (
      <View style={tw`mx-5 mt-8`}>
        <View style={tw`bg-white rounded-3xl p-12 shadow-lg items-center justify-center`}>
          <ActivityIndicator size="large" color="#6B7280" />
          <Text style={tw`text-quartz-400 text-center mt-4`}>Loading premium analytics...</Text>
        </View>
      </View>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <View style={tw`mx-5 mt-8`}>
        <View style={tw`bg-quartz-50 rounded-3xl p-8 items-center shadow-lg`}>
          <Crown size={40} color="#9CA3AF" />
          <Text style={tw`text-quartz-400 text-center mt-4 text-base`}>Create habits to unlock premium statistics</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={tw`pb-6`}>
      <View style={tw`mx-5`}>
        {/* Premium Header Card */}
        <LinearGradient colors={['#4B5563', '#374151']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 mb-6 shadow-xl`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <View style={tw`bg-white/20 p-2 rounded-full mr-3`}>
                <Crown size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={tw`text-white font-bold text-lg`}>Premium Analytics</Text>
                <Text style={tw`text-white/70 text-xs`}>
                  {aggregatedStats?.todayStats ? `Today: ${aggregatedStats.todayStats.completed}/${aggregatedStats.todayStats.total} completed` : 'Deep insights & tracking'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setShowGlobalStats(!showGlobalStats)} style={tw`bg-white/25 px-4 py-2 rounded-full flex-row items-center`}>
              {showGlobalStats ? <Eye size={16} color="#FFFFFF" /> : <BarChart3 size={16} color="#FFFFFF" />}
              <Text style={tw`ml-2 text-white font-semibold text-sm`}>{showGlobalStats ? 'Charts' : 'Stats'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Bar */}
          {globalStats && (
            <View style={tw`flex-row justify-between pt-3 border-t border-white/20`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-white font-bold text-lg`}>{globalStats.totalHabits}</Text>
                <Text style={tw`text-white/60 text-xs`}>Habits</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-white font-bold text-lg`}>{globalStats.averageStreak}</Text>
                <Text style={tw`text-white/60 text-xs`}>Avg Streak</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-white font-bold text-lg`}>Lvl {globalStats.currentLevel}</Text>
                <Text style={tw`text-white/60 text-xs`}>Level</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-white font-bold text-lg`}>{globalStats.totalXP}</Text>
                <Text style={tw`text-white/60 text-xs`}>Total XP</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {showGlobalStats && globalStats ? (
          /* Global Stats View */
          <GlobalStats globalStats={globalStats} habits={habits} onRefresh={fetchAggregatedStats} />
        ) : (
          <>
            {/* Period Selector */}
            <View style={tw`mb-6`}>
              <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
            </View>

            {/* Chart Type Selector */}
            <View style={tw`mb-6`}>
              <ChartTypeSelector selected={selectedChart} onSelect={setSelectedChart as any} />
            </View>

            {/* Main Chart */}
            <View style={tw`mb-6`}>{renderChart()}</View>
          </>
        )}
      </View>
    </View>
  );
};

export default PremiumStatsSection;
