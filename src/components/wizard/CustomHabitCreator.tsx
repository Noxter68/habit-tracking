// src/components/wizard/CustomHabitCreator.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BicepsFlexed,
  Trophy,
  Zap,
  Heart,
  Star,
  Flame,
  CheckCircle,
  Award,
  TrendingUp,
  Activity,
  Sparkles,
  Coffee,
  Book,
  Music,
  Camera,
  Palette,
  Code,
  Scissors,
  Wrench,
  Briefcase,
} from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { HabitType } from '../../types';

interface CustomHabitCreatorProps {
  habitType: HabitType;
  habitName: string;
  selectedIcon: string;
  onNameChange: (name: string) => void;
  onIconSelect: (icon: string) => void;
}

const customIcons = [
  { id: 'target', component: BicepsFlexed, label: 'Biceps' },
  { id: 'trophy', component: Trophy, label: 'Trophy' },
  { id: 'zap', component: Zap, label: 'Energy' },
  { id: 'heart', component: Heart, label: 'Heart' },
  { id: 'star', component: Star, label: 'Star' },
  { id: 'flame', component: Flame, label: 'Flame' },
  { id: 'check-circle', component: CheckCircle, label: 'Complete' },
  { id: 'award', component: Award, label: 'Award' },
  { id: 'trending-up', component: TrendingUp, label: 'Growth' },
  { id: 'activity', component: Activity, label: 'Activity' },
  { id: 'sparkles', component: Sparkles, label: 'Magic' },
  { id: 'coffee', component: Coffee, label: 'Coffee' },
  { id: 'book', component: Book, label: 'Book' },
  { id: 'music', component: Music, label: 'Music' },
  { id: 'camera', component: Camera, label: 'Camera' },
  { id: 'palette', component: Palette, label: 'Art' },
  { id: 'code', component: Code, label: 'Code' },
  { id: 'scissors', component: Scissors, label: 'Craft' },
  { id: 'wrench', component: Wrench, label: 'Build' },
  { id: 'briefcase', component: Briefcase, label: 'Work' },
];

const CustomHabitCreator: React.FC<CustomHabitCreatorProps> = ({ habitType, habitName, selectedIcon, onNameChange, onIconSelect }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const gradientColors = habitType === 'good' ? ['#06b6d4', '#0891b2'] : ['#f97316', '#ea580c'];
  const primaryColor = habitType === 'good' ? '#06b6d4' : '#f97316';

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  return (
    <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={tw`flex-1`}>
        {/* Header - Fixed at top */}
        <View style={tw`px-6 pt-4 pb-3`}>
          <Animated.View entering={FadeInUp.duration(400)}>
            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
              <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Create Your Habit</Text>
              <Text style={tw`text-sm text-white/90 leading-5`}>
                {habitType === 'good' ? 'Give your habit a meaningful name and choose an icon that represents it' : 'Define what you want to overcome with a clear name and visual'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-6 pb-4`} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Habit Name Input */}
          <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-6 mt-2`}>
            <Text style={tw`text-base font-semibold text-quartz-800 mb-3`}>Habit Name</Text>
            <View style={tw`bg-white rounded-2xl border border-quartz-200 overflow-hidden`}>
              <TextInput
                style={tw`px-4 py-4 text-base text-quartz-800`}
                placeholder={habitType === 'good' ? 'e.g., Daily Journaling' : 'e.g., Quit Social Media Scrolling'}
                placeholderTextColor="#9ca3af"
                value={habitName}
                onChangeText={onNameChange}
                maxLength={40}
                returnKeyType="done"
              />
            </View>
            <View style={tw`flex-row justify-between items-center mt-2`}>
              <Text style={tw`text-xs text-quartz-500`}>Be specific and inspiring</Text>
              <Text style={tw`text-xs text-quartz-400`}>{habitName.length}/40</Text>
            </View>
          </Animated.View>

          {/* Icon Selection - NO STAGGERED ANIMATIONS */}
          <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-5`}>
            <Text style={tw`text-base font-semibold text-quartz-800 mb-3`}>Choose an Icon</Text>
            <View style={tw`flex-row flex-wrap -mx-1.5`}>
              {customIcons.map((icon) => {
                const Icon = icon.component;
                const isSelected = selectedIcon === icon.id;

                return (
                  <View key={icon.id} style={tw`w-1/4 px-1.5 mb-3`}>
                    <Pressable
                      onPress={() => onIconSelect(icon.id)}
                      style={({ pressed }) => [
                        tw`rounded-2xl overflow-hidden`,
                        {
                          aspectRatio: 1,
                          borderWidth: 1,
                          borderColor: isSelected ? primaryColor : '#e5e7eb',
                          backgroundColor: isSelected ? primaryColor : '#ffffff',
                        },
                        pressed && tw`opacity-80`,
                      ]}
                    >
                      <View style={tw`flex-1 items-center justify-center`}>
                        <View style={[tw`w-11 h-11 rounded-xl items-center justify-center`, isSelected ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                          <Icon size={22} color={isSelected ? '#ffffff' : '#6B7280'} strokeWidth={2} />
                        </View>
                        <Text style={[tw`text-xs text-center mt-2 px-1`, isSelected ? tw`text-white font-semibold` : tw`text-quartz-600`]} numberOfLines={1}>
                          {icon.label}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Preview Card */}
          {habitName.length > 0 && selectedIcon && (
            <Animated.View entering={FadeInDown.duration(400)} style={tw`mb-5`}>
              <Text style={tw`text-base font-semibold text-quartz-800 mb-3`}>Preview</Text>
              <View style={[tw`rounded-2xl p-4`, { backgroundColor: primaryColor }]}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-14 h-14 bg-white/25 rounded-xl items-center justify-center mr-4`}>
                    {(() => {
                      const iconData = customIcons.find((i) => i.id === selectedIcon);
                      if (!iconData) return null;
                      const Icon = iconData.component;
                      return <Icon size={28} color="#ffffff" strokeWidth={2} />;
                    })()}
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-lg font-semibold text-white mb-0.5`}>{habitName}</Text>
                    <Text style={tw`text-sm text-white/80`}>Custom Habit</Text>
                  </View>
                  <View style={tw`w-6 h-6 bg-white/30 rounded-full items-center justify-center`}>
                    <View style={tw`w-2.5 h-2.5 bg-white rounded-full`} />
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Helpful Tip */}
          <View style={[tw`rounded-2xl p-4 border border-amber-200`, { backgroundColor: '#fef3c7' }]}>
            <View style={tw`flex-row items-center mb-2`}>
              <Sparkles size={18} color="#78350f" strokeWidth={2} style={tw`mr-2`} />
              <Text style={tw`text-sm font-semibold text-amber-900`}>Pro Tip</Text>
            </View>
            <Text style={tw`text-sm text-amber-800 leading-5`}>
              {habitType === 'good'
                ? "Choose a name that motivates you and an icon that you'll recognize at a glance. This will be your daily companion!"
                : 'Frame your habit positively. Instead of "Stop doing X", try "Reduce X" or "Replace X with Y"'}
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

export default React.memo(CustomHabitCreator);

export const getCustomIconComponent = (iconId: string) => {
  const icon = customIcons.find((i) => i.id === iconId);
  return icon?.component || Target;
};
