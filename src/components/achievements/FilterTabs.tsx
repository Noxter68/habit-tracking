/**
 * FilterTabs.tsx
 *
 * Filter tabs with Duolingo 3D depth style.
 */

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { FilterType } from '../../types/achievement.types';
import { useTranslation } from 'react-i18next';

interface FilterTabsProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  unlockedCount: number;
  totalCount: number;
}

const FilterTab: React.FC<{
  label: string;
  count: number | null;
  isActive: boolean;
  onPress: () => void;
}> = ({ label, count, isActive, onPress }) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 2 }],
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressed.value * 0.5,
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 80 });
      }}
      style={{ marginRight: 10, position: 'relative' }}
    >
      {/* Shadow layer for 3D depth */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 2,
            left: 0,
            right: 0,
            bottom: -2,
            backgroundColor: isActive ? '#3f3f46' : '#d4d4d8',
            borderRadius: 14,
          },
          shadowStyle,
        ]}
      />

      {/* Main tab */}
      <Animated.View
        style={[
          {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 14,
            backgroundColor: isActive ? '#52525b' : '#FFFFFF',
            borderWidth: 2,
            borderColor: isActive ? '#52525b' : '#e4e4e7',
          },
          animatedStyle,
        ]}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: isActive ? '#FFFFFF' : '#52525b',
          }}
        >
          {label}
          {count !== null && ` (${count})`}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

export const FilterTabs: React.FC<FilterTabsProps> = ({ filter, setFilter, unlockedCount, totalCount }) => {
  const { t } = useTranslation();
  const filters: FilterType[] = ['all', 'unlocked', 'locked'];

  const getFilterLabel = (filterType: FilterType): string => {
    return t(`achievements.filters.${filterType}`);
  };

  const getCount = (filterType: FilterType): number | null => {
    if (filterType === 'unlocked') return unlockedCount;
    if (filterType === 'locked') return totalCount - unlockedCount;
    return null;
  };

  return (
    <View style={tw`px-4 mb-5`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={tw`-mx-4 px-4`}
        contentContainerStyle={{ paddingBottom: 4, paddingRight: 16 }}
      >
        {filters.map((filterType) => (
          <FilterTab
            key={filterType}
            label={getFilterLabel(filterType)}
            count={getCount(filterType)}
            isActive={filter === filterType}
            onPress={() => setFilter(filterType)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
