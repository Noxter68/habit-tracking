// src/screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle, G, Rect, Line, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import tw from '../lib/tailwind';
import { useAuth } from '../context/AuthContext';
import { useHabits } from '../context/HabitContext';
import NotificationManager from '@/components/notifications/NotificationManger';

// SVG Icon Components
const BellIcon = ({ color = '#14b8a6' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C10.897 2 10 2.897 10 4C10 4.276 10.112 4.526 10.293 4.707L11 5.414V8C11 8.265 10.895 8.52 10.707 8.707L9.293 10.121C9.105 10.309 9 10.564 9 10.829V14C9 14.552 9.448 15 10 15H14C14.552 15 15 14.552 15 14V10.829C15 10.564 14.895 10.309 14.707 10.121L13.293 8.707C13.105 8.52 13 8.265 13 8V5.414L13.707 4.707C13.888 4.526 14 4.276 14 4C14 2.897 13.103 2 12 2Z"
      fill={color}
      opacity="0.2"
    />
    <Path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClockIcon = ({ color = '#14b8a6' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" fill={`${color}20`} />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
  </Svg>
);

const VolumeIcon = ({ color = '#14b8a6' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M11 5L6 9H2V15H6L11 19V5Z" fill={`${color}20`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path
      d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 11.995C17.0039 13.3208 16.4774 14.5924 15.54 15.53"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SendIcon = ({ color = '#14b8a6' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2L15 22L11 13L2 9L22 2Z" fill={`${color}20`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const MoonIcon = ({ color = '#14b8a6' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z" fill={`${color}20`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <G opacity="0.5">
      <Circle cx="17" cy="8" r="1" fill={color} />
      <Circle cx="19" cy="11" r="0.5" fill={color} />
      <Circle cx="15" cy="10" r="0.5" fill={color} />
    </G>
  </Svg>
);

const TrashIcon = ({ color = '#ef4444' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5M5 6H21M5 6V20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6H5ZM8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const LogOutIcon = ({ color = '#ef4444' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M16 17L21 12L16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M21 12H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronRightIcon = ({ color = '#94a3b8' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserAvatarIcon = ({ letter = 'U', bgColor = '#ccfbf1', textColor = '#14b8a6' }) => (
  <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
    <Defs>
      <LinearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor={bgColor} />
        <Stop offset="100%" stopColor={textColor} stopOpacity="0.3" />
      </LinearGradient>
    </Defs>
    <Circle cx="32" cy="32" r="30" fill="url(#avatarGradient)" />
    <Circle cx="32" cy="32" r="30" stroke={textColor} strokeWidth="2" opacity="0.2" />
  </Svg>
);

const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { habits } = useHabits();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showNotificationManager, setShowNotificationManager] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
        setDarkMode(parsed.darkMode ?? false);
        setSoundEnabled(parsed.soundEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('appSettings', JSON.stringify(parsed));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await saveSettings('notificationsEnabled', value);

    if (!value) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Notifications Disabled', 'All scheduled notifications have been cancelled.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will delete all your habits and settings. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Data',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.clear();
          Alert.alert('Success', 'All data has been cleared.');
        },
      },
    ]);
  };

  const testNotification = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please enable notifications in your device settings.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'Your notifications are working perfectly!',
        sound: soundEnabled,
      },
      trigger: { seconds: 2 },
    });

    Alert.alert('Test Sent', 'You should receive a notification in 2 seconds.');
  };

  const habitsWithNotifications = habits.filter((h) => h.notifications);

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-50`}>
      <ScrollView style={tw`flex-1`} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={tw`px-6 pt-6 pb-4`}>
          <Text style={tw`text-3xl font-bold text-slate-800`}>Settings</Text>
        </View>

        {/* Profile Section */}
        <View style={tw`px-6 mb-6`}>
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
            <View style={tw`flex-row items-center`}>
              <UserAvatarIcon letter={user?.email?.[0]?.toUpperCase() || 'U'} />
              <View style={tw`ml-4 flex-1`}>
                <Text style={tw`text-lg font-semibold text-slate-800`}>{user?.email?.split('@')[0] || 'User'}</Text>
                <Text style={tw`text-sm text-slate-500`}>{user?.email}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-lg font-semibold text-slate-700 mb-3`}>Notifications</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm`}>
            <View style={tw`p-4 flex-row items-center justify-between border-b border-slate-100`}>
              <View style={tw`flex-row items-center flex-1`}>
                <BellIcon />
                <Text style={tw`ml-3 text-base text-slate-700`}>Enable Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
                thumbColor={notificationsEnabled ? '#14b8a6' : '#f4f4f5'}
              />
            </View>

            {notificationsEnabled && (
              <>
                <Pressable
                  onPress={() => setShowNotificationManager(true)}
                  style={({ pressed }) => [tw`p-4 flex-row items-center justify-between border-b border-slate-100`, pressed && tw`bg-slate-50`]}
                >
                  <View style={tw`flex-row items-center flex-1`}>
                    <ClockIcon />
                    <View style={tw`ml-3 flex-1`}>
                      <Text style={tw`text-base text-slate-700`}>Manage Notifications</Text>
                      <Text style={tw`text-sm text-slate-500 mt-0.5`}>{habitsWithNotifications.length} habits with reminders</Text>
                    </View>
                  </View>
                  <ChevronRightIcon />
                </Pressable>

                <View style={tw`p-4 flex-row items-center justify-between border-b border-slate-100`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <VolumeIcon />
                    <Text style={tw`ml-3 text-base text-slate-700`}>Notification Sound</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={(value) => {
                      setSoundEnabled(value);
                      saveSettings('soundEnabled', value);
                    }}
                    trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
                    thumbColor={soundEnabled ? '#14b8a6' : '#f4f4f5'}
                  />
                </View>

                <Pressable onPress={testNotification} style={({ pressed }) => [tw`p-4 flex-row items-center`, pressed && tw`bg-slate-50`]}>
                  <SendIcon />
                  <Text style={tw`ml-3 text-base text-slate-700`}>Test Notification</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-lg font-semibold text-slate-700 mb-3`}>Appearance</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm`}>
            <View style={tw`p-4 flex-row items-center justify-between`}>
              <View style={tw`flex-row items-center flex-1`}>
                <MoonIcon />
                <Text style={tw`ml-3 text-base text-slate-700`}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={(value) => {
                  setDarkMode(value);
                  saveSettings('darkMode', value);
                }}
                trackColor={{ false: '#cbd5e1', true: '#5eead4' }}
                thumbColor={darkMode ? '#14b8a6' : '#f4f4f5'}
                disabled
              />
            </View>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={tw`px-6 mb-6`}>
          <Text style={tw`text-lg font-semibold text-slate-700 mb-3`}>Data & Privacy</Text>
          <View style={tw`bg-white rounded-2xl shadow-sm`}>
            <Pressable onPress={handleClearData} style={({ pressed }) => [tw`p-4 flex-row items-center border-b border-slate-100`, pressed && tw`bg-slate-50`]}>
              <TrashIcon />
              <Text style={tw`ml-3 text-base text-red-600`}>Clear All Data</Text>
            </Pressable>

            <Pressable onPress={handleSignOut} style={({ pressed }) => [tw`p-4 flex-row items-center`, pressed && tw`bg-slate-50`]}>
              <LogOutIcon />
              <Text style={tw`ml-3 text-base text-red-600`}>Sign Out</Text>
            </Pressable>
          </View>
        </View>

        {/* App Info */}
        <View style={tw`px-6 mb-6`}>
          <View style={tw`items-center`}>
            <Text style={tw`text-sm text-slate-500`}>Habit Tracker v1.0.0</Text>
            <View style={tw`flex-row items-center mt-1`}>
              <Text style={tw`text-xs text-slate-400`}>Made with </Text>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="#14b8a6">
                <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </Svg>
              <Text style={tw`text-xs text-slate-400`}> for better habits</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Notification Manager Modal */}
      <Modal visible={showNotificationManager} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowNotificationManager(false)}>
        <NotificationManager habits={habitsWithNotifications} onClose={() => setShowNotificationManager(false)} />
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;
