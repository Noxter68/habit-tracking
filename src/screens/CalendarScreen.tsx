// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import CalendarView from '../components/CalendarView';
import GoalBattery from '../components/GoalBattery';
import { Habit } from '../types';

const CalendarScreen: React.FC = () => {
  const { habits, loading, refreshHabits } = useHabits();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  // Update selected habit when habits change
  useEffect(() => {
    if (habits.length > 0) {
      // If no habit selected, select the first one
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
        // Update the selected habit with new data
        const updatedHabit = habits.find((h) => h.id === selectedHabit.id);
        if (updatedHabit) {
          setSelectedHabit(updatedHabit);
        }
      }
    } else {
      setSelectedHabit(null);
    }
  }, [habits]);

  const dateString = selectedDate.toISOString().split('T')[0];

  // Check task completion status for selected date
  const getDateCompletionStatus = () => {
    if (!selectedHabit) return { completed: false, partial: false, tasks: [], completedCount: 0, totalCount: 0 };

    const dayTasks = selectedHabit.dailyTasks[dateString];
    const totalTasks = selectedHabit.tasks.length;

    if (!dayTasks) {
      return {
        completed: false,
        partial: false,
        tasks: [],
        completedCount: 0,
        totalCount: totalTasks,
      };
    }

    const completedTasks = dayTasks.completedTasks.length;

    return {
      completed: completedTasks === totalTasks && totalTasks > 0,
      partial: completedTasks > 0 && completedTasks < totalTasks,
      tasks: dayTasks.completedTasks,
      completedCount: completedTasks,
      totalCount: totalTasks,
    };
  };

  const completionStatus = getDateCompletionStatus();

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      fitness: '💪',
      health: '🧘',
      nutrition: '🥗',
      learning: '📚',
      productivity: '⚡',
      mindfulness: '🧠',
      sleep: '😴',
      hydration: '💧',
      smoking: '🚭',
      'junk-food': '🍔',
      shopping: '🛍️',
      'screen-time': '📱',
      procrastination: '⏰',
      'negative-thinking': '💭',
      alcohol: '🍺',
      oversleeping: '🛏️',
    };
    return icons[category] || '✨';
  };

  // Calculate actual completed days based on task completion
  const calculateActualCompletedDays = (habit: Habit) => {
    let count = 0;
    Object.entries(habit.dailyTasks).forEach(([date, tasks]) => {
      if (tasks.completedTasks.length === habit.tasks.length && habit.tasks.length > 0) {
        count++;
      }
    });
    // Also count days in completedDays array for backward compatibility
    habit.completedDays.forEach((date) => {
      if (!habit.dailyTasks[date]) {
        count++;
      }
    });
    return count;
  };

  // Calculate missed days for selected habit
  const calculateMissedDays = (habit: Habit) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(habit.createdAt);
    startDate.setHours(0, 0, 0, 0);

    let missedCount = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayTasks = habit.dailyTasks[dateStr];

      // Check if this day should be counted based on frequency
      let shouldCount = false;
      if (habit.frequency === 'daily') {
        shouldCount = true;
      } else if (habit.frequency === 'weekly' && currentDate.getDay() === 0) {
        shouldCount = true;
      } else if (habit.frequency === 'custom' && habit.customDays) {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][currentDate.getDay()];
        shouldCount = habit.customDays.includes(dayName);
      }

      if (shouldCount) {
        if (!dayTasks || dayTasks.completedTasks.length < habit.tasks.length) {
          missedCount++;
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return missedCount;
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <View style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 py-4 bg-white border-b border-slate-200`}>
          <Text style={tw`text-2xl font-bold text-slate-800`}>Calendar</Text>
          <Text style={tw`text-slate-600 mt-1`}>Track your progress over time</Text>
        </View>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor="#14b8a6" />}>
          {habits.length === 0 ? (
            <View style={tw`flex-1 items-center justify-center py-20`}>
              <Text style={tw`text-6xl mb-4`}>📅</Text>
              <Text style={tw`text-xl font-semibold text-slate-700 mb-2`}>No habits yet</Text>
              <Text style={tw`text-slate-600 text-center px-8`}>Create your first habit to see your progress calendar</Text>
            </View>
          ) : (
            <>
              {/* Habit Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-6 py-4`}>
                {habits.map((habit) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => setSelectedHabit(habit)}
                    style={({ pressed }) => [
                      tw`mr-3 px-4 py-2 rounded-xl border flex-row items-center`,
                      selectedHabit?.id === habit.id ? tw`bg-teal-50 border-teal-500` : tw`bg-white border-slate-200`,
                      pressed && tw`opacity-80`,
                    ]}
                  >
                    <Text style={tw`text-lg mr-2`}>{getCategoryIcon(habit.category)}</Text>
                    <Text style={[tw`font-medium`, selectedHabit?.id === habit.id ? tw`text-teal-700` : tw`text-slate-700`]}>{habit.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {/* Goal Battery Component */}
              {selectedHabit && (
                <View style={tw`px-6 mb-4`}>
                  <GoalBattery
                    totalDays={selectedHabit.totalDays}
                    completedDays={calculateActualCompletedDays(selectedHabit)}
                    missedDays={calculateMissedDays(selectedHabit)}
                    startDate={new Date(selectedHabit.createdAt)}
                  />
                </View>
              )}

              {/* Calendar Component */}
              {selectedHabit && (
                <View style={tw`px-6`}>
                  <CalendarView
                    key={selectedHabit.id} // Force re-render when habit changes
                    habit={selectedHabit}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />

                  {/* Selected Date Info */}
                  <View style={tw`mt-4 p-4 bg-white rounded-xl`}>
                    <Text style={tw`text-lg font-semibold text-slate-800 mb-2`}>
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>

                    <View style={tw`flex-row items-center`}>
                      <View
                        style={[
                          tw`w-12 h-12 rounded-full items-center justify-center mr-3`,
                          completionStatus.completed ? tw`bg-teal-500` : completionStatus.partial ? tw`bg-amber-400` : tw`bg-slate-100`,
                        ]}
                      >
                        <Text style={tw`text-2xl`}>{completionStatus.completed ? '✓' : completionStatus.partial ? '◐' : '○'}</Text>
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-slate-700`}>
                          {completionStatus.completed
                            ? `All ${completionStatus.totalCount} tasks completed!`
                            : completionStatus.partial
                            ? `${completionStatus.completedCount}/${completionStatus.totalCount} tasks completed`
                            : `No tasks completed for "${selectedHabit.name}"`}
                        </Text>
                        {completionStatus.partial && (
                          <Text style={tw`text-sm text-amber-600 mt-1`}>
                            Complete {completionStatus.totalCount - completionStatus.completedCount} more task{completionStatus.totalCount - completionStatus.completedCount > 1 ? 's' : ''} to mark
                            this day as complete!
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Tips Section (shown when battery is low) */}
                  {selectedHabit && calculateMissedDays(selectedHabit) > 3 && (
                    <View style={tw`mt-4 p-4 bg-blue-50 rounded-xl mb-4`}>
                      <Text style={tw`text-base font-semibold text-blue-900 mb-2`}>💡 Tips to Get Back on Track</Text>
                      <View style={tw`gap-2`}>
                        <Text style={tw`text-sm text-blue-800`}>• Set a specific time for your habit</Text>
                        <Text style={tw`text-sm text-blue-800`}>• Start small - even 2 minutes counts</Text>
                        <Text style={tw`text-sm text-blue-800`}>• Stack it with an existing habit</Text>
                        <Text style={tw`text-sm text-blue-800`}>• Prepare your environment for success</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
