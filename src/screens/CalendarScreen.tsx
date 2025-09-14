// src/screens/CalendarScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar as CalendarIcon, TrendingUp, Award, Target, ChevronRight, Sparkles } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { useHabits } from '../context/HabitContext';
import CalendarView from '../components/CalendarView';
import GoalBattery from '../components/GoalBattery';
import { Habit } from '../types';

const CalendarScreen: React.FC = () => {
  const { habits, loading, refreshHabits } = useHabits();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [expandedSection, setExpandedSection] = useState<'battery' | 'tips' | null>(null);

  const scaleAnimation = useSharedValue(1);

  // Update selected habit when habits change
  useEffect(() => {
    if (habits.length > 0) {
      if (!selectedHabit) {
        setSelectedHabit(habits[0]);
      } else {
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
    if (!selectedHabit)
      return {
        completed: false,
        partial: false,
        tasks: [],
        completedCount: 0,
        totalCount: 0,
        percentage: 0,
      };

    const dayTasks = selectedHabit.dailyTasks[dateString];
    const totalTasks = selectedHabit.tasks.length;

    if (!dayTasks) {
      return {
        completed: false,
        partial: false,
        tasks: [],
        completedCount: 0,
        totalCount: totalTasks,
        percentage: 0,
      };
    }

    const completedTasks = dayTasks.completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      completed: completedTasks === totalTasks && totalTasks > 0,
      partial: completedTasks > 0 && completedTasks < totalTasks,
      tasks: dayTasks.completedTasks,
      completedCount: completedTasks,
      totalCount: totalTasks,
      percentage,
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

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnimation.value }],
  }));

  const tips = [
    { icon: '⏰', title: 'Set a specific time', description: 'Link your habit to a daily trigger' },
    { icon: '🎯', title: 'Start small', description: 'Even 2 minutes counts towards building momentum' },
    { icon: '🔗', title: 'Stack habits', description: 'Attach new habits to existing routines' },
    { icon: '🌟', title: 'Prepare your environment', description: 'Make good habits obvious and easy' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`flex-1`}>
        {/* Enhanced Header */}
        <LinearGradient colors={['#ffffff', '#f8fafc']} style={tw`px-6 py-4 border-b border-gray-100`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-2xl font-bold text-gray-900`}>Calendar</Text>
              <Text style={tw`text-sm text-gray-600 mt-0.5`}>Track your journey</Text>
            </View>
            <View style={tw`bg-indigo-50 p-2 rounded-xl`}>
              <CalendarIcon size={24} color="#6366f1" strokeWidth={2} />
            </View>
          </View>
        </LinearGradient>

        <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor="#6366f1" />}>
          {habits.length === 0 ? (
            // Empty State with better design
            <View style={tw`flex-1 items-center justify-center py-24`}>
              <Animated.View entering={FadeIn.duration(400)} style={tw`items-center`}>
                <View style={tw`w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl items-center justify-center mb-6`}>
                  <CalendarIcon size={48} color="#6366f1" strokeWidth={1.5} />
                </View>
                <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>No habits yet</Text>
                <Text style={tw`text-base text-gray-600 text-center px-8 leading-relaxed`}>Create your first habit to see{'\n'}your progress calendar</Text>
              </Animated.View>
            </View>
          ) : (
            <>
              {/* Enhanced Habit Selector */}
              <View style={tw`px-6 py-4`}>
                <Text style={tw`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3`}>Select Habit</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-3`}>
                  {habits.map((habit, index) => (
                    <Animated.View key={habit.id} entering={FadeInDown.delay(index * 50).duration(400)}>
                      <Pressable
                        onPress={() => {
                          setSelectedHabit(habit);
                          scaleAnimation.value = withSpring(0.95);
                          setTimeout(() => {
                            scaleAnimation.value = withSpring(1);
                          }, 100);
                        }}
                        style={({ pressed }) => [
                          tw`px-4 py-3 rounded-xl border flex-row items-center`,
                          selectedHabit?.id === habit.id ? tw`bg-indigo-50 border-indigo-400` : tw`bg-white border-gray-200`,
                          pressed && tw`scale-95`,
                        ]}
                      >
                        <View style={tw`w-8 h-8 rounded-lg bg-gray-50 items-center justify-center mr-3`}>
                          <Text style={tw`text-lg`}>{getCategoryIcon(habit.category)}</Text>
                        </View>
                        <View>
                          <Text style={[tw`font-semibold`, selectedHabit?.id === habit.id ? tw`text-indigo-700` : tw`text-gray-700`]}>{habit.name}</Text>
                          <Text style={tw`text-xs text-gray-500 mt-0.5`}>{habit.currentStreak} day streak</Text>
                        </View>
                        {selectedHabit?.id === habit.id && (
                          <View style={tw`ml-3`}>
                            <View style={tw`w-2 h-2 bg-indigo-500 rounded-full`} />
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  ))}
                </ScrollView>
              </View>

              {/* Goal Battery Component with Animation */}
              {selectedHabit && (
                <Animated.View entering={FadeIn.duration(400)} style={[tw`px-6 mb-4`, animatedCardStyle]}>
                  <GoalBattery
                    totalDays={selectedHabit.totalDays}
                    completedDays={calculateActualCompletedDays(selectedHabit)}
                    missedDays={calculateMissedDays(selectedHabit)}
                    startDate={new Date(selectedHabit.createdAt)}
                    habitName={selectedHabit.name}
                    habitType={selectedHabit.type}
                  />
                </Animated.View>
              )}

              {/* Calendar Component */}
              {selectedHabit && (
                <Animated.View entering={FadeInDown.delay(200).duration(400)} style={tw`px-6`}>
                  <CalendarView key={selectedHabit.id} habit={selectedHabit} selectedDate={selectedDate} onDateSelect={setSelectedDate} />

                  {/* Enhanced Selected Date Info */}
                  <View style={tw`mt-4`}>
                    <LinearGradient
                      colors={completionStatus.completed ? ['#10b981', '#059669'] : completionStatus.partial ? ['#f59e0b', '#d97706'] : ['#f3f4f6', '#e5e7eb']}
                      style={tw`rounded-2xl p-5`}
                    >
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <Text style={[tw`text-lg font-bold`, completionStatus.completed || completionStatus.partial ? tw`text-white` : tw`text-gray-800`]}>
                          {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                        {completionStatus.completed && <Award size={24} color="#ffffff" strokeWidth={2} />}
                      </View>

                      <View style={tw`bg-white/20 rounded-xl p-3`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={tw`flex-row items-center`}>
                            <View
                              style={[
                                tw`w-14 h-14 rounded-xl items-center justify-center mr-3`,
                                completionStatus.completed ? tw`bg-white/30` : completionStatus.partial ? tw`bg-white/20` : tw`bg-gray-100`,
                              ]}
                            >
                              <Text style={tw`text-2xl font-bold ${completionStatus.completed || completionStatus.partial ? 'text-white' : 'text-gray-600'}`}>{completionStatus.percentage}%</Text>
                            </View>
                            <View style={tw`flex-1`}>
                              <Text style={[tw`font-semibold`, completionStatus.completed || completionStatus.partial ? tw`text-white` : tw`text-gray-700`]}>
                                {completionStatus.completed
                                  ? 'All tasks completed!'
                                  : completionStatus.partial
                                  ? `${completionStatus.completedCount}/${completionStatus.totalCount} tasks done`
                                  : 'No tasks completed'}
                              </Text>
                              {completionStatus.partial && (
                                <Text style={tw`text-xs text-white/80 mt-1`}>Complete {completionStatus.totalCount - completionStatus.completedCount} more to finish today</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Enhanced Tips Section */}
                  {selectedHabit && calculateMissedDays(selectedHabit) > 3 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={tw`mt-4 mb-4`}>
                      <Pressable
                        onPress={() => setExpandedSection(expandedSection === 'tips' ? null : 'tips')}
                        style={({ pressed }) => [tw`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4`, pressed && tw`opacity-90`]}
                      >
                        <View style={tw`flex-row items-center justify-between mb-2`}>
                          <View style={tw`flex-row items-center`}>
                            <Sparkles size={20} color="#6366f1" style={tw`mr-2`} />
                            <Text style={tw`text-base font-bold text-indigo-900`}>Tips to Get Back on Track</Text>
                          </View>
                          <ChevronRight size={20} color="#6366f1" style={[tw`transform`, expandedSection === 'tips' && tw`rotate-90`]} />
                        </View>

                        {expandedSection === 'tips' && (
                          <View style={tw`mt-3 gap-3`}>
                            {tips.map((tip, index) => (
                              <Animated.View key={`tip-${index}`} entering={FadeInDown.delay(index * 50).duration(300)} style={tw`flex-row items-start bg-white/50 rounded-xl p-3`}>
                                <View style={[tw`w-8 h-8 rounded-lg items-center justify-center mr-3`, { backgroundColor: tip.iconColor + '20' }]}>
                                  {createElement(tip.icon, {
                                    size: 16,
                                    color: tip.iconColor,
                                    strokeWidth: 2,
                                  })}
                                </View>
                                <View style={tw`flex-1`}>
                                  <Text style={tw`text-sm font-semibold text-indigo-900`}>{tip.title}</Text>
                                  <Text style={tw`text-xs text-indigo-700 mt-0.5`}>{tip.description}</Text>
                                </View>
                              </Animated.View>
                            ))}
                          </View>
                        )}
                      </Pressable>
                    </Animated.View>
                  )}
                </Animated.View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
