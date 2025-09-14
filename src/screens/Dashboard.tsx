// src/screens/Dashboard.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
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
  const habitsWithAllTasksComplete = habits.filter((habit) => {
    const todayTasks = habit.dailyTasks?.[today];
    return todayTasks?.allCompleted;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshHabits();
    setRefreshing(false);
  };

  const handleAddHabit = () => {
    navigation.navigate('HabitWizard' as never);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={{ paddingBottom: 100 }} // Padding for floating tab bar
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#14b8a6" />}
      >
        {/* Header */}
        <View style={tw`px-6 pt-6 pb-4`}>
          <Text style={tw`text-3xl font-bold text-slate-800`}>Today's Habits</Text>
          <Text style={tw`text-slate-600 mt-1`}>
            {habits.length === 0
              ? 'Ready to build better habits?'
              : habitsWithAllTasksComplete.length === habits.length
              ? '🎉 All habits completed!'
              : `${habitsWithAllTasksComplete.length}/${habits.length} habits completed`}
          </Text>
        </View>

        {/* Daily Summary Card */}
        {habits.length > 0 && (
          <Animated.View entering={FadeIn} style={tw`px-6 mb-4`}>
            <View style={tw`p-4 bg-teal-50 rounded-2xl`}>
              <Text style={tw`text-lg font-semibold text-slate-800 mb-3`}>Today's Progress</Text>
              <View style={tw`gap-2`}>
                {habits.slice(0, 3).map((habit) => {
                  const todayTasks = habit.dailyTasks?.[today] || { completedTasks: [], allCompleted: false };
                  const progress = habit.tasks?.length > 0 ? (todayTasks.completedTasks.length / habit.tasks.length) * 100 : todayTasks.allCompleted ? 100 : 0;

                  return (
                    <View key={habit.id} style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-sm font-medium text-slate-700 flex-1`}>{habit.name}</Text>
                      <View style={tw`flex-row items-center`}>
                        <View style={tw`h-2 w-20 bg-white rounded-full overflow-hidden mr-2`}>
                          <View style={[tw`h-full rounded-full`, todayTasks.allCompleted ? tw`bg-teal-500` : progress > 0 ? tw`bg-amber-400` : tw`bg-slate-300`, { width: `${progress}%` }]} />
                        </View>
                        <Text style={tw`text-xs font-bold text-slate-600 w-10 text-right`}>{Math.round(progress)}%</Text>
                      </View>
                    </View>
                  );
                })}
                {habits.length > 3 && <Text style={tw`text-xs text-slate-500 text-center mt-1`}>+{habits.length - 3} more habits</Text>}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Content */}
        <View style={tw`px-6`}>
          {habits.length === 0 ? (
            <EmptyState onAddHabit={handleAddHabit} />
          ) : (
            <>
              {habits.map((habit, index) => (
                <Animated.View key={habit.id} entering={FadeIn.delay(index * 100)} style={tw`mb-4`}>
                  <HabitCard habit={habit} onToggleDay={toggleHabitDay} onToggleTask={toggleTask} onPress={() => navigation.navigate('HabitDetails' as never, { habitId: habit.id } as never)} />
                </Animated.View>
              ))}

              {/* Add New Habit Button */}
              <Pressable onPress={handleAddHabit} style={({ pressed }) => [tw`mt-2 mb-4 p-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 items-center`, pressed && tw`bg-slate-50`]}>
                <View style={tw`flex-row items-center`}>
                  <Text style={tw`text-slate-500 text-2xl mr-2`}>+</Text>
                  <Text style={tw`text-slate-600 font-semibold text-base`}>Add New Habit</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
