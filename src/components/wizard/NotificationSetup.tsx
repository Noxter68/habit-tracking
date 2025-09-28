// src/components/NotificationSetup.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, Alert, Platform } from 'react-native';
import { Bell, Sun, Sunrise, Sunset, Moon, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import TimePicker from '../TimePicker';
import tw from '@/lib/tailwind';

interface NotificationSetupProps {
  enabled: boolean;
  time?: string;
  onChange: (enabled: boolean, time?: string) => void;
}

const NotificationSetup: React.FC<NotificationSetupProps> = ({ enabled, time, onChange }) => {
  const [selectedTime, setSelectedTime] = useState(time || '09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in your device settings to receive habit reminders.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]);
      return false;
    }

    setHasPermission(true);
    return true;
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return; // Don't enable if permission denied
      }
    }
    onChange(value, selectedTime);
  };

  const commonTimes = [
    { label: 'Early Morning', time: '07:00', icon: Sunrise, subtitle: '7:00 AM', color: '#fbbf24' },
    { label: 'Morning', time: '09:00', icon: Sun, subtitle: '9:00 AM', color: '#facc15' },
    { label: 'Evening', time: '18:00', icon: Sunset, subtitle: '6:00 PM', color: '#fb923c' },
    { label: 'Night', time: '21:00', icon: Moon, subtitle: '9:00 PM', color: '#818cf8' },
    { label: 'Custom Time', time: 'custom', icon: Clock, subtitle: 'Choose your time', color: '#14b8a6' },
  ];

  const handleTimeSelect = (timeOption: any) => {
    if (timeOption.time === 'custom') {
      setShowTimePicker(true);
      setIsCustomTime(true);
    } else {
      setSelectedTime(timeOption.time);
      setIsCustomTime(false);
      onChange(enabled, timeOption.time);
    }
  };

  const handleCustomTimeConfirm = (hour: number, minute: number) => {
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setSelectedTime(formattedTime);
    setShowTimePicker(false);
    onChange(enabled, formattedTime);
  };

  const formatDisplayTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={tw`px-5`}>
      {/* Header */}
      <View style={tw`mb-6`}>
        <Text style={tw`text-2xl font-bold text-gray-900 mb-2`}>Stay on Track</Text>
        <Text style={tw`text-gray-600 leading-5`}>Set daily reminders to build consistency</Text>
      </View>

      {/* Main Toggle Card */}
      <View style={tw`bg-white rounded-2xl p-4 border border-gray-100`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center flex-1`}>
            <View style={tw`w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-3`}>
              <Bell size={20} color="#6366f1" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-semibold text-gray-900`}>Daily Reminders</Text>
              <Text style={tw`text-xs text-gray-500 mt-0.5`}>{enabled ? `Reminder at ${formatDisplayTime(selectedTime)}` : 'Get notified daily'}</Text>
            </View>
          </View>
          <Switch value={enabled} onValueChange={handleToggleNotifications} trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }} thumbColor={enabled ? '#6366f1' : '#f9fafb'} />
        </View>

        {/* Time Selection - Only show when enabled */}
        {enabled && (
          <View style={tw`mt-4 pt-4 border-t border-gray-100`}>
            <Text style={tw`text-sm font-medium text-gray-700 mb-3`}>Choose reminder time</Text>

            <View style={tw`gap-2`}>
              {commonTimes.map((timeOption) => {
                const Icon = timeOption.icon;
                const isSelected = timeOption.time === 'custom' ? isCustomTime : selectedTime === timeOption.time && !isCustomTime;

                return (
                  <Pressable
                    key={timeOption.time}
                    onPress={() => handleTimeSelect(timeOption)}
                    style={({ pressed }) => [
                      tw`flex-row items-center p-3 rounded-xl border`,
                      isSelected ? tw`bg-indigo-50 border-indigo-300` : tw`bg-gray-50 border-gray-200`,
                      pressed && tw`opacity-80`,
                    ]}
                  >
                    <View style={[tw`w-10 h-10 rounded-lg items-center justify-center mr-3`, { backgroundColor: isSelected ? timeOption.color + '20' : '#f9fafb' }]}>
                      <Icon size={20} color={isSelected ? timeOption.color : '#9ca3af'} />
                    </View>

                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-sm font-medium`, isSelected ? tw`text-gray-900` : tw`text-gray-700`]}>{timeOption.label}</Text>
                      <Text style={tw`text-xs text-gray-500 mt-0.5`}>{timeOption.time === 'custom' && isCustomTime ? formatDisplayTime(selectedTime) : timeOption.subtitle}</Text>
                    </View>

                    {isSelected && (
                      <View style={tw`w-5 h-5 bg-indigo-600 rounded-full items-center justify-center`}>
                        <View style={tw`w-2 h-2 bg-white rounded-full`} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* Tip Card */}
      <LinearGradient colors={['#fef3c7', '#fde68a']} style={tw`rounded-2xl p-4 mt-4`}>
        <View style={tw`flex-row items-start`}>
          <View style={tw`w-8 h-8 bg-stone-200 rounded-lg items-center justify-center mr-3`}>
            <Text style={tw`text-base`}>💡</Text>
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold text-stone-900 mb-1`}>Best Practice</Text>
            <Text style={tw`text-xs text-stone-800 leading-5`}>
              {enabled
                ? 'Stack your habit with an existing routine. If you chose morning, do it right after brushing your teeth.'
                : 'Reminders increase habit success by 40%. Enable them to stay consistent.'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker
          initialHour={parseInt(selectedTime.split(':')[0])}
          initialMinute={parseInt(selectedTime.split(':')[1])}
          onConfirm={handleCustomTimeConfirm}
          onCancel={() => setShowTimePicker(false)}
        />
      </Modal>
    </View>
  );
};

export default NotificationSetup;
