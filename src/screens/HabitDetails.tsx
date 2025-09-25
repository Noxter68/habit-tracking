// src/screens/HabitDetails.tsx
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, withSpring, useSharedValue, interpolate, Extrapolate, useAnimatedScrollHandler, withTiming } from 'react-native-reanimated';
import { ArrowLeft, Trophy, Flame, TrendingUp, Calendar, Target, Award, Sparkles, Star, Clock, CheckCircle2, Circle, BarChart3, Activity, Zap, Shield, Crown, Medal } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { useHabits } from '@/context/HabitContext';
import { RootStackParamList } from '@/navigation/types';
import { getCategoryIcon } from '@/utils/categoryIcons';
import { XPService } from '@/services/xpService';
import { Habit, Task, DailyTaskProgress } from '@/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HabitDetails'>;
type RouteProps = RouteProp<RootStackParamList, 'HabitDetails'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TabType = 'overview' | 'calendar' | 'stats';

interface StreakTier {
  name: string;
  gradient: string[];
  icon: string;
  minDays: number;
  nextTier?: string;
  color: string;
}

const STREAK_TIERS: StreakTier[] = [
  { name: 'Legendary', gradient: ['#78350f', '#451a03'], icon: '👑', minDays: 100, color: '#78350f' },
  { name: 'Master', gradient: ['#92400e', '#78350f'], icon: '🏆', minDays: 50, nextTier: 'Legendary', color: '#92400e' },
  { name: 'Expert', gradient: ['#b45309', '#92400e'], icon: '⭐', minDays: 30, nextTier: 'Master', color: '#b45309' },
  { name: 'Adept', gradient: ['#d97706', '#b45309'], icon: '🔥', minDays: 14, nextTier: 'Expert', color: '#d97706' },
  { name: 'Novice', gradient: ['#f59e0b', '#d97706'], icon: '✨', minDays: 7, nextTier: 'Adept', color: '#f59e0b' },
  { name: 'Beginner', gradient: ['#fbbf24', '#f59e0b'], icon: '🌱', minDays: 0, nextTier: 'Novice', color: '#fbbf24' },
];

const MILESTONES = [
  { days: 7, title: 'Week Warrior', icon: Star, reward: '+100 XP' },
  { days: 14, title: 'Fortnight Fighter', icon: Shield, reward: '+250 XP' },
  { days: 30, title: 'Monthly Master', icon: Trophy, reward: '+500 XP' },
  { days: 60, title: 'Champion', icon: Medal, reward: '+1000 XP' },
  { days: 100, title: 'Legend', icon: Crown, reward: '+2000 XP' },
];

