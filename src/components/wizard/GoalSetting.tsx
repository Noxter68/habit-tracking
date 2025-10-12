import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, ImageBackground } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Set Your Goal</Text>
        <Text style={tw`text-quartz-600 leading-5`}>Choose how long you want to track this habit</Text>
      </View>

      <View style={tw`gap-3 mb-6`}>
        {/* Default 61-Day Challenge */}
        <Pressable onPress={() => onChange(false)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
          <LinearGradient colors={!hasEndGoal ? ['#9CA3AF', '#6B7280'] : ['#F3F4F6', '#E5E7EB']} style={tw`border border-quartz-200`}>
            <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: !hasEndGoal ? 0.2 : 0.05, borderRadius: 16 }} resizeMode="cover">
              <View style={tw`flex-row items-start justify-between`}>
                <View style={tw`flex-1 mr-3`}>
                  <View style={tw`flex-row items-center mb-2`}>
                    <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, !hasEndGoal ? tw`bg-sand/20` : tw`bg-quartz-100`]}>
                      <Target size={20} color={!hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                    </View>
                    <Text style={[tw`text-lg font-medium`, !hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>61-Day Challenge</Text>
                  </View>
                  <Text style={[tw`text-sm leading-5`, !hasEndGoal ? tw`text-white/80` : tw`text-quartz-600`]}>Science-backed duration for lasting habit formation</Text>
                  {!hasEndGoal && (
                    <View style={tw`mt-2 bg-sand/10 rounded-lg px-3 py-1.5 self-start`}>
                      <Text style={tw`text-xs text-white font-light`}>Optimal for habit building</Text>
                    </View>
                  )}
                </View>
                <View style={[tw`w-5 h-5 rounded-full border-2`, !hasEndGoal ? tw`border-white bg-sand/20` : tw`border-quartz-300`]}>
                  {!hasEndGoal && <View style={tw`w-2 h-2 bg-sand rounded-full m-auto`} />}
                </View>
              </View>
            </ImageBackground>
          </LinearGradient>
        </Pressable>

        {/* Custom Duration */}
        <Pressable onPress={() => onChange(true, endGoalDays || 30)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
          <LinearGradient colors={hasEndGoal ? ['#9CA3AF', '#6B7280'] : ['#F3F4F6', '#E5E7EB']} style={tw`border border-quartz-200`}>
            <View style={tw`p-4`}>
              <View style={tw`flex-row items-start justify-between mb-3`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={[tw`w-9 h-9 rounded-lg items-center justify-center mr-3`, hasEndGoal ? tw`bg-sand/20` : tw`bg-quartz-100`]}>
                    <Zap size={20} color={hasEndGoal ? '#ffffff' : '#6B7280'} strokeWidth={1.5} />
                  </View>
                  <Text style={[tw`text-lg font-medium`, hasEndGoal ? tw`text-white` : tw`text-quartz-800`]}>Custom Duration</Text>
                </View>
                <View style={[tw`w-5 h-5 rounded-full border-2`, hasEndGoal ? tw`border-white bg-sand/20` : tw`border-quartz-300`]}>
                  {hasEndGoal && <View style={tw`w-2 h-2 bg-sand rounded-full m-auto`} />}
                </View>
              </View>

              <Text style={[tw`text-sm mb-3`, hasEndGoal ? tw`text-white/80` : tw`text-quartz-600`]}>Set your own timeline that works for you</Text>

              {hasEndGoal && (
                <Animated.View entering={FadeInDown.duration(400)}>
                  <View style={tw`flex-row flex-wrap gap-2 mb-4`}>
                    {presetGoals.map((goal) => (
                      <Pressable
                        key={goal.days}
                        onPress={() => handlePresetSelect(goal.days)}
                        style={({ pressed }) => [
                          tw`px-3 py-2 rounded-xl border`,
                          endGoalDays === goal.days ? tw`bg-sand/20 border-white` : tw`bg-sand/10 border-quartz-400`,
                          pressed && tw`opacity-80`,
                        ]}
                      >
                        <Text style={[tw`text-sm font-medium`, endGoalDays === goal.days ? tw`text-white` : tw`text-white/70`]}>{goal.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={tw`bg-sand/10 rounded-xl p-3`}>
                    <Text style={tw`text-xs text-white/80 mb-2`}>Or enter custom days:</Text>
                    <TextInput
                      value={inputValue}
                      onChangeText={handleCustomDays}
                      placeholder="Enter number of days"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      keyboardType="numeric"
                      style={tw`bg-sand/20 rounded-lg px-3 py-2 text-white`}
                    />
                  </View>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={tw`bg-quartz-50 rounded-2xl overflow-hidden`}>
        <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: 0.05, borderRadius: 16 }} resizeMode="cover">
          <View style={tw`flex-row items-start`}>
            <View style={tw`w-8 h-8 bg-quartz-100 rounded-lg items-center justify-center mr-3`}>
              <Lightbulb size={16} color="#6B7280" strokeWidth={1.5} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-medium text-quartz-700 mb-1`}>Research Shows</Text>
              <Text style={tw`text-xs text-quartz-600 leading-5`}>It takes an average of 66 days to form a habit, but anywhere from 21-90 days can work depending on complexity and consistency.</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};

export default GoalSetting;
