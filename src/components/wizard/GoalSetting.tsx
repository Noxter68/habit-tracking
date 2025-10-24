// src/components/wizard/GoalSetting.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Sparkles, Lightbulb, Calendar } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { quotes, tips } from '../../utils/habitHelpers';

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
      {/* Header with Quote Integrated */}
      <View style={tw`mb-5`}>
        <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
          <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Set Your Goal</Text>
          <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>Choose how long you want to track this habit</Text>

          {/* Integrated Quote */}
          <View style={tw`border-t border-white/20 pt-3 mt-1`}>
            <Text style={tw`text-xs text-white/70 italic leading-5`}>"{quotes.goal.text}"</Text>
            <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {quotes.goal.author}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={tw`gap-3 mb-6`}>
        {/* Default 61-Day Challenge */}
        <Pressable onPress={() => onChange(false)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
          <LinearGradient colors={!hasEndGoal ? ['#10b981', '#059669dd'] : ['#ffffff', '#f9fafb']} style={[tw`p-4`, { borderWidth: 1, borderColor: !hasEndGoal ? 'transparent' : '#e5e7eb' }]}>
            <View style={tw`flex-row items-start`}>
              {/* Icon Container */}
              <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, !hasEndGoal ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                <Target size={24} color={!hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={2} />
              </View>

              {/* Text Content */}
              <View style={tw`flex-1 mr-3 pt-0.5`}>
                <Text style={[tw`text-base font-semibold mb-0.5`, !hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>61-Day Challenge</Text>
                <Text style={[tw`text-sm leading-5`, !hasEndGoal ? tw`text-white/90` : tw`text-quartz-600`]}>Science-backed duration for lasting habit formation</Text>
                {!hasEndGoal && (
                  <View style={tw`flex-row items-center mt-1.5`}>
                    <Sparkles size={12} color="#ffffff" strokeWidth={2} style={tw`mr-1`} />
                    <Text style={tw`text-xs text-white/80`}>Optimal for habit building</Text>
                  </View>
                )}
              </View>

              {/* Selection Indicator */}
              {!hasEndGoal && (
                <View style={tw`w-5.5 h-5.5 rounded-full bg-white/30 items-center justify-center flex-shrink-0 mt-0.5`}>
                  <View style={tw`w-2 h-2 bg-white rounded-full`} />
                </View>
              )}
            </View>
          </LinearGradient>
        </Pressable>

        {/* Custom Duration */}
        <Pressable onPress={() => onChange(true, endGoalDays || 30)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
          <LinearGradient colors={hasEndGoal ? ['#8b5cf6', '#7c3aeddd'] : ['#ffffff', '#f9fafb']} style={[tw`p-4`, { borderWidth: 1, borderColor: hasEndGoal ? 'transparent' : '#e5e7eb' }]}>
            <View style={tw`flex-row items-center mb-${hasEndGoal ? '3' : '0'}`}>
              {/* Icon Container */}
              <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-3.5`, hasEndGoal ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                <Calendar size={24} color={hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={2} />
              </View>

              {/* Text Content */}
              <View style={tw`flex-1 mr-3`}>
                <Text style={[tw`text-base font-semibold mb-0.5`, hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>Custom Duration</Text>
                <Text style={[tw`text-sm leading-5`, hasEndGoal ? tw`text-white/90` : tw`text-quartz-600`]}>Set your own timeline that works for you</Text>
              </View>

              {/* Selection Indicator */}
              {hasEndGoal && (
                <View style={tw`w-5.5 h-5.5 rounded-full bg-white/30 items-center justify-center flex-shrink-0`}>
                  <View style={tw`w-2 h-2 bg-white rounded-full`} />
                </View>
              )}
            </View>

            {hasEndGoal && (
              <Animated.View entering={FadeInDown.duration(400)} style={tw`mt-3`}>
                {/* Preset Goals */}
                <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
                  {presetGoals.map((goal) => (
                    <Pressable
                      key={goal.days}
                      onPress={() => handlePresetSelect(goal.days)}
                      style={({ pressed }) => [
                        tw`flex-1 min-w-[45%] px-3 py-2.5 rounded-xl`,
                        endGoalDays === goal.days ? tw`bg-white/25 border-2 border-white` : tw`bg-white/10 border border-white/30`,
                        pressed && tw`opacity-80`,
                      ]}
                    >
                      <Text style={[tw`text-sm font-semibold text-center`, endGoalDays === goal.days ? tw`text-white` : tw`text-white/80`]}>{goal.label}</Text>
                      <Text style={tw`text-xs text-white/60 text-center mt-0.5`}>{goal.subtitle}</Text>
                    </Pressable>
                  ))}
                </View>

                {/* Custom Input */}
                <View style={tw`bg-white/10 rounded-xl p-3`}>
                  <Text style={tw`text-xs text-white/80 mb-2 font-medium`}>Or enter custom days:</Text>
                  <TextInput
                    value={inputValue}
                    onChangeText={handleCustomDays}
                    placeholder="Enter number of days"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    style={tw`bg-white/20 rounded-lg px-3 py-2.5 text-white text-base`}
                  />
                </View>
              </Animated.View>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* Professional Tip */}
      <LinearGradient colors={['#e0e7ff', '#c7d2fe', '#a5b4fc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-2xl p-4 border border-indigo-200`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Lightbulb size={18} color="#4338ca" strokeWidth={2} style={tw`mr-2`} />
          <Text style={tw`text-sm font-semibold text-indigo-900`}>{tips.goal[0].title}</Text>
        </View>
        <Text style={tw`text-sm text-indigo-800 leading-5`}>{tips.goal[0].content}</Text>
      </LinearGradient>
    </View>
  );
};

export default GoalSetting;
