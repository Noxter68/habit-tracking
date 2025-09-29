import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from 'twrnc';

// Custom Icon Component
const Icon = ({ name, size = 22, color = '#6366F1' }) => {
  const icons = {
    'moon-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'notifications-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'language-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'finger-print-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 11V11.01M8 11V16M8 16C8 18.21 9.79 20 12 20C13.73 20 15.22 19.01 16 17.58M16 11V13M20 11V15C20 16.06 19.58 17.01 18.92 17.72M4 11V13C4 13.34 4.03 13.67 4.09 14"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx="12" cy="11" r="3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'lock-closed-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'shield-checkmark-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'cloud-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'download-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'trash-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'information-circle-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'document-text-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'help-circle-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'log-out-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'chevron-forward': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  };

  return icons[name] || null;
};

const SettingsScreen = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometrics, setBiometrics] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  const handleToggle = (setter, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="dark-content" />

      {/* Quartz Gradient Background */}
      <LinearGradient colors={['#F8F9FD', '#E8EBF7', '#F3F4FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`absolute inset-0`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={tw`px-6 pt-4 pb-2`}>
          <Text style={tw`text-3xl font-bold text-gray-900`}>Settings</Text>
          <Text style={tw`text-sm text-gray-500 mt-1`}>Manage your preferences</Text>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <ProfileHeader />
        </Animated.View>

        {/* Settings Sections */}
        <View style={tw`px-6 mt-6`}>
          <SettingsSection title="Preferences" delay={200}>
            <SettingsItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Easier on the eyes"
              trailing={
                <Switch
                  value={darkMode}
                  onValueChange={(value) => handleToggle(setDarkMode, value)}
                  trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                  thumbColor={darkMode ? '#6366F1' : '#F3F4F6'}
                  ios_backgroundColor="#E2E8F0"
                />
              }
            />
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Stay updated"
              trailing={
                <Switch
                  value={notifications}
                  onValueChange={(value) => handleToggle(setNotifications, value)}
                  trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                  thumbColor={notifications ? '#6366F1' : '#F3F4F6'}
                  ios_backgroundColor="#E2E8F0"
                />
              }
            />
            <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('Language pressed')}
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="Security" delay={300}>
            <SettingsItem
              icon="finger-print-outline"
              title="Biometric Login"
              subtitle="Use Face ID or Touch ID"
              trailing={
                <Switch
                  value={biometrics}
                  onValueChange={(value) => handleToggle(setBiometrics, value)}
                  trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                  thumbColor={biometrics ? '#6366F1' : '#F3F4F6'}
                  ios_backgroundColor="#E2E8F0"
                />
              }
            />
            <SettingsItem
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Manage your data"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('Privacy pressed')}
            />
            <SettingsItem
              icon="shield-checkmark-outline"
              title="Two-Factor Auth"
              subtitle="Extra security layer"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('2FA pressed')}
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="Data" delay={400}>
            <SettingsItem
              icon="cloud-outline"
              title="Auto Backup"
              subtitle="Sync to cloud"
              trailing={
                <Switch
                  value={autoBackup}
                  onValueChange={(value) => handleToggle(setAutoBackup, value)}
                  trackColor={{ false: '#E2E8F0', true: '#A5B4FC' }}
                  thumbColor={autoBackup ? '#6366F1' : '#F3F4F6'}
                  ios_backgroundColor="#E2E8F0"
                />
              }
            />
            <SettingsItem
              icon="download-outline"
              title="Export Data"
              subtitle="Download your information"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('Export pressed')}
            />
            <SettingsItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up space"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('Clear cache pressed')}
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="About" delay={500}>
            <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.0" />
            <SettingsItem icon="document-text-outline" title="Terms of Service" trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />} onPress={() => console.log('Terms pressed')} />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              trailing={<Icon name="chevron-forward" size={20} color="#9CA3AF" />}
              onPress={() => console.log('Help pressed')}
              isLast={true}
            />
          </SettingsSection>

          {/* Sign Out Button */}
          <Animated.View entering={FadeInDown.delay(600).duration(600).springify()} style={tw`mt-8 mb-6`}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                console.log('Sign out pressed');
              }}
              style={tw`bg-red-50 rounded-2xl p-4`}
            >
              <View style={tw`flex-row items-center justify-center`}>
                <Icon name="log-out-outline" size={22} color="#EF4444" />
                <Text style={tw`ml-2 text-red-500 font-semibold text-base`}>Sign Out</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Section Component
const SettingsSection = ({ title, children, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={tw`mb-6`}>
      <Text style={tw`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1`}>{title}</Text>
      <View style={tw`bg-white bg-opacity-80 rounded-2xl overflow-hidden`}>
        {React.Children.map(children, (child, index) => {
          return React.cloneElement(child, {
            isLast: index === React.Children.count(children) - 1,
          });
        })}
      </View>
    </Animated.View>
  );
};

// Settings Item Component
const SettingsItem = ({ icon, title, subtitle, trailing, onPress, isLast = false }) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const content = (
    <>
      <View style={tw`flex-row items-center flex-1`}>
        <View style={tw`w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center mr-4`}>
          <Icon name={icon} size={22} color="#6366F1" />
        </View>
        <View style={tw`flex-1`}>
          <Text style={tw`text-gray-900 font-medium text-base`}>{title}</Text>
          {subtitle && <Text style={tw`text-gray-500 text-sm mt-0.5`}>{subtitle}</Text>}
        </View>
      </View>
      {trailing && <View style={tw`ml-4`}>{trailing}</View>}
    </>
  );

  const containerStyle = tw.style('flex-row items-center px-4 py-3.5', !isLast && 'border-b border-gray-100 border-opacity-50');

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={containerStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

// Profile Header Component
const ProfileHeader = () => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        console.log('Profile pressed');
      }}
      style={tw`mx-6 mt-4`}
    >
      <LinearGradient colors={['#FFFFFF', '#F8F9FD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-4 shadow-sm`}>
        <View style={tw`flex-row items-center`}>
          <LinearGradient colors={['#818CF8', '#A78BFA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-2xl items-center justify-center`}>
            <Text style={tw`text-white text-2xl font-bold`}>JD</Text>
          </LinearGradient>
          <View style={tw`flex-1 ml-4`}>
            <Text style={tw`text-gray-900 font-semibold text-lg`}>John Doe</Text>
            <Text style={tw`text-gray-500 text-sm`}>john.doe@example.com</Text>
            <Text style={tw`text-indigo-500 text-xs mt-1 font-medium`}>Premium Member</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default SettingsScreen;
