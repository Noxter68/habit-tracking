import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarDays, CalendarRange } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface HabitCategoryBadgeProps {
  type: 'daily' | 'weekly';
  count: number;
}

export const HabitCategoryBadge: React.FC<HabitCategoryBadgeProps> = ({ type, count }) => {
  const { t } = useTranslation();

  const isDaily = type === 'daily';
  const Icon = isDaily ? CalendarDays : CalendarRange;
  const label = isDaily ? t('dashboard.habitsSection.daily') : t('dashboard.habitsSection.weekly');

  // Daily: blue tones, Weekly: purple tones
  const gradientColors: [string, string] = isDaily
    ? ['rgba(59, 130, 246, 0.12)', 'rgba(37, 99, 235, 0.08)']
    : ['rgba(139, 92, 246, 0.12)', 'rgba(124, 58, 237, 0.08)'];

  const borderColor = isDaily ? 'rgba(59, 130, 246, 0.25)' : 'rgba(139, 92, 246, 0.25)';
  const iconColor = isDaily ? '#3b82f6' : '#8b5cf6';
  const textColor = isDaily ? 'text-blue-700' : 'text-purple-700';
  const countBgColor = isDaily ? 'bg-blue-500' : 'bg-purple-500';

  return (
    <View style={tw`mb-3 mt-3`}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          tw`flex-row items-center gap-2.5 px-4 py-3 rounded-xl`,
          { borderWidth: 1, borderColor },
        ]}
      >
        <Icon size={16} color={iconColor} strokeWidth={2.5} />
        <Text style={tw`text-sm font-bold ${textColor}`}>{label}</Text>
        <View style={[tw`${countBgColor} rounded-full px-2 py-0.5 ml-auto`]}>
          <Text style={tw`text-xs font-bold text-white`}>{count}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

export default HabitCategoryBadge;
