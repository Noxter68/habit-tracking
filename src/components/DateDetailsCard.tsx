// src/components/calendar/DateDetailsCard.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Target, TrendingUp, Calendar } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';

interface DateDetailsCardProps {
  selectedDate: Date;
  habit: Habit;
  onToggleDay?: (habitId: string, date: string) => void;
}

const DateDetailsCard: React.FC<DateDetailsCardProps> = ({ selectedDate, habit, onToggleDay }) => {
  const dateString = selectedDate.toISOString().split('T')[0];

  // Get completion status for selected date
  const getCompletionStatus = () => {
    const dayTasks = habit.dailyTasks[dateString];
    const totalTasks = habit.tasks.length;

    // Check if this date has any data
    if (!dayTasks) {
      // Check if it's in completedDays array (legacy support)
      const isCompleted = habit.completedDays.includes(dateString);
      return {
        completed: isCompleted,
        partial: false,
        completedCount: isCompleted ? totalTasks : 0,
        totalCount: totalTasks,
        percentage: isCompleted ? 100 : 0,
      };
    }

    const completedCount = dayTasks.completedTasks?.length || 0;
    const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    return {
      completed: dayTasks.allCompleted || (completedCount === totalTasks && totalTasks > 0),
      partial: completedCount > 0 && completedCount < totalTasks,
      completedCount,
      totalCount: totalTasks,
      percentage,
    };
  };

  const status = getCompletionStatus();

  // Determine gradient colors based on status
  const getGradientColors = () => {
    if (status.completed) return ['#34d399', '#10b981', '#059669'];
    if (status.partial) return ['#fbbf24', '#f59e0b', '#d97706'];
    return ['#e5e7eb', '#d1d5db', '#9ca3af'];
  };

  const getStatusIcon = () => {
    if (status.completed) return Award;
    if (status.partial) return TrendingUp;
    return Target;
  };

  const getStatusText = () => {
    if (status.completed) return 'Quest Complete!';
    if (status.partial) return 'In Progress';
    return 'Not Started';
  };

  const getStatusEmoji = () => {
    if (status.completed) return '⚔️';
    if (status.partial) return '🛡️';
    return '🎯';
  };

  const StatusIcon = getStatusIcon();
  const gradientColors = getGradientColors();

  // Check if date is today
  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  // Check if date is in the future
  const isFuture = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected > today;
  };

  return (
    <View style={tw`bg-sand rounded-2xl shadow-sm overflow-hidden`}>
      {/* Header with gradient */}
      <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-1`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Calendar size={14} color="#ffffff" strokeWidth={2.5} />
              <Text style={tw`text-white/90 text-xs font-medium ml-1.5 uppercase tracking-wider`}>{isToday() ? 'TODAY' : isFuture() ? 'UPCOMING' : 'PAST DATE'}</Text>
            </View>
            <Text style={tw`text-white text-lg font-bold`}>
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
              })}
            </Text>
          </View>

          <View style={tw`bg-sand/20 rounded-xl p-3`}>
            <StatusIcon size={24} color="#ffffff" strokeWidth={2} />
          </View>
        </View>
      </LinearGradient>

      {/* Progress Section */}
      <View style={tw`p-4`}>
        <View style={tw`flex-row items-center justify-between mb-3`}>
          <View>
            <Text style={tw`text-2xl font-bold text-stone-800`}>{status.percentage}%</Text>
            <Text style={tw`text-xs text-sand-500 mt-0.5`}>
              {status.completedCount} of {status.totalCount} tasks
            </Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <Text style={tw`text-2xl mr-2`}>{getStatusEmoji()}</Text>
            <View>
              <Text style={[tw`text-sm font-bold`, status.completed ? tw`text-emerald-600` : status.partial ? tw`text-stone-600` : tw`text-stone-300`]}>{getStatusText()}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={tw`h-2 bg-sand-100 rounded-full overflow-hidden`}>
          <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${status.percentage}%` }]} />
        </View>

        {/* Action Button for Today */}
        {isToday() && !isFuture() && onToggleDay && (
          <Pressable
            onPress={() => onToggleDay(habit.id, dateString)}
            style={({ pressed }) => [tw`mt-4 py-3 rounded-xl`, status.completed ? tw`bg-sage-100` : tw`bg-sage-50`, pressed && tw`opacity-80`]}
          >
            <Text style={[tw`text-center font-semibold`, status.completed ? tw`text-sage-700` : tw`text-indigo-700`]}>{status.completed ? 'Mark as Incomplete' : 'Complete All Tasks'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default DateDetailsCard;
