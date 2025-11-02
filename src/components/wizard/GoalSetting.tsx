// src/components/wizard/GoalSetting.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Target, Calendar, Sparkles } from 'lucide-react-native';
import tw from '../../lib/tailwind';

interface GoalSettingProps {
  hasEndGoal: boolean;
  endGoalDays?: number;
  onChange: (hasEndGoal: boolean, days?: number) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ hasEndGoal, endGoalDays, onChange }) => {
  const [inputValue, setInputValue] = useState(endGoalDays?.toString() || '');

  const presetGoals = [
    { days: 21, label: '21 days', subtitle: 'Quick start' },
    { days: 30, label: '30 days', subtitle: 'One month' },
    { days: 66, label: '66 days', subtitle: 'Habit formation' },
    { days: 90, label: '90 days', subtitle: 'Full quarter' },
  ];

  const handlePresetSelect = (days: number) => {
    setInputValue(days.toString());
    onChange(true, days);
  };

  const handleCustomDays = (text: string) => {
    setInputValue(text);
    const days = parseInt(text) || undefined;
    if (days && days > 0) {
      onChange(true, days);
    }
  };

  return (
    <View style={tw`flex-1 justify-center`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-10`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>Set Your Goal</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>How long do you want to track this habit?</Text>
        </View>

        {/* Default 61-Day Option */}
        <Pressable
          onPress={() => onChange(false)}
          style={({ pressed }) => [
            tw`rounded-2xl p-5 flex-row items-center border-2 mb-4 ${!hasEndGoal ? 'border-emerald-400/60' : 'border-white/10'}`,
            { backgroundColor: !hasEndGoal ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
            pressed && tw`opacity-80`,
          ]}
        >
          <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: !hasEndGoal ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)' }]}>
            <Target size={24} color="#ffffff" strokeWidth={2} />
          </View>

          <View style={tw`flex-1`}>
            <Text style={tw`text-base font-semibold text-white mb-0.5`}>61-Day Challenge</Text>
            <Text style={tw`text-sm text-white/70 leading-5`}>Science-backed habit formation</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Sparkles size={12} color="rgba(255, 255, 255, 0.5)" strokeWidth={2} style={tw`mr-1.5`} />
              <Text style={tw`text-xs text-white/50`}>Recommended</Text>
            </View>
          </View>

          {!hasEndGoal && (
            <View style={tw`w-6 h-6 rounded-full bg-emerald-500 items-center justify-center`}>
              <View style={tw`w-3 h-3 rounded-full bg-white`} />
            </View>
          )}
        </Pressable>

        {/* Divider */}
        <View style={tw`flex-row items-center my-6`}>
          <View style={tw`flex-1 h-px bg-white/20`} />
          <Text style={tw`px-4 text-xs text-white/50 font-medium`}>OR CHOOSE CUSTOM</Text>
          <View style={tw`flex-1 h-px bg-white/20`} />
        </View>

        {/* Preset Goals */}
        <View style={tw`gap-2 mb-6`}>
          {presetGoals.map((goal, index) => {
            const isSelected = hasEndGoal && endGoalDays === goal.days;

            return (
              <Animated.View key={goal.days} entering={FadeInDown.delay(index * 30).duration(300)}>
                <Pressable
                  onPress={() => handlePresetSelect(goal.days)}
                  style={({ pressed }) => [
                    tw`rounded-2xl p-4 flex-row items-center justify-between border-2 ${isSelected ? 'border-amber-400/60' : 'border-white/10'}`,
                    { backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
                    pressed && tw`opacity-80`,
                  ]}
                >
                  <View style={tw`flex-row items-center flex-1`}>
                    <Calendar size={20} color="#ffffff" strokeWidth={2} style={tw`mr-3`} />
                    <View>
                      <Text style={tw`text-base font-semibold text-white`}>{goal.label}</Text>
                      <Text style={tw`text-xs text-white/60`}>{goal.subtitle}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View style={tw`w-6 h-6 rounded-full bg-amber-500 items-center justify-center`}>
                      <View style={tw`w-3 h-3 rounded-full bg-white`} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Custom Input */}
        <View>
          <Text style={tw`text-sm font-medium text-white/90 mb-3`}>Or set custom days:</Text>
          <TextInput
            value={inputValue}
            onChangeText={handleCustomDays}
            placeholder="e.g., 100"
            placeholderTextColor="rgba(255, 255, 255, 0.3)"
            keyboardType="numeric"
            style={tw`bg-white/15 border-2 border-white/20 rounded-2xl px-5 py-4 text-white text-base`}
            maxLength={4}
          />
        </View>

        {/* Tip */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>Research shows 66 days is the average time{'\n'}to form a new automatic habit</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default GoalSetting;
