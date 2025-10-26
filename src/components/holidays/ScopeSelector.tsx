// src/components/holiday/ScopeSelector.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Calendar, CheckSquare, ListChecks } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import tw from '@/lib/tailwind';

export type HolidayScope = 'all' | 'habits' | 'tasks';

interface ScopeSelectorProps {
  selectedScope: HolidayScope;
  onScopeChange: (scope: HolidayScope) => void;
}

export const ScopeSelector: React.FC<ScopeSelectorProps> = ({ selectedScope, onScopeChange }) => {
  const scopes: Array<{
    value: HolidayScope;
    label: string;
    icon: typeof Calendar;
    description: string;
  }> = [
    {
      value: 'all',
      label: 'All Habits',
      icon: Calendar,
      description: 'Pause everything',
    },
    {
      value: 'habits',
      label: 'Specific Habits',
      icon: CheckSquare,
      description: 'Choose habits',
    },
    {
      value: 'tasks',
      label: 'Specific Tasks',
      icon: ListChecks,
      description: 'Choose tasks',
    },
  ];

  const handlePress = (scope: HolidayScope) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onScopeChange(scope);
  };

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-4`}>
      <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Freeze Scope</Text>

      {/* Horizontal Layout */}
      <View style={tw`flex-row gap-3`}>
        {scopes.map((scope, index) => {
          const isSelected = selectedScope === scope.value;
          const Icon = scope.icon;

          return (
            <Pressable
              key={scope.value}
              onPress={() => handlePress(scope.value)}
              style={({ pressed }) => [
                tw`flex-1 rounded-2xl p-4 border-2`,
                {
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'white',
                  borderColor: isSelected ? '#6366f1' : '#e5e7eb',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={tw`items-center`}>
                {/* Icon */}
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mb-2`,
                    {
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : '#f3f4f6',
                    },
                  ]}
                >
                  <Icon size={20} color={isSelected ? '#6366f1' : '#9ca3af'} strokeWidth={2.5} />
                </View>

                {/* Label */}
                <Text style={[tw`text-xs font-bold text-center mb-1`, { color: isSelected ? '#4f46e5' : '#6b7280' }]} numberOfLines={2}>
                  {scope.label}
                </Text>

                {/* Description */}
                <Text style={[tw`text-xs text-center`, { color: isSelected ? '#6366f1' : '#9ca3af' }]} numberOfLines={1}>
                  {scope.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

export default ScopeSelector;
