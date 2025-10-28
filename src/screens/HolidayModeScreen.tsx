// src/screens/HolidayModeScreen.tsx
// Redesigned with improved UX/UI

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import tw from '@/lib/tailwind';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { HolidayModeService, HolidayPeriod, HolidayStats, HolidayScope, HabitWithTasks } from '../services/holidayModeService';
import { ChevronLeft, Umbrella, Diamond, Info, Calendar, Sparkles, Globe, CheckSquare, ListChecks, InfinityIcon, Crown } from 'lucide-react-native';
import { ScopeSelector } from '../components/holidays/ScopeSelector';
import { HabitSelector } from '../components/holidays/HabitSelector';
import { TaskSelector } from '../components/holidays/TaskSelector';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DatePickerType = 'start' | 'end' | null;

const HolidayModeScreen: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [stats, setStats] = useState<HolidayStats | null>(null);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [scope, setScope] = useState<HolidayScope>('all');
  const [habits, setHabits] = useState<HabitWithTasks[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Map<string, Set<string>>>(new Map());

  // Calculate duration
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [holiday, holidayStats, userHabits] = await Promise.all([
        HolidayModeService.getActiveHoliday(user.id),
        HolidayModeService.getHolidayStats(user.id),
        HolidayModeService.getUserHabitsWithTasks(user.id),
      ]);

      setActiveHoliday(holiday);
      setStats(holidayStats);
      setHabits(userHabits);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEndDate(tomorrow);
    } catch (error) {
      console.error('Error loading holiday data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      if (selectedDate >= endDate) {
        const newEnd = new Date(selectedDate);
        newEnd.setDate(newEnd.getDate() + 1);
        setEndDate(newEnd);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleToggleTask = (habitId: string, taskId: string) => {
    setSelectedTasks((prev) => {
      const newMap = new Map(prev);
      const habitTasks = newMap.get(habitId) || new Set<string>();

      if (habitTasks.has(taskId)) {
        habitTasks.delete(taskId);
        if (habitTasks.size === 0) {
          newMap.delete(habitId);
        } else {
          newMap.set(habitId, habitTasks);
        }
      } else {
        habitTasks.add(taskId);
        newMap.set(habitId, habitTasks);
      }

      return newMap;
    });
  };

  const handleToggleAllTasks = (habitId: string) => {
    setSelectedTasks((prev) => {
      const newMap = new Map(prev);
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return prev;

      const habitTasks = newMap.get(habitId);
      const allSelected = habitTasks?.size === habit.tasks.length;

      if (allSelected) {
        newMap.delete(habitId);
      } else {
        newMap.set(habitId, new Set(habit.tasks.map((t) => t.id)));
      }

      return newMap;
    });
  };

  const handleScopeChange = (newScope: HolidayScope) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScope(newScope);
    if (newScope === 'all') {
      setSelectedHabits(new Set());
      setSelectedTasks(new Map());
    }
  };

  const handleHabitToggle = (habitId: string) => {
    const newSelection = new Set(selectedHabits);
    if (newSelection.has(habitId)) {
      newSelection.delete(habitId);
    } else {
      newSelection.add(habitId);
    }
    setSelectedHabits(newSelection);
  };

  const handleTaskToggle = (habitId: string, taskId: string) => {
    const newSelectedTasks = new Map(selectedTasks);
    const habitTasks = newSelectedTasks.get(habitId) || new Set<string>();

    if (habitTasks.has(taskId)) {
      habitTasks.delete(taskId);
    } else {
      habitTasks.add(taskId);
    }

    if (habitTasks.size === 0) {
      newSelectedTasks.delete(habitId);
    } else {
      newSelectedTasks.set(habitId, habitTasks);
    }

    setSelectedTasks(newSelectedTasks);
  };

  const validateSelection = (): { valid: boolean; message?: string } => {
    if (scope === 'habits') {
      if (selectedHabits.size === 0) {
        return { valid: false, message: 'Please select at least one habit to freeze' };
      }
    } else if (scope === 'tasks') {
      let totalTasks = 0;
      selectedTasks.forEach((tasks) => (totalTasks += tasks.size));
      if (totalTasks === 0) {
        return { valid: false, message: 'Please select at least one task to freeze' };
      }
    }
    return { valid: true };
  };

  const handleCreateHoliday = async () => {
    if (!user) return;

    const validation = validateSelection();
    if (!validation.valid) {
      Alert.alert('Selection Required', validation.message);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const dateValidation = HolidayModeService.validateDateRange(startDateStr, endDateStr);
    if (!dateValidation.isValid) {
      Alert.alert('Invalid Dates', dateValidation.error);
      return;
    }

    // ✅ IMPORTANT: Check with backend first to get proper validation messages
    try {
      const canCreateResult = await HolidayModeService.canCreateHoliday(
        user.id,
        startDateStr,
        endDateStr,
        scope,
        scope === 'habits' ? Array.from(selectedHabits) : undefined,
        scope === 'tasks'
          ? Array.from(selectedTasks.entries()).map(([habitId, taskIds]) => ({
              habitId,
              taskIds: Array.from(taskIds),
            }))
          : undefined
      );

      if (!canCreateResult.canCreate) {
        // Show the proper error message from backend
        if (canCreateResult.requiresPremium) {
          Alert.alert('Premium Required', canCreateResult.reason || 'This feature requires a Premium subscription.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              onPress: () => navigation.navigate('Paywall', { source: 'holiday_mode' }),
            },
          ]);
        } else {
          Alert.alert('Cannot Create Holiday', canCreateResult.reason || 'Unable to create holiday period.');
        }
        return;
      }
    } catch (error) {
      console.error('Error validating holiday:', error);
      Alert.alert('Error', 'Failed to validate holiday period. Please try again.');
      return;
    }

    let selectionMessage = '';
    if (scope === 'habits') {
      selectionMessage = `\n\nFreezing ${selectedHabits.size} habit${selectedHabits.size > 1 ? 's' : ''}`;
    } else if (scope === 'tasks') {
      let totalTasks = 0;
      selectedTasks.forEach((tasks) => (totalTasks += tasks.size));
      selectionMessage = `\n\nFreezing ${totalTasks} task${totalTasks > 1 ? 's' : ''} across ${selectedTasks.size} habit${selectedTasks.size > 1 ? 's' : ''}`;
    }

    Alert.alert(
      'Activate Holiday Mode?',
      `All ${scope === 'all' ? 'habits' : 'selected items'} will be paused from ${HolidayModeService.formatDate(startDateStr)} to ${HolidayModeService.formatDate(
        endDateStr
      )} (${duration} days).${selectionMessage}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'default',
          onPress: async () => {
            try {
              setSubmitting(true);

              const optimisticHoliday: HolidayPeriod = {
                id: 'temp-' + Date.now(),
                userId: user.id,
                startDate: startDateStr,
                endDate: endDateStr,
                appliesToAll: scope === 'all',
                frozenHabits: scope === 'habits' ? Array.from(selectedHabits) : null,
                frozenTasks:
                  scope === 'tasks'
                    ? Array.from(selectedTasks.entries()).map(([habitId, taskIds]) => ({
                        habitId,
                        taskIds: Array.from(taskIds),
                      }))
                    : null,
                reason: undefined,
                createdAt: new Date().toISOString(),
                isActive: true,
                daysRemaining: duration,
              };
              setActiveHoliday(optimisticHoliday);

              const result = await HolidayModeService.createHolidayPeriod({
                userId: user.id,
                startDate: startDateStr,
                endDate: endDateStr,
                scope,
                frozenHabits: scope === 'habits' ? Array.from(selectedHabits) : undefined,
                frozenTasks:
                  scope === 'tasks'
                    ? Array.from(selectedTasks.entries()).map(([habitId, taskIds]) => ({
                        habitId,
                        taskIds: Array.from(taskIds),
                      }))
                    : undefined,
              });

              if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                await loadData();
              } else if (result.requiresPremium) {
                setActiveHoliday(null);
                Alert.alert('Premium Feature', result.error || 'This feature requires Premium.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Upgrade',
                    onPress: () => navigation.navigate('Paywall', { source: 'holiday_mode' }),
                  },
                ]);
              } else {
                setActiveHoliday(null);
                Alert.alert('Error', result.error || 'Failed to create holiday');
              }
            } catch (error: any) {
              setActiveHoliday(null);
              Alert.alert('Error', error.message || 'Failed to create holiday');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelHoliday = async () => {
    if (!user || !activeHoliday) return;

    Alert.alert('End Holiday Early?', 'Your habits will resume tracking immediately.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Holiday',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);
            const result = await HolidayModeService.cancelHoliday(activeHoliday.id, user.id);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setActiveHoliday(null);
              await loadData();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel holiday');
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to cancel holiday');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#FAF9F7] items-center justify-center`}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  const ScopeButton = ({ value, icon: Icon, label }: { value: HolidayScope; icon: any; label: string }) => {
    const isSelected = scope === value;
    return (
      <TouchableOpacity onPress={() => handleScopeChange(value)} activeOpacity={0.7} style={tw`flex-1 ${isSelected ? 'bg-indigo-500' : 'bg-gray-100'} rounded-2xl py-4 px-3 items-center`}>
        <Icon size={24} color={isSelected ? '#FFFFFF' : '#9CA3AF'} strokeWidth={2.5} />
        <Text style={tw`${isSelected ? 'text-white' : 'text-gray-600'} text-sm font-bold mt-2`}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#FAF9F7]`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={tw`px-6 pt-4 pb-6`}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={tw`mb-6`}
          >
            <ChevronLeft size={28} color="#374151" />
          </TouchableOpacity>

          <Text style={tw`text-3xl font-black text-gray-800 mb-2`}>Holiday Mode</Text>
          <Text style={tw`text-base text-gray-500`}>Pause habits without losing progress</Text>
        </Animated.View>

        {/* Active Holiday Card */}
        {activeHoliday && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={tw`px-6 mb-6`}>
            <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-6 shadow-lg`}>
              <View style={tw`flex-row items-center justify-between mb-4`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`bg-white/20 p-2 rounded-full`}>
                    <Umbrella size={20} color="#FFFFFF" />
                  </View>
                  <Text style={tw`text-white text-lg font-bold ml-3`}>Holiday Active</Text>
                </View>
                <View style={tw`bg-white/20 px-3 py-1 rounded-full`}>
                  <Text style={tw`text-white text-sm font-bold`}>{activeHoliday.daysRemaining ?? 0}d left</Text>
                </View>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-indigo-200 text-sm mb-1`}>Period</Text>
                <Text style={tw`text-white text-base font-semibold`}>
                  {activeHoliday.startDate && activeHoliday.endDate
                    ? `${HolidayModeService.formatDate(activeHoliday.startDate)} - ${HolidayModeService.formatDate(activeHoliday.endDate)}`
                    : 'Loading dates...'}
                </Text>
              </View>

              {!activeHoliday.appliesToAll && (
                <View style={tw`mb-4`}>
                  <Text style={tw`text-indigo-200 text-sm mb-1`}>Frozen Items</Text>
                  <Text style={tw`text-white text-sm`}>
                    {activeHoliday.frozenHabits?.length
                      ? `${activeHoliday.frozenHabits.length} habits`
                      : activeHoliday.frozenTasks?.length
                      ? `${activeHoliday.frozenTasks.reduce((sum, ft) => sum + ft.taskIds.length, 0)} tasks`
                      : 'Custom selection'}
                  </Text>
                </View>
              )}

              <TouchableOpacity onPress={handleCancelHoliday} disabled={submitting} style={tw`bg-white rounded-xl py-3 ${submitting ? 'opacity-50' : ''}`}>
                {submitting ? <ActivityIndicator color="#6366F1" /> : <Text style={tw`text-indigo-600 font-bold text-center`}>End Early</Text>}
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Stats Card - Redesigned with calm blue gradient */}
        {stats && !activeHoliday && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={tw`px-6 mb-6`}>
            {isPremium ? (
              <LinearGradient colors={['#78716C', '#57534E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-6 shadow-lg`}>
                <View style={tw`flex-row items-center justify-between mb-3`}>
                  <Text style={tw`text-xl font-black text-white`}>Premium Access</Text>
                  <View style={tw`bg-white/20 px-3 py-1.5 rounded-full flex-row items-center`}>
                    <Crown size={14} color="#FFFFFF" />
                    <Text style={tw`text-xs font-bold text-white ml-1`}>UNLIMITED</Text>
                  </View>
                </View>
                <Text style={tw`text-stone-100 text-sm mb-4`}>Create unlimited holiday periods with no duration restrictions</Text>

                <View style={tw`flex-row items-center gap-4`}>
                  <View style={tw`flex-1 bg-white/10 rounded-xl p-3 items-center`}>
                    <InfinityIcon size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text style={tw`text-xs text-white/80 mt-1`}>Periods</Text>
                  </View>
                  <View style={tw`flex-1 bg-white/10 rounded-xl p-3 items-center`}>
                    <InfinityIcon size={28} color="#FFFFFF" strokeWidth={2} />
                    <Text style={tw`text-xs text-white/80 mt-1`}>Days per period</Text>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={tw`bg-white rounded-3xl p-6 shadow-sm border border-gray-200`}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Your Allowance</Text>
                  <View style={tw`bg-blue-50 px-3 py-1 rounded-full`}>
                    <Text style={tw`text-xs font-bold text-blue-700`}>FREE PLAN</Text>
                  </View>
                </View>

                <View style={tw`flex-row items-center gap-4`}>
                  <View style={tw`flex-1 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-4 items-center`}>
                    <Text style={tw`text-4xl font-black text-cyan-600`}>{stats.remainingAllowance}</Text>
                    <Text style={tw`text-xs text-cyan-700 font-semibold mt-1`}>Period left</Text>
                  </View>
                  <View style={tw`w-px h-16 bg-gray-200`} />
                  <View style={tw`flex-1 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 items-center`}>
                    <Text style={tw`text-4xl font-black text-amber-600`}>{stats.maxDuration}</Text>
                    <Text style={tw`text-xs text-amber-700 font-semibold mt-1`}>Days max</Text>
                  </View>
                </View>

                <View style={tw`mt-4 pt-4 border-t border-gray-100`}>
                  <Text style={tw`text-xs text-gray-500 text-center`}>Upgrade to Premium for unlimited holiday periods</Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* Create Holiday Form */}
        {!activeHoliday && (
          <View style={tw`px-6`}>
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={tw`bg-white rounded-3xl p-6 shadow-sm mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-6`}>Schedule Break</Text>

              {/* Duration Display - Above dates */}
              <View style={tw`bg-indigo-50 rounded-2xl p-4 mb-6 items-center`}>
                <Text style={tw`text-indigo-400 text-xs font-semibold uppercase mb-1`}>Total Duration</Text>
                <Text style={tw`text-indigo-600 text-4xl font-black`}>{duration}</Text>
                <Text style={tw`text-indigo-500 text-sm font-semibold`}>{duration === 1 ? 'day' : 'days'}</Text>
              </View>

              {/* Date Selection - Simplified */}
              <View style={tw`flex-row gap-3 mb-6`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-semibold text-gray-500 mb-2 uppercase`}>Start Date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowStartPicker(true);
                    }}
                    style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200`}
                  >
                    <Text style={tw`text-gray-800 font-semibold text-center text-sm`}>{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  </TouchableOpacity>
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-xs font-semibold text-gray-500 mb-2 uppercase`}>End Date</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowEndPicker(true);
                    }}
                    style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200`}
                  >
                    <Text style={tw`text-gray-800 font-semibold text-center text-sm`}>{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Freeze Scope - Vertical 3 buttons */}
              <View style={tw`mb-6`}>
                <Text style={tw`text-sm font-semibold text-gray-700 mb-3`}>Freeze Scope</Text>
                <View style={tw`flex-row gap-2`}>
                  <ScopeButton value="all" icon={Globe} label="All" />
                  <ScopeButton value="habits" icon={CheckSquare} label="Habits" />
                  <ScopeButton value="tasks" icon={ListChecks} label="Tasks" />
                </View>
              </View>

              {/* Habit Selector */}
              {scope === 'habits' && habits.length > 0 && (
                <View style={tw`mb-6`}>
                  <HabitSelector habits={habits} selectedHabits={selectedHabits} onToggle={handleHabitToggle} />
                </View>
              )}

              {/* Task Selector */}
              {scope === 'tasks' && habits.length > 0 && (
                <View style={tw`mb-6`}>
                  <TaskSelector habits={habits} selectedTasks={selectedTasks} onToggleTask={handleToggleTask} onToggleAllTasks={handleToggleAllTasks} />
                </View>
              )}

              {/* Info */}
              <View style={tw`bg-amber-50 rounded-xl p-3 mb-6 flex-row items-start`}>
                <Info size={16} color="#D97706" style={tw`mt-0.5`} />
                <Text style={tw`text-amber-700 text-xs ml-2 flex-1`}>
                  {scope === 'all'
                    ? 'All habits paused. Streaks preserved.'
                    : scope === 'habits'
                    ? 'Selected habits paused. Others continue normally.'
                    : 'Selected tasks paused. Others continue normally.'}
                </Text>
              </View>

              {/* Activate Button */}
              <TouchableOpacity onPress={handleCreateHoliday} disabled={submitting} activeOpacity={0.8}>
                <LinearGradient colors={['#6366F1', '#4F46E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-xl py-4 shadow-md ${submitting ? 'opacity-50' : ''}`}>
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={tw`flex-row items-center justify-center`}>
                      <Text style={tw`text-white font-bold text-center ml-2`}>Activate Holiday Mode</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Premium Upsell - Calm blue gradient */}
            {!isPremium && (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('Paywall', { source: 'settings' });
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#60A5FA', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-6 shadow-lg`}>
                    <View style={tw`flex-row items-center mb-3`}>
                      <View style={tw`bg-white/20 p-2 rounded-full`}>
                        <Diamond size={16} color="#FFFFFF" />
                      </View>
                      <Text style={tw`text-white text-lg font-bold ml-3`}>Go Premium</Text>
                    </View>
                    <Text style={tw`text-blue-100 text-sm`}>Unlimited holidays • No duration limits • Advanced controls</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Simplified Date Pickers */}
      {showStartPicker && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowStartPicker(false)}>
          <Animated.View entering={FadeInDown.duration(300)} style={tw`flex-1`}>
            <Pressable style={tw`flex-1 justify-end bg-black/50`} onPress={() => setShowStartPicker(false)}>
              <Pressable style={tw`bg-white rounded-t-3xl pb-8`} onPress={(e) => e.stopPropagation()}>
                <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-gray-100`}>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={tw`text-indigo-600 font-semibold`}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={tw`font-bold text-gray-800`}>Start Date</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                    <Text style={tw`text-indigo-600 font-semibold`}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={tw`w-full items-center`}>
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                    minimumDate={new Date()}
                    maximumDate={new Date(new Date().getFullYear() + 2, 11, 31)}
                    textColor="#1F2937"
                    style={{ width: '100%' }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Modal>
      )}

      {showEndPicker && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setShowEndPicker(false)}>
          <Animated.View entering={FadeInDown.duration(300)} style={tw`flex-1`}>
            <Pressable style={tw`flex-1 justify-end bg-black/50`} onPress={() => setShowEndPicker(false)}>
              <Pressable style={tw`bg-white rounded-t-3xl pb-8`} onPress={(e) => e.stopPropagation()}>
                <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-gray-100`}>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={tw`text-indigo-600 font-semibold`}>Cancel</Text>
                  </TouchableOpacity>
                  <Text style={tw`font-bold text-gray-800`}>End Date</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                    <Text style={tw`text-indigo-600 font-semibold`}>Done</Text>
                  </TouchableOpacity>
                </View>
                <View style={tw`w-full items-center`}>
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
                    minimumDate={startDate}
                    maximumDate={new Date(new Date().getFullYear() + 2, 11, 31)}
                    textColor="#1F2937"
                    style={{ width: '100%' }}
                  />
                </View>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default HolidayModeScreen;
