// src/screens/HolidayModeScreen.tsx
// Phase 2: Complete integration with granular control

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
import { ChevronLeft, Umbrella, Diamond, Info, Calendar, Sparkles } from 'lucide-react-native';

// Phase 2 Components
import { ScopeSelector } from '../components/holidays/ScopeSelector';
import { HabitSelector } from '../components/holidays/HabitSelector';
import { TaskSelector } from '../components/holidays/TaskSelector';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type DatePickerType = 'start' | 'end' | null;

// ============================================================================
// Main Screen
// ============================================================================

const HolidayModeScreen: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [stats, setStats] = useState<HolidayStats | null>(null);

  // Date picker states
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [activePickerType, setActivePickerType] = useState<DatePickerType>(null);

  // ============================================================================
  // Phase 2: Granular Control States
  // ============================================================================

  const [scope, setScope] = useState<HolidayScope>('all');
  const [habits, setHabits] = useState<HabitWithTasks[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Map<string, Set<string>>>(new Map());

  // ============================================================================
  // Load Data
  // ============================================================================

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [holiday, holidayStats, userHabits] = await Promise.all([
        HolidayModeService.getActiveHoliday(user.id),
        HolidayModeService.getHolidayStats(user.id),
        HolidayModeService.getUserHabitsWithTasks(user.id),
      ]);

      console.log('🏖️ Active Holiday Data:', holiday);
      console.log('📊 Holiday Stats:', holidayStats);
      console.log('📋 User Habits:', userHabits);

      setActiveHoliday(holiday);
      setStats(holidayStats);
      setHabits(userHabits);

      // Set default end date to tomorrow
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

  // ============================================================================
  // Date Picker Handlers
  // ============================================================================

  const openDatePicker = (type: DatePickerType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePickerType(type);
  };

  const closeDatePicker = () => {
    setActivePickerType(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      closeDatePicker();
    }

    if (selectedDate) {
      if (activePickerType === 'start') {
        setStartDate(selectedDate);
        // Adjust end date if it's before the new start date
        if (selectedDate > endDate) {
          const newEndDate = new Date(selectedDate);
          newEndDate.setDate(newEndDate.getDate() + 1);
          setEndDate(newEndDate);
        }
      } else if (activePickerType === 'end') {
        setEndDate(selectedDate);
      }
    }
  };

  // ============================================================================
  // Phase 2: Selection Handlers
  // ============================================================================

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
    setScope(newScope);
    // Reset selections when changing scope
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

  const handleSelectAllTasks = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const newSelectedTasks = new Map(selectedTasks);
    const allTaskIds = new Set(habit.tasks.map((t) => t.id));
    newSelectedTasks.set(habitId, allTaskIds);
    setSelectedTasks(newSelectedTasks);
  };

  // ============================================================================
  // Validation
  // ============================================================================

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

  // ============================================================================
  // Holiday Actions
  // ============================================================================

  const handleCreateHoliday = async () => {
    if (!user) return;

    // Validate selection
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

    const duration = HolidayModeService.calculateDuration(startDateStr, endDateStr);

    // Build selection message
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

              // ✅ OPTIMISTIC UPDATE
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

              // Create with Phase 2 parameters
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
                // Reload to get actual data from server
                await loadData();
              } else if (result.requiresPremium) {
                setActiveHoliday(null);
                Alert.alert('Premium Feature', result.error || 'This feature requires Premium.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Upgrade',
                    onPress: () => navigation.navigate('Paywall', { source: 'settings' }),
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

  // ============================================================================
  // Date Picker Rendering
  // ============================================================================

  const renderDatePicker = () => {
    if (!activePickerType) return null;

    if (Platform.OS === 'android') {
      return <DateTimePicker value={activePickerType === 'start' ? startDate : endDate} mode="date" onChange={handleDateChange} minimumDate={activePickerType === 'start' ? new Date() : startDate} />;
    }

    // iOS
    return (
      <Modal visible={true} transparent={true} animationType="fade" onRequestClose={closeDatePicker}>
        <Pressable style={tw`flex-1 bg-black/50 justify-end`} onPress={closeDatePicker}>
          <View style={tw`bg-white rounded-t-3xl pb-6`}>
            <View style={tw`flex-row justify-between items-center px-6 py-4 border-b border-gray-100`}>
              <TouchableOpacity onPress={closeDatePicker}>
                <Text style={tw`text-indigo-600 font-semibold`}>Cancel</Text>
              </TouchableOpacity>
              <Text style={tw`font-bold text-gray-800`}>{activePickerType === 'start' ? 'Start Date' : 'End Date'}</Text>
              <TouchableOpacity onPress={closeDatePicker}>
                <Text style={tw`text-indigo-600 font-semibold`}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={tw`items-center justify-center w-full`}>
              <DateTimePicker
                value={activePickerType === 'start' ? startDate : endDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={activePickerType === 'start' ? new Date() : startDate}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#FAF9F7] items-center justify-center`}>
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <SafeAreaView style={tw`flex-1 bg-[#FAF9F7]`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={tw`px-6 pt-4 pb-8`}>
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

              {/* Phase 2: Show what's frozen */}
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

        {/* Stats Card */}
        {stats && !activeHoliday && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={tw`px-6 mb-6`}>
            <View style={tw`bg-white rounded-3xl p-6 shadow-sm`}>
              {isPremium ? (
                <>
                  <View style={tw`flex-row items-center justify-between mb-4`}>
                    <Text style={tw`text-lg font-bold text-gray-800`}>Premium</Text>
                    <View style={tw`bg-stone-100 px-3 py-1 rounded-full flex-row items-center`}>
                      <Diamond size={14} color="#78716C" />
                      <Text style={tw`text-xs font-bold text-stone-700 ml-1`}>UNLIMITED</Text>
                    </View>
                  </View>
                  <Text style={tw`text-gray-500 text-sm`}>Create unlimited holidays with no duration restrictions</Text>
                </>
              ) : (
                <>
                  <Text style={tw`text-lg font-bold text-gray-800 mb-4`}>Your Allowance</Text>
                  <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-3xl font-black text-indigo-600`}>{stats.remainingAllowance}</Text>
                      <Text style={tw`text-xs text-gray-500 mt-1`}>Holidays left</Text>
                    </View>
                    <View style={tw`w-px h-12 bg-gray-200`} />
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-3xl font-black text-indigo-600`}>{stats.maxDuration}</Text>
                      <Text style={tw`text-xs text-gray-500 mt-1`}>Days max</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        )}

        {/* Create Holiday Form */}
        {!activeHoliday && (
          <View style={tw`px-6`}>
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={tw`bg-white rounded-3xl p-6 shadow-sm mb-6`}>
              <Text style={tw`text-lg font-bold text-gray-800 mb-6`}>Schedule Break</Text>

              {/* Date Selection */}
              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Start Date</Text>
                <TouchableOpacity onPress={() => openDatePicker('start')} style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}>
                  <Text style={tw`text-gray-800 font-medium`}>{HolidayModeService.formatDate(startDate.toISOString().split('T')[0])}</Text>
                  <Calendar size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <View style={tw`mb-4`}>
                <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>End Date</Text>
                <TouchableOpacity onPress={() => openDatePicker('end')} style={tw`bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between`}>
                  <Text style={tw`text-gray-800 font-medium`}>{HolidayModeService.formatDate(endDate.toISOString().split('T')[0])}</Text>
                  <Calendar size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Duration Display */}
              <View style={tw`bg-indigo-50 rounded-xl p-3 mb-6`}>
                <Text style={tw`text-indigo-700 text-sm font-semibold text-center`}>
                  {HolidayModeService.calculateDuration(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])} days total
                </Text>
              </View>

              {/* Phase 2: Scope Selector */}
              <ScopeSelector selectedScope={scope} onScopeChange={handleScopeChange} />

              {/* Phase 2: Habit Selector */}
              {scope === 'habits' && habits.length > 0 && (
                <View style={tw`mt-6`}>
                  <HabitSelector habits={habits} selectedHabits={selectedHabits} onToggle={handleHabitToggle} />
                </View>
              )}

              {/* Phase 2: Task Selector */}
              {scope === 'tasks' && habits.length > 0 && (
                <View style={tw`mt-6`}>
                  <TaskSelector habits={habits} selectedTasks={selectedTasks} onToggleTask={handleToggleTask} onToggleAllTasks={handleToggleAllTasks} />
                </View>
              )}

              {/* Info */}
              <View style={tw`bg-amber-50 rounded-xl p-3 mb-6 flex-row items-start mt-6`}>
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
                      <Sparkles size={18} color="#FFFFFF" />
                      <Text style={tw`text-white font-bold text-center ml-2`}>Activate Holiday Mode</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Premium Upsell */}
            {!isPremium && (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigation.navigate('Paywall', { source: 'settings' });
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient colors={['#78716C', '#57534E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-6 shadow-lg`}>
                    <View style={tw`flex-row items-center mb-3`}>
                      <View style={tw`bg-white/20 p-2 rounded-full`}>
                        <Diamond size={16} color="#D4AF37" />
                      </View>
                      <Text style={tw`text-white text-lg font-bold ml-3`}>Go Premium</Text>
                    </View>
                    <Text style={tw`text-stone-200 text-sm mb-3`}>Unlimited holidays • No duration limits • Advanced controls</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Date Picker Modal */}
      {renderDatePicker()}
    </SafeAreaView>
  );
};

export default HolidayModeScreen;
