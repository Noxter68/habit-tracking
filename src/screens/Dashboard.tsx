// src/screens/Dashboard.tsx
import React, { useState, useRef, useEffect } from 'react';
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

  // Get habits context with null checks
  const habitContext = useHabits();
  const habits = habitContext?.habits || [];
  const loading = habitContext?.loading || false;
  const refreshHabits = habitContext?.refreshHabits || (async () => {});
  const toggleHabitDay = habitContext?.toggleHabitDay || (async () => {});
  const toggleTask = habitContext?.toggleTask || (async () => {});
  const deleteHabit = habitContext?.deleteHabit || (async () => {});

  // Get achievements context with null checks
  const achievementContext = useAchievements();
  const userTitle = achievementContext?.userTitle || 'Newcomer';
  const totalCompletions = achievementContext?.totalCompletions || 0;
  const checkAchievements = achievementContext?.checkAchievements || (async () => {});

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  console.log(achievementContext);
  // Safe navigation check
  useEffect(() => {
    if (!navigation) {
      console.error('Navigation is not available');
    }
  }, [navigation]);

  // Calculate stats with null safety
  const stats = getDashboardStats(habits);
  const progressStatus = getProgressStatus(stats.completionRate, stats.todayCompleted, stats.totalActive);

  console.log(achievementContext);

  // Calculate total tasks for today across all habits
  const calculateTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    let totalTasks = 0;
    let completedTasks = 0;

    if (Array.isArray(habits)) {
      habits.forEach((habit) => {
        // Count tasks for habits with tasks
        if (habit?.tasks && habit.tasks.length > 0) {
          totalTasks += habit.tasks.length;
          const todayData = habit.dailyTasks?.[today];
          if (todayData?.completedTasks) {
            completedTasks += todayData.completedTasks.length;
          }
        } else if (habit) {
          // For habits without tasks, count the habit itself
          totalTasks += 1;
          const todayData = habit.dailyTasks?.[today];
          if (todayData?.allCompleted || habit.completedDays?.includes(today)) {
            completedTasks += 1;
          }
        }
      });
    }

    return { totalTasks, completedTasks };
  };

  const todayTasksData = calculateTodayTasks();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshHabits();
      await checkAchievements();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddHabit = () => {
    if (navigation) {
      navigation.navigate('HabitWizard' as never);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await deleteHabit(habitId);
      await checkAchievements();
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const handleXPCollected = (amount: number) => {
    console.log('XP Collected:', amount);
    setRefreshTrigger((prev) => prev + 1);
  };

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
            userLevel={achievementContext.currentLevel}
            totalStreak={stats.currentStreak}
            weekProgress={stats.weeklyProgress}
            activeHabits={stats.totalActive}
            totalCompletions={totalCompletions}
            completedTasksToday={todayTasksData.completedTasks}
            totalTasksToday={todayTasksData.totalTasks}
            onXPCollected={handleXPCollected}
            refreshTrigger={refreshTrigger}
            currentAchievement={achievementContext?.currentAchievement}
            currentLevelXP={achievementContext?.currentLevelXP || 0}
            xpForNextLevel={achievementContext?.xpForNextLevel || 100}
            levelProgress={achievementContext?.levelProgress || 0}
          />
        </LinearGradient>

        {/* Progress Card - only show if there are active habits */}
        {stats.totalActive > 0 && stats.completionRate < 100 && (
          <Animated.View entering={FadeInDown.delay(200)} style={tw`px-5 -mt-3 mb-4`}>
            <LinearGradient colors={['#ffffff', '#fef3c7']} style={tw`rounded-2xl p-4 border border-achievement-amber-200`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-10 h-10 bg-achievement-amber-100 rounded-xl items-center justify-center mr-3`}>
                    <Sparkles size={20} color="#d97706" />
                  </View>
                  <View>
                    <Text style={tw`text-sm font-bold text-gray-900`}>Today's Progress</Text>
                    <Text style={tw`text-xs text-achievement-amber-600`}>{stats.completionRate >= 100 ? 'Perfect Day!' : `${100 - stats.completionRate}% to Perfect Day`}</Text>
                  </View>
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
          {!habits || habits.length === 0 ? (
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
                <Pressable onPress={() => navigation && navigation.navigate('Achievements' as never)} style={tw`flex-row items-center`}>
                  <Text style={tw`text-xs text-achievement-amber-600 font-semibold mr-1`}>View Rewards</Text>
                  <TrendingUp size={14} color="#d97706" />
                </Pressable>
              </View>

              {/* Habit Cards with Gamified Style */}
              {habits.map((habit, index) => (
                <SwipeableHabitCard
                  key={habit?.id || index}
                  habit={habit}
                  index={index}
                  onDelete={handleDeleteHabit}
                  onToggleDay={toggleHabitDay}
                  onToggleTask={toggleTask}
                  onPress={() => {
                    if (navigation && habit?.id) {
                      navigation.navigate('HabitDetails' as never, { habitId: habit.id } as never);
                    }
                  }}
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
