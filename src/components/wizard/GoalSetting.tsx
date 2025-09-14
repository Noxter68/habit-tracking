import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Zap, Lightbulb } from 'lucide-react-native';
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
    <View style={tw`px-5`}>
      {/* Header */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>Set Your Goal</Text>
        <Text style={tw`text-gray-600 leading-5`}>Choose how long you want to track this habit</Text>
      </View>

      {/* Goal Type Selection */}
      <View style={tw`gap-3 mb-6`}>
        {/* Default 61-Day Challenge */}
        <Pressable onPress={() => onChange(false)} style={({ pressed }) => [tw`relative overflow-hidden rounded-2xl`, pressed && tw`opacity-90`]}>
          <LinearGradient colors={!hasEndGoal ? ['#6366f1', '#4f46e5'] : ['#f9fafb', '#ffffff']} style={tw`p-4 border ${!hasEndGoal ? 'border-indigo-500' : 'border-gray-200'}`}>
            <View style={tw`flex-row items-start justify-between`}>
              <View style={tw`flex-1 mr-3`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, !hasEndGoal ? tw`bg-white/20` : tw`bg-gray-100`]}>
                    <Target size={20} color={!hasEndGoal ? '#ffffff' : '#6b7280'} strokeWidth={2.5} />
                  </View>
                  <Text style={[tw`text-lg font-semibold`, !hasEndGoal ? tw`text-white` : tw`text-gray-900`]}>61-Day Challenge</Text>
                </View>
                <Text style={[tw`text-sm leading-5`, !hasEndGoal ? tw`text-white/90` : tw`text-gray-600`]}>Build a lasting habit with our science-backed timeline</Text>

                {/* Progress Indicator */}
                <View style={tw`mt-3 flex-row items-center`}>
                  <View style={tw`flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden mr-2`}>
                    <View style={tw`flex-row h-full`}>
                      <View style={[tw`h-full`, { width: '33%', backgroundColor: !hasEndGoal ? '#fbbf24' : '#e5e7eb' }]} />
                      <View style={[tw`h-full`, { width: '33%', backgroundColor: !hasEndGoal ? '#fb923c' : '#e5e7eb' }]} />
                      <View style={[tw`h-full`, { width: '34%', backgroundColor: !hasEndGoal ? '#f87171' : '#e5e7eb' }]} />
                    </View>
                  </View>
                  <Text style={[tw`text-xs font-medium`, !hasEndGoal ? tw`text-white` : tw`text-gray-500`]}>Recommended</Text>
                </View>
              </View>

              {/* Radio Button */}
              <View style={[tw`w-5 h-5 rounded-full border-2`, !hasEndGoal ? tw`border-white bg-white` : tw`border-gray-300`]}>
                {!hasEndGoal && <View style={tw`w-2 h-2 bg-indigo-600 rounded-full m-auto`} />}
              </View>
            </View>

            {!hasEndGoal && (
              <View style={tw`mt-3 pt-3 border-t border-white/20`}>
                <Text style={tw`text-xs text-white/80 leading-4`}>Research shows it takes 18-254 days to form a habit, with 66 days being the average. We use 61 days as an optimal balance.</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>

        {/* Custom Goal */}
        <Pressable
          onPress={() => onChange(true, endGoalDays || 30)}
          style={({ pressed }) => [tw`bg-white rounded-2xl p-4 border`, hasEndGoal ? tw`border-indigo-200 bg-indigo-50/30` : tw`border-gray-200`, pressed && tw`opacity-90`]}
        >
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, hasEndGoal ? tw`bg-indigo-100` : tw`bg-gray-100`]}>
                <Zap size={20} color={hasEndGoal ? '#6366f1' : '#6b7280'} strokeWidth={2.5} />
              </View>
              <Text style={tw`text-lg font-semibold text-gray-900`}>Custom Duration</Text>
            </View>

            {/* Radio Button */}
            <View style={[tw`w-5 h-5 rounded-full border-2`, hasEndGoal ? tw`border-indigo-600 bg-white` : tw`border-gray-300`]}>
              {hasEndGoal && <View style={tw`w-2 h-2 bg-indigo-600 rounded-full m-auto`} />}
            </View>
          </View>

          <Text style={tw`text-sm text-gray-600 mb-3`}>Set your own timeline that works for you</Text>

          {hasEndGoal && (
            <Animated.View>
              {/* Preset Options */}
              <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                {presetGoals.map((goal) => (
                  <Pressable
                    key={goal.days}
                    onPress={() => handlePresetSelect(goal.days)}
                    style={({ pressed }) => [
                      tw`px-3 py-2 rounded-xl border`,
                      endGoalDays === goal.days ? tw`bg-indigo-100 border-indigo-300` : tw`bg-white border-gray-200`,
                      pressed && tw`opacity-80`,
                    ]}
                  >
                    <Text style={[tw`text-sm font-medium`, endGoalDays === goal.days ? tw`text-indigo-700` : tw`text-gray-700`]}>{goal.label}</Text>
                    <Text style={tw`text-xs text-gray-500`}>{goal.subtitle}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Custom Input */}
              <View style={tw`bg-gray-50 rounded-xl p-3`}>
                <Text style={tw`text-xs font-medium text-gray-600 mb-2`}>Or enter custom days:</Text>
                <View style={tw`flex-row items-center`}>
                  <TextInput
                    style={tw`flex-1 bg-white px-3 py-2 rounded-lg text-base font-medium text-gray-900 border border-gray-200`}
                    placeholder="Enter number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    value={inputValue}
                    onChangeText={handleCustomDays}
                    maxLength={3}
                  />
                  <Text style={tw`ml-3 text-sm text-gray-600`}>days</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </Pressable>
      </View>

      {/* Motivational Footer */}
      <View style={tw`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4`}>
        <View style={tw`flex-row items-start`}>
          <View style={tw`w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center mr-3`}>
            <Lightbulb size={16} color="#4f46e5" strokeWidth={2.5} />
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-indigo-900 mb-1`}>Pro Tip</Text>
            <Text style={tw`text-xs text-indigo-700 leading-5`}>
              {hasEndGoal
                ? `${endGoalDays || 30} days is a great commitment! Remember, consistency matters more than perfection.`
                : 'The 61-day challenge helps you move beyond the initial motivation phase into true habit formation.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default GoalSetting;
