import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle, XCircle, Clock, Trophy, LucideIcon } from 'lucide-react-native';
import tw from 'twrnc';

interface QuickStatsProps {
  summary: {
    totalCompleted: number;
    totalMissed: number;
    totalPartial: number;
    perfectDays: number;
  };
}

interface StatItem {
  label: string;
  value: number;
  Icon: LucideIcon;
  colors: string[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ summary }) => {
  const stats: StatItem[] = [
    {
      label: 'Completed',
      value: summary.totalCompleted,
      Icon: CheckCircle,
      colors: ['#6B7280', '#4B5563'],
    },
    {
      label: 'Missed',
      value: summary.totalMissed,
      Icon: XCircle,
      colors: ['#E5E7EB', '#D1D5DB'],
    },
    {
      label: 'Partial',
      value: summary.totalPartial,
      Icon: Clock,
      colors: ['#D1D5DB', '#9CA3AF'],
    },
    {
      label: 'Perfect',
      value: summary.perfectDays,
      Icon: Trophy,
      colors: ['#9CA3AF', '#6B7280'],
    },
  ];

  return (
    <View style={tw`bg-sand rounded-3xl p-5 shadow-lg`}>
      <View style={tw`flex-row flex-wrap gap-3`}>
        {stats.map(({ label, value, Icon, colors }) => (
          <View key={label} style={tw`flex-1 min-w-[47%]`}>
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4`}>
              <View style={tw`flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`text-2xl font-bold text-white`}>{value}</Text>
                  <Text style={tw`text-xs text-white/80 mt-1`}>{label}</Text>
                </View>
                <View style={tw`bg-sand/20 p-2 rounded-xl`}>
                  <Icon size={20} color="white" />
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </View>
    </View>
  );
};

export default QuickStats;
