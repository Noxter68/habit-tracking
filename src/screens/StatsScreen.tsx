// screens/StatsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Award, Calendar, Target, Sparkles, ChevronRight, BarChart3 } from 'lucide-react-native';
import tw from 'twrnc';
import { format } from 'date-fns';

// Import your components
import PremiumStatsSection from '@/components/premium/PremiumStatsSection';
import { useHabits } from '@/context/HabitContext';
import { useStats } from '@/context/StatsContext';
import { useAuth } from '@/context/AuthContext';

const StatsScreen: React.FC = () => {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, refreshHabits } = useHabits();
  const { stats, refreshStats } = useStats();

  const [refreshing, setRefreshing] = useState(false);
  const [showAIPrediction, setShowAIPrediction] = useState(false);
  const [aiPrediction, setAIPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshStats(true)]);
    setRefreshing(false);
  };

  const generateAIPrediction = async () => {
    setLoadingPrediction(true);
    // Simulate AI prediction generation
    setTimeout(() => {
      setAIPrediction({
        successRate: 78,
        trend: 'improving',
        keyInsight: 'Morning habits show 23% higher completion',
        recommendation: 'Focus on consistency during weekends',
        predictedStreak: 14,
        confidence: 85,
      });
      setLoadingPrediction(false);
    }, 1500);
  };

  useEffect(() => {
    if (showAIPrediction && !aiPrediction) {
      generateAIPrediction();
    }
  }, [showAIPrediction]);

  if (habitsLoading) {
    return (
      <View style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  const totalCompletions = habits?.reduce((sum, h) => sum + (h.completedDays?.length || 0), 0) || 0;
  const avgCompletion = habits?.length > 0 ? Math.round((totalCompletions / (habits.length * 30)) * 100) : 0;
  const currentStreak = Math.max(...(habits?.map((h) => h.currentStreak || 0) || [0]));

  return (
    <ScrollView style={tw`flex-1 bg-gray-50 mt-8`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header Section - Minimal */}
      <View style={tw`px-5 pt-6 pb-4`}>
        <View style={tw`flex-row justify-between items-center`}>
          <View>
            <Text style={tw`text-3xl font-light text-black`}>Statistics</Text>
            <Text style={tw`text-sm text-gray-500 mt-1`}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
          <View style={tw`bg-black rounded-full px-3 py-1.5`}>
            <Text style={tw`text-xs text-white font-medium`}>Level {stats?.level || 1}</Text>
          </View>
        </View>
      </View>

      {/* Premium Stats Section - Now First for better hierarchy */}
      <PremiumStatsSection habits={habits} />

      {/* AI Predictions - Second for insights */}
      <View style={tw`mx-5 mb-6`}>
        <TouchableOpacity onPress={() => setShowAIPrediction(!showAIPrediction)} activeOpacity={0.8} style={tw`bg-white rounded-3xl overflow-hidden shadow-sm`}>
          <LinearGradient colors={['#FAFAFA', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-6`}>
            <View style={tw`flex-row justify-between items-center`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`bg-black rounded-full p-2`}>
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={tw`text-sm font-medium text-black`}>AI Insights</Text>
                  <Text style={tw`text-xs text-gray-500 mt-0.5`}>Personalized predictions</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" style={[tw`transition-all`, showAIPrediction && tw`rotate-90`]} />
            </View>

            {showAIPrediction && (
              <View style={tw`mt-6 pt-6 border-t border-gray-100`}>
                {loadingPrediction ? (
                  <View style={tw`py-8 items-center`}>
                    <ActivityIndicator size="small" color="#000000" />
                    <Text style={tw`text-xs text-gray-400 mt-3`}>Analyzing patterns...</Text>
                  </View>
                ) : (
                  aiPrediction && (
                    <View>
                      {/* Success Prediction */}
                      <View style={tw`mb-6`}>
                        <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-3`}>Success Prediction</Text>
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={tw`flex-row items-baseline gap-1`}>
                            <Text style={tw`text-5xl font-light text-black`}>{aiPrediction.successRate}</Text>
                            <Text style={tw`text-2xl font-light text-gray-400`}>%</Text>
                          </View>
                          <View style={tw`bg-green-50 rounded-full px-3 py-1`}>
                            <Text style={tw`text-xs text-green-600 font-medium`}>{aiPrediction.trend}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Key Insight */}
                      <View style={tw`bg-gray-50 rounded-2xl p-4 mb-4`}>
                        <Text style={tw`text-xs text-gray-500 mb-1`}>Key Insight</Text>
                        <Text style={tw`text-sm text-black`}>{aiPrediction.keyInsight}</Text>
                      </View>

                      {/* Recommendation */}
                      <View style={tw`bg-gray-50 rounded-2xl p-4 mb-4`}>
                        <Text style={tw`text-xs text-gray-500 mb-1`}>Recommendation</Text>
                        <Text style={tw`text-sm text-black`}>{aiPrediction.recommendation}</Text>
                      </View>

                      {/* Predicted Metrics */}
                      <View style={tw`flex-row gap-3`}>
                        <View style={tw`flex-1 bg-gray-50 rounded-2xl p-4`}>
                          <Text style={tw`text-2xl font-light text-black mb-1`}>{aiPrediction.predictedStreak}d</Text>
                          <Text style={tw`text-xs text-gray-500`}>Predicted streak</Text>
                        </View>
                        <View style={tw`flex-1 bg-gray-50 rounded-2xl p-4`}>
                          <Text style={tw`text-2xl font-light text-black mb-1`}>{aiPrediction.confidence}%</Text>
                          <Text style={tw`text-xs text-gray-500`}>Confidence</Text>
                        </View>
                      </View>
                    </View>
                  )
                )}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick Summary Card - Compact version */}
      <View style={tw`mx-5 mb-6`}>
        <View style={tw`bg-white rounded-3xl p-5 shadow-sm`}>
          <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-4`}>Current Performance</Text>
          <View style={tw`flex-row justify-between`}>
            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-2xl font-light text-black mb-1`}>{avgCompletion}%</Text>
              <Text style={tw`text-xs text-gray-500`}>Completion</Text>
            </View>

            <View style={tw`w-px bg-gray-100`} />

            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-2xl font-light text-black mb-1`}>{currentStreak}d</Text>
              <Text style={tw`text-xs text-gray-500`}>Best Streak</Text>
            </View>

            <View style={tw`w-px bg-gray-100`} />

            <View style={tw`flex-1 items-center`}>
              <Text style={tw`text-2xl font-light text-black mb-1`}>{stats?.totalXP || 0}</Text>
              <Text style={tw`text-xs text-gray-500`}>Total XP</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Achievement Grid - More compact */}
      <View style={tw`mx-5 mb-6`}>
        <Text style={tw`text-xs uppercase tracking-wider text-gray-400 mb-4`}>Achievements</Text>
        <View style={tw`flex-row flex-wrap gap-3`}>
          <View style={tw`flex-1 min-w-[47%] bg-white rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center gap-3`}>
              <Award size={16} color="#000000" />
              <View>
                <Text style={tw`text-xl font-light text-black`}>{totalCompletions}</Text>
                <Text style={tw`text-xs text-gray-500`}>Completions</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 min-w-[47%] bg-white rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center gap-3`}>
              <Target size={16} color="#000000" />
              <View>
                <Text style={tw`text-xl font-light text-black`}>{habits?.length || 0}</Text>
                <Text style={tw`text-xs text-gray-500`}>Active</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 min-w-[47%] bg-white rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center gap-3`}>
              <Calendar size={16} color="#000000" />
              <View>
                <Text style={tw`text-xl font-light text-black`}>{stats?.perfectDays || 0}</Text>
                <Text style={tw`text-xs text-gray-500`}>Perfect Days</Text>
              </View>
            </View>
          </View>

          <View style={tw`flex-1 min-w-[47%] bg-white rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center gap-3`}>
              <BarChart3 size={16} color="#000000" />
              <View>
                <Text style={tw`text-xl font-light text-black`}>Lvl {stats?.level || 1}</Text>
                <Text style={tw`text-xs text-gray-500`}>Current</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Progress to Next Level - Bottom */}
      <View style={tw`mx-5 mb-6`}>
        <View style={tw`bg-white rounded-3xl p-5 shadow-sm`}>
          <View style={tw`flex-row justify-between items-center mb-3`}>
            <Text style={tw`text-xs uppercase tracking-wider text-gray-400`}>Level Progress</Text>
            <Text style={tw`text-xs text-gray-500`}>
              {stats?.xp || 0} / {stats?.xpForNextLevel || 100} XP
            </Text>
          </View>
          <View style={tw`h-2 bg-gray-100 rounded-full overflow-hidden`}>
            <View style={[tw`h-2 bg-black rounded-full`, { width: `${((stats?.xp || 0) / (stats?.xpForNextLevel || 100)) * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={tw`h-6`} />
    </ScrollView>
  );
};

export default StatsScreen;
