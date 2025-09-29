// src/screens/StatisticsScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ActivityIndicator, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { TrendingUp, Target, Zap, Calendar, Activity, Clock, Star, Flame, ArrowUp, ArrowDown, Brain, Sparkles } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, withTiming, useSharedValue, interpolate, runOnJS } from 'react-native-reanimated';
import { LineChart, BarChart } from 'react-native-chart-kit';
import tw from '@/lib/tailwind';

import { HabitService } from '@/services/habitService';
import { XPService } from '@/services/xpService';
import { HabitProgressionService, HabitTier, TierInfo } from '@/services/habitProgressionService';
import { getTotalXPForLevel } from '@/utils/xpCalculations';
import { Habit, HabitProgression } from '@/types';
import { tierThemes } from '@/utils/tierTheme';
import ProgressBar from '@/components/ui/ProgressBar';
import { useAuth } from '@/context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Preload all texture images at module level
const textureCache = {
  Crystal: Image.resolveAssetSource(require('../../assets/interface/progressBar/crystal.png')),
  Ruby: Image.resolveAssetSource(require('../../assets/interface/progressBar/ruby-texture.png')),
  Amethyst: Image.resolveAssetSource(require('../../assets/interface/progressBar/amethyst-texture.png')),
};

interface HabitAnalytics {
  habit: Habit;
  progression: HabitProgression | null;
  completionRate: number;
  predictedDaysToNextTier: number;
  weeklyPattern: number[];
  bestDayOfWeek: string;
  consistency: number;
  momentum: 'increasing' | 'stable' | 'decreasing';
  nextMilestone: { days: number; title: string } | null;
  tierInfo: TierInfo;
  tierProgress: number;
  successProbability: number;
  streakVelocity: number;
  predictedMaxStreak: number;
}

interface PredictionData {
  habit: Habit;
  confidenceScore: number;
  predictedStreak30Days: number;
  predictedStreak90Days: number;
  habitFormationProgress: number;
  riskFactors: string[];
  strengthFactors: string[];
  criticalPeriod: string;
}

