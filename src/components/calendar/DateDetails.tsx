import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';
import { getLocalDateString, isToday } from '@/utils/dateHelpers';

interface DateDetailsProps {
  habit: Habit;
  selectedDate: Date;
}

const DateDetails: React.FC<DateDetailsProps> = ({ habit, selectedDate }) => {
  const { tier } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  const dateString = getLocalDateString(selectedDate);
  const dayTasks = habit.dailyTasks[dateString];
  const totalTasks = habit.tasks?.length || 0;
  const completedTasks = dayTasks?.completedTasks?.length || 0;
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isCompleted = dayTasks?.allCompleted || false;
  const isPartial = completedTasks > 0 && !isCompleted;
  const beforeCreation = selectedDate < new Date(habit.createdAt);
  const isPast = selectedDate < new Date() && !isToday(selectedDate);

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={tw`bg-sand rounded-2xl p-4 mt-4 shadow-sm`}>
      <Text style={tw`text-sm font-semibold text-stone-800 mb-3`}>
        {selectedDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>

      {beforeCreation ? (
        <StatusIndicator color="#d1d5db" label="Habit not created yet" textStyle={tw`text-stone-400`} />
      ) : isCompleted ? (
        <>
          <StatusIndicator color={theme.accent} label="Completed" />
          {totalTasks > 0 && <Text style={tw`text-xs text-sand-500 mt-1 ml-4`}>All tasks finished</Text>}
        </>
      ) : isPartial ? (
        <>
          <StatusIndicator color={theme.accent + '60'} label="Partially Complete" />
          <Text style={tw`text-xs text-sand-500 mt-1 ml-4`}>{percentage}% of tasks completed</Text>
        </>
      ) : isPast ? (
        <StatusIndicator color="#f87171" label="Missed" textStyle={tw`text-red-600`} />
      ) : (
        <Text style={tw`text-sm text-sand-500`}>Not completed</Text>
      )}
    </Animated.View>
  );
};

const StatusIndicator: React.FC<{
  color: string;
  label: string;
  textStyle?: any;
}> = ({ color, label, textStyle }) => (
  <View style={tw`flex-row items-center`}>
    <View style={[tw`w-2 h-2 rounded-full mr-2`, { backgroundColor: color }]} />
    <Text style={[tw`text-sm font-medium`, textStyle || { color }]}>{label}</Text>
  </View>
);

export default DateDetails;
