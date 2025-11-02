// src/components/wizard/NotificationSetup.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, Alert, Platform, ScrollView } from 'react-native';
import { Bell, BellOff, Sun, Sunrise, Moon, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
      Alert.alert('Permission Required', 'Please enable notifications in your device settings.', [{ text: 'OK' }]);
      return false;
    }

    setHasPermission(true);
    return true;
  };

  const handleToggle = async (value: boolean) => {
    if (value && !hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    onChange(value, selectedTime);
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const newTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setSelectedTime(newTime);
    onChange(enabled, newTime);
    setShowTimePicker(false);
  };

  const quickTimes = [
    { time: '07:00', label: 'Morning', subtitle: '7:00 AM', icon: Sunrise },
    { time: '12:00', label: 'Noon', subtitle: '12:00 PM', icon: Sun },
    { time: '18:00', label: 'Evening', subtitle: '6:00 PM', icon: Moon },
  ];

  return (
    <View style={tw`flex-1 justify-center`}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 py-8`}>
        {/* Header */}
        <View style={tw`mb-10`}>
          <Text style={tw`text-3xl font-bold text-white text-center mb-3`}>Daily Reminders</Text>
          <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>Get gentle nudges to stay on track</Text>
        </View>

        {/* Enable/Disable Toggle */}
        <View style={tw`bg-white/15 border-2 border-white/20 rounded-2xl p-5 mb-6`}>
          <View style={tw`flex-row items-center justify-between mb-3`}>
            <View style={tw`flex-row items-center flex-1`}>
              {enabled ? <Bell size={24} color="#10b981" strokeWidth={2} style={tw`mr-3`} /> : <BellOff size={24} color="rgba(255, 255, 255, 0.5)" strokeWidth={2} style={tw`mr-3`} />}
              <View style={tw`flex-1`}>
                <Text style={tw`text-base font-semibold text-white mb-0.5`}>{enabled ? 'Notifications On' : 'Notifications Off'}</Text>
                <Text style={tw`text-sm text-white/70`}>{enabled ? 'Daily reminder active' : 'No reminders'}</Text>
              </View>
            </View>
            <Switch value={enabled} onValueChange={handleToggle} trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: '#10b981' }} thumbColor="#ffffff" />
          </View>
        </View>

        {/* Time Selection (only if enabled) */}
        {enabled && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Quick Time Options */}
            <Text style={tw`text-sm font-medium text-white/90 mb-3`}>Quick select:</Text>
            <View style={tw`gap-2 mb-6`}>
              {quickTimes.map((quickTime, index) => {
                const Icon = quickTime.icon;
                const isSelected = selectedTime === quickTime.time;

                return (
                  <Animated.View key={quickTime.time} entering={FadeInDown.delay(index * 30).duration(300)}>
                    <Pressable
                      onPress={() => {
                        setSelectedTime(quickTime.time);
                        onChange(true, quickTime.time);
                      }}
                      style={({ pressed }) => [
                        tw`rounded-2xl p-4 flex-row items-center border-2 ${isSelected ? 'border-amber-400/60' : 'border-white/10'}`,
                        { backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
                        pressed && tw`opacity-80`,
                      ]}
                    >
                      <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3`, { backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.1)' }]}>
                        <Icon size={20} color="#ffffff" strokeWidth={2} />
                      </View>

                      <View style={tw`flex-1`}>
                        <Text style={tw`text-base font-semibold text-white`}>{quickTime.label}</Text>
                        <Text style={tw`text-sm text-white/70`}>{quickTime.subtitle}</Text>
                      </View>

                      {isSelected && (
                        <View style={tw`w-6 h-6 rounded-full bg-amber-500 items-center justify-center`}>
                          <View style={tw`w-3 h-3 rounded-full bg-white`} />
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>

            {/* Custom Time Button */}
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={({ pressed }) => [tw`rounded-2xl p-4 flex-row items-center justify-center bg-white/15 border-2 border-white/20`, pressed && tw`opacity-70`]}
            >
              <Clock size={20} color="#ffffff" strokeWidth={2} style={tw`mr-2`} />
              <Text style={tw`text-white font-semibold`}>Choose Custom Time</Text>
            </Pressable>

            {/* Current Time Display */}
            <View style={tw`mt-4 bg-emerald-500/20 border-2 border-emerald-400/30 rounded-2xl p-4`}>
              <Text style={tw`text-sm text-white/70 text-center mb-1`}>You'll be reminded at</Text>
              <Text style={tw`text-2xl font-bold text-white text-center`}>{selectedTime}</Text>
            </View>
          </Animated.View>
        )}

        {/* Tip */}
        <View style={tw`mt-8`}>
          <Text style={tw`text-xs text-white/50 text-center font-light italic leading-5`}>
            {enabled ? 'Choose a time that fits naturally into your routine' : 'You can always enable reminders later in settings'}
          </Text>
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <TimePicker initialHour={parseInt(selectedTime.split(':')[0])} initialMinute={parseInt(selectedTime.split(':')[1])} onConfirm={handleTimeChange} onCancel={() => setShowTimePicker(false)} />
      </Modal>
    </View>
  );
};

export default NotificationSetup;