// Enhanced TexturedHeader with proper crossfade (no white flash)
const TexturedHeader: React.FC<{
  selectedTier: HabitTier;
  children: React.ReactNode;
}> = ({ selectedTier, children }) => {
  const theme = tierThemes[selectedTier];

  // Simply render the texture without complex animations
  return (
    <View style={tw`relative overflow-hidden`}>
      <ImageBackground source={theme.texture} resizeMode="cover" style={tw`px-5 pt-4 pb-8`} fadeDuration={0}>
        <LinearGradient colors={theme.gradient.map((c) => c + 'dd')} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0`} />
        {children}
      </ImageBackground>
    </View>
  );
};

// Helper functions (keep all existing helper functions)
const calculateCompletionMetrics = (habit: Habit) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let completedInPeriod = 0;
  let totalDays = 0;

  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    totalDays++;

    if (habit.completedDays.includes(dateStr)) {
      completedInPeriod++;
    }
  }

  const rate = totalDays > 0 ? (completedInPeriod / totalDays) * 100 : 0;
  const averageDailyProgress = completedInPeriod / Math.max(totalDays, 1);

  return { rate, averageDailyProgress };
};

const calculateSuccessProbability = (habit: Habit, consistency: number): number => {
  const streakFactor = Math.min(habit.currentStreak / 21, 1) * 30;
  const consistencyFactor = (consistency / 100) * 40;
  const completionFactor = (calculateCompletionMetrics(habit).rate / 100) * 30;

  return Math.min(95, Math.round(streakFactor + consistencyFactor + completionFactor));
};

const calculateStreakVelocity = (habit: Habit): number => {
  const recentDays = habit.completedDays.slice(-14);
  if (recentDays.length < 7) return 0;

  const firstWeek = recentDays.slice(0, 7).length;
  const secondWeek = recentDays.slice(7).length;

  return ((secondWeek - firstWeek) / firstWeek) * 100;
};

const predictMaxStreak = (currentStreak: number, consistency: number, momentum: string): number => {
  let multiplier = 1;
  if (momentum === 'increasing') multiplier = 1.5;
  if (momentum === 'decreasing') multiplier = 0.7;

  const consistencyMultiplier = consistency / 100;
  return Math.round(currentStreak + currentStreak * multiplier * consistencyMultiplier);
};

const calculateHabitFormationProgress = (streak: number): number => {
  if (streak >= 66) return 100;
  if (streak >= 21) return 50 + ((streak - 21) / 45) * 50;
  return (streak / 21) * 50;
};

const identifyRiskFactors = (analytics: HabitAnalytics): string[] => {
  const risks = [];
  if (analytics.consistency < 60) risks.push('Low consistency');
  if (analytics.momentum === 'decreasing') risks.push('Declining momentum');
  if (analytics.habit.currentStreak < 7) risks.push('Early stage vulnerability');
  if (analytics.completionRate < 50) risks.push('Low completion rate');
  return risks;
};

const identifyStrengthFactors = (analytics: HabitAnalytics): string[] => {
  const strengths = [];
  if (analytics.consistency >= 80) strengths.push('High consistency');
  if (analytics.momentum === 'increasing') strengths.push('Growing momentum');
  if (analytics.habit.currentStreak >= 21) strengths.push('Habit forming');
  if (analytics.completionRate >= 80) strengths.push('Excellent completion');
  if (analytics.habit.currentStreak >= 7) strengths.push(`${analytics.bestDayOfWeek} champion`);
  return strengths;
};

const getCriticalPeriod = (streak: number): string => {
  if (streak < 7) return 'Days 3-7 (Building momentum)';
  if (streak < 21) return 'Days 14-21 (Habit formation)';
  if (streak < 66) return 'Days 30-66 (Automation phase)';
  return 'Maintenance mode';
};

const calculateWeeklyPattern = (habit: Habit): number[] => {
  const pattern = new Array(7).fill(0);
  habit.completedDays.forEach((dateStr) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    pattern[dayOfWeek]++;
  });

  const createdDate = new Date(habit.createdAt);
  const now = new Date();
  const weeksExisted = Math.max(1, Math.floor((now.getTime() - createdDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));

  return pattern.map((count) => Math.min(100, (count / weeksExisted) * 100));
};

const findBestDayOfWeek = (pattern: number[]): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxIndex = pattern.indexOf(Math.max(...pattern));
  return days[maxIndex];
};

const calculateConsistencyScore = (habit: Habit): number => {
  if (habit.completedDays.length === 0) return 0;

  const sortedDates = [...habit.completedDays].sort();
  let gaps = 0;
  let totalGapDays = 0;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const daysDiff = Math.floor((curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000));

    if (daysDiff > 1) {
      gaps++;
      totalGapDays += daysDiff - 1;
    }
  }

  const score = Math.max(0, 100 - gaps * 5 - totalGapDays * 2);
  return Math.round(score);
};

const calculateMomentum = (habit: Habit): 'increasing' | 'stable' | 'decreasing' => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let recentCount = 0;
  let previousCount = 0;

  habit.completedDays.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (date >= sevenDaysAgo) {
      recentCount++;
    } else if (date >= fourteenDaysAgo && date < sevenDaysAgo) {
      previousCount++;
    }
  });

  if (recentCount > previousCount + 1) return 'increasing';
  if (recentCount < previousCount - 1) return 'decreasing';
  return 'stable';
};

const findNextMilestone = (currentStreak: number): { days: number; title: string } | null => {
  const milestones = [
    { days: 7, title: 'Week Warrior' },
    { days: 21, title: 'Habit Former' },
    { days: 30, title: 'Monthly Master' },
    { days: 50, title: 'Ruby Challenger' },
    { days: 66, title: 'Automatic Pilot' },
    { days: 100, title: 'Century Legend' },
    { days: 150, title: 'Amethyst Master' },
    { days: 365, title: 'Year Champion' },
  ];

  return milestones.find((m) => m.days > currentStreak) || null;
};

const calculateDaysToNextTier = (currentStreak: number, avgProgress: number): number => {
  const tiers = [50, 150];
  const nextTier = tiers.find((t) => t > currentStreak) || 999;
  if (avgProgress === 0) return 365;
  const daysNeeded = nextTier - currentStreak;
  return Math.min(Math.ceil(daysNeeded / Math.max(avgProgress, 0.1)), 365);
};

const getGemIcon = (tier: HabitTier) => {
  switch (tier) {
    case 'Ruby':
      return require('../../assets/interface/gems/ruby-gem.png');
    case 'Amethyst':
      return require('../../assets/interface/gems/amethyst-gem.png');
    case 'Crystal':
    default:
      return require('../../assets/interface/gems/crystal-gem.png');
  }
};

export default function StatisticsScreen() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [xpStats, setXPStats] = useState<any>(null);
  const [habitAnalytics, setHabitAnalytics] = useState<HabitAnalytics[]>([]);
  const [predictions, setPredictions] = useState<PredictionData[]>([]);

  const loadingRef = useRef(false);
  const progressAnimation = useSharedValue(0);
  const tabTransition = useSharedValue(0);

  useEffect(() => {
    // Preload all textures on mount
    Promise.all(Object.values(textureCache).map((source) => Image.prefetch(source.uri)));
  }, []);

  const calculateHabitAnalytics = useCallback(async (habitsData: Habit[], userId: string): Promise<HabitAnalytics[]> => {
    const analytics: HabitAnalytics[] = [];

    for (const habit of habitsData) {
      const progression = await HabitProgressionService.getOrCreateProgression(habit.id, userId);
      const { tier, progress: tierProgress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);

      const completionData = calculateCompletionMetrics(habit);
      const weeklyPattern = calculateWeeklyPattern(habit);
      const bestDayOfWeek = findBestDayOfWeek(weeklyPattern);
      const consistency = calculateConsistencyScore(habit);
      const momentum = calculateMomentum(habit);
      const nextMilestone = findNextMilestone(habit.currentStreak);

      const successProbability = calculateSuccessProbability(habit, consistency);
      const streakVelocity = calculateStreakVelocity(habit);
      const predictedMaxStreak = predictMaxStreak(habit.currentStreak, consistency, momentum);

      analytics.push({
        habit,
        progression,
        completionRate: completionData.rate,
        predictedDaysToNextTier: calculateDaysToNextTier(habit.currentStreak, completionData.averageDailyProgress),
        weeklyPattern,
        bestDayOfWeek,
        consistency,
        momentum,
        nextMilestone,
        tierInfo: tier,
        tierProgress,
        successProbability,
        streakVelocity,
        predictedMaxStreak,
      });
    }

    return analytics;
  }, []);

  const calculatePredictions = useCallback((analytics: HabitAnalytics[]): PredictionData[] => {
    return analytics.map((a) => {
      const confidenceScore = a.successProbability;
      const dailyRate = a.completionRate / 100;

      const predictedStreak30Days = Math.round(a.habit.currentStreak + 30 * dailyRate * (a.momentum === 'increasing' ? 1.2 : a.momentum === 'decreasing' ? 0.8 : 1));
      const predictedStreak90Days = Math.round(a.habit.currentStreak + 90 * dailyRate * (a.momentum === 'increasing' ? 1.1 : a.momentum === 'decreasing' ? 0.7 : 0.9));

      const habitFormationProgress = calculateHabitFormationProgress(a.habit.currentStreak);
      const riskFactors = identifyRiskFactors(a);
      const strengthFactors = identifyStrengthFactors(a);
      const criticalPeriod = getCriticalPeriod(a.habit.currentStreak);

      return {
        habit: a.habit,
        confidenceScore,
        predictedStreak30Days,
        predictedStreak90Days,
        habitFormationProgress,
        riskFactors,
        strengthFactors,
        criticalPeriod,
      };
    });
  }, []);

  const loadAllData = useCallback(async () => {
    if (!user || loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const [habitsData, xpData] = await Promise.all([HabitService.fetchHabits(user.id), XPService.getUserXPStats(user.id)]);

      setHabits(habitsData);
      setXPStats(xpData);

      if (habitsData.length > 0) {
        const analytics = await calculateHabitAnalytics(habitsData, user.id);
        setHabitAnalytics(analytics);

        const preds = calculatePredictions(analytics);
        setPredictions(preds);

        // Only set selected habit if not already set
        if (!selectedHabitId) {
          setSelectedHabitId(habitsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [user, calculateHabitAnalytics, calculatePredictions, selectedHabitId]);

  useEffect(() => {
    if (user && !loadingRef.current) {
      loadAllData();
    }
  }, [user]);

  useEffect(() => {
    if (habitAnalytics.length > 0) {
      progressAnimation.value = withTiming(1, { duration: 1000 });
    }
  }, [habitAnalytics.length]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [loadAllData, refreshing]);

  const selectedAnalytics = useMemo(() => {
    return habitAnalytics.find((h) => h.habit.id === selectedHabitId) || habitAnalytics[0];
  }, [selectedHabitId, habitAnalytics]);

  const selectedPrediction = useMemo(() => {
    return predictions.find((p) => p.habit.id === selectedHabitId) || predictions[0];
  }, [selectedHabitId, predictions]);

  const currentTheme = useMemo(() => {
    return tierThemes[selectedAnalytics?.tierInfo.name || 'Crystal'];
  }, [selectedAnalytics]);

  const handleHabitSelection = useCallback((habitId: string) => {
    tabTransition.value = 0;
    setSelectedHabitId(habitId);
    tabTransition.value = withTiming(1, { duration: 300 });
  }, []);

  const getTierColors = (tier: HabitTier, isActive: boolean) => {
    const colors = {
      Crystal: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        activeBg: 'bg-white/20',
        activeBorder: 'border-white/40',
        text: 'text-blue-700',
        activeText: 'text-white',
      },
      Ruby: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        activeBg: 'bg-white/20',
        activeBorder: 'border-white/40',
        text: 'text-red-700',
        activeText: 'text-white',
      },
      Amethyst: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        activeBg: 'bg-white/20',
        activeBorder: 'border-white/40',
        text: 'text-purple-700',
        activeText: 'text-white',
      },
    };
    return colors[tier];
  };

  const renderFuturePrediction = useMemo(() => {
    if (!selectedPrediction || !selectedAnalytics) return null;

    return (
      <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-6`}>
        <View style={tw`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden`}>
          <View style={tw`p-6`}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View style={tw`flex-row items-center`}>
                <Brain size={24} color="#8b5cf6" />
                <Text style={tw`text-slate-900 font-bold text-lg ml-3`}>AI Prediction Engine</Text>
              </View>
              <View style={[tw`px-3 py-1 rounded-full`, selectedPrediction.confidenceScore >= 70 ? tw`bg-green-100` : selectedPrediction.confidenceScore >= 40 ? tw`bg-yellow-100` : tw`bg-red-100`]}>
                <Text
                  style={[tw`text-xs font-bold`, selectedPrediction.confidenceScore >= 70 ? tw`text-green-700` : selectedPrediction.confidenceScore >= 40 ? tw`text-yellow-700` : tw`text-red-700`]}
                >
                  {selectedPrediction.confidenceScore}% Success Rate
                </Text>
              </View>
            </View>

            <View style={tw`mb-6`}>
              <Text style={tw`text-slate-600 text-sm mb-2`}>Habit Formation Progress</Text>
              <View style={tw`bg-slate-100 h-3 rounded-full overflow-hidden mb-2`}>
                <View
                  style={[
                    tw`h-full rounded-full`,
                    {
                      width: `${selectedPrediction.habitFormationProgress}%`,
                      backgroundColor: currentTheme.accent,
                    },
                  ]}
                />
              </View>
              <Text style={tw`text-slate-500 text-xs`}>{selectedPrediction.criticalPeriod}</Text>
            </View>

            <View style={tw`flex-row -mx-2 mb-6`}>
              <View style={tw`flex-1 px-2`}>
                <View style={tw`bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Calendar size={16} color="#8b5cf6" />
                    <Text style={tw`text-purple-600 text-xs font-semibold ml-2`}>30 Days</Text>
                  </View>
                  <Text style={tw`text-2xl font-bold text-slate-900`}>{selectedPrediction.predictedStreak30Days}</Text>
                  <Text style={tw`text-slate-600 text-xs mt-1`}>predicted streak</Text>
                </View>
              </View>

              <View style={tw`flex-1 px-2`}>
                <View style={tw`bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <Target size={16} color="#6366f1" />
                    <Text style={tw`text-indigo-600 text-xs font-semibold ml-2`}>90 Days</Text>
                  </View>
                  <Text style={tw`text-2xl font-bold text-slate-900`}>{selectedPrediction.predictedStreak90Days}</Text>
                  <Text style={tw`text-slate-600 text-xs mt-1`}>predicted streak</Text>
                </View>
              </View>
            </View>

            <View style={tw`flex-row -mx-2`}>
              {selectedPrediction.strengthFactors.length > 0 && (
                <View style={tw`flex-1 px-2`}>
                  <View style={tw`bg-green-50 rounded-xl p-3`}>
                    <View style={tw`flex-row items-center mb-2`}>
                      <Sparkles size={14} color="#16a34a" />
                      <Text style={tw`text-green-700 text-xs font-semibold ml-1`}>Strengths</Text>
                    </View>
                    {selectedPrediction.strengthFactors.map((factor, idx) => (
                      <Text key={idx} style={tw`text-green-600 text-xs mb-1`}>
                        • {factor}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {selectedPrediction.riskFactors.length > 0 && (
                <View style={tw`flex-1 px-2`}>
                  <View style={tw`bg-red-50 rounded-xl p-3`}>
                    <View style={tw`flex-row items-center mb-2`}>
                      <Flame size={14} color="#dc2626" />
                      <Text style={tw`text-red-700 text-xs font-semibold ml-1`}>Watch Out</Text>
                    </View>
                    {selectedPrediction.riskFactors.map((factor, idx) => (
                      <Text key={idx} style={tw`text-red-600 text-xs mb-1`}>
                        • {factor}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }, [selectedPrediction, selectedAnalytics, currentTheme]);

  const renderPerformanceMetrics = useMemo(() => {
    if (!selectedAnalytics) return null;

    return (
      <Animated.View entering={FadeIn.duration(300)} style={tw`mb-6`}>
        <View style={tw`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden`}>
          <View style={tw`p-5`}>
            <Text style={tw`text-slate-700 font-semibold mb-4`}>Performance Metrics</Text>

            <View style={tw`flex-row flex-wrap -mx-2`}>
              <View style={tw`w-1/2 px-2 mb-4`}>
                <View style={tw`bg-slate-50 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Activity size={14} color="#64748b" />
                    <Text style={tw`text-slate-600 text-xs ml-2`}>Momentum</Text>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Text style={tw`text-slate-900 font-bold text-lg`}>{selectedAnalytics.momentum}</Text>
                    {selectedAnalytics.momentum === 'increasing' && <ArrowUp size={16} color="#10b981" style={tw`ml-2`} />}
                    {selectedAnalytics.momentum === 'decreasing' && <ArrowDown size={16} color="#ef4444" style={tw`ml-2`} />}
                  </View>
                </View>
              </View>

              <View style={tw`w-1/2 px-2 mb-4`}>
                <View style={tw`bg-slate-50 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Zap size={14} color="#64748b" />
                    <Text style={tw`text-slate-600 text-xs ml-2`}>Velocity</Text>
                  </View>
                  <Text style={tw`text-slate-900 font-bold text-lg`}>
                    {selectedAnalytics.streakVelocity > 0 ? '+' : ''}
                    {selectedAnalytics.streakVelocity.toFixed(0)}%
                  </Text>
                </View>
              </View>

              <View style={tw`w-1/2 px-2`}>
                <View style={tw`bg-slate-50 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Target size={14} color="#64748b" />
                    <Text style={tw`text-slate-600 text-xs ml-2`}>Max Potential</Text>
                  </View>
                  <Text style={tw`text-slate-900 font-bold text-lg`}>{selectedAnalytics.predictedMaxStreak} days</Text>
                </View>
              </View>

              <View style={tw`w-1/2 px-2`}>
                <View style={tw`bg-slate-50 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center mb-1`}>
                    <Star size={14} color="#64748b" />
                    <Text style={tw`text-slate-600 text-xs ml-2`}>Best Day</Text>
                  </View>
                  <Text style={tw`text-slate-900 font-bold text-lg`}>{selectedAnalytics.bestDayOfWeek}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }, [selectedAnalytics]);

  const renderWeeklyConsistency = useMemo(() => {
    if (!selectedAnalytics) return null;

    return (
      <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-6`}>
        <Text style={tw`text-slate-700 font-semibold mb-3`}>Weekly Pattern Analysis</Text>

        <BarChart
          data={{
            labels: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
            datasets: [
              {
                data: selectedAnalytics.weeklyPattern.length > 0 ? selectedAnalytics.weeklyPattern : [0, 0, 0, 0, 0, 0, 0],
              },
            ],
          }}
          width={SCREEN_WIDTH - 60}
          height={180}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => currentTheme.accent,
            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            style: { borderRadius: 16 },
            propsForBackgroundLines: {
              strokeDasharray: '',
              stroke: '#e2e8f0',
              strokeWidth: 1,
            },
            barPercentage: 0.7,
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
          fromZero
          showBarTops={false}
        />
      </View>
    );
  }, [selectedAnalytics, currentTheme]);

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-50`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-6`} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}>
        {/* Enhanced Header with smooth texture transitions */}
        <TexturedHeader selectedTier={selectedAnalytics?.tierInfo.name || 'Crystal'}>
          <Animated.View entering={FadeInDown.duration(400)} style={tw`relative`}>
            <View style={tw`mb-6`}>
              <Text style={tw`text-3xl font-bold text-white`}>Future Vision</Text>
              <Text style={tw`text-white/80 text-sm mt-1`}>Predict your success trajectory</Text>
            </View>

            {/* Habit Tabs with optimized rendering */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={tw`-mx-5`}
              contentContainerStyle={tw`px-5`}
              removeClippedSubviews={true}
              initialNumToRender={5}
              maxToRenderPerBatch={3}
            >
              {habitAnalytics.map((analytics) => {
                const isActive = selectedHabitId === analytics.habit.id;
                const colors = getTierColors(analytics.tierInfo.name, isActive);

                return (
                  <TouchableOpacity key={analytics.habit.id} onPress={() => handleHabitSelection(analytics.habit.id)} activeOpacity={0.8} style={tw`mr-3`}>
                    <Animated.View style={[tw`px-4 py-3 rounded-2xl border-2`, isActive ? tw`${colors.activeBg} ${colors.activeBorder}` : tw`${colors.bg} ${colors.border}`]}>
                      <View style={tw`flex-row items-center`}>
                        <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, isActive ? tw`bg-white/20` : tw`bg-white`]}>
                          <Image source={getGemIcon(analytics.tierInfo.name)} style={tw`w-10 h-10 `} contentFit="contain" />
                        </View>

                        <View style={tw`mr-3`}>
                          <Text style={[tw`font-semibold text-sm`, isActive ? tw`${colors.activeText}` : tw`text-slate-800`]}>{analytics.habit.name}</Text>
                          <View style={tw`flex-row items-center mt-0.5`}>
                            <Text style={[tw`text-xs`, isActive ? tw`text-white/80` : tw`text-slate-500`]}>{analytics.habit.currentStreak} day streak</Text>
                          </View>
                        </View>

                        {analytics.habit.currentStreak > 0 && (
                          <View style={[tw`px-2 py-1 rounded-full`, isActive ? tw`bg-white/25` : tw`bg-white`]}>
                            <Text style={[tw`text-xs font-bold`, isActive ? tw`text-white` : tw`${colors.text}`]}>{analytics.habit.currentStreak}</Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Tier Progress inside header */}
            {selectedAnalytics && (
              <Animated.View style={tw`mt-6`}>
                <View style={tw`flex-row justify-between mb-2`}>
                  <Text style={tw`text-white/90 text-sm font-semibold`}>{selectedAnalytics.tierInfo.name} Tier Progress</Text>
                  <Text style={tw`text-white text-sm font-bold`}>{Math.round(selectedAnalytics.tierProgress)}%</Text>
                </View>
                <ProgressBar progress={selectedAnalytics.tierProgress} width={SCREEN_WIDTH - 40} height={24} tier={selectedAnalytics.tierInfo.name.toLowerCase() as 'crystal' | 'ruby' | 'amethyst'} />
                {selectedAnalytics.nextMilestone && (
                  <Text style={tw`text-white/80 text-xs mt-2`}>
                    Next: {selectedAnalytics.nextMilestone.title} in {selectedAnalytics.nextMilestone.days - selectedAnalytics.habit.currentStreak} days
                  </Text>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </TexturedHeader>

        {/* Content with smooth transitions */}
        <View style={tw`px-5 mt-6`}>
          {/* Future Prediction Card */}
          {renderFuturePrediction}

          {/* Performance Metrics */}
          {renderPerformanceMetrics}

          {/* Weekly Consistency Chart */}
          {renderWeeklyConsistency}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
