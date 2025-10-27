// src/components/notifications/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import { Bell, X, ChevronRight } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import TimePicker from '../TimePicker';
import { useHabits } from '../../context/HabitContext';
import { NotificationService } from '../../services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface NotificationManagerProps {
  onClose: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ onClose }) => {
  const { habits, updateHabitNotification } = useHabits();
  const { user } = useAuth();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [localHabits, setLocalHabits] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [globalEnabled, setGlobalEnabled] = useState(true);

  useEffect(() => {
    loadHabits();
  }, [habits]);

  useEffect(() => {
    checkGlobalNotificationState();
  }, [user]);

  const checkGlobalNotificationState = async () => {
    if (!user) return;
    try {
      const prefs = await NotificationPreferencesService.getPreferences(user.id);
      setGlobalEnabled(prefs.globalEnabled);
    } catch (error) {
      console.error('Error checking global notification state:', error);
    }
  };

  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const allHabits = habits.map((habit) => ({
        ...habit,
        notificationEnabled: habit.notifications || false,
        notificationTime: habit.notificationTime || '09:00',
      }));
      setLocalHabits(allHabits);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '9:00 AM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (habitId: string) => {
    if (showTimePicker) return;
    setSelectedHabitId(habitId);
    setShowTimePicker(true);
  };

  const getInitialTime = () => {
    if (!selectedHabitId) return { hour: 9, minute: 0 };
    const habit = localHabits.find((h) => h.id === selectedHabitId);
    if (!habit || !habit.notificationTime) return { hour: 9, minute: 0 };
    const [hour, minute] = habit.notificationTime.split(':').map(Number);
    return { hour: hour || 9, minute: minute || 0 };
  };

  const handleTimeConfirm = async (hour: number, minute: number) => {
    if (!selectedHabitId) return;

    setIsUpdating(selectedHabitId);
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    try {
      setLocalHabits((prev) => prev.map((habit) => (habit.id === selectedHabitId ? { ...habit, notificationTime: timeStr } : habit)));

      const habit = localHabits.find((h) => h.id === selectedHabitId);
      if (!habit) return;

      await updateHabitNotification(selectedHabitId, habit.notificationEnabled, timeStr);

      if (habit.notificationEnabled) {
        await NotificationService.scheduleHabitNotifications({
          ...habit,
          notifications: true,
          notificationTime: timeStr,
        });
      }

      setShowTimePicker(false);
      setSelectedHabitId(null);
    } catch (error) {
      console.error('Error updating notification time:', error);
      // Revert on error
      setLocalHabits((prev) => prev.map((habit) => (habit.id === selectedHabitId ? { ...habit, notificationTime: habit.notificationTime } : habit)));
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleNotification = async (habitId: string, enabled: boolean) => {
    if (!globalEnabled && enabled) {
      Alert.alert('Enable Global Notifications First', 'Please enable notifications in Settings before managing individual habit notifications.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Settings',
          onPress: () => onClose(),
        },
      ]);
      return;
    }

    setIsUpdating(habitId);

    try {
      setLocalHabits((prev) =>
        prev.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                notificationEnabled: enabled,
                notifications: enabled,
              }
            : habit
        )
      );

      const habit = localHabits.find((h) => h.id === habitId);
      if (!habit) return;

      await updateHabitNotification(habitId, enabled, habit.notificationTime);

      if (enabled) {
        const hasPermission = await NotificationService.registerForPushNotifications();
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive habit reminders.', [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLocalHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, notificationEnabled: false, notifications: false } : h)));
              },
            },
            {
              text: 'Open Settings',
              onPress: () => Notifications.openSettingsAsync(),
            },
          ]);
          return;
        }

        await NotificationService.scheduleHabitNotifications({
          ...habit,
          notifications: true,
          notificationTime: habit.notificationTime || '09:00',
        });
      } else {
        await NotificationService.cancelHabitNotifications(habitId);
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      // Revert on error
      setLocalHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, notificationEnabled: !enabled, notifications: !enabled } : h)));
    } finally {
      setIsUpdating(null);
    }
  };

  const activeCount = localHabits.filter((h) => h.notificationEnabled).length;

  if (isLoading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-stone-50`}>
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color={tw.color('teal-500')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`}>
      {/* Minimalist Header */}
      <View style={tw`px-6 py-5 bg-sand border-b border-stone-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}>
            <Bell size={24} color={tw.color('teal-600')} strokeWidth={2} />
            <View style={tw`ml-3`}>
              <Text style={tw`text-2xl font-bold text-stone-800`}>Notifications</Text>
              <Text style={tw`text-sm text-sand-500 mt-0.5`}>
                {activeCount} of {localHabits.length} active
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [tw`p-2 rounded-full`, pressed && tw`bg-sand-100`]}>
            <X size={24} color={tw.color('stone-600')} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        {/* Elegant Info Banner */}
        <View style={tw`mx-6 mt-6 p-4 ${globalEnabled ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'} rounded-2xl border`}>
          <Text style={tw`text-sm ${globalEnabled ? 'text-teal-800' : 'text-amber-800'} leading-5`}>
            {globalEnabled ? "Configure when you'd like to receive gentle reminders for each habit" : 'Enable notifications in Settings first to manage individual habit reminders'}
          </Text>
        </View>

        {/* Habits List */}
        <View style={tw`px-6 mt-6`}>
          {localHabits.length === 0 ? (
            <View style={tw`py-16 items-center`}>
              <View style={tw`w-20 h-20 rounded-full bg-sand-100 items-center justify-center mb-4`}>
                <Bell size={32} color={tw.color('sand-400')} strokeWidth={2} />
              </View>
              <Text style={tw`text-stone-800 font-medium mb-2`}>No habits yet</Text>
              <Text style={tw`text-sm text-sand-500 text-center`}>Create habits to set up reminders</Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {localHabits.map((habit, index) => {
                const categoryIcon = getCategoryIcon(habit.category, habit.type);
                const HabitIcon = categoryIcon.icon;

                return (
                  <Animated.View key={habit.id} entering={FadeIn.delay(index * 50).duration(300)}>
                    <View style={[tw`bg-sand rounded-2xl p-4 border`, habit.notificationEnabled ? tw`border-teal-100` : tw`border-stone-100`]}>
                      {/* Habit Header */}
                      <View style={tw`flex-row items-center justify-between`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          {/* Habit Icon from category */}
                          <View style={[tw`w-11 h-11 rounded-xl items-center justify-center mr-3`, { backgroundColor: categoryIcon.bgColor }]}>
                            <HabitIcon size={20} color={categoryIcon.color} strokeWidth={2} />
                          </View>
                          <View style={tw`flex-1`}>
                            <Text style={tw`text-base font-semibold text-stone-800`} numberOfLines={1}>
                              {habit.name}
                            </Text>
                            <View style={tw`flex-row items-center mt-1`}>
                              <View style={[tw`px-2 py-0.5 rounded-full`, habit.notificationEnabled ? tw`bg-teal-100` : tw`bg-sand-100`]}>
                                <Text style={[tw`text-xs font-medium`, habit.notificationEnabled ? tw`text-teal-700` : tw`text-gray-600`]}>{habit.notificationEnabled ? 'Active' : 'Inactive'}</Text>
                              </View>
                              {habit.category && <Text style={tw`text-xs text-sand-500 ml-2 capitalize`}>{habit.category.replace('-', ' ')}</Text>}
                            </View>
                          </View>
                        </View>
                        <Switch
                          value={habit.notificationEnabled}
                          onValueChange={(value) => handleToggleNotification(habit.id, value)}
                          trackColor={{ false: '#e2e8f0', true: '#99f6e4' }}
                          thumbColor={habit.notificationEnabled ? '#14b8a6' : '#f1f5f9'}
                          disabled={isUpdating === habit.id}
                          style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
                        />
                      </View>

                      {/* Time Selector with ChevronRight */}
                      <Pressable
                        onPress={() => handleTimeChange(habit.id)}
                        disabled={isUpdating === habit.id}
                        style={({ pressed }) => [
                          tw`flex-row items-center justify-between mt-3 py-3 px-4 rounded-xl`,
                          habit.notificationEnabled ? tw`bg-teal-50/30 border border-teal-100` : tw`bg-stone-50 border border-stone-100`,
                          pressed && tw`opacity-70`,
                          isUpdating === habit.id && tw`opacity-50`,
                        ]}
                      >
                        <Text style={[tw`text-sm font-medium`, habit.notificationEnabled ? tw`text-teal-800` : tw`text-sand-500`]}>Daily at {formatTime(habit.notificationTime)}</Text>
                        <ChevronRight size={18} color={habit.notificationEnabled ? tw.color('teal-600') : tw.color('sand-400')} strokeWidth={2} />
                      </Pressable>

                      {/* Loading overlay */}
                      {isUpdating === habit.id && (
                        <View style={tw`absolute inset-0 rounded-2xl bg-sand/80 items-center justify-center`}>
                          <ActivityIndicator size="small" color={tw.color('teal-500')} />
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal with Fade-In (60fps) */}
      {showTimePicker && selectedHabitId && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="none"
          onRequestClose={() => {
            setShowTimePicker(false);
            setSelectedHabitId(null);
          }}
        >
          <Animated.View entering={FadeIn.duration(200)} style={tw`flex-1`}>
            <TimePicker
              initialHour={getInitialTime().hour}
              initialMinute={getInitialTime().minute}
              onConfirm={handleTimeConfirm}
              onCancel={() => {
                setShowTimePicker(false);
                setSelectedHabitId(null);
              }}
            />
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default NotificationManager;
