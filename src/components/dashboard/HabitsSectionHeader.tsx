import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';

interface HabitsSectionHeaderProps {
  habitCount: number;
}

export const HabitsSectionHeader: React.FC<HabitsSectionHeaderProps> = ({
  habitCount,
}) => {
  const { t } = useTranslation();

  return (
    <View style={tw`mt-2`}>
      {/* Title */}
      <Text style={tw`text-xl font-black text-stone-800`}>{t('dashboard.habitsSection.title')}</Text>
      <Text style={tw`text-sm text-stone-500 mt-0.5`}>
        {habitCount} {habitCount === 1 ? t('common.habits').slice(0, -1) : t('common.habits')}
      </Text>
    </View>
  );
};

export default HabitsSectionHeader;
