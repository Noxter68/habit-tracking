// src/screens/Dashboard.tsx
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, Sparkles } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../lib/tailwind';

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

// Swipeable Habit Card Wrapper
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
      <View style={tw`justify-center pl-3`}>
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
          style={({ pressed }) => [tw`bg-red-50 rounded-2xl px-5 py-4 border border-red-200`, pressed && tw`bg-red-100`]}
        >
          <View style={tw`items-center`}>
            <Trash2 size={20} color="#dc2626" strokeWidth={2} />
            <Text style={tw`text-xs text-red-600 font-medium mt-1`}>Delete</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - deleteAnimation.value,
    transform: [
      {
        scale: 1 - deleteAnimation.value * 0.2,
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} rightThreshold={40} friction={2}>
        <Animated.View entering={FadeInUp.delay(index * 50).springify()} style={tw`mb-3`}>
          <EnhancedHabitCard habit={habit} onToggleDay={onToggleDay} onToggleTask={onToggleTask} onPress={onPress} />
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
};

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { habits, loading, refreshHabits, toggleHabitDay, toggleTask, deleteHabit } = useHabits();
  const { userTitle, totalCompletions, checkAchievements } = useAchievements();

  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats
  const stats = getDashboardStats(habits);
  const progressStatus = getProgressStatus(stats.completionRate, stats.todayCompleted, stats.totalActive);

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
        {/* Header Section */}
        <DashboardHeader userTitle={userTitle} userLevel={Math.floor(totalCompletions / 10) + 1} totalStreak={stats.totalStreak} weekProgress={stats.weekProgress} activeHabits={stats.totalActive} />

        {/* Progress Card */}
        {habits.length > 0 && (
          <ProgressCard status={progressStatus} completionRate={stats.completionRate} habitsCompleted={stats.todayCompleted} totalHabits={stats.totalActive} totalCompletions={totalCompletions} />
        )}

        {/* Add Habit Button */}
        {habits.length > 0 && habits.length < 10 && (
          <Animated.View entering={FadeInUp.delay(400).springify()} style={tw`px-5 pb-4`}>
            <Pressable onPress={handleAddHabit} style={({ pressed }) => [tw`bg-white rounded-2xl overflow-hidden shadow-sm`, pressed && tw`scale-98`]}>
              <LinearGradient colors={['#f8fafc', '#ffffff']} style={tw`p-4 border border-gray-100`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-11 h-11 items-center justify-center mr-3`}>
                      <AddHabitIcon size={40} />
                    </View>
                    <View>
                      <Text style={tw`text-base font-bold text-gray-900`}>Add New Habit</Text>
                      <Text style={tw`text-xs text-gray-500 mt-0.5`}>{10 - habits.length} slots available</Text>
                    </View>
                  </View>
                  <View style={tw`flex-row items-center`}>
                    <Sparkles size={16} color="#6366f1" style={tw`mr-1`} />
                    <Plus size={20} color="#6b7280" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Habits List */}
        <View style={tw`px-5`}>
          {habits.length === 0 ? (
            <EmptyState onAddHabit={handleAddHabit} />
          ) : (
            <>
              {/* Section Header */}
              <View style={tw`flex-row items-center justify-between mb-3`}>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider`}>Today's Habits</Text>
                  <View style={tw`ml-2 px-2 py-0.5 bg-indigo-50 rounded-full border border-indigo-200`}>
                    <Text style={tw`text-xs font-bold text-indigo-600`}>{habits.length}</Text>
                  </View>
                </View>
                <Text style={tw`text-xs text-gray-400 italic`}>Swipe left to manage</Text>
              </View>

              {/* Habit Cards */}
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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
