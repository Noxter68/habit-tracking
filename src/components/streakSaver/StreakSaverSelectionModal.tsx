// src/components/streakSaver/StreakSaverSelectionModal.tsx
// Modal permettant de sélectionner quelle habitude sauvegarder

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Flame, X, ChevronRight, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';

interface SaveableHabit {
  habitId: string;
  habitName: string;
  previousStreak: number;
  missedDate: string;
}

interface StreakSaverSelectionModalProps {
  visible: boolean;
  habits: SaveableHabit[];
  availableSavers: number;
  loading?: boolean;
  onSelectHabit: (habit: SaveableHabit) => void;
  onClose: () => void;
  onShopPress?: () => void;
}

// ============================================================================
// Animated Header Icon
// ============================================================================
const AnimatedIcon = () => {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathe.value, [0, 1], [1, 1.08]);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View style={tw`relative`}>
        <View style={tw`absolute inset-0 bg-purple-300 rounded-full opacity-30 blur-xl scale-110`} />
        <View style={tw`w-16 h-16 rounded-2xl bg-white items-center justify-center shadow-xl`}>
          <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </View>
        <View style={tw`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center border-2 border-white`}>
          <AlertTriangle size={12} color="white" strokeWidth={3} />
        </View>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Habit Card Component
// ============================================================================
const HabitCard = ({ habit, index, onPress, disabled }: { habit: SaveableHabit; index: number; onPress: () => void; disabled?: boolean }) => {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInUp.delay(100 + index * 80).springify()}>
      <Pressable
        onPress={() => {
          if (!disabled) {
            HapticFeedback.light();
            onPress();
          }
        }}
        disabled={disabled}
        style={({ pressed }) => [tw`rounded-2xl overflow-hidden mb-3`, pressed && !disabled && tw`opacity-80 scale-[0.98]`, disabled && tw`opacity-50`]}
      >
        <LinearGradient colors={['#faf5ff', '#f3e8ff', '#ede9fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-4`}>
          <View style={tw`flex-row items-center`}>
            {/* Streak indicator */}
            <View style={tw`w-14 h-14 rounded-xl bg-white items-center justify-center shadow-md mr-4`}>
              <Flame size={24} color="#8B5CF6" fill="#8B5CF6" />
              <Text style={tw`text-base font-black text-purple-900 -mt-0.5`}>{habit.previousStreak}</Text>
            </View>

            {/* Habit info */}
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-purple-900 mb-1`} numberOfLines={1}>
                {habit.habitName}
              </Text>
              <Text style={tw`text-xs font-semibold text-purple-700`}>
                {t('streakSaver.selection.streakDays', { count: habit.previousStreak })}
              </Text>
            </View>

            {/* Arrow */}
            <View style={tw`ml-2`}>
              <ChevronRight size={22} color="#7C3AED" strokeWidth={2.5} />
            </View>
          </View>
        </LinearGradient>

        {/* Border */}
        <View style={[tw`absolute inset-0 rounded-2xl`, { borderWidth: 1.5, borderColor: 'rgba(139, 92, 246, 0.2)' }]} />
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// Main Modal Component
// ============================================================================
export const StreakSaverSelectionModal: React.FC<StreakSaverSelectionModalProps> = ({
  visible,
  habits,
  availableSavers,
  loading = false,
  onSelectHabit,
  onClose,
  onShopPress,
}) => {
  const { t } = useTranslation();
  const glowPulse = useSharedValue(0);

  const isOutOfSavers = availableSavers === 0;

  useEffect(() => {
    if (visible) {
      glowPulse.value = withRepeat(withTiming(1, { duration: 1500 }), -1, true);
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.2, 0.5]),
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <BlurView intensity={30} style={tw`flex-1`}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={tw`flex-1 bg-black/50 items-center justify-center px-5`}>
          <Pressable style={tw`absolute inset-0`} onPress={onClose} />

          <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl max-h-[85%]`}>
            {/* Header */}
            <LinearGradient colors={['#f3e8ff', '#e9d5ff', '#ddd6fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`relative`}>
              <Animated.View style={[tw`absolute inset-0 bg-purple-300`, glowStyle]} />

              <View style={tw`px-5 pt-6 pb-4`}>
                <Pressable onPress={onClose} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow`}>
                  <X size={18} color="#78716C" strokeWidth={2.5} />
                </Pressable>

                <View style={tw`items-center mb-3`}>
                  <AnimatedIcon />
                </View>

                <Text style={tw`text-2xl font-black text-center text-purple-900 mb-1`}>{t('streakSaver.selection.title')}</Text>
                <Text style={tw`text-sm text-center text-purple-700 font-medium`}>{t('streakSaver.selection.subtitle')}</Text>
              </View>
            </LinearGradient>

            {/* Content */}
            <View style={tw`px-5 py-4`}>
              {/* Inventory indicator */}
              <View style={tw`flex-row items-center justify-center mb-4 px-4 py-2 rounded-xl ${isOutOfSavers ? 'bg-orange-50 border border-orange-200' : 'bg-purple-50 border border-purple-200'}`}>
                <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 20, height: 20 }} resizeMode="contain" />
                <Text style={tw`text-sm font-bold ml-2 ${isOutOfSavers ? 'text-orange-800' : 'text-purple-800'}`}>
                  {t('streakSaver.selection.saversAvailable', { count: availableSavers })}
                </Text>
              </View>

              {/* Loading state */}
              {loading ? (
                <View style={tw`py-8 items-center`}>
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text style={tw`text-sm text-stone-500 mt-3`}>{t('common.loading')}</Text>
                </View>
              ) : isOutOfSavers ? (
                /* Out of savers state */
                <View style={tw`py-4`}>
                  <View style={tw`bg-orange-50 rounded-2xl p-4 border border-orange-200 mb-4`}>
                    <View style={tw`flex-row items-start`}>
                      <AlertTriangle size={20} color="#EA580C" strokeWidth={2.5} style={tw`mr-3 mt-0.5`} />
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-sm font-bold text-orange-900 mb-1`}>{t('streakSaver.selection.noSaversTitle')}</Text>
                        <Text style={tw`text-xs text-orange-800 leading-4`}>{t('streakSaver.selection.noSaversMessage')}</Text>
                      </View>
                    </View>
                  </View>

                  {onShopPress && (
                    <Pressable
                      onPress={() => {
                        HapticFeedback.light();
                        onClose();
                        onShopPress();
                      }}
                      style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-80`]}
                    >
                      <LinearGradient colors={['#f97316', '#ea580c', '#c2410c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-4 px-6 items-center justify-center`}>
                        <Text style={tw`text-white font-black text-base`}>{t('streakSaver.selection.goToShop')}</Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>
              ) : (
                /* Habits list */
                <ScrollView style={tw`max-h-80`} showsVerticalScrollIndicator={false}>
                  {habits.map((habit, index) => (
                    <HabitCard key={habit.habitId} habit={habit} index={index} onPress={() => onSelectHabit(habit)} />
                  ))}
                </ScrollView>
              )}

              {/* Close button */}
              {!isOutOfSavers && (
                <Pressable onPress={onClose} style={({ pressed }) => [tw`bg-stone-100 rounded-xl py-3 items-center mt-2`, pressed && tw`opacity-70`]}>
                  <Text style={tw`text-stone-600 font-semibold text-sm`}>{t('common.close')}</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
