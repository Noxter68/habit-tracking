// src/components/wizard/GoalSetting.tsx
import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Zap, Lightbulb } from 'lucide-react-native';
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
          <LinearGradient
            colors={!hasEndGoal ? ['#10b981E6', '#059669'] : ['#F9FAFB', '#F3F4F6']}
            style={[tw`p-4`, !hasEndGoal ? { borderWidth: 2, borderColor: '#059669DD' } : { borderWidth: 2, borderColor: '#E5E7EB' }]}
          >
            <View style={tw`flex-row items-start justify-between`}>
              <View style={tw`flex-1 mr-3`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, !hasEndGoal ? tw`bg-white/20` : tw`bg-quartz-100`]}>
                    <Target size={20} color={!hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                  </View>
                  <Text style={[tw`text-lg font-semibold`, !hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>61-Day Challenge</Text>
                </View>
                <Text style={[tw`text-sm leading-5 ml-12`, !hasEndGoal ? tw`text-white/80` : tw`text-quartz-600`]}>Science-backed duration for lasting habit formation</Text>
                {!hasEndGoal && (
                  <View style={tw`mt-2 ml-12 bg-white/10 rounded-lg px-3 py-1.5 self-start`}>
                    <Text style={tw`text-xs text-white font-light`}>✨ Optimal for habit building</Text>
                  </View>
                )}
              </View>
              <View style={[tw`w-5 h-5 rounded-full border-2`, !hasEndGoal ? tw`border-white bg-white/20` : tw`border-quartz-300`]}>
                {!hasEndGoal && <View style={tw`w-2 h-2 bg-white rounded-full m-auto`} />}
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Custom Duration */}
        <Pressable onPress={() => onChange(true, endGoalDays || 30)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
          <LinearGradient
            colors={hasEndGoal ? ['#8b5cf6E6', '#7c3aed'] : ['#F9FAFB', '#F3F4F6']}
            style={[tw`p-4`, hasEndGoal ? { borderWidth: 2, borderColor: '#7c3aedDD' } : { borderWidth: 2, borderColor: '#E5E7EB' }]}
          >
            <View style={tw`flex-row items-start justify-between mb-3`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, hasEndGoal ? tw`bg-white/20` : tw`bg-quartz-100`]}>
                  <Zap size={20} color={hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                </View>
                <Text style={[tw`text-lg font-semibold`, hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>Custom Duration</Text>
              </View>
              <View style={[tw`w-5 h-5 rounded-full border-2`, hasEndGoal ? tw`border-white bg-white/20` : tw`border-quartz-300`]}>
                {hasEndGoal && <View style={tw`w-2 h-2 bg-white rounded-full m-auto`} />}
              </View>
            </View>

            <Text style={[tw`text-sm mb-3 ml-12`, hasEndGoal ? tw`text-white/80` : tw`text-quartz-600`]}>Set your own timeline that works for you</Text>

            {hasEndGoal && (
              <Animated.View entering={FadeInDown.duration(400)} style={tw`ml-12`}>
                <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                  {presetGoals.map((goal) => (
                    <Pressable
                      key={goal.days}
                      onPress={() => handlePresetSelect(goal.days)}
                      style={({ pressed }) => [tw`px-3 py-2 rounded-xl border`, endGoalDays === goal.days ? tw`bg-white/20 border-white` : tw`bg-white/10 border-white/40`, pressed && tw`opacity-80`]}
                    >
                      <Text style={[tw`text-sm font-medium`, endGoalDays === goal.days ? tw`text-white` : tw`text-white/70`]}>{goal.label}</Text>
                    </Pressable>
                  ))}
                </View>

                <View style={tw`bg-white/10 rounded-xl p-3`}>
                  <Text style={tw`text-xs text-white/80 mb-2`}>Or enter custom days:</Text>
                  <TextInput
                    value={inputValue}
                    onChangeText={handleCustomDays}
                    placeholder="Enter number of days"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="numeric"
                    style={tw`bg-white/20 rounded-lg px-3 py-2 text-white`}
                  />
                </View>
              </Animated.View>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {/* Professional Tip */}
      <View style={tw`bg-indigo-50 rounded-2xl p-4 border-l-3 border-l-indigo-500`}>
        <View style={tw`flex-row items-center mb-2`}>
          <Lightbulb size={18} color="#6366f1" strokeWidth={2} style={tw`mr-2`} />
          <Text style={tw`text-sm font-semibold text-indigo-900`}>{tips.goal[0].title}</Text>
        </View>
        <Text style={tw`text-sm text-indigo-800 leading-5`}>{tips.goal[0].content}</Text>
      </View>
    </View>
  );
};

export default GoalSetting;
