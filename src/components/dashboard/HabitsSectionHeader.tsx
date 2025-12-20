import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface HabitsSectionHeaderProps {
  onAddPress: () => void;
  habitCount: number;
}

export const HabitsSectionHeader: React.FC<HabitsSectionHeaderProps> = ({ onAddPress, habitCount }) => {
  const { t } = useTranslation();

  return (
    <View style={tw`flex-row items-center justify-between mt-2`}>
      <View>
        <Text style={tw`text-xl font-black text-stone-800`}>{t('dashboard.habitsSection.title')}</Text>
        <Text style={tw`text-sm text-stone-500 mt-0.5`}>
          {habitCount} {habitCount === 1 ? t('common.habits').slice(0, -1) : t('common.habits')}
        </Text>
      </View>

      <TouchableOpacity onPress={onAddPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#60a5fa', '#3b82f6', '#1d4ed8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            tw`flex-row items-center gap-1.5 rounded-xl px-3.5 py-2`,
            {
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            },
          ]}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={tw`text-sm font-bold text-white`}>{t('dashboard.habitsSection.addHabit')}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default HabitsSectionHeader;
