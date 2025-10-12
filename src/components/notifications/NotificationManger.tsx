// src/components/notifications/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import * as Notifications from 'expo-notifications';
import tw from '../../lib/tailwind';
import TimePicker from '../TimePicker';
import { useHabits } from '../../context/HabitContext';
import { NotificationService } from '../../services/notificationService';

interface NotificationManagerProps {
  onClose: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ onClose }) => {
  const { habits, updateHabitNotification } = useHabits();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [localHabits, setLocalHabits] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHabits();
  }, [habits]);

  const loadHabits = async () => {
    setIsLoading(true);
    try {
      // Include ALL habits, not just those with notifications enabled
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
      Alert.alert('Error', 'Failed to update notification time');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleNotification = async (habitId: string, enabled: boolean) => {
    setIsUpdating(habitId);

    try {
      // Update local state optimistically
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
              onPress: () => Notifications.openNotificationSettingsAsync(),
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
      Alert.alert('Error', 'Failed to update notification settings');
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
          <View>
            <Text style={tw`text-2xl font-bold text-stone-800`}>Notifications</Text>
            <Text style={tw`text-sm text-sand-500 mt-1`}>
              {activeCount} of {localHabits.length} active
            </Text>
          </View>
          <Pressable onPress={onClose} style={({ pressed }) => [tw`p-2.5 rounded-full`, pressed && tw`bg-sand-100`]}>
            <Icon name="x" size={22} color={tw.color('gray-600')} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        {/* Elegant Info Banner */}
        <View style={tw`mx-6 mt-6 p-4 bg-teal-50/50 rounded-2xl border border-teal-100`}>
          <View style={tw`flex-row items-start`}>
            <View style={tw`w-10 h-10 rounded-full bg-teal-100 items-center justify-center mr-3`}>
              <Icon name="bell" size={16} color={tw.color('teal-600')} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-sm font-medium text-stone-800 mb-1`}>Daily Reminders</Text>
              <Text style={tw`text-xs text-gray-600 leading-5`}>Set personalized reminder times for each habit. Your settings are saved even when disabled.</Text>
            </View>
          </View>
        </View>

        {/* Habits List */}
        <View style={tw`px-6 mt-6`}>
          {localHabits.length === 0 ? (
            <View style={tw`py-16 items-center`}>
              <View style={tw`w-20 h-20 rounded-full bg-sand-100 items-center justify-center mb-4`}>
                <Icon name="bell-off" size={32} color={tw.color('gray-400')} />
              </View>
              <Text style={tw`text-stone-800 font-medium mb-2`}>No habits yet</Text>
              <Text style={tw`text-sm text-sand-500 text-center`}>Create habits to set up reminders</Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {localHabits.map((habit) => (
                <View key={habit.id} style={[tw`bg-sand rounded-2xl p-4 border`, habit.notificationEnabled ? tw`border-teal-100` : tw`border-stone-100`]}>
                  {/* Habit Header */}
                  <View style={tw`flex-row items-center justify-between`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`w-12 h-12 rounded-xl bg-stone-50 items-center justify-center mr-3`}>
                        <Text style={tw`text-xl`}>{habit.icon || '🎯'}</Text>
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

                  {/* Time Selector - Always visible */}
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
                    <View style={tw`flex-row items-center`}>
                      <Icon name="clock" size={16} color={habit.notificationEnabled ? tw.color('teal-600') : tw.color('gray-400')} />
                      <Text style={[tw`ml-2 text-sm`, habit.notificationEnabled ? tw`text-sand-700` : tw`text-sand-500`]}>Daily at</Text>
                    </View>
                    <View style={tw`flex-row items-center`}>
                      <Text style={[tw`text-sm font-medium`, habit.notificationEnabled ? tw`text-stone-800` : tw`text-sand-500`]}>{formatTime(habit.notificationTime)}</Text>
                      <Icon name="chevron-right" size={14} color={habit.notificationEnabled ? tw.color('teal-600') : tw.color('gray-400')} style={tw`ml-1`} />
                    </View>
                  </Pressable>

                  {/* Loading overlay */}
                  {isUpdating === habit.id && (
                    <View style={tw`absolute inset-0 rounded-2xl bg-sand/80 items-center justify-center`}>
                      <ActivityIndicator size="small" color={tw.color('teal-500')} />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker && selectedHabitId && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowTimePicker(false);
            setSelectedHabitId(null);
          }}
        >
          <TimePicker
            initialHour={getInitialTime().hour}
            initialMinute={getInitialTime().minute}
            onConfirm={handleTimeConfirm}
            onCancel={() => {
              setShowTimePicker(false);
              setSelectedHabitId(null);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default NotificationManager;
