// src/components/notifications/NotificationManager.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import * as Notifications from 'expo-notifications';
import tw from '../../lib/tailwind';
import TimePicker from '../TimePicker';
import { useHabits } from '../../context/HabitContext';

interface Habit {
  id: string;
  name: string;
  notificationEnabled: boolean;
  notificationTime?: string;
  icon?: string;
}

interface NotificationManagerProps {
  habits: Habit[];
  onClose: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ habits, onClose }) => {
  const { updateHabitNotification } = useHabits();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '9:00 AM';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (habitId: string) => {
    setSelectedHabitId(habitId);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async (hour: number, minute: number) => {
    if (!selectedHabitId) return;

    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    await updateHabitNotification(selectedHabitId, true, timeStr);

    // Reschedule notification
    await scheduleHabitNotification(selectedHabitId, timeStr);

    setShowTimePicker(false);
    setSelectedHabitId(null);
  };

  const handleToggleNotification = async (habitId: string, enabled: boolean) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    await updateHabitNotification(habitId, enabled, habit.notificationTime);

    if (enabled && habit.notificationTime) {
      await scheduleHabitNotification(habitId, habit.notificationTime);
    } else {
      await Notifications.cancelScheduledNotificationAsync(habitId);
    }
  };

  const scheduleHabitNotification = async (habitId: string, timeStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    // Cancel existing notification
    await Notifications.cancelScheduledNotificationAsync(habitId);

    // Parse time
    const [hours, minutes] = timeStr.split(':').map(Number);

    // Schedule daily notification
    await Notifications.scheduleNotificationAsync({
      identifier: habitId,
      content: {
        title: `🎯 ${habit.name}`,
        body: "Time to complete your habit! You've got this! 💪",
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      {/* Header */}
      <View style={tw`flex-row items-center justify-between px-6 py-4 border-b border-slate-100 bg-white`}>
        <Text style={tw`text-xl font-semibold text-slate-800`}>Manage Notifications</Text>
        <Pressable onPress={onClose} style={tw`p-2 -mr-2 rounded-full`}>
          <Icon name="x" size={24} color={tw.color('slate-600')} />
        </Pressable>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pb-6`} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={tw`mx-6 mt-6 p-4 bg-blue-50 rounded-2xl`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Icon name="info" size={20} color={tw.color('blue-600')} />
            <Text style={tw`text-base font-medium text-blue-900 ml-2`}>Habit Reminders</Text>
          </View>
          <Text style={tw`text-sm text-blue-700 leading-5`}>Set custom reminder times for each habit. You'll receive a notification at your chosen time every day.</Text>
        </View>

        {/* Habits List */}
        <View style={tw`px-6 mt-6`}>
          <Text style={tw`text-lg font-semibold text-slate-800 mb-4`}>Your Habits ({habits.length})</Text>

          {habits.length === 0 ? (
            <View style={tw`py-8 items-center`}>
              <Icon name="bell-off" size={48} color={tw.color('slate-300')} />
              <Text style={tw`text-slate-500 mt-3 text-center`}>
                No habits with notifications yet.{'\n'}
                Enable notifications when creating habits.
              </Text>
            </View>
          ) : (
            <View style={tw`gap-3`}>
              {habits.map((habit) => (
                <View key={habit.id} style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
                  {/* Habit Header */}
                  <View style={tw`flex-row items-center justify-between mb-3`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <Text style={tw`text-2xl mr-3`}>{habit.icon || '🎯'}</Text>
                      <Text style={tw`text-base font-semibold text-slate-800 flex-1`}>{habit.name}</Text>
                    </View>
                    <Switch
                      value={habit.notificationEnabled}
                      onValueChange={(value) => handleToggleNotification(habit.id, value)}
                      trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
                      thumbColor={habit.notificationEnabled ? '#14b8a6' : '#f4f4f5'}
                    />
                  </View>

                  {/* Time Selector */}
                  {habit.notificationEnabled && (
                    <Pressable
                      onPress={() => handleTimeChange(habit.id)}
                      style={({ pressed }) => [tw`flex-row items-center justify-between py-3 px-4 bg-slate-50 rounded-xl`, pressed && tw`bg-slate-100`]}
                    >
                      <View style={tw`flex-row items-center`}>
                        <Icon name="clock" size={18} color={tw.color('slate-600')} />
                        <Text style={tw`ml-2 text-slate-700`}>Reminder Time</Text>
                      </View>
                      <View style={tw`flex-row items-center`}>
                        <Text style={tw`text-teal-600 font-medium mr-1`}>{formatTime(habit.notificationTime)}</Text>
                        <Icon name="chevron-right" size={16} color={tw.color('teal-600')} />
                      </View>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        {habits.length > 0 && (
          <View style={tw`px-6 mt-6`}>
            <View style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
              <Text style={tw`text-sm font-medium text-slate-700 mb-3`}>Quick Actions</Text>
              <View style={tw`gap-2`}>
                <Pressable
                  onPress={async () => {
                    for (const habit of habits) {
                      await handleToggleNotification(habit.id, true);
                    }
                  }}
                  style={({ pressed }) => [tw`py-2 px-3 bg-teal-50 rounded-lg`, pressed && tw`bg-teal-100`]}
                >
                  <Text style={tw`text-teal-700 text-center font-medium`}>Enable All Notifications</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    for (const habit of habits) {
                      await handleToggleNotification(habit.id, false);
                    }
                  }}
                  style={({ pressed }) => [tw`py-2 px-3 bg-red-50 rounded-lg`, pressed && tw`bg-red-100`]}
                >
                  <Text style={tw`text-red-700 text-center font-medium`}>Disable All Notifications</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker initialHour={9} initialMinute={0} onConfirm={handleTimeConfirm} onCancel={() => setShowTimePicker(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationManager;
