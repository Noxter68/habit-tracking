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
                tw`px-4 py-2 rounded-full mr-2 border`,
                isActive ? tw`bg-quartz-600 border-quartz-600` : tw`bg-quartz-50 border-quartz-200`,
                pressed && tw`bg-quartz-200 border-quartz-300`,
              ]}
            >
              <Text style={[tw`text-xs font-semibold capitalize`, isActive ? tw`text-sand-700` : tw`text-stone-300`]}>
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
