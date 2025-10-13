import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from 'twrnc';

// Custom Icon Component
const Icon = ({ name, size = 22, color = '#9333EA' }) => {
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
    'cloud-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'information-circle-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ backgroundColor: 'rgba(147, 51, 234, 0.1)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#9333EA', letterSpacing: 2 }}>PREFERENCES</Text>
            </View>
            <Text style={{ fontSize: 40, fontWeight: '900', color: '#1F2937', letterSpacing: -1.5, textAlign: 'center' }}>Settings</Text>
          </View>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <ProfileHeader />
        </Animated.View>

        {/* Settings Sections */}
        <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
          <SettingsSection title="General" delay={200} gradient={['#9333EA', '#7C3AED']}>
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              color="#9333EA"
              trailing={
                <Switch
                  value={notifications}
                  onValueChange={(value) => handleToggle(setNotifications, value)}
                  trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                  thumbColor={notifications ? '#9333EA' : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                />
              }
            />
            <SettingsItem
              icon="moon-outline"
              title="Dark Mode"
              color="#9333EA"
              trailing={
                <Switch
                  value={darkMode}
                  onValueChange={(value) => handleToggle(setDarkMode, value)}
                  trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                  thumbColor={darkMode ? '#9333EA' : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                />
              }
            />
            <SettingsItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              color="#9333EA"
              trailing={<Icon name="chevron-forward" size={20} color="#9333EA" />}
              onPress={() => console.log('Language pressed')}
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="Security" delay={300} gradient={['#DC2626', '#B91C1C']}>
            <SettingsItem
              icon="finger-print-outline"
              title="Biometric Login"
              color="#DC2626"
              trailing={
                <Switch
                  value={biometrics}
                  onValueChange={(value) => handleToggle(setBiometrics, value)}
                  trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                  thumbColor={biometrics ? '#DC2626' : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                />
              }
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="Data" delay={400} gradient={['#06B6D4', '#0891B2']}>
            <SettingsItem
              icon="cloud-outline"
              title="Auto Backup"
              color="#06B6D4"
              trailing={
                <Switch
                  value={autoBackup}
                  onValueChange={(value) => handleToggle(setAutoBackup, value)}
                  trackColor={{ false: '#E5E7EB', true: '#67E8F9' }}
                  thumbColor={autoBackup ? '#06B6D4' : '#FFFFFF'}
                  ios_backgroundColor="#E5E7EB"
                />
              }
              isLast={true}
            />
          </SettingsSection>

          <SettingsSection title="Support" delay={500} gradient={['#EC4899', '#DB2777']}>
            <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.0" color="#EC4899" />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              color="#EC4899"
              trailing={<Icon name="chevron-forward" size={20} color="#EC4899" />}
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
            >
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  shadowColor: '#DC2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="log-out-outline" size={22} color="#FFFFFF" />
                  <Text style={{ marginLeft: 10, color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>Sign Out</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Settings Section Component
const SettingsSection = ({ title, children, delay = 0, gradient }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 4 }}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 3, height: 12, borderRadius: 2 }} />
        <Text style={{ fontSize: 11, fontWeight: '800', color: gradient[0], textTransform: 'uppercase', letterSpacing: 1.5 }}>{title}</Text>
      </View>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: gradient[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
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
const SettingsItem = ({ icon, title, subtitle, trailing, onPress, isLast = false, color }) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const content = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{ width: 40, height: 40, backgroundColor: `${color}15`, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
          <Icon name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1F2937', fontWeight: '600', fontSize: 15 }}>{title}</Text>
          {subtitle && <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 2 }}>{subtitle}</Text>}
        </View>
      </View>
      {trailing && <View style={{ marginLeft: 12 }}>{trailing}</View>}
    </>
  );

  const containerStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...(!isLast && {
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
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
      style={{ marginHorizontal: 24 }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: 20,
          shadowColor: '#9333EA',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={['#9333EA', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '800' }}>JD</Text>
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={{ color: '#1F2937', fontWeight: '700', fontSize: 18 }}>John Doe</Text>
            <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>john.doe@example.com</Text>
            <View style={{ marginTop: 6 }}>
              <LinearGradient
                colors={['#9333EA', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>PREMIUM</Text>
              </LinearGradient>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#9333EA" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default SettingsScreen;
