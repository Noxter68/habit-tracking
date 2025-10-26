// src/screens/SettingsScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from 'twrnc';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { HolidayModeService, HolidayPeriod } from '@/services/holidayModeService';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

type IconName =
  | 'notifications-outline'
  | 'language-outline'
  | 'information-circle-outline'
  | 'help-circle-outline'
  | 'log-out-outline'
  | 'chevron-forward'
  | 'crown'
  | 'sparkles'
  | 'credit-card'
  | 'beach-outline';

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

// ============================================================================
// Icon Components
// ============================================================================

const Icon: React.FC<IconProps> = ({ name, size = 22, color = '#9333EA' }) => {
  const icons: Record<IconName, JSX.Element> = {
    'notifications-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9zM13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'language-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
        <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke={color} strokeWidth={2} />
      </Svg>
    ),
    'information-circle-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
        <Path d="M12 16v-4M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    'help-circle-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
        <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    'log-out-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    'chevron-forward': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    crown: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M2 8l2 9h16l2-9-5 3-5-5-5 5-5-3z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill={`${color}20`} />
        <Circle cx="12" cy="3" r="1.5" fill={color} />
        <Circle cx="7" cy="11" r="1.5" fill={color} />
        <Circle cx="17" cy="11" r="1.5" fill={color} />
      </Svg>
    ),
    sparkles: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill={color} />
        <Path d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" fill={color} />
        <Path d="M5 16l.5 1.5L7 18l-1.5.5L5 20l-.5-1.5L3 18l1.5-.5L5 16z" fill={color} />
      </Svg>
    ),
    'credit-card': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth={2} />
        <Path d="M2 10h20" stroke={color} strokeWidth={2} />
      </Svg>
    ),
    'beach-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3L4 9h16l-8-6zm-8 8v10h16V11H4zm8 8c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
  };

  return icons[name] || null;
};

// ============================================================================
// Profile Header Component
// ============================================================================

const ProfileHeader: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  // Get user initials
  const getInitials = () => {
    const email = user?.email || 'User';
    return email.substring(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={tw`mx-6 mb-6`}>
      <View style={tw`bg-white rounded-3xl p-6 shadow-lg`}>
        <View style={tw`flex-row items-center`}>
          {/* Avatar */}
          <LinearGradient
            colors={isPremium ? ['#78716C', '#57534E'] : ['#9CA3AF', '#6B7280']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`w-16 h-16 rounded-2xl items-center justify-center`}
          >
            <Text style={tw`text-white text-2xl font-extrabold`}>{getInitials()}</Text>
          </LinearGradient>

          {/* User Info */}
          <View style={tw`flex-1 ml-4`}>
            <View style={tw`flex-row items-center mb-1`}>
              <Text style={tw`text-gray-800 font-bold text-lg`}>{getDisplayName()}</Text>
              {isPremium && (
                <View style={tw`ml-2`}>
                  <Icon name="crown" size={18} color="#D4AF37" />
                </View>
              )}
            </View>

            <Text style={tw`text-gray-500 text-sm mb-1`}>{user?.email || 'user@example.com'}</Text>

            {/* Status Badge */}
            <View style={tw`mt-1`}>
              {isPremium ? (
                <View style={tw`px-2.5 py-1 bg-stone-100 rounded-lg self-start`}>
                  <Text style={tw`text-stone-700 text-xs font-bold`}>Premium Active</Text>
                </View>
              ) : (
                <View style={tw`px-2.5 py-1 bg-gray-100 rounded-lg self-start`}>
                  <Text style={tw`text-gray-600 text-xs font-bold`}>Free Plan</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Settings Section Component
// ============================================================================

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

// ============================================================================
// Settings Item Component
// ============================================================================

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
        <View style={tw`w-10 h-10 bg-gray-50 rounded-xl items-center justify-center`}>
          <Icon name={icon} size={20} color={color} />
        </View>

        <View style={tw`flex-1 ml-3`}>
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

// ============================================================================
// Main Settings Screen
// ============================================================================

const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);

  const { signOut, loading, user } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const loadHolidayStatus = async () => {
      if (user) {
        const holiday = await HolidayModeService.getActiveHoliday(user.id);
        setActiveHoliday(holiday);
      }
    };

    loadHolidayStatus();
  }, [user]);

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

  /**
   * Open iOS subscription management settings
   */
  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPremium) {
      // Open App Store subscription management
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      // Navigate to paywall for upgrade
      navigation.navigate('Paywall', { source: 'settings' });
    }
  };

  /**
   * Get holiday mode subtitle with days remaining
   */
  const getHolidaySubtitle = () => {
    if (!activeHoliday) {
      return 'Pause habits without losing streaks';
    }

    const daysRemaining = activeHoliday.daysRemaining || 0;

    if (daysRemaining === 0) {
      return 'Ending today';
    } else if (daysRemaining === 1) {
      return '1 day remaining';
    } else {
      return `${daysRemaining} days remaining`;
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#FAF9F7]`}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={tw`px-6 pt-15 pb-8`}>
          <View style={tw`items-center`}>
            <View style={tw`bg-stone-100 px-5 py-2 rounded-2xl mb-3`}>
              <Text style={tw`text-xs font-bold text-stone-600 tracking-widest`}>PREFERENCES</Text>
            </View>
            <Text style={tw`text-4xl font-black text-gray-800 text-center`}>Settings</Text>
          </View>
        </Animated.View>

        {/* Profile Card */}
        <ProfileHeader />

        {/* Settings Sections */}
        <View style={tw`px-6`}>
          {/* Subscription Section */}
          <SettingsSection title="Subscription" delay={200} gradient={['#78716C', '#57534E']}>
            <SettingsItem
              icon={isPremium ? 'credit-card' : 'sparkles'}
              title={isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
              subtitle={isPremium ? 'Cancel or change your plan' : 'Unlock unlimited habits & features'}
              onPress={handleManageSubscription}
              trailing={
                isPremium ? (
                  <Icon name="chevron-forward" size={20} color="#78716C" />
                ) : (
                  <View style={tw`px-3 py-1.5 bg-stone-700 rounded-lg`}>
                    <Text style={tw`text-white text-xs font-bold`}>UPGRADE</Text>
                  </View>
                )
              }
              color="#78716C"
              isLast
            />
          </SettingsSection>

          {/* Holiday Mode Section */}
          <SettingsSection title="Break Mode" delay={200} gradient={['#6366F1', '#4F46E5']}>
            <SettingsItem
              icon="beach-outline"
              title="Holiday Mode"
              subtitle={getHolidaySubtitle()}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('HolidayMode');
              }}
              trailing={
                activeHoliday ? (
                  <View style={tw`px-3 py-1.5 bg-indigo-600 rounded-lg`}>
                    <Text style={tw`text-white text-xs font-bold`}>ACTIVE</Text>
                  </View>
                ) : (
                  <Icon name="chevron-forward" size={20} color="#6366F1" />
                )
              }
              color="#6366F1"
              isLast
            />
          </SettingsSection>

          {/* General Section */}
          <SettingsSection title="General" delay={300} gradient={['#9333EA', '#7C3AED']}>
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
          <SettingsSection title="Support" delay={400} gradient={['#EC4899', '#DB2777']}>
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
          <Animated.View entering={FadeInDown.delay(500).duration(600).springify()} style={tw`mt-8 mb-6`}>
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
