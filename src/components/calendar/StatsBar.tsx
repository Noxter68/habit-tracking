import React from 'react';
import { View, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { Habit } from '@/types';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { tierThemes } from '@/utils/tierTheme';

interface StatsBarProps {
  habit: Habit;
}

const StatsBar: React.FC<StatsBarProps> = ({ habit }) => {
  const { tier, progress } = HabitProgressionService.calculateTierFromStreak(habit.currentStreak);
  const theme = tierThemes[tier.name];

  return (
    <View style={tw`bg-sand mx-5 mt-4 rounded-2xl p-4 shadow-sm`}>
      <View style={tw`flex-row justify-around`}>
        <StatItem label="Current" value={habit.currentStreak} />
        <Divider />
        <StatItem label="Best" value={habit.bestStreak} />
        <Divider />
        <StatItem label="Total" value={habit.completedDays.length} />
        <Divider />
        <StatItem label="Tier" value={`${Math.round(progress)}%`} valueColor={theme.accent} />
      </View>
    </View>
  );
};

const StatItem: React.FC<{ label: string; value: number | string; valueColor?: string }> = ({ label, value, valueColor }) => (
  <View style={tw`items-center`}>
    <Text style={[tw`text-2xl font-bold`, valueColor ? { color: valueColor } : tw`text-stone-800`]}>{value}</Text>
    <Text style={tw`text-xs text-sand-500 mt-0.5`}>{label}</Text>
  </View>
);

const Divider = () => <View style={tw`w-px bg-stone-200`} />;

export default StatsBar;
