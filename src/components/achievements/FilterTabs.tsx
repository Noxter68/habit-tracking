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
              style={({ pressed }) => [tw`px-4 py-2 rounded-full mr-2 border`, isActive ? tw`bg-sage-600 border-sage-600` : tw`bg-sage-50 border-sage-200`, pressed && tw`bg-sage-200 border-sage-300`]}
            >
              <Text style={[tw`text-xs font-semibold capitalize`, isActive ? tw`text-gray-700` : tw`text-gray-400`]}>
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
