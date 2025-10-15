import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import tw from 'twrnc';
import { useAuth } from '@/context/AuthContext';

// Types
interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

type IconName = 'notifications-outline' | 'language-outline' | 'information-circle-outline' | 'help-circle-outline' | 'log-out-outline' | 'chevron-forward';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
  gradient: [string, string];
}

interface SettingsItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  color: string;
}

// Custom Icon Component
const Icon: React.FC<IconProps> = ({ name, size = 22, color = '#9333EA' }) => {
  const icons: Record<IconName, JSX.Element> = {
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

// Profile Header Component
const ProfileHeader: React.FC = () => {
  const handleProfilePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Profile pressed');
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleProfilePress} style={tw`mx-6`}>
      <View style={tw`bg-white rounded-3xl p-5 shadow-lg`}>
        <View style={tw`flex-row items-center`}>
          <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-2xl items-center justify-center`}>
            <Text style={tw`text-white text-2xl font-extrabold`}>JD</Text>
          </LinearGradient>

          <View style={tw`flex-1 ml-4`}>
            <Text style={tw`text-gray-800 font-bold text-lg`}>John Doe</Text>
            <Text style={tw`text-gray-500 text-sm mt-0.5`}>john.doe@example.com</Text>

            <View style={tw`mt-1.5`}>
              <LinearGradient colors={['#9333EA', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`px-2.5 py-1 rounded-lg self-start`}>
                <Text style={tw`text-white text-xs font-bold tracking-wide`}>PREMIUM</Text>
              </LinearGradient>
            </View>
          </View>

          <Icon name="chevron-forward" size={20} color="#9333EA" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Settings Section Component
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, delay = 0, gradient }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={tw`mb-6`}>
      <View style={tw`flex-row items-center gap-2 mb-3 ml-1`}>
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-0.75 h-3 rounded-sm`} />
        <Text style={[tw`text-xs font-extrabold uppercase tracking-widest`, { color: gradient[0] }]}>{title}</Text>
      </View>

      <View style={tw`bg-white rounded-2xl overflow-hidden shadow-md`}>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement<SettingsItemProps>(child)) {
            return React.cloneElement(child, {
              isLast: index === React.Children.count(children) - 1,
            });
          }
          return child;
        })}
      </View>
    </Animated.View>
  );
};

// Settings Item Component
const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, trailing, onPress, isLast = false, color }) => {
  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const content = (
    <>
      <View style={tw`flex-row items-center flex-1`}>
        <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3.5`, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={20} color={color} />
        </View>

        <View style={tw`flex-1`}>
          <Text style={tw`text-gray-800 font-semibold text-base`}>{title}</Text>
          {subtitle && <Text style={tw`text-gray-400 text-xs mt-0.5`}>{subtitle}</Text>}
        </View>
      </View>

      {trailing && <View style={tw`ml-3`}>{trailing}</View>}
    </>
  );

  const containerStyle = [tw`flex-row items-center px-4 py-4`, !isLast && tw`border-b border-gray-100`];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress} style={containerStyle}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

// Main Settings Screen
const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const { signOut, loading } = useAuth();

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setter(value);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#FAF9F7]`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={tw`px-6 pt-15 pb-8`}>
          <View style={tw`items-center`}>
            <View style={tw`bg-purple-100 px-5 py-2 rounded-2xl mb-3`}>
              <Text style={tw`text-xs font-bold text-purple-600 tracking-widest`}>PREFERENCES</Text>
            </View>
            <Text style={tw`text-4xl font-black text-gray-800 text-center`}>Settings</Text>
          </View>
        </Animated.View>

        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <ProfileHeader />
        </Animated.View>

        {/* Settings Sections */}
        <View style={tw`px-6 mt-8`}>
          {/* General Section */}
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
              icon="language-outline"
              title="Language"
              subtitle="English"
              color="#9333EA"
              trailing={<Icon name="chevron-forward" size={20} color="#9333EA" />}
              onPress={() => console.log('Language pressed')}
              isLast
            />
          </SettingsSection>

          {/* Support Section */}
          <SettingsSection title="Support" delay={300} gradient={['#EC4899', '#DB2777']}>
            <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.0" color="#EC4899" />
            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              color="#EC4899"
              trailing={<Icon name="chevron-forward" size={20} color="#EC4899" />}
              onPress={() => console.log('Help pressed')}
              isLast
            />
          </SettingsSection>

          {/* Sign Out Button */}
          <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} style={tw`mt-8 mb-6`}>
            <TouchableOpacity activeOpacity={0.8} disabled={loading} onPress={handleSignOut}>
              <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[tw`rounded-2xl p-4.5 shadow-lg`, { opacity: loading ? 0.6 : 1 }]}>
                <View style={tw`flex-row items-center justify-center`}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Icon name="log-out-outline" size={22} color="#FFFFFF" />
                      <Text style={tw`ml-2.5 text-white font-bold text-base tracking-wide`}>Sign Out</Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
