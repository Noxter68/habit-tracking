// src/screens/Dashboard.tsx
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, Sparkles, Trophy, Star, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw, { achievementGradients } from '../lib/tailwind';

// Utils
import { getProgressStatus, calculateCompletionRate } from '../utils/progressStatus';
import { getDashboardStats } from '../utils/dashboardStats';

// Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ProgressCard from '../components/dashboard/ProgressCard';
import EmptyState from '../components/EmptyState';
import { AddHabitIcon } from '../components/icons/CustomIcons';

// Context
import { useHabits } from '../context/HabitContext';
import { useAchievements } from '../context/AchievementContext';
import EnhancedHabitCard from '@/components/dashboard/EnhanceHabitCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Swipeable Habit Card Wrapper with Achievement Colors
const SwipeableHabitCard: React.FC<{
  habit: any;
  index: number;
  onDelete: (id: string) => void;
  onToggleDay: (habitId: string, date: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onPress: () => void;
}> = ({ habit, index, onDelete, onToggleDay, onToggleTask, onPress }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = () => (
    <View style={tw`w-20 ml-2`}>
      <LinearGradient colors={['#ef4444', '#dc2626']} style={tw`flex-1 rounded-2xl items-center justify-center`}>
        <Trash2 size={22} color="#fff" />
        <Text style={tw`text-xs text-white font-bold mt-1`}>Delete</Text>
      </LinearGradient>
    </View>
  );

  const handleSwipeOpen = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        {
          text: 'Cancel',
          onPress: () => swipeableRef.current?.close(),
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => onDelete(habit.id),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={tw`mb-3`}>
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} onSwipeableOpen={handleSwipeOpen} rightThreshold={40} overshootRight={false}>
        <Animated.View entering={FadeInUp.delay(index * 100)}>
          <EnhancedHabitCard habit={habit} onToggleDay={onToggleDay} onToggleTask={onToggleTask} onPress={onPress} />
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
};

// Main Dashboard Component with Achievement Theme
const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { habits, loading, refreshHabits, toggleHabitDay, toggleTask, deleteHabit } = useHabits();
  const { userTitle, totalCompletions, checkAchievements } = useAchievements();

  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats
  const stats = getDashboardStats(habits);
  const progressStatus = getProgressStatus(stats.completionRate, stats.todayCompleted, stats.totalActive);

  // Calculate total tasks for today across all habits
  const calculateTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    let totalTasks = 0;
    let completedTasks = 0;

    habits.forEach((habit) => {
      // Count tasks for habits with tasks
      if (habit.tasks && habit.tasks.length > 0) {
        totalTasks += habit.tasks.length;
        const todayData = habit.dailyTasks?.[today];
        if (todayData?.completedTasks) {
          completedTasks += todayData.completedTasks.length;
        }
      } else {
        // For habits without tasks, count the habit itself
        totalTasks += 1;
        const todayData = habit.dailyTasks?.[today];
        if (todayData?.allCompleted || habit.completedDays.includes(today)) {
          completedTasks += 1;
        }
      }
    });

    return { totalTasks, completedTasks };
  };

  const todayTasksData = calculateTodayTasks();

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
  console.log(userTitle);
  return (
    <SafeAreaView style={tw`flex-1 bg-achievement-amber-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" colors={['#f59e0b']} />}
      >
        {/* Enhanced Header Section with Achievement Theme */}
        <LinearGradient colors={achievementGradients.hero} style={tw`px-5 pt-2 pb-6`}>
          <DashboardHeader
            userTitle={userTitle}
            userLevel={Math.floor(totalCompletions / 10) + 1}
            totalStreak={stats.totalStreak}
            weekProgress={stats.weekProgress}
            activeHabits={stats.totalActive}
            totalCompletions={totalCompletions}
            completedTasksToday={todayTasksData.completedTasks}
            totalTasksToday={todayTasksData.totalTasks}
          />
        </LinearGradient>

        {/* Daily Progress Card with Gamified Design */}
        {habits.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200)} style={tw`px-5 -mt-3 mb-4`}>
            <LinearGradient colors={['#ffffff', '#fef3c7']} style={tw`rounded-3xl p-5 shadow-lg border border-achievement-amber-200`}>
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-12 h-12 bg-achievement-amber-300/30 rounded-2xl items-center justify-center mr-3`}>
                    <Trophy size={24} color="#d97706" />
                  </View>
                  <View>
                    <Text style={tw`text-lg font-bold text-gray-900`}>Daily Quest</Text>
                    <Text style={tw`text-xs text-achievement-amber-700 font-semibold`}>{progressStatus.message}</Text>
                  </View>
                </View>
                <View style={tw`items-end`}>
                  <Text style={tw`text-2xl font-black text-achievement-amber-800`}>
                    {stats.todayCompleted}/{stats.totalActive}
                  </Text>
                  <Text style={tw`text-xs text-achievement-amber-600 font-semibold`}>Completed</Text>
                </View>
              </View>

              {/* Progress Bar with Gradient */}
              <View style={tw`h-3 bg-achievement-amber-100 rounded-full overflow-hidden`}>
                <LinearGradient colors={achievementGradients.levelProgress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${stats.completionRate}%` }]} />
              </View>

              {/* Reward Preview */}
              <View style={tw`flex-row items-center justify-between mt-3`}>
                <View style={tw`flex-row items-center`}>
                  <Sparkles size={14} color="#d97706" />
                  <Text style={tw`text-xs text-achievement-amber-700 ml-1 font-medium`}>{stats.completionRate >= 100 ? 'Perfect Day!' : `${100 - stats.completionRate}% to Perfect Day`}</Text>
                </View>
                {stats.completionRate >= 100 && (
                  <View style={tw`bg-achievement-amber-800 rounded-full px-3 py-1`}>
                    <Text style={tw`text-xs font-bold text-white`}>+10 XP</Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Habits Section with Achievement Theme */}
        <View style={tw`px-5`}>
          {habits.length === 0 ? (
            <EmptyState onAddHabit={handleAddHabit} />
          ) : (
            <>
              {/* Section Header with Achievement Colors */}
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <LinearGradient colors={achievementGradients.tiers['Rising Hero']} style={tw`rounded-full px-3 py-1.5 flex-row items-center`}>
                    <Star size={14} color="#fff" />
                    <Text style={tw`text-xs font-bold text-white ml-1.5`}>TODAY'S QUESTS</Text>
                    <View style={tw`ml-2 bg-white/30 rounded-full px-2 py-0.5`}>
                      <Text style={tw`text-xs font-bold text-white`}>{habits.length}</Text>
                    </View>
                  </LinearGradient>
                </View>
                <Pressable onPress={() => navigation.navigate('Achievements' as never)} style={tw`flex-row items-center`}>
                  <Text style={tw`text-xs text-achievement-amber-600 font-semibold mr-1`}>View Rewards</Text>
                  <TrendingUp size={14} color="#d97706" />
                </Pressable>
              </View>

              {/* Habit Cards with Gamified Style */}
              {habits.map((habit, index) => (
                <SwipeableHabitCard
                  key={habit.id}
                  habit={habit}
                  index={index}
                  onDelete={handleDeleteHabit}
                  onToggleDay={toggleHabitDay}
                  onToggleTask={toggleTask}
                  onPress={() =>
                    navigation.navigate(
                      'HabitDetails' as never,
                      {
                        habitId: habit.id,
                      } as never
                    )
                  }
                />
              ))}

              {/* Add New Habit Button with Achievement Theme */}
              <Animated.View entering={FadeInDown.delay((habits.length + 1) * 100)}>
                <Pressable onPress={handleAddHabit} style={({ pressed }) => [tw`mt-2`, pressed && tw`scale-[0.98]`]}>
                  <LinearGradient colors={achievementGradients.unlocked.button} style={tw`rounded-2xl p-4 flex-row items-center justify-center`}>
                    <Plus size={20} color="#fff" strokeWidth={3} />
                    <Text style={tw`ml-2 text-white font-bold text-sm`}>Add New Quest</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
