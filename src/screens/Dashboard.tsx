// src/screens/Dashboard.tsx
import React, { useState, useMemo, useRef, createElement } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate, Extrapolate } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Trophy, Flame, Target, TrendingUp, Crown, Star, Award, Medal, Zap, Sparkles, Trash2, Shield, Rocket, Heart, ChevronRight, BarChart3, Activity } from 'lucide-react-native';
import tw from '../lib/tailwind';
import EmptyState from '../components/EmptyState';
import HabitCard from '../components/HabitCard';
import { useHabits } from '../context/HabitContext';
import { useNavigation } from '@react-navigation/native';
import { useAchievements } from '../context/AchievementContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced Swipeable Habit Card with better animations
const SwipeableHabitCard: React.FC<{
  habit: any;
  index: number;
  onDelete: (id: string) => void;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onPress: () => void;
}> = ({ habit, index, onDelete, onToggleDay, onToggleTask, onPress }) => {
  const swipeableRef = useRef<Swipeable>(null);
  const deleteAnimation = useSharedValue(0);

  const renderRightActions = () => {
    return (
      <View style={tw`justify-center`}>
        <Pressable
          onPress={() => {
            Alert.alert('Delete Habit', `Are you sure you want to delete "${habit.name}"?`, [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => swipeableRef.current?.close(),
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  deleteAnimation.value = withTiming(1, { duration: 300 });
                  setTimeout(() => onDelete(habit.id), 300);
                },
              },
            ]);
          }}
          style={({ pressed }) => [tw`bg-red-500 rounded-2xl px-6 py-4 ml-3 mr-5`, pressed && tw`bg-red-600`]}
        >
          <Trash2 size={24} color="#ffffff" strokeWidth={2} />
        </Pressable>
      </View>
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(deleteAnimation.value, [0, 1], [1, 0], Extrapolate.CLAMP),
    transform: [
      {
        scale: interpolate(deleteAnimation.value, [0, 1], [1, 0.8], Extrapolate.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} rightThreshold={40} friction={2}>
        <Animated.View entering={FadeInUp.delay(index * 50).springify()} style={tw`mb-3`}>
          <HabitCard habit={habit} onToggleDay={onToggleDay} onToggleTask={onToggleTask} onPress={onPress} />
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
};

// Mini Stats Card Component
const StatsCard: React.FC<{
  icon: any;
  value: number | string;
  label: string;
  color: string;
  delay?: number;
}> = ({ icon: Icon, value, label, color, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay).springify()} style={tw`flex-1`}>
    <Pressable style={({ pressed }) => [tw`bg-white rounded-2xl p-3 border border-gray-100`, pressed && tw`scale-95`]}>
      <View style={tw`flex-row items-center mb-1`}>
        <View style={[tw`w-7 h-7 rounded-lg items-center justify-center mr-2`, { backgroundColor: color + '15' }]}>{createElement(Icon, { size: 14, color, strokeWidth: 2.5 })}</View>
        <Text style={tw`text-xl font-bold text-gray-900`}>{value}</Text>
      </View>
      <Text style={tw`text-xs text-gray-500`}>{label}</Text>
    </Pressable>
  </Animated.View>
);

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { habits, loading, refreshHabits, toggleHabitDay, toggleTask, deleteHabit } = useHabits();
  const { userTitle, streak, totalCompletions, checkAchievements } = useAchievements();
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  const getGreeting = () => {
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const habitsCompleted = habits.filter((habit) => {
    const todayTasks = habit.dailyTasks?.[today];
    return todayTasks?.allCompleted;
  }).length;

  const completionRate = habits.length > 0 ? Math.round((habitsCompleted / habits.length) * 100) : 0;

  // Calculate total streak across all habits
  const totalStreak = useMemo(() => {
    return habits.reduce((max, habit) => Math.max(max, habit.currentStreak || 0), 0);
  }, [habits]);

  // Calculate week progress
  const weekProgress = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const completions = last7Days.map((date) => habits.filter((h) => h.completedDays?.includes(date)).length);

    return Math.round((completions.reduce((a, b) => a + b, 0) / (habits.length * 7)) * 100) || 0;
  }, [habits]);

  // Get user achievement icon
  const getTitleIcon = () => {
    const icons: Record<string, any> = {
      Newcomer: Star,
      Starter: Rocket,
      Committed: Target,
      Dedicated: Shield,
      Consistent: Flame,
      Warrior: Medal,
      Champion: Trophy,
      Master: Crown,
      Legend: Sparkles,
      Mythic: Heart,
    };
    return icons[userTitle] || Star;
  };

  const TitleIcon = getTitleIcon();

  // Enhanced progress status with better gradients
  const getProgressStatus = () => {
    if (completionRate === 100) {
      return {
        title: 'Perfect Day!',
        emoji: '🎯',
        subtitle: 'All habits completed',
        icon: Trophy,
        colors: ['#10b981', '#059669'],
        lightColors: ['#dcfce7', '#bbf7d0'],
        iconColor: '#059669',
        message: 'Outstanding work! Keep this momentum going!',
      };
    } else if (completionRate >= 80) {
      return {
        title: 'Almost There!',
        emoji: '💪',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: Flame,
        colors: ['#8b5cf6', '#7c3aed'],
        lightColors: ['#ede9fe', '#ddd6fe'],
        iconColor: '#7c3aed',
        message: 'Great progress! Just a little more to go!',
      };
    } else if (completionRate >= 50) {
      return {
        title: 'Good Progress',
        emoji: '📈',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: TrendingUp,
        colors: ['#6366f1', '#4f46e5'],
        lightColors: ['#e0e7ff', '#c7d2fe'],
        iconColor: '#4f46e5',
        message: "You're halfway there! Keep pushing!",
      };
    } else if (completionRate > 0) {
      return {
        title: 'Getting Started',
        emoji: '🌱',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: Target,
        colors: ['#f59e0b', '#d97706'],
        lightColors: ['#fef3c7', '#fde68a'],
        iconColor: '#d97706',
        message: 'Every step counts! Keep going!',
      };
    } else {
      return {
        title: 'Ready to Begin?',
        emoji: '🚀',
        subtitle: 'Start with your first habit',
        icon: Target,
        colors: ['#94a3b8', '#64748b'],
        lightColors: ['#f1f5f9', '#e2e8f0'],
        iconColor: '#64748b',
        message: 'Today is a great day to start!',
      };
    }
  };

  const progressStatus = getProgressStatus();
  const StatusIcon = progressStatus.icon;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    await checkAchievements();
    setRefreshing(false);
  };

  const handleAddHabit = () => {
    navigation.navigate('HabitWizard' as never);
  };

  const handleDeleteHabit = async (habitId: string) => {
    await deleteHabit(habitId);
    await checkAchievements();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
      >
        {/* Enhanced Header with blur effect */}
        <View style={tw`px-5 pt-5 pb-3`}>
          <Animated.View entering={FadeIn.duration(400)}>
            <View style={tw`flex-row items-center justify-between mb-4`}>
              <View>
                <Text style={tw`text-xs font-medium text-gray-500 uppercase tracking-wider`}>{getGreeting()}</Text>
                <Text style={tw`text-4xl font-bold text-gray-900 mt-1`}>Dashboard</Text>
              </View>

              {/* Enhanced Achievement Badge */}
              {userTitle && (
                <Pressable style={({ pressed }) => [tw`bg-white rounded-2xl shadow-sm border border-gray-100`, pressed && tw`scale-95`]} onPress={() => navigation.navigate('Achievements' as never)}>
                  <LinearGradient colors={progressStatus.lightColors} style={tw`px-4 py-3 rounded-2xl`}>
                    <View style={tw`flex-row items-center`}>
                      <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: progressStatus.iconColor + '20' }]}>
                        {createElement(TitleIcon, {
                          size: 20,
                          color: progressStatus.iconColor,
                          strokeWidth: 2,
                        })}
                      </View>
                      <View>
                        <Text style={tw`text-sm font-bold text-gray-900`}>{userTitle}</Text>
                        <View style={tw`flex-row items-center mt-0.5`}>
                          <Text style={tw`text-xs text-gray-600`}>Level {Math.floor(totalCompletions / 10) + 1}</Text>
                          <ChevronRight size={12} color="#6b7280" style={tw`ml-1`} />
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              )}
            </View>

            {/* Quick Stats Row */}
            <View style={tw`flex-row gap-3`}>
              <StatsCard icon={Flame} value={totalStreak} label="Day Streak" color="#f59e0b" delay={100} />
              <StatsCard icon={Activity} value={`${weekProgress}%`} label="Week Avg" color="#6366f1" delay={200} />
              <StatsCard icon={BarChart3} value={habits.length} label="Active" color="#10b981" delay={300} />
            </View>
          </Animated.View>
        </View>

        {/* Ultra-modern Progress Card */}
        {habits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={tw`px-5 pb-4`}>
            <View style={tw`relative`}>
              {/* Subtle shadow gradient */}
              <View style={tw`absolute inset-0 bg-gray-200 rounded-3xl blur-xl opacity-30 top-2`} />

              {/* Main Card */}
              <LinearGradient colors={progressStatus.colors} style={tw`rounded-3xl overflow-hidden`} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={tw`p-5`}>
                  {/* Progress Header with emoji */}
                  <View style={tw`flex-row items-start justify-between mb-4`}>
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center mb-1`}>
                        <Text style={tw`text-2xl font-bold text-white`}>{progressStatus.title}</Text>
                        <Text style={tw`text-2xl ml-2`}>{progressStatus.emoji}</Text>
                      </View>
                      <Text style={tw`text-white/90 text-sm font-medium`}>{progressStatus.subtitle}</Text>
                    </View>

                    {/* Floating icon */}
                    <View style={tw`relative`}>
                      <View style={tw`absolute inset-0 bg-white/10 rounded-2xl blur-lg`} />
                      <View style={tw`w-14 h-14 bg-white/20 rounded-2xl items-center justify-center`}>
                        <StatusIcon size={28} color="#ffffff" strokeWidth={2} />
                      </View>
                    </View>
                  </View>

                  {/* Enhanced Progress Bar */}
                  <View style={tw`mb-4`}>
                    <View style={tw`h-5 bg-black/20 rounded-full overflow-hidden`}>
                      <Animated.View
                        entering={FadeIn.delay(600).duration(1000)}
                        style={[
                          tw`h-full rounded-full flex-row items-center justify-end px-2`,
                          {
                            width: `${completionRate}%`,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          },
                        ]}
                      >
                        {completionRate > 20 && <Text style={tw`text-xs font-bold text-gray-900`}>{completionRate}%</Text>}
                      </Animated.View>
                    </View>
                    {completionRate <= 20 && <Text style={tw`text-xs text-white/80 mt-1`}>{completionRate}% Complete</Text>}
                  </View>

                  {/* Motivational Message */}
                  <View style={tw`bg-white/15 rounded-2xl px-4 py-3 backdrop-blur-sm`}>
                    <Text style={tw`text-sm text-white font-semibold text-center`}>{progressStatus.message}</Text>
                  </View>
                </View>

                {/* Bottom Stats Bar */}
                <View style={tw`bg-black/10 px-5 py-3`}>
                  <View style={tw`flex-row justify-around`}>
                    <Pressable style={({ pressed }) => [tw`items-center`, pressed && tw`opacity-70`]}>
                      <Text style={tw`text-2xl font-bold text-white`}>{habitsCompleted}</Text>
                      <Text style={tw`text-xs text-white/80 mt-0.5`}>Completed</Text>
                    </Pressable>

                    <View style={tw`w-px bg-white/20`} />

                    <Pressable style={({ pressed }) => [tw`items-center`, pressed && tw`opacity-70`]}>
                      <Text style={tw`text-2xl font-bold text-white`}>{habits.length - habitsCompleted}</Text>
                      <Text style={tw`text-xs text-white/80 mt-0.5`}>Remaining</Text>
                    </Pressable>

                    <View style={tw`w-px bg-white/20`} />

                    <Pressable style={({ pressed }) => [tw`items-center`, pressed && tw`opacity-70`]} onPress={() => navigation.navigate('Stats' as never)}>
                      <Text style={tw`text-2xl font-bold text-white`}>{totalCompletions}</Text>
                      <Text style={tw`text-xs text-white/80 mt-0.5`}>All Time</Text>
                    </Pressable>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Refined Add Habit Button */}
        {habits.length > 0 && habits.length < 10 && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={tw`px-5 pb-4`}>
            <Pressable onPress={handleAddHabit} style={({ pressed }) => [tw`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`, pressed && tw`scale-98`]}>
              <LinearGradient colors={['#fafafa', '#ffffff']} style={tw`p-4`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl items-center justify-center mr-3 shadow-sm`}>
                      <Plus size={24} color="#ffffff" strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text style={tw`text-base font-bold text-gray-900`}>Add New Habit</Text>
                      <Text style={tw`text-xs text-gray-500 mt-0.5`}>{10 - habits.length} slots available</Text>
                    </View>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Zap size={16} color="#6366f1" style={tw`mr-1`} />
                    <ChevronRight size={18} color="#6b7280" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Habits List Section */}
        <View style={tw`px-5`}>
          {habits.length === 0 ? (
            <EmptyState onAddHabit={handleAddHabit} />
          ) : (
            <>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>Today's Focus</Text>
                  <View style={tw`ml-2 px-2 py-0.5 bg-gray-100 rounded-full`}>
                    <Text style={tw`text-xs font-medium text-gray-600`}>{habits.length}</Text>
                  </View>
                </View>
                <Text style={tw`text-xs text-gray-400`}>Swipe ← to manage</Text>
              </View>

              {habits.map((habit, index) => (
                <SwipeableHabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onDelete={handleDeleteHabit}
                  onToggleDay={toggleHabitDay}
                  onToggleTask={toggleTask}
                  onPress={() => navigation.navigate('HabitDetails' as never, { habitId: habit.id } as never)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
