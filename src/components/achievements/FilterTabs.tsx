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
        {filters.map((filterType) => (
          <Pressable
            key={filterType}
            onPress={() => setFilter(filterType)}
            style={({ pressed }) => [tw`px-4 py-2 rounded-full mr-2`, filter === filterType ? tw`bg-achievement-amber-700` : tw`bg-achievement-amber-100`, pressed && tw`opacity-80`]}
          >
            <Text style={[tw`text-xs font-semibold capitalize`, filter === filterType ? tw`text-white` : tw`text-achievement-amber-800`]}>
              {filterType}
              {filterType !== 'all' && ` (${filterType === 'unlocked' ? unlockedCount : totalCount - unlockedCount})`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};
