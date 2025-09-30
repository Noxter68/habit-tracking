// src/components/calendar/DynamicCalendarHeader.tsx
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { Habit } from '../../types';
import { StatsIcons } from '../icons/StatsIcons';

interface DynamicCalendarHeaderProps {
  selectedHabit: Habit | null;
  selectedDate: Date;
  getLocalDateString: (date: Date) => string;
}

interface DateStats {
  percentage: number;
  completed: boolean;
  partial: boolean;
  tasksCompleted: number;
  totalTasks: number;
}

// Separate component for stat item to prevent re-renders
const StatItem = React.memo(({ icon, iconColor, label, value }: { icon: React.ReactElement; iconColor: string; label: string; value: number }) => (
  <View style={tw`flex-1 bg-white/10 rounded-lg px-3 py-2`}>
    <View style={tw`flex-row items-center justify-between`}>
      <View style={tw`flex-row items-center`}>
        {icon}
        <Text style={tw`text-white/70 text-sm ml-1.5`}>{label}</Text>
      </View>
      <Text style={tw`text-white text-base font-bold`}>{value}</Text>
    </View>
  </View>
));

StatItem.displayName = 'StatItem';

// Progress indicator component
const ProgressIndicator = React.memo(({ percentage }: { percentage: number }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${percentage}%`,
    transform: [
      {
        translateX: withSpring(0, {
          damping: 15,
          stiffness: 100,
        }),
      },
    ],
  }));

  return (
    <View style={tw`h-1.5 bg-white/20 rounded-full overflow-hidden relative`}>
      <Animated.View
        style={[
          tw`h-full rounded-full`,
          {
            backgroundColor: percentage === 100 ? '#10b981' : '#fbbf24',
          },
          animatedStyle,
        ]}
      >
        <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
      </Animated.View>

      <View
        style={[
          tw`absolute top-1/2 w-2 h-2 bg-white rounded-full -mt-1`,
          {
            left: `${Math.max(0, Math.min(98, percentage - 2))}%`,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
          },
        ]}
      />
    </View>
  );
});

ProgressIndicator.displayName = 'ProgressIndicator';

const DynamicCalendarHeader: React.FC<DynamicCalendarHeaderProps> = ({ selectedHabit, selectedDate, getLocalDateString }) => {
  // Memoize date calculations
  const dateInfo = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);

    const isToday = checkDate.getTime() === today.getTime();
    const isPastDay = checkDate < today;

    let beforeCreation = false;
    if (selectedHabit) {
      const creationDate = new Date(selectedHabit.createdAt);
      creationDate.setHours(0, 0, 0, 0);
      beforeCreation = checkDate < creationDate;
    }

    return { isToday, isPastDay, beforeCreation };
  }, [selectedDate, selectedHabit?.createdAt]);

  // Calculate stats for selected date
  const dateStats = useMemo((): DateStats => {
    if (!selectedHabit) {
      return { percentage: 0, completed: false, partial: false, tasksCompleted: 0, totalTasks: 0 };
    }

    const dateString = getLocalDateString(selectedDate);
    const dayTasks = selectedHabit.dailyTasks[dateString];
    const totalTasks = selectedHabit.tasks.length;

    if (!dayTasks) {
      return { percentage: 0, completed: false, partial: false, tasksCompleted: 0, totalTasks };
    }

    const tasksCompleted = dayTasks.completedTasks.length;
    const percentage = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    return {
      percentage,
      completed: dayTasks.allCompleted,
      partial: percentage > 0 && percentage < 100,
      tasksCompleted,
      totalTasks,
    };
  }, [selectedHabit, selectedDate, getLocalDateString]);

  // Calculate monthly stats
  const monthlyAchievements = useMemo(() => {
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
  }, [selectedHabit, selectedDate]);

  // Format date display
  const dateDisplay = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [selectedDate]);

  // Empty habit state
  if (!selectedHabit) {
    return (
      <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-4 py-3`}>
        <View style={tw`flex-row items-center justify-between`}>
          <Text style={tw`text-base font-bold text-white`}>Quest Calendar</Text>
          <Text style={tw`text-xs text-white/70`}>{dateDisplay}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-4 pt-3.5 pb-3.5`}>
      {/* Title Bar with Progress */}
      <View style={tw`flex-row items-center justify-between mb-2.5`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-bold text-white`}>{selectedHabit.name}</Text>
          <Text style={tw`text-sm text-white/60`}>
            {dateDisplay}
            {dateInfo.isToday && ' • Today'}
          </Text>
        </View>

        {/* Progress Circle */}
        <Animated.View entering={FadeInUp.duration(200).springify()} style={tw`relative`}>
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
        <StatItem icon={<StatsIcons.Flame size={14} color="#fbbf24" />} iconColor="#fbbf24" label="Streak" value={selectedHabit.currentStreak} />
        <StatItem icon={<StatsIcons.Trophy size={14} color="#34d399" />} iconColor="#34d399" label="Best" value={selectedHabit.bestStreak} />
        <StatItem icon={<StatsIcons.Calendar size={14} color="#a78bfa" />} iconColor="#a78bfa" label="Month" value={monthlyAchievements} />
      </Animated.View>

      {/* Progress Bar Section */}
      {dateStats.percentage > 0 && (
        <Animated.View entering={FadeIn.duration(300)} style={tw`mt-2.5`}>
          <ProgressIndicator percentage={dateStats.percentage} />

          {/* Status Messages */}
          {dateStats.completed && (
            <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`flex-row items-center justify-center mt-2 bg-green-500/15 rounded-lg py-1.5 px-3`}>
              <StatsIcons.Star size={14} color="#ffffff" />
              <Text style={tw`text-white/90 text-sm ml-2 font-semibold tracking-wide`}>Quest Complete!</Text>
              <View style={tw`ml-2 flex-row`}>
                {[0, 1, 2].map((i) => (
                  <Animated.View key={`star-${i}`} entering={FadeIn.delay(400 + i * 100).duration(300)} style={tw`w-1 h-1 bg--quartz-400 rounded-full mx-0.5`} />
                ))}
              </View>
            </Animated.View>
          )}

          {dateStats.partial && (
            <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`flex-row items-center justify-center mt-2 bg--quartz-500/15 rounded-lg py-1.5 px-3`}>
              <StatsIcons.Target size={14} color="#ffffff" />
              <Text style={tw`text-white/90 text-sm ml-2 font-semibold tracking-wide`}>
                Keep Going! {dateStats.tasksCompleted} of {dateStats.totalTasks} done
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* Missed Day Message */}
      {dateStats.percentage === 0 && !dateInfo.beforeCreation && dateInfo.isPastDay && (
        <Animated.View entering={FadeInUp.delay(200).duration(400).springify()} style={tw`mt-2.5`}>
          <View style={tw`bg-red-500/10 rounded-lg py-1.5 px-3`}>
            <View style={tw`flex-row items-center justify-center`}>
              <StatsIcons.Star size={14} color="#ffffff" />
              <Text style={tw`text-white/80 text-sm ml-2 font-medium tracking-wide`}>Tomorrow is a new day!</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </LinearGradient>
  );
};

export default React.memo(DynamicCalendarHeader);
