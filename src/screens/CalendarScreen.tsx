// src/screens/CalendarScreen.tsx
import React, { useState, useEffect, createElement } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring, useSharedValue, interpolate, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  Target,
  ChevronRight,
  Sparkles,
  Dumbbell,
  Heart,
  Apple,
  BookOpen,
  Zap,
  Brain,
  Moon,
  Droplets,
  Ban,
  Cigarette,
  ShoppingBag,
  Smartphone,
  Clock,
  ThumbsDown,
  Beer,
  Bed,
  CheckCircle2,
  AlertCircle,
  Info,
  Rocket,
  Timer,
  Layers,
  Link2,
  TreePine,
} from 'lucide-react-native';
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
  const rotateAnimation = useSharedValue(0);

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

  // Get date completion status
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

  // Get category icon with Lucide icons
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, { icon: any; color: string }> = {
      fitness: { icon: Dumbbell, color: '#ef4444' },
      health: { icon: Heart, color: '#ec4899' },
      nutrition: { icon: Apple, color: '#84cc16' },
      learning: { icon: BookOpen, color: '#3b82f6' },
      productivity: { icon: Zap, color: '#f59e0b' },
      mindfulness: { icon: Brain, color: '#8b5cf6' },
      sleep: { icon: Moon, color: '#6366f1' },
      hydration: { icon: Droplets, color: '#06b6d4' },
      smoking: { icon: Cigarette, color: '#dc2626' },
      'junk-food': { icon: Ban, color: '#f97316' },
      shopping: { icon: ShoppingBag, color: '#ec4899' },
      'screen-time': { icon: Smartphone, color: '#6b7280' },
      procrastination: { icon: Clock, color: '#f59e0b' },
      'negative-thinking': { icon: ThumbsDown, color: '#7c3aed' },
      alcohol: { icon: Beer, color: '#ca8a04' },
      oversleeping: { icon: Bed, color: '#64748b' },
    };
    return icons[category] || { icon: Target, color: '#6b7280' };
  };

  // Calculate completed days
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

  // Calculate missed days
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

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnimation.value}deg` }],
  }));

  const tips = [
    { icon: Timer, iconColor: '#f59e0b', title: 'Set a specific time', description: 'Link your habit to a daily trigger' },
    { icon: Target, iconColor: '#ef4444', title: 'Start small', description: 'Even 2 minutes counts towards building momentum' },
    { icon: Link2, iconColor: '#3b82f6', title: 'Stack habits', description: 'Attach new habits to existing routines' },
    { icon: TreePine, iconColor: '#10b981', title: 'Prepare your environment', description: 'Make good habits obvious and easy' },
  ];

  const handleExpandTips = () => {
    const newState = expandedSection === 'tips' ? null : 'tips';
    setExpandedSection(newState);
    rotateAnimation.value = withSpring(newState === 'tips' ? 90 : 0);
  };

  // Calculate header height for proper offset
  const headerHeight = selectedHabit ? 200 : 140;

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-1`}>
        {/* Fixed Modern Header with Gradient */}
        <View style={[tw`absolute top-0 left-0 right-0 z-10`]}>
          <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-6 pt-6 pb-8 rounded-b-3xl shadow-lg`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-3xl font-bold text-white mb-1`}>Calendar</Text>
                <Text style={tw`text-white/80 text-sm`}>Track your daily progress</Text>
              </View>
              <View style={tw`w-14 h-14 bg-white/20 rounded-2xl items-center justify-center`}>
                <CalendarIcon size={28} color="#ffffff" strokeWidth={2} />
              </View>
            </View>

            {/* Quick Stats */}
            {selectedHabit && (
              <View style={tw`flex-row gap-3 mt-6`}>
                <View style={tw`flex-1 bg-white/15 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Rocket size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={tw`text-white font-semibold ml-2`}>{selectedHabit.currentStreak}</Text>
                  </View>
                  <Text style={tw`text-white/70 text-xs mt-1`}>Current</Text>
                </View>

                <View style={tw`flex-1 bg-white/15 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center`}>
                    <Award size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={tw`text-white font-semibold ml-2`}>{selectedHabit.bestStreak}</Text>
                  </View>
                  <Text style={tw`text-white/70 text-xs mt-1`}>Best</Text>
                </View>

                <View style={tw`flex-1 bg-white/15 rounded-xl p-3`}>
                  <View style={tw`flex-row items-center`}>
                    <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={tw`text-white font-semibold ml-2`}>{calculateActualCompletedDays(selectedHabit)}</Text>
                  </View>
                  <Text style={tw`text-white/70 text-xs mt-1`}>Done</Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Scrollable Content with padding top to account for fixed header */}
        <ScrollView
          style={[tw`flex-1`, { paddingTop: headerHeight }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshHabits} tintColor="#6366f1" />}
        >
          {habits.length === 0 ? (
            // Beautiful Empty State
            <View style={tw`flex-1 items-center justify-center py-24`}>
              <Animated.View entering={FadeIn.duration(600)} style={tw`items-center`}>
                <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={tw`w-36 h-36 rounded-full items-center justify-center mb-6`}>
                  <CalendarIcon size={56} color="#6366f1" strokeWidth={1.5} />
                </LinearGradient>
                <Text style={tw`text-3xl font-bold text-gray-900 mb-3`}>No habits yet</Text>
                <Text style={tw`text-base text-gray-500 text-center px-12 leading-relaxed`}>Start your journey by creating{'\n'}your first habit to track</Text>
                <Pressable style={({ pressed }) => [tw`mt-8 px-8 py-3 bg-indigo-600 rounded-2xl`, pressed && tw`bg-indigo-700`]}>
                  <Text style={tw`text-white font-semibold`}>Create First Habit</Text>
                </Pressable>
              </Animated.View>
            </View>
          ) : (
            <View style={tw`pb-6`}>
              {/* Modern Habit Selector - Reduced top padding */}
              <View style={tw`px-6 pt-4 pb-4`}>
                <Text style={tw`text-xs font-bold text-gray-400 uppercase tracking-wider mb-3`}>Active Habits</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`gap-2`}>
                  {habits.map((habit, index) => {
                    const categoryData = getCategoryIcon(habit.category);
                    const isSelected = selectedHabit?.id === habit.id;

                    return (
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
                            tw`px-3 py-2.5 rounded-2xl border-2 flex-row items-center`,
                            isSelected ? tw`bg-indigo-50 border-indigo-500` : tw`bg-white border-gray-200`,
                            pressed && tw`scale-95`,
                          ]}
                        >
                          <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-2.5`, { backgroundColor: categoryData.color + '15' }]}>
                            {createElement(categoryData.icon, {
                              size: 18,
                              color: categoryData.color,
                              strokeWidth: 2,
                            })}
                          </View>
                          <View style={tw`pr-2`}>
                            <Text style={[tw`font-bold text-sm`, isSelected ? tw`text-indigo-700` : tw`text-gray-900`]} numberOfLines={1}>
                              {habit.name}
                            </Text>
                            <View style={tw`flex-row items-center mt-0.5`}>
                              <Rocket size={10} color={isSelected ? '#6366f1' : '#9ca3af'} />
                              <Text style={[tw`text-xs ml-1`, isSelected ? tw`text-indigo-600` : tw`text-gray-500`]}>{habit.currentStreak} days</Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={tw`ml-1.5`}>
                              <CheckCircle2 size={16} color="#6366f1" strokeWidth={2.5} />
                            </View>
                          )}
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Goal Battery with Modern Design - Reduced margin */}
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

                  {/* Modern Selected Date Card */}
                  <View style={tw`mt-4`}>
                    <View style={tw`bg-white rounded-2xl shadow-lg overflow-hidden`}>
                      {/* Date Header */}
                      <LinearGradient colors={completionStatus.completed ? ['#10b981', '#059669'] : completionStatus.partial ? ['#f59e0b', '#d97706'] : ['#94a3b8', '#64748b']} style={tw`px-5 py-4`}>
                        <View style={tw`flex-row items-center justify-between`}>
                          <View>
                            <Text style={tw`text-white/80 text-xs uppercase tracking-wider`}>Selected Date</Text>
                            <Text style={tw`text-white text-xl font-bold mt-1`}>
                              {selectedDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Text>
                          </View>
                          {completionStatus.completed && (
                            <View style={tw`w-12 h-12 bg-white/20 rounded-xl items-center justify-center`}>
                              <Award size={24} color="#ffffff" strokeWidth={2} />
                            </View>
                          )}
                        </View>
                      </LinearGradient>

                      {/* Progress Content */}
                      <View style={tw`p-5`}>
                        <View style={tw`flex-row items-center`}>
                          {/* Progress Circle */}
                          <View style={tw`relative w-20 h-20 mr-4`}>
                            <View style={tw`absolute inset-0 border-4 border-gray-200 rounded-full`} />
                            <View
                              style={[
                                tw`absolute inset-0 rounded-full border-4`,
                                {
                                  borderColor: completionStatus.completed ? '#10b981' : completionStatus.partial ? '#f59e0b' : '#e5e7eb',
                                  opacity: completionStatus.percentage / 100,
                                },
                              ]}
                            />
                            <View style={tw`absolute inset-0 items-center justify-center`}>
                              <Text style={tw`text-2xl font-bold text-gray-900`}>{completionStatus.percentage}%</Text>
                            </View>
                          </View>

                          {/* Status Text */}
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-lg font-bold text-gray-900 mb-1`}>
                              {completionStatus.completed ? 'Perfect Day! 🎯' : completionStatus.partial ? 'Keep Going! 💪' : 'Ready to Start? 🚀'}
                            </Text>
                            <Text style={tw`text-sm text-gray-600`}>
                              {completionStatus.completed
                                ? 'All tasks completed'
                                : completionStatus.partial
                                ? `${completionStatus.completedCount} of ${completionStatus.totalCount} tasks done`
                                : 'No tasks completed yet'}
                            </Text>
                            {completionStatus.partial && (
                              <View style={tw`flex-row items-center mt-2`}>
                                <Info size={14} color="#f59e0b" />
                                <Text style={tw`text-xs text-amber-600 ml-1`}>{completionStatus.totalCount - completionStatus.completedCount} more to complete</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Modern Tips Section */}
                  {selectedHabit && calculateMissedDays(selectedHabit) > 3 && (
                    <Animated.View entering={FadeInDown.delay(300).duration(400)} style={tw`mt-4 mb-4`}>
                      <Pressable onPress={handleExpandTips} style={({ pressed }) => [tw`bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden`, pressed && tw`opacity-90`]}>
                        <LinearGradient colors={['#eef2ff', '#e0e7ff']} style={tw`px-5 py-4`}>
                          <View style={tw`flex-row items-center justify-between`}>
                            <View style={tw`flex-row items-center`}>
                              <View style={tw`w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center mr-3`}>
                                <Sparkles size={20} color="#ffffff" strokeWidth={2.5} />
                              </View>
                              <Text style={tw`text-base font-bold text-indigo-900`}>Tips to Get Back on Track</Text>
                            </View>
                            <Animated.View style={animatedChevronStyle}>
                              <ChevronRight size={20} color="#6366f1" strokeWidth={2.5} />
                            </Animated.View>
                          </View>
                        </LinearGradient>

                        {expandedSection === 'tips' && (
                          <View style={tw`px-5 pb-4 pt-2`}>
                            {tips.map((tip, index) => (
                              <Animated.View key={`tip-${index}`} entering={FadeInDown.delay(index * 50).duration(300)} style={tw`flex-row items-start bg-gray-50 rounded-xl p-3 mb-2`}>
                                <View style={[tw`w-9 h-9 rounded-xl items-center justify-center mr-3`, { backgroundColor: tip.iconColor + '15' }]}>
                                  {createElement(tip.icon, {
                                    size: 18,
                                    color: tip.iconColor,
                                    strokeWidth: 2.5,
                                  })}
                                </View>
                                <View style={tw`flex-1`}>
                                  <Text style={tw`text-sm font-semibold text-gray-900`}>{tip.title}</Text>
                                  <Text style={tw`text-xs text-gray-600 mt-0.5 leading-4`}>{tip.description}</Text>
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
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
