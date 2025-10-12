import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from 'twrnc';

// Custom Icon Component with Sand/Stone colors
const Icon = ({ name, size = 22, color = '#726454' }) => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF9F7' }}>
      <StatusBar barStyle="dark-content" />

      {/* Calm Sand Gradient Background */}
      <LinearGradient colors={['#FAF9F7', '#F5F2ED', '#FAF9F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 30, fontWeight: '700', color: '#44403c' }}>Settings</Text>
          <Text style={{ fontSize: 14, color: '#A89885', marginTop: 4 }}>Manage your preferences</Text>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <ProfileHeader />
        </Animated.View>

        {/* Settings Sections */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <SettingsSection title="Preferences" delay={200}>
            <SettingsItem
              icon="moon-outline"
              title="Dark Mode"
              subtitle="Easier on the eyes"
              trailing={
                <Switch
                  value={darkMode}
                  onValueChange={(value) => handleToggle(setDarkMode, value)}
                  trackColor={{ false: '#E8E3DB', true: '#D6CEC1' }}
                  thumbColor={darkMode ? '#726454' : '#FFFFFF'}
                  ios_backgroundColor="#E8E3DB"
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
                  trackColor={{ false: '#E8E3DB', true: '#D6CEC1' }}
                  thumbColor={notifications ? '#726454' : '#FFFFFF'}
                  ios_backgroundColor="#E8E3DB"
                />
              }
            />
            <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
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
                  trackColor={{ false: '#E8E3DB', true: '#D6CEC1' }}
                  thumbColor={biometrics ? '#726454' : '#FFFFFF'}
                  ios_backgroundColor="#E8E3DB"
                />
              }
            />
            <SettingsItem
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Manage your data"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
              onPress={() => console.log('Privacy pressed')}
            />
            <SettingsItem
              icon="shield-checkmark-outline"
              title="Two-Factor Auth"
              subtitle="Extra security layer"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
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
                  trackColor={{ false: '#E8E3DB', true: '#D6CEC1' }}
                  thumbColor={autoBackup ? '#726454' : '#FFFFFF'}
                  ios_backgroundColor="#E8E3DB"
                />
              }
            />
            <SettingsItem
              icon="download-outline"
              title="Export Data"
              subtitle="Download your information"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
              onPress={() => console.log('Export pressed')}
            />
            <SettingsItem
              icon="trash-outline"
              title="Clear Cache"
              subtitle="Free up space"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
              onPress={() => console.log('Clear cache pressed')}
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="About" delay={500}>
            <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.0" />
            <SettingsItem icon="document-text-outline" title="Terms of Service" trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />} onPress={() => console.log('Terms pressed')} />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              trailing={<Icon name="chevron-forward" size={20} color="#BFB3A3" />}
              onPress={() => console.log('Help pressed')}
              isLast={true}
            />
          </SettingsSection>

          {/* Sign Out Button */}
          <Animated.View entering={FadeInDown.delay(600).duration(600).springify()} style={{ marginTop: 32, marginBottom: 24 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                console.log('Sign out pressed');
              }}
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#FEE2E2',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="log-out-outline" size={22} color="#DC2626" />
                <Text style={{ marginLeft: 8, color: '#DC2626', fontWeight: '600', fontSize: 16 }}>Sign Out</Text>
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
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={{ marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: '#A89885',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 12,
          marginLeft: 4,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#726454',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
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
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View
          style={{
            width: 44,
            height: 44,
            backgroundColor: '#F5F2ED',
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Icon name={icon} size={22} color="#726454" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#44403c', fontWeight: '500', fontSize: 16 }}>{title}</Text>
          {subtitle && <Text style={{ color: '#A89885', fontSize: 14, marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
      {trailing && <View style={{ marginLeft: 16 }}>{trailing}</View>}
    </>
  );

  const containerStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...(!isLast && {
      borderBottomWidth: 1,
      borderBottomColor: '#F5F2ED',
    }),
  };

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
      style={{ marginHorizontal: 24, marginTop: 16 }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 20,
          shadowColor: '#726454',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={['#D6CEC1', '#BFB3A3', '#A89885']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>JD</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: '#44403c', fontWeight: '600', fontSize: 18 }}>John Doe</Text>
            <Text style={{ color: '#A89885', fontSize: 14, marginTop: 2 }}>john.doe@example.com</Text>
            <Text style={{ color: '#726454', fontSize: 12, marginTop: 4, fontWeight: '500' }}>Premium Member</Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#BFB3A3" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SettingsScreen;
