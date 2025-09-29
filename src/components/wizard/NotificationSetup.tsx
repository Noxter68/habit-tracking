// src/components/wizard/NotificationSetup.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Pressable, Modal, Alert, Platform, Linking, ImageBackground } from 'react-native';
import { Bell, BellOff, Sun, Sunrise, Sunset, Moon, Clock, Sparkles, Shield } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

  // Animation values
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
    // Animate the switch
    switchScale.value = withSpring(0.9, {}, () => {
      switchScale.value = withSpring(1);
    });

    if (value && !hasPermission) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return;
      }
    }
    onChange(value, selectedTime);
  };

  const timeOptions = [
    {
      label: 'Early Bird',
      time: '06:00',
      icon: Sunrise,
      subtitle: '6:00 AM',
      description: 'Start your day right',
      gradient: ['#FEF3C7', '#FDE68A'],
    },
    {
      label: 'Morning Focus',
      time: '09:00',
      icon: Sun,
      subtitle: '9:00 AM',
      description: 'Post-breakfast energy',
      gradient: ['#FED7AA', '#FDBA74'],
    },
    {
      label: 'Evening Wind Down',
      time: '19:00',
      icon: Sunset,
      subtitle: '7:00 PM',
      description: 'Reflect on your day',
      gradient: ['#E9D5FF', '#C084FC'],
    },
    {
      label: 'Night Routine',
      time: '21:00',
      icon: Moon,
      subtitle: '9:00 PM',
      description: 'Before bedtime ritual',
      gradient: ['#DBEAFE', '#93C5FD'],
    },
    {
      label: 'Custom Time',
      time: 'custom',
      icon: Clock,
      subtitle: 'Your schedule',
      description: 'Pick the perfect time',
      gradient: ['#D1D5DB', '#9CA3AF'],
    },
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
      <Animated.View entering={FadeInDown.duration(500)} style={tw`mb-6`}>
        <Text style={tw`text-2xl font-light text-quartz-800 mb-2`}>Stay Consistent</Text>
        <Text style={tw`text-quartz-600 leading-5`}>Set gentle reminders to maintain your momentum</Text>
      </Animated.View>

      {/* Main Toggle Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)}>
        <LinearGradient colors={enabled ? ['#9CA3AF', '#6B7280'] : ['#F3F4F6', '#E5E7EB']} style={tw`rounded-3xl border border-quartz-200`}>
          <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-5`} imageStyle={{ opacity: enabled ? 0.15 : 0.05, borderRadius: 24 }} resizeMode="cover">
            <View style={tw`flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center flex-1`}>
                <View style={[tw`w-12 h-12 rounded-2xl items-center justify-center mr-4`, enabled ? tw`bg-white/25` : tw`bg-quartz-100`]}>
                  {enabled ? <Bell size={24} color={enabled ? '#FFFFFF' : '#6B7280'} strokeWidth={1.5} /> : <BellOff size={24} color="#6B7280" strokeWidth={1.5} />}
                </View>
                <View style={tw`flex-1`}>
                  <Text style={[tw`text-lg font-medium`, enabled ? tw`text-white` : tw`text-quartz-800`]}>Daily Reminders</Text>
                  <Text style={[tw`text-sm mt-0.5`, enabled ? tw`text-white/80` : tw`text-quartz-600`]}>{enabled ? `Active at ${formatDisplayTime(selectedTime)}` : 'Enable mindful nudges'}</Text>
                </View>
              </View>
              <Animated.View style={toggleAnimation}>
                <Switch
                  value={enabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{
                    false: '#E5E7EB',
                    true: 'rgba(255,255,255,0.3)',
                  }}
                  thumbColor={enabled ? '#FFFFFF' : '#9CA3AF'}
                  ios_backgroundColor="#E5E7EB"
                />
              </Animated.View>
            </View>

            {/* Permission Status Badge */}
            {enabled && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={tw`mt-3`}>
                <View style={[tw`flex-row items-center self-start px-3 py-1.5 rounded-full`, hasPermission ? tw`bg-white/20` : tw`bg-red-500/20`]}>
                  <Shield size={12} color={hasPermission ? '#FFFFFF' : '#EF4444'} strokeWidth={2} />
                  <Text style={[tw`text-xs font-light ml-1.5`, hasPermission ? tw`text-white` : tw`text-red-200`]}>{hasPermission ? 'Notifications Active' : 'Permission Required'}</Text>
                </View>
              </Animated.View>
            )}
          </ImageBackground>
        </LinearGradient>
      </Animated.View>

      {/* Time Selection Grid - Only show when enabled */}
      {enabled && (
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={tw`mt-6`}>
          <Text style={tw`text-sm font-medium text-quartz-700 mb-3`}>Choose your reminder time</Text>

          <View style={tw`gap-2`}>
            {timeOptions.map((timeOption, index) => {
              const Icon = timeOption.icon;
              const isSelected = timeOption.time === 'custom' ? isCustomTime : selectedTime === timeOption.time && !isCustomTime;

              return (
                <Animated.View key={timeOption.time} entering={FadeInDown.delay(index * 60).duration(400)}>
                  <Pressable onPress={() => handleTimeSelect(timeOption)} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`scale-[0.98]`]}>
                    <LinearGradient colors={isSelected ? timeOption.gradient : ['#FFFFFF', '#F9FAFB']} style={tw`border border-quartz-200`}>
                      <View style={tw`p-4 flex-row items-center`}>
                        <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, isSelected ? tw`bg-white/40` : tw`bg-quartz-50`]}>
                          <Icon size={22} color={isSelected ? '#374151' : '#9CA3AF'} strokeWidth={1.5} />
                        </View>

                        <View style={tw`flex-1`}>
                          <View style={tw`flex-row items-center`}>
                            <Text style={[tw`text-base font-medium`, isSelected ? tw`text-quartz-900` : tw`text-quartz-800`]}>{timeOption.label}</Text>
                            {isSelected && (
                              <View style={tw`ml-2 bg-quartz-700/10 px-2 py-0.5 rounded-full`}>
                                <Text style={tw`text-xs text-quartz-700 font-medium`}>Active</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[tw`text-xs mt-0.5`, isSelected ? tw`text-quartz-700` : tw`text-quartz-500`]}>
                            {timeOption.time === 'custom' && isCustomTime ? formatDisplayTime(selectedTime) : timeOption.subtitle} • {timeOption.description}
                          </Text>
                        </View>

                        <View style={[tw`w-6 h-6 rounded-full border-2 items-center justify-center`, isSelected ? tw`border-quartz-700 bg-quartz-700` : tw`border-quartz-300`]}>
                          {isSelected && <View style={tw`w-2.5 h-2.5 bg-white rounded-full`} />}
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      )}

      {/* Smart Tip Card */}
      <Animated.View entering={FadeInDown.delay(500).duration(500)} style={tw`mt-6`}>
        <View style={tw`bg-quartz-50 rounded-2xl overflow-hidden`}>
          <ImageBackground source={require('../../../assets/interface/quartz-texture.png')} style={tw`p-4`} imageStyle={{ opacity: 0.05, borderRadius: 16 }} resizeMode="cover">
            <View style={tw`flex-row items-start`}>
              <View style={tw`w-8 h-8 bg-quartz-100 rounded-lg items-center justify-center mr-3`}>
                <Sparkles size={16} color="#6B7280" strokeWidth={1.5} />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-sm font-medium text-quartz-700 mb-1`}>{enabled ? 'Habit Stacking Tip' : 'Why Reminders Work'}</Text>
                <Text style={tw`text-xs text-quartz-600 leading-5`}>
                  {enabled
                    ? `Link this habit to an existing routine. ${
                        selectedTime.startsWith('06') || selectedTime.startsWith('07') || selectedTime.startsWith('08') || selectedTime.startsWith('09')
                          ? 'Morning habits work best after established routines like brushing teeth or having coffee.'
                          : selectedTime.startsWith('18') || selectedTime.startsWith('19') || selectedTime.startsWith('20')
                          ? 'Evening habits are perfect after dinner or during your wind-down routine.'
                          : 'Choose a trigger moment that already happens daily in your life.'
                      }`
                    : 'Studies show reminders increase habit completion by 40%. They act as environmental cues that trigger automatic behavior.'}
                </Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </Animated.View>

      {/* Stats Card when enabled */}
      {enabled && (
        <Animated.View entering={FadeInDown.delay(600).duration(500)} style={tw`mt-3`}>
          <LinearGradient colors={['#6B7280', '#4B5563']} style={tw`rounded-2xl p-3`}>
            <View style={tw`flex-row justify-around`}>
              <View style={tw`items-center`}>
                <Text style={tw`text-white/60 text-xs font-light`}>Success Rate</Text>
                <Text style={tw`text-white text-lg font-semibold mt-0.5`}>+40%</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-white/60 text-xs font-light`}>Best Time</Text>
                <Text style={tw`text-white text-lg font-semibold mt-0.5`}>Morning</Text>
              </View>
              <View style={tw`w-px bg-white/20`} />
              <View style={tw`items-center`}>
                <Text style={tw`text-white/60 text-xs font-light`}>Avg Streak</Text>
                <Text style={tw`text-white text-lg font-semibold mt-0.5`}>21 days</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

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