const HabitDetails: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { habits, toggleTask, toggleHabitDay } = useHabits();
  const [selectedTab, setSelectedTab] = useState<TabType>('overview');

  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(280);

  const habit = habits.find((h: Habit) => h.id === route.params.habitId);

  if (!habit) {
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-50 items-center justify-center`}>
        <Text style={tw`text-gray-500`}>Habit not found</Text>
      </SafeAreaView>
    );
  }

  const categoryData = getCategoryIcon(habit.category, habit.type);
  const CategoryIcon = categoryData.icon;

  // Calculations
  const today = new Date().toISOString().split('T')[0];
  const todayTasks: DailyTaskProgress = habit.dailyTasks?.[today] || {
    completedTasks: [],
    allCompleted: false,
  };
  const completedTasksToday = todayTasks.completedTasks?.length || 0;
  const totalTasks = habit.tasks?.length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksToday / totalTasks) * 100 : 0;
  const overallProgress = (habit.completedDays.length / habit.totalDays) * 100;

  const calculateHabitXP = useCallback((): number => {
    return XPService.calculateHabitXP(habit.type, completedTasksToday, habit.currentStreak);
  }, [habit.type, completedTasksToday, habit.currentStreak]);

  const currentXP = useMemo(() => calculateHabitXP(), [calculateHabitXP]);
  const totalXPEarned = habit.completedDays.length * 50; // Simplified calculation

  const getStreakTier = useCallback((): StreakTier => {
    return STREAK_TIERS.find((tier) => habit.currentStreak >= tier.minDays) || STREAK_TIERS[STREAK_TIERS.length - 1];
  }, [habit.currentStreak]);

  const streakTier = useMemo(() => getStreakTier(), [getStreakTier]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.days > habit.currentStreak) || MILESTONES[MILESTONES.length - 1];
  }, [habit.currentStreak]);

  const progressToNextTier = useMemo(() => {
    const nextTier = STREAK_TIERS.find((t) => t.minDays > habit.currentStreak);
    if (!nextTier) return 100;
    const currentTierMin = streakTier.minDays;
    const progress = ((habit.currentStreak - currentTierMin) / (nextTier.minDays - currentTierMin)) * 100;
    return Math.min(progress, 100);
  }, [habit.currentStreak, streakTier]);

  const calculateCompletionRate = useCallback((): number => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let daysInRange = 0;
    let completedInRange = 0;

    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      daysInRange++;
      if (habit.completedDays.includes(dateStr)) {
        completedInRange++;
      }
    }

    return daysInRange > 0 ? Math.round((completedInRange / daysInRange) * 100) : 0;
  }, [habit.completedDays]);

  const completionRate = useMemo(() => calculateCompletionRate(), [calculateCompletionRate]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -100], Extrapolate.CLAMP),
      },
    ],
    opacity: interpolate(scrollY.value, [0, 150], [1, 0], Extrapolate.CLAMP),
  }));

  const renderTask = useCallback(
    (task: Task | string, index: number) => {
      const taskId = typeof task === 'string' ? task : task.id;
      const taskName = typeof task === 'string' ? `Task ${index + 1}` : task.name || `Task ${index + 1}`;
      const taskDuration = typeof task === 'object' ? task.duration : undefined;
      const isCompleted = todayTasks.completedTasks?.includes(taskId) || false;

      return (
        <Animated.View key={`detail-task-${habit.id}-${taskId}`} entering={FadeInDown.delay(index * 50).springify()}>
          <Pressable
            onPress={() => toggleTask(habit.id, today, taskId)}
            style={({ pressed }) => [
              tw`flex-row items-center p-4 rounded-2xl mb-2.5`,
              isCompleted ? tw`bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200/30` : tw`bg-white border border-gray-100`,
              pressed && tw`scale-[0.98]`,
            ]}
          >
            <View style={tw`w-6 h-6 mr-3.5`}>{isCompleted ? <CheckCircle2 size={24} color="#d97706" strokeWidth={2.5} /> : <Circle size={24} color="#d1d5db" strokeWidth={2} />}</View>
            <Text style={[tw`text-sm flex-1 font-medium`, isCompleted ? tw`text-gray-500 line-through` : tw`text-gray-800`]}>{taskName}</Text>
            {taskDuration && (
              <View style={tw`flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl mr-2`}>
                <Clock size={13} color="#9ca3af" />
                <Text style={tw`text-xs text-gray-500 font-semibold`}>{taskDuration}</Text>
              </View>
            )}
            {isCompleted && <Sparkles size={18} color="#fbbf24" />}
          </Pressable>
        </Animated.View>
      );
    },
    [habit.id, today, todayTasks.completedTasks, toggleTask]
  );

  return (
    <View style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />

      {/* Hero Header with Gradient */}
      <Animated.View style={[headerAnimatedStyle, tw`absolute top-0 left-0 right-0 z-10`]}>
        <LinearGradient colors={['rgba(254, 243, 199, 0.95)', 'rgba(253, 230, 138, 0.85)', 'rgba(252, 211, 77, 0.6)', 'transparent']} style={[tw`pb-6`, { height: headerHeight.value }]}>
          <SafeAreaView edges={['top']}>
            {/* Navigation Header */}
            <View style={tw`px-5 py-3 flex-row items-center justify-between`}>
              <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-11 h-11 rounded-2xl items-center justify-center bg-white/90 shadow-sm`, pressed && tw`scale-95`]}>
                <ArrowLeft size={22} color="#1f2937" strokeWidth={2.5} />
              </Pressable>

              <Text style={tw`text-lg font-black text-gray-900`}>Habit Journey</Text>

              <View style={tw`w-11`} />
            </View>

            {/* Hero Card - Similar to CurrentLevelHero */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={tw`px-5 mt-2`}>
              <LinearGradient colors={streakTier.gradient} style={tw`rounded-3xl p-5 relative overflow-hidden`}>
                {/* Background Pattern */}
                <View style={tw`absolute inset-0 opacity-10`}>
                  <LinearGradient colors={['transparent', 'rgba(255,255,255,0.2)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-full h-full`} />
                </View>

                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 pr-4`}>
                    <Text style={tw`text-amber-100/80 text-xs font-bold uppercase tracking-wider`}>{habit.type === 'good' ? 'Building' : 'Breaking'}</Text>
                    <Text style={tw`text-white text-2xl font-black mt-1`} numberOfLines={1}>
                      {habit.name}
                    </Text>
                    <View style={tw`flex-row items-center gap-2 mt-2.5`}>
                      <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                        <Text style={tw`text-white text-xs font-bold`}>
                          {streakTier.icon} {streakTier.name}
                        </Text>
                      </View>
                      <View style={tw`bg-white/25 rounded-xl px-2.5 py-1`}>
                        <Text style={tw`text-white text-xs font-bold`}>{habit.category}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Large Icon Badge - Positioned like CurrentLevelHero */}
                  <View style={tw`absolute -right-8 top-1/2 transform -translate-y-1/2`}>
                    <View style={tw`w-32 h-32 rounded-full bg-white/10 items-center justify-center`}>
                      <View style={tw`w-28 h-28 rounded-full bg-white/20 items-center justify-center`}>
                        <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} style={tw`w-24 h-24 rounded-full items-center justify-center`}>
                          {CategoryIcon && <CategoryIcon size={48} color={streakTier.color} strokeWidth={2} />}
                        </LinearGradient>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Progress to next tier */}
                {streakTier.nextTier && (
                  <View style={tw`mt-4`}>
                    <View style={tw`flex-row justify-between mb-1.5`}>
                      <Text style={tw`text-white/80 text-xs font-semibold`}>Progress to {streakTier.nextTier}</Text>
                      <Text style={tw`text-white font-bold text-xs`}>{Math.round(progressToNextTier)}%</Text>
                    </View>
                    <View style={tw`h-5 bg-white/20 rounded-full overflow-hidden`}>
                      <View style={[tw`h-full bg-white rounded-full`, { width: `${progressToNextTier}%` }]} />
                    </View>
                  </View>
                )}

                {/* Key Stats Row */}
                <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-white/20`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Streak</Text>
                    <Text style={tw`text-white font-black text-xl`}>{habit.currentStreak}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Best</Text>
                    <Text style={tw`text-white font-black text-xl`}>{habit.bestStreak}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Today XP</Text>
                    <Text style={tw`text-white font-black text-xl`}>+{currentXP}</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>Success</Text>
                    <Text style={tw`text-white font-black text-xl`}>{completionRate}%</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={[tw`pb-8`, { paddingTop: 280 }]} showsVerticalScrollIndicator={false}>
        {/* Tab Selector */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={tw`px-5 mb-5`}>
          <View style={tw`bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100`}>
            <View style={tw`flex-row`}>
              {(['overview', 'stats', 'calendar'] as const).map((tab) => (
                <Pressable key={tab} onPress={() => setSelectedTab(tab)} style={tw`flex-1`}>
                  {selectedTab === tab ? (
                    <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} style={tw`py-3 rounded-xl`}>
                      <Text style={tw`text-center font-bold text-white text-sm`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={tw`py-3`}>
                      <Text style={tw`text-center font-semibold text-gray-500 text-sm`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Tab Content */}
        <View style={tw`px-5`}>
          {selectedTab === 'overview' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Today's Tasks Card */}
              {totalTasks > 0 && (
                <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100`}>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <View style={tw`flex-row items-center gap-2`}>
                      <Target size={18} color="#d97706" />
                      <Text style={tw`text-base font-bold text-gray-900`}>Today's Tasks</Text>
                    </View>
                    <View style={tw`bg-gradient-to-r from-amber-50 to-amber-100 px-3 py-1.5 rounded-xl border border-amber-200/30`}>
                      <Text style={tw`text-xs font-black text-amber-800`}>
                        {completedTasksToday}/{totalTasks}
                      </Text>
                    </View>
                  </View>

                  {/* Task Progress Bar */}
                  <View style={tw`h-3 bg-gray-100 rounded-full overflow-hidden mb-4`}>
                    <LinearGradient
                      colors={taskProgress === 100 ? ['#f59e0b', '#d97706', '#b45309'] : ['#fde68a', '#fcd34d', '#fbbf24']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[tw`h-full`, { width: `${Math.max(taskProgress, 5)}%` }]}
                    />
                  </View>

                  {habit.tasks?.map((task, idx) => renderTask(task, idx))}
                </View>
              )}

              {/* Achievement Status */}
              <LinearGradient colors={[streakTier.color, streakTier.color + '99', streakTier.color + '66']} style={tw`rounded-3xl p-5 mb-4`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <View>
                    <Text style={tw`text-white/90 text-xs font-bold uppercase tracking-wider`}>Streak Achievement</Text>
                    <Text style={tw`text-white font-black text-2xl mt-1`}>
                      {streakTier.icon} {streakTier.name} Level
                    </Text>
                  </View>
                  <View style={tw`bg-white/25 rounded-2xl px-4 py-3`}>
                    <Text style={tw`text-white font-black text-2xl`}>{habit.currentStreak}</Text>
                    <Text style={tw`text-white/80 text-xs font-semibold`}>days</Text>
                  </View>
                </View>
                <View style={tw`bg-white/20 rounded-xl p-3`}>
                  <Text style={tw`text-white/90 text-sm`}>
                    {nextMilestone.days - habit.currentStreak} days until {nextMilestone.title}
                  </Text>
                  <Text style={tw`text-white font-bold text-xs mt-1`}>Reward: {nextMilestone.reward}</Text>
                </View>
              </LinearGradient>

              {/* Overall Progress Card */}
              <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
                <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Journey Progress</Text>

                <View style={tw`mb-4`}>
                  <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-sm text-gray-600`}>Overall Completion</Text>
                    <Text style={tw`text-sm font-bold text-amber-700`}>{Math.round(overallProgress)}%</Text>
                  </View>
                  <View style={tw`h-4 bg-gray-100 rounded-full overflow-hidden`}>
                    <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full`, { width: `${overallProgress}%` }]} />
                  </View>
                  <Text style={tw`text-xs text-gray-500 mt-1`}>
                    {habit.completedDays.length} of {habit.totalDays} days
                  </Text>
                </View>

                <View style={tw`flex-row justify-between pt-4 border-t border-gray-100`}>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{habit.bestStreak}</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Best Streak</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{habit.completedDays.length}</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Days Done</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-black text-gray-900`}>{completionRate}%</Text>
                    <Text style={tw`text-xs text-gray-500 mt-1`}>Success Rate</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {selectedTab === 'stats' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              {/* Stats Cards Grid */}
              <View style={tw`flex-row flex-wrap justify-between mb-4`}>
                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 mb-3 border border-amber-200/20`}>
                  <Trophy size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{totalXPEarned}</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Total XP</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 mb-3 border border-amber-200/20`}>
                  <Activity size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{completionRate}%</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Success Rate</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 border border-amber-200/20`}>
                  <Flame size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{habit.currentStreak}</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Current Streak</Text>
                </LinearGradient>

                <LinearGradient colors={['rgba(251, 191, 36, 0.1)', 'rgba(245, 158, 11, 0.05)']} style={tw`w-[48%] rounded-2xl p-4 border border-amber-200/20`}>
                  <Star size={24} color="#d97706" />
                  <Text style={tw`text-2xl font-black text-amber-900 mt-2`}>{habit.bestStreak}</Text>
                  <Text style={tw`text-xs text-amber-700 font-semibold`}>Best Streak</Text>
                </LinearGradient>
              </View>

              {/* Milestones */}
              <View style={tw`bg-white rounded-3xl p-5 shadow-sm border border-gray-100`}>
                <Text style={tw`text-base font-bold text-gray-900 mb-4`}>Milestones</Text>

                {MILESTONES.map((milestone, idx) => {
                  const achieved = habit.bestStreak >= milestone.days;
                  const Icon = milestone.icon;

                  return (
                    <Animated.View key={milestone.days} entering={FadeInDown.delay(idx * 50).springify()}>
                      <View style={tw`flex-row items-center justify-between py-3.5 border-b border-gray-50`}>
                        <View style={tw`flex-row items-center gap-3`}>
                          <LinearGradient
                            colors={achieved ? ['rgba(251, 191, 36, 0.2)', 'rgba(245, 158, 11, 0.1)'] : ['#f3f4f6', '#e5e7eb']}
                            style={tw`w-12 h-12 rounded-2xl items-center justify-center`}
                          >
                            <Icon size={24} color={achieved ? '#d97706' : '#9ca3af'} />
                          </LinearGradient>
                          <View>
                            <Text style={[tw`text-sm font-bold`, achieved ? tw`text-gray-900` : tw`text-gray-400`]}>{milestone.title}</Text>
                            <Text style={tw`text-xs text-gray-500 mt-0.5`}>{achieved ? `Achieved! ${milestone.reward}` : `${milestone.days - habit.currentStreak} days away`}</Text>
                          </View>
                        </View>
                        {achieved && (
                          <View style={tw`bg-amber-50 rounded-full p-2`}>
                            <CheckCircle2 size={20} color="#d97706" strokeWidth={2.5} />
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {selectedTab === 'calendar' && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <LinearGradient colors={['rgba(251, 191, 36, 0.05)', 'rgba(245, 158, 11, 0.02)']} style={tw`rounded-3xl p-8 border border-amber-200/20`}>
                <View style={tw`items-center`}>
                  <View style={tw`w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-4`}>
                    <Calendar size={40} color="#d97706" strokeWidth={1.5} />
                  </View>
                  <Text style={tw`text-xl font-bold text-gray-800 mb-2`}>Calendar View</Text>
                  <Text style={tw`text-sm text-gray-500 text-center`}>Visual calendar tracking coming soon!</Text>
                  <Text style={tw`text-xs text-gray-400 mt-2 text-center`}>Track your daily progress with a beautiful calendar</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default HabitDetails;
