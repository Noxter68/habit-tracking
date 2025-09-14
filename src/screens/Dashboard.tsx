// src/screens/Dashboard.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trophy, Flame, Target, TrendingUp } from 'lucide-react-native';
import tw from '../lib/tailwind';
import EmptyState from '../components/EmptyState';
import HabitCard from '../components/HabitCard';
import { useHabits } from '../context/HabitContext';
import { useNavigation } from '@react-navigation/native';

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { habits, loading, refreshHabits, toggleHabitDay, toggleTask, deleteHabit } = useHabits();
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

  // Gamification: Dynamic title and message based on progress
  const getProgressStatus = () => {
    if (completionRate === 100) {
      return {
        title: 'Perfect Day! 🎯',
        subtitle: 'All habits completed',
        icon: Trophy,
        colors: ['#10b981', '#059669'],
        iconColor: '#059669',
        message: 'Outstanding work! Keep this momentum going!',
      };
    } else if (completionRate >= 80) {
      return {
        title: 'Almost There! 💪',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: Flame,
        colors: ['#8b5cf6', '#7c3aed'],
        iconColor: '#7c3aed',
        message: 'Great progress! Just a little more to go!',
      };
    } else if (completionRate >= 50) {
      return {
        title: 'Good Progress 📈',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: TrendingUp,
        colors: ['#6366f1', '#4f46e5'],
        iconColor: '#4f46e5',
        message: "You're halfway there! Keep pushing!",
      };
    } else if (completionRate > 0) {
      return {
        title: 'Getting Started 🌱',
        subtitle: `${habitsCompleted} of ${habits.length} done`,
        icon: Target,
        colors: ['#f59e0b', '#d97706'],
        iconColor: '#d97706',
        message: 'Every step counts! Keep going!',
      };
    } else {
      return {
        title: 'Ready to Begin? 🚀',
        subtitle: 'Start with your first habit',
        icon: Target,
        colors: ['#64748b', '#475569'],
        iconColor: '#475569',
        message: 'Today is a great day to start!',
      };
    }
  };

  const progressStatus = getProgressStatus();
  const StatusIcon = progressStatus.icon;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    setRefreshing(false);
  };

  const handleAddHabit = () => {
    navigation.navigate('HabitWizard' as never);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
      >
        {/* Header */}
        <View style={tw`px-5 pt-5 pb-2`}>
          <Text style={tw`text-sm text-gray-500 mb-1`}>{getGreeting()}</Text>
          <Text style={tw`text-2xl font-bold text-gray-900`}>Your Journey</Text>
        </View>

        {/* Enhanced Progress Card */}
        {habits.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={tw`px-5 pb-5`}>
            <LinearGradient colors={progressStatus.colors} style={tw`rounded-2xl p-5 shadow-lg`}>
              {/* Progress Header */}
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xl font-bold text-white mb-1`}>{progressStatus.title}</Text>
                  <Text style={tw`text-white/80 text-sm`}>{progressStatus.subtitle}</Text>
                </View>
                <View style={tw`w-14 h-14 bg-white/20 rounded-2xl items-center justify-center`}>
                  <StatusIcon size={28} color="#ffffff" strokeWidth={2.5} />
                </View>
              </View>

              {/* Large Progress Bar */}
              <View style={tw`mb-4`}>
                <View style={tw`h-3 bg-white/20 rounded-full overflow-hidden`}>
                  <Animated.View entering={FadeIn.delay(200).duration(600)} style={[tw`h-full bg-white rounded-full`, { width: `${completionRate}%` }]} />
                </View>
                <View style={tw`flex-row justify-between mt-2`}>
                  <Text style={tw`text-xs text-white/70`}>0%</Text>
                  <Text style={tw`text-sm font-bold text-white`}>{completionRate}%</Text>
                  <Text style={tw`text-xs text-white/70`}>100%</Text>
                </View>
              </View>

              {/* Motivational Message */}
              <View style={tw`bg-white/10 rounded-xl p-3`}>
                <Text style={tw`text-sm text-white font-medium text-center`}>{progressStatus.message}</Text>
              </View>

              {/* Stats Row */}
              {totalStreak > 0 && (
                <View style={tw`flex-row justify-around mt-4 pt-4 border-t border-white/20`}>
                  <View style={tw`items-center`}>
                    <View style={tw`flex-row items-center`}>
                      <Flame size={16} color="#ffffff" style={tw`mr-1`} />
                      <Text style={tw`text-2xl font-bold text-white`}>{totalStreak}</Text>
                    </View>
                    <Text style={tw`text-xs text-white/70 mt-1`}>Best Streak</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-bold text-white`}>{habits.length}</Text>
                    <Text style={tw`text-xs text-white/70 mt-1`}>Active Habits</Text>
                  </View>
                  <View style={tw`items-center`}>
                    <Text style={tw`text-2xl font-bold text-white`}>{habitsCompleted}</Text>
                    <Text style={tw`text-xs text-white/70 mt-1`}>Completed Today</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        )}

        {/* Quick Actions (if habits exist) */}
        {habits.length > 0 && habits.length < 5 && (
          <View style={tw`px-5 pb-4`}>
            <Pressable onPress={handleAddHabit} style={({ pressed }) => [tw`bg-white rounded-xl p-4 border border-gray-100 shadow-sm`, pressed && tw`opacity-90 scale-98`]}>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`text-sm font-semibold text-gray-900`}>Add Another Habit</Text>
                  <Text style={tw`text-xs text-gray-500 mt-0.5`}>
                    You're tracking {habits.length} habit{habits.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={tw`w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center`}>
                  <Plus size={20} color="#6366f1" strokeWidth={2.5} />
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Habits List */}
        <View style={tw`px-5`}>
          {habits.length === 0 ? (
            <EmptyState onAddHabit={handleAddHabit} />
          ) : (
            <>
              <Text style={tw`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3`}>Today's Habits</Text>

              {habits.map((habit, index) => (
                <Animated.View key={habit.id} entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
                  <HabitCard habit={habit} onToggleDay={toggleHabitDay} onToggleTask={toggleTask} onPress={() => navigation.navigate('HabitDetails' as never, { habitId: habit.id } as never)} />
                </Animated.View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
