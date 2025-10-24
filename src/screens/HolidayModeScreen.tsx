// src/screens/HolidayModeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, Alert, Platform, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import tw from 'twrnc';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { HolidayModeService, HolidayPeriod, HolidayStats } from '../services/holidayModeService';
import { ChevronLeft, Umbrella, Diamond, Info, Calendar, Sparkles } from 'lucide-react-native';

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
  // Load Data
  // ============================================================================

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [holiday, holidayStats] = await Promise.all([HolidayModeService.getActiveHoliday(user.id), HolidayModeService.getHolidayStats(user.id)]);

      console.log('🏖️ Active Holiday Data:', holiday);
      console.log('📊 Holiday Stats:', holidayStats);

      setActiveHoliday(holiday);
      setStats(holidayStats);

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
  // Holiday Actions
  // ============================================================================

  const handleCreateHoliday = async () => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const validation = HolidayModeService.validateDateRange(startDateStr, endDateStr);
    if (!validation.isValid) {
      Alert.alert('Invalid Dates', validation.error);
      return;
    }

    const duration = HolidayModeService.calculateDuration(startDateStr, endDateStr);

    Alert.alert('Activate Holiday Mode?', `All habits will be paused from ${HolidayModeService.formatDate(startDateStr)} to ${HolidayModeService.formatDate(endDateStr)} (${duration} days).`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Activate',
        style: 'default',
        onPress: async () => {
          try {
            setSubmitting(true);

            // ✅ OPTIMISTIC UPDATE - Show holiday immediately
            const optimisticHoliday: HolidayPeriod = {
              id: 'temp-' + Date.now(),
              userId: user.id,
              startDate: startDateStr,
              endDate: endDateStr,
              reason: undefined,
              createdAt: new Date().toISOString(),
              isActive: true,
              daysRemaining: duration,
            };
            setActiveHoliday(optimisticHoliday);

            const result = await HolidayModeService.createHolidayPeriod(user.id, startDateStr, endDateStr, undefined);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              // Reload to get actual data from server
              await loadData();
            } else if (result.requiresPremium) {
              // Revert optimistic update
              setActiveHoliday(null);
              Alert.alert('Premium Feature', result.error || 'This feature requires Premium.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Upgrade',
                  onPress: () => navigation.navigate('Paywall', { source: 'settings' }),
                },
              ]);
            } else {
              // Revert optimistic update
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
    ]);
  };

  const handleCancelHoliday = async () => {
    if (!user || !activeHoliday) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert('End Holiday Mode?', 'Your habits will become active again immediately.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Resume',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmitting(true);

            const result = await HolidayModeService.cancelHoliday(user.id, activeHoliday.id);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
  // Render Date Picker
  // ============================================================================

  const renderDatePicker = () => {
    if (!activePickerType) return null;

    const currentDate = activePickerType === 'start' ? startDate : endDate;
    const minimumDate = activePickerType === 'start' ? new Date() : startDate;

    if (Platform.OS === 'ios') {
      return (
        <Modal visible={true} transparent animationType="fade" onRequestClose={closeDatePicker}>
          <Pressable style={tw`flex-1 bg-black/50 justify-end`} onPress={closeDatePicker}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={tw`bg-white rounded-t-3xl p-4`}>
                <View style={tw`flex-row justify-between items-center mb-4`}>
                  <Text style={tw`text-lg font-bold text-gray-800`}>Select {activePickerType === 'start' ? 'Start' : 'End'} Date</Text>
                  <TouchableOpacity onPress={closeDatePicker} style={tw`bg-indigo-100 px-4 py-2 rounded-xl`}>
                    <Text style={tw`text-indigo-700 font-bold`}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker value={currentDate} mode="date" display="spinner" minimumDate={minimumDate} onChange={handleDateChange} textColor="#374151" />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      );
    }

    // Android shows system picker
    return <DateTimePicker value={currentDate} mode="date" display="default" minimumDate={minimumDate} onChange={handleDateChange} />;
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#FAF9F7]`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
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

        {/* Active Holiday Card - Shows at top with optimistic update */}
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

              <TouchableOpacity onPress={handleCancelHoliday} disabled={submitting} style={tw`bg-white rounded-xl py-3 ${submitting ? 'opacity-50' : ''}`}>
                {submitting ? <ActivityIndicator color="#6366F1" /> : <Text style={tw`text-indigo-600 font-bold text-center`}>End Early</Text>}
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Stats Card - Different for Free vs Premium */}
        {stats && !activeHoliday && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={tw`px-6 mb-6`}>
            <View style={tw`bg-white rounded-3xl p-6 shadow-sm`}>
              {isPremium ? (
                // Premium: Simple elegant message
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
                // Free: Show remaining allowance
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

        {/* Create Holiday Form - Only show if no active holiday */}
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
              <View style={tw`bg-indigo-50 rounded-xl p-3 mb-4`}>
                <Text style={tw`text-indigo-700 text-sm font-semibold text-center`}>
                  {HolidayModeService.calculateDuration(startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0])} days total
                </Text>
              </View>

              {/* Info */}
              <View style={tw`bg-amber-50 rounded-xl p-3 mb-6 flex-row items-start`}>
                <Info size={16} color="#D97706" style={tw`mt-0.5`} />
                <Text style={tw`text-amber-700 text-xs ml-2 flex-1`}>All habits paused. Streaks preserved.</Text>
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

            {/* Premium Upsell - Only for Free Users */}
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
