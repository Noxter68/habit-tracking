// src/components/achievements/FilterTabs.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import tw from '../../lib/tailwind';
import { FilterType } from '../../types/achievement.types';
import { useTranslation } from 'react-i18next';

interface FilterTabsProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  unlockedCount: number;
  totalCount: number;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter, unlockedCount, totalCount }) => {
  const { t } = useTranslation();
  const filters: FilterType[] = ['all', 'unlocked', 'locked'];

  const getFilterLabel = (filterType: FilterType): string => {
    return t(`achievements.filters.${filterType}`);
  };

  return (
    <View style={tw`px-4 mb-4`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-4 px-4`}>
        {filters.map((filterType) => {
          const isActive = filter === filterType;
          const count = filterType === 'unlocked' ? unlockedCount : filterType === 'locked' ? totalCount - unlockedCount : null;

          return (
            <Pressable
              key={filterType}
              onPress={() => setFilter(filterType)}
              style={({ pressed }) => [
                tw`px-3.5 py-2 rounded-xl mr-2 border`,
                isActive ? tw`bg-zinc-700 border-zinc-700` : tw`bg-white/80 border-zinc-200`,
                pressed && !isActive && tw`bg-zinc-100 border-zinc-300`,
              ]}
            >
              <Text style={[tw`text-xs font-bold`, isActive ? tw`text-white` : tw`text-zinc-600`]}>
                {getFilterLabel(filterType)}
                {count !== null && ` (${count})`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
