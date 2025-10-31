// src/components/wizard/NotificationSetup.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, Alert, Platform, Linking } from 'react-native';
import { Bell, BellOff, Sun, Sunrise, Sunset, Moon, Clock, Sparkles, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import TimePicker from '../TimePicker';
import tw from '@/lib/tailwind';
import { quotes, tips } from '@/utils/habitHelpers';

interface NotificationSetupProps {
  enabled: boolean;
  time?: string;
  onChange: (enabled: boolean, time?: string) => void;
}

const NotificationSetup: React.FC<NotificationSetupProps> = ({ enabled, time, onChange }) => {
  const [selectedTime, setSelectedTime] = useState(time || '09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const switchScale = useSharedValue(1);
  const toggleAnimation = useAnimatedStyle(() => ({
    transform: [{ scale: switchScale.value }],
  }));

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
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return false;
    }

    setHasPermission(true);
    return true;
  };

  const handleToggle = async () => {
    if (!enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        switchScale.value = withSpring(1.1, {}, () => {
          switchScale.value = withSpring(1);
        });
        onChange(true, selectedTime);
      }
    } else {
      onChange(false);
    }
  };

  const quickTimes = [
    { time: '07:00', label: 'Morning', icon: Sunrise, description: 'Start fresh' },
    { time: '09:00', label: 'Mid-Morning', icon: Sun, description: 'After breakfast' },
    { time: '18:00', label: 'Evening', icon: Sunset, description: 'After work' },
    { time: '21:00', label: 'Night', icon: Moon, description: 'Before bed' },
  ];

  const handleQuickTime = (time: string) => {
    setSelectedTime(time);
    onChange(enabled, time);
  };

  const handleCustomTimeConfirm = (hour: number, minute: number) => {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    setSelectedTime(timeStr);
    onChange(enabled, timeStr);
    setShowTimePicker(false);
  };

  // Check if selected time is one of the quick times
  const isQuickTime = quickTimes.some((qt) => qt.time === selectedTime);

  // Format time for display (12-hour format with AM/PM)
  const formatTime = (timeStr: string) => {
    const [hourStr, minuteStr] = timeStr.split(':');
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={tw`px-5`}>
      {/* Header with Quote Integrated */}
      <View style={tw`mb-5`}>
        <LinearGradient colors={['#fbbf24', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-5 shadow-lg`}>
          <Text style={tw`text-2xl font-light text-white mb-1.5 tracking-tight`}>Stay on Track</Text>
          <Text style={tw`text-sm text-white/90 leading-5 mb-3`}>Set up reminders to build consistency</Text>

          {/* Integrated Quote */}
          <View style={tw`border-t border-white/20 pt-3 mt-1`}>
            <Text style={tw`text-xs text-white/70 italic leading-5`}>"{quotes.notification.text}"</Text>
            <Text style={tw`text-xs text-white/60 font-medium mt-1`}>— {quotes.notification.author}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Main Toggle Card */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={tw`mb-4`}>
        <View style={[tw`bg-white rounded-2xl p-5 shadow-sm`, { borderWidth: 1, borderColor: '#e5e7eb' }]}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-12 h-12 rounded-xl bg-amber-50 items-center justify-center mr-4`}>
                {enabled ? <Bell size={24} color="#f59e0b" strokeWidth={2} /> : <BellOff size={24} color="#9ca3af" strokeWidth={2} />}
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-lg font-semibold text-stone-800 mb-1`}>{enabled ? 'Reminders Enabled' : 'Enable Reminders'}</Text>
                <Text style={tw`text-sm text-stone-600`}>{enabled ? 'You will receive daily notifications' : 'Get notified to stay consistent'}</Text>
              </View>
            </View>
            <Animated.View style={toggleAnimation}>
              <Switch value={enabled} onValueChange={handleToggle} trackColor={{ false: '#e5e7eb', true: '#fbbf24' }} thumbColor={enabled ? '#ffffff' : '#f3f4f6'} />
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Quick Time Selection */}
      {enabled && (
        <Animated.View entering={FadeInDown.delay(300).duration(500)} style={tw`mb-4`}>
          <Text style={tw`text-sm font-medium text-stone-700 mb-3`}>Choose your reminder time:</Text>
          <View style={tw`gap-2`}>
            {quickTimes.map((qt, index) => {
              const Icon = qt.icon;
              const isSelected = selectedTime === qt.time;

              return (
                <Pressable
                  key={qt.time}
                  onPress={() => handleQuickTime(qt.time)}
                  style={({ pressed }) => [tw`rounded-xl overflow-hidden`, { borderWidth: 1, borderColor: isSelected ? '#fde68a' : '#e5e7eb' }, pressed && tw`opacity-90`]}
                >
                  <View style={[tw`p-4 flex-row items-center`, isSelected ? tw`bg-amber-50` : tw`bg-white`]}>
                    <View style={[tw`w-10 h-10 rounded-lg items-center justify-center mr-3`, isSelected ? tw`bg-amber-100` : tw`bg-stone-50`]}>
                      <Icon size={20} color={isSelected ? '#f59e0b' : '#9ca3af'} strokeWidth={2} />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={[tw`text-base font-semibold`, isSelected ? tw`text-amber-900` : tw`text-stone-800`]}>{qt.label}</Text>
                      <Text style={[tw`text-sm`, isSelected ? tw`text-amber-700` : tw`text-stone-600`]}>
                        {qt.time} • {qt.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={tw`w-5 h-5 rounded-full bg-amber-500 items-center justify-center`}>
                        <View style={tw`w-2 h-2 bg-white rounded-full`} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}

            {/* Custom Time Button */}
            <Pressable
              onPress={() => setShowTimePicker(true)}
              style={({ pressed }) => [tw`rounded-xl overflow-hidden`, { borderWidth: 1, borderColor: !isQuickTime ? '#fde68a' : '#e5e7eb' }, pressed && tw`opacity-90`]}
            >
              <View style={[tw`p-4 flex-row items-center`, !isQuickTime ? tw`bg-amber-50` : tw`bg-white`]}>
                <View style={[tw`w-10 h-10 rounded-lg items-center justify-center mr-3`, !isQuickTime ? tw`bg-amber-100` : tw`bg-stone-50`]}>
                  <Clock size={20} color={!isQuickTime ? '#f59e0b' : '#9ca3af'} strokeWidth={2} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-base font-semibold`, !isQuickTime ? tw`text-amber-900` : tw`text-stone-800`]}>Custom Time</Text>
                  {!isQuickTime && <Text style={tw`text-sm text-amber-700 mt-0.5`}>{formatTime(selectedTime)}</Text>}
                </View>
                {!isQuickTime && (
                  <View style={tw`w-5 h-5 rounded-full bg-amber-500 items-center justify-center`}>
                    <View style={tw`w-2 h-2 bg-white rounded-full`} />
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Stats Card */}
      {enabled && (
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={tw`mb-6`}>
          <LinearGradient colors={['#fbbf24', '#f59e0b']} style={tw`rounded-2xl p-4`}>
            <View style={tw`flex-row justify-around`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-white/70 text-xs font-light`}>Success Rate</Text>
                <Text style={tw`text-white text-lg font-bold mt-0.5`}>+40%</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-white/70 text-xs font-light`}>Best Time</Text>
                <Text style={tw`text-white text-lg font-bold mt-0.5`}>Morning</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-white/70 text-xs font-light`}>Avg Streak</Text>
                <Text style={tw`text-white text-lg font-bold mt-0.5`}>21 days</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Professional Tip */}
      <View style={[tw`bg-blue-50 rounded-2xl p-4`, { borderLeftWidth: 3, borderLeftColor: '#3b82f6' }]}>
        <View style={tw`flex-row items-center mb-2`}>
          <TrendingUp size={18} color="#3b82f6" strokeWidth={2} style={tw`mr-2`} />
          <Text style={tw`text-sm font-semibold text-blue-900`}>{tips.notification[1].title}</Text>
        </View>
        <Text style={tw`text-sm text-blue-800 leading-5`}>
          {enabled
            ? selectedTime.startsWith('07') || selectedTime.startsWith('08') || selectedTime.startsWith('09')
              ? `${tips.notification[1].content.split('.')[0]}. Great choice for building willpower!`
              : selectedTime.startsWith('18') || selectedTime.startsWith('19') || selectedTime.startsWith('20')
              ? 'Evening habits are perfect after dinner or during your wind-down routine.'
              : 'Choose a trigger moment that already happens daily in your life for best results.'
            : tips.notification[0].content}
        </Text>
      </View>

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
