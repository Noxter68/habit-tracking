// src/components/achievements/FilterTabs.tsx
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import tw from '../../lib/tailwind';
import { FilterType } from '../../types/achievement.types';

interface FilterTabsProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  unlockedCount: number;
  totalCount: number;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter, unlockedCount, totalCount }) => {
  const filters: FilterType[] = ['all', 'unlocked', 'locked'];

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
                tw`px-4 py-2.5 rounded-full mr-2 border-2`,
                isActive ? tw`bg-stone-700 border-stone-700` : tw`bg-white border-stone-300`,
                pressed && !isActive && tw`bg-stone-100 border-stone-400`,
              ]}
            >
              <Text style={[tw`text-sm font-bold capitalize`, isActive ? tw`text-white` : tw`text-stone-600`]}>
                {filterType}
                {count !== null && ` (${count})`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
