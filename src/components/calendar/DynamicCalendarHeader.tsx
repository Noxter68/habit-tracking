// src/components/calendar/DynamicCalendarHeader.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { MiniFlameIcon, MiniTrophyIcon, MiniCalendarIcon, MiniCheckIcon, QuestCompleteIcon, KeepGoingIcon, TomorrowStarIcon } from '../icons/MiniIcons';
import tw from '../../lib/tailwind';
import { Habit } from '../../types';
import { StatsIcons } from '../icons/StatsIcons';

interface DynamicCalendarHeaderProps {
  selectedHabit: Habit | null;
  selectedDate: Date;
  getLocalDateString: (date: Date) => string;
}

const DynamicCalendarHeader: React.FC<DynamicCalendarHeaderProps> = ({ selectedHabit, selectedDate, getLocalDateString }) => {
  // Helper functions for date checks
  const isBeforeHabitCreation = (date: Date): boolean => {
    if (!selectedHabit) return false;
    const creationDate = new Date(selectedHabit.createdAt);
    creationDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < creationDate;
  };

  const isPastDay = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Calculate stats for selected date
  const getDateStats = () => {
    if (!selectedHabit) return { percentage: 0, completed: false, partial: false, tasksCompleted: 0, totalTasks: 0 };

    const dateString = getLocalDateString(selectedDate);
    const dayTasks = selectedHabit.dailyTasks[dateString];
    const totalTasks = selectedHabit.tasks.length;

    if (!dayTasks) return { percentage: 0, completed: false, partial: false, tasksCompleted: 0, totalTasks };

    const tasksCompleted = dayTasks.completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      percentage,
      completed: dayTasks.allCompleted,
      partial: percentage > 0 && percentage < 100,
      tasksCompleted,
      totalTasks,
    };
  };

  const getMonthlyStats = () => {
    if (!selectedHabit) return 0;

    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    let monthlyCompleted = 0;

    Object.entries(selectedHabit.dailyTasks).forEach(([dateStr, tasks]) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const taskDate = new Date(year, month - 1, day);

      if (taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear && tasks.allCompleted) {
        monthlyCompleted++;
      }
    });

    return monthlyCompleted;
  };

  const dateStats = getDateStats();
  const monthlyAchievements = getMonthlyStats();
  const isToday = getLocalDateString(selectedDate) === getLocalDateString(new Date());
  const beforeCreation = isBeforeHabitCreation(selectedDate);
  const pastDay = isPastDay(selectedDate);
  const progressKey = `progress-${getLocalDateString(selectedDate)}-${dateStats.percentage}`;

  if (!selectedHabit) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-4 py-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-base font-bold text-white`}>Quest Calendar</Text>
          <Text style={tw`text-xs text-white/70`}>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-4 pt-3.5 pb-3.5`}>
      {/* Compact Title Bar with Dynamic Date Progress */}
      <View style={tw`flex-row items-center justify-between mb-2.5`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-bold text-white`}>{selectedHabit.name}</Text>
          <Text style={tw`text-sm text-white/60`}>
            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {isToday && ' • Today'}
          </Text>
        </View>

        {/* Dynamic Progress Circle */}
        <Animated.View key={progressKey} entering={FadeInUp.duration(200).springify()} style={tw`relative`}>
          <View style={tw`w-16 h-16 rounded-full bg-white/10 items-center justify-center`}>
            <Text style={tw`text-white font-bold text-lg`}>{dateStats.percentage}%</Text>
            {dateStats.tasksCompleted > 0 && (
              <Text style={tw`text-white/60 text-xs`}>
                {dateStats.tasksCompleted}/{dateStats.totalTasks}
              </Text>
            )}
          </View>
          {dateStats.completed && (
            <View style={tw`absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5`}>
              <StatsIcons.CheckCircle size={10} color="#ffffff" />
            </View>
          )}
        </Animated.View>
      </View>

      {/* Stats Row */}
      <Animated.View entering={FadeIn.duration(200)} style={tw`flex-row gap-2`}>
        <View style={tw`flex-1 bg-white/10 rounded-lg px-3 py-2`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <StatsIcons.Flame size={14} color="#fbbf24" />
              <Text style={tw`text-white/70 text-sm ml-1.5`}>Streak</Text>
            </View>
            <Text style={tw`text-white text-base font-bold`}>{selectedHabit.currentStreak}</Text>
          </View>
        </View>

        <View style={tw`flex-1 bg-white/10 rounded-lg px-3 py-2`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <StatsIcons.Trophy size={14} color="#34d399" />
              <Text style={tw`text-white/70 text-sm ml-1.5`}>Best</Text>
            </View>
            <Text style={tw`text-white text-base font-bold`}>{selectedHabit.bestStreak}</Text>
          </View>
        </View>

        <View style={tw`flex-1 bg-white/10 rounded-lg px-3 py-2`}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <StatsIcons.Calendar size={14} color="#a78bfa" />
              <Text style={tw`text-white/70 text-sm ml-1.5`}>Month</Text>
            </View>
            <Text style={tw`text-white text-base font-bold`}>{monthlyAchievements}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Progress Bar and Motivational Messages */}
      {dateStats.percentage > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={tw`mt-2.5`}>
          <View style={tw`h-1.5 bg-white/20 rounded-full overflow-hidden relative`}>
            <Animated.View
              style={[
                tw`h-full rounded-full`,
                {
                  width: `${dateStats.percentage}%`,
                  backgroundColor: dateStats.completed ? '#10b981' : '#fbbf24',
                },
                useAnimatedStyle(() => ({
                  transform: [
                    {
                      translateX: withSpring(0, {
                        damping: 15,
                        stiffness: 100,
                      }),
                    },
                  ],
                })),
              ]}
            >
              <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
            </Animated.View>

            <Animated.View
              style={[
                tw`absolute top-1/2 w-2 h-2 bg-white rounded-full -mt-1`,
                {
                  left: `${Math.max(0, Math.min(98, dateStats.percentage - 2))}%`,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                },
              ]}
            />
          </View>

          {/* Quest Complete Message */}
          {dateStats.completed && (
            <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`flex-row items-center justify-center mt-2 bg-green-500/15 rounded-lg py-1.5 px-3`}>
              <StatsIcons.Star size={14} />
              <Text style={tw`text-white/90 text-sm ml-2 font-semibold tracking-wide`}>Quest Complete!</Text>
              <View style={tw`ml-2 flex-row`}>
                {[...Array(3)].map((_, i) => (
                  <Animated.View key={i} entering={FadeIn.delay(400 + i * 100).duration(300)} style={tw`w-1 h-1 bg-yellow-400 rounded-full mx-0.5`} />
                ))}
              </View>
            </Animated.View>
          )}

          {/* Partial Progress Message */}
          {dateStats.partial && (
            <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`flex-row items-center justify-center mt-2 bg-yellow-500/15 rounded-lg py-1.5 px-3`}>
              <KeepGoingIcon size={14} />
              <Text style={tw`text-white/90 text-sm ml-2 font-semibold tracking-wide`}>
                Keep Going! {dateStats.tasksCompleted} of {dateStats.totalTasks} done
              </Text>
              <View style={tw`ml-2`}>
                <Animated.View entering={FadeIn.delay(400).duration(600)} style={tw`w-2 h-2 bg-yellow-400/60 rounded-full`} />
              </View>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* Missed Day Message */}
      {dateStats.percentage === 0 && !beforeCreation && pastDay && (
        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`mt-2.5`}>
          <View style={tw`bg-red-500/10 rounded-lg py-1.5 px-3`}>
            <View style={tw`flex-row items-center justify-center`}>
              <TomorrowStarIcon size={14} />
              <Text style={tw`text-white/80 text-sm ml-2 font-medium tracking-wide`}>Tomorrow is a new day!</Text>
              <View style={tw`ml-2 flex-row`}>
                {[...Array(2)].map((_, i) => (
                  <Animated.View key={i} entering={FadeIn.delay(400 + i * 150).duration(400)} style={tw`w-0.5 h-3 bg-red-400/40 rounded-full mx-0.5`} />
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );
};

export default DynamicCalendarHeader;
