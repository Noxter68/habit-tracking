// src/screens/SettingsScreen.tsx
import React, { JSX, useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar, ActivityIndicator, Linking, Alert, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import tw from 'twrnc';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { HolidayModeService } from '@/services/holidayModeService';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { Config } from '@/config';
import Logger from '@/utils/logger';
import { OnboardingService } from '@/services/onboardingService';
import { ChevronRight, Pencil } from 'lucide-react-native';
import { HolidayPeriod } from '@/types/holiday.types';
import { supabase } from '@/lib/supabase';
import EditUsernameModal from '@/components/settings/EditUserModal';
import { t } from 'i18next';
import i18n from '@/i18n';

const APP_ICON = require('../../assets/icon/icon-v2.png');

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
  | 'beach-outline'
  | 'bug'
  | 'diagnostic'
  | 'create-outline';

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
    bug: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2v3m0 14v3M4 7h3m10 0h3M4 17h3m10 0h3M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Path d="M18 11a6 6 0 11-12 0" stroke={color} strokeWidth={2} />
        <Path d="M12 11v6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    ),
    diagnostic: (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    ),
    'create-outline': (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    if (user?.id) {
      fetchUsername();
    }
  }, [user?.id]);

  const fetchUsername = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single();

      if (!error && data) {
        setCurrentUsername(data.username || getDisplayName());
      }
    } catch (error) {
      Logger.error('Error fetching username:', error);
    }
  };

  const getInitials = () => {
    const name = currentUsername || user?.email || 'User';
    return name.substring(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    return currentUsername || user?.email?.split('@')[0] || 'User';
  };

  const handleUsernameUpdate = (newUsername: string) => {
    setCurrentUsername(newUsername);
  };

  return (
    <>
      <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={tw`mx-6 mb-6`}>
        <View style={tw`bg-white rounded-3xl p-6 shadow-lg`}>
          {/* Edit Button - Positioned top right */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEditModal(true);
            }}
            style={tw`absolute top-4 right-4 bg-gray-100 rounded-full p-2 z-10`}
          >
            <Pencil size={18} color="#6B7280" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={tw`flex-row items-center pr-10`}>
            <LinearGradient
              colors={isPremium ? ['#78716C', '#57534E'] : ['#9CA3AF', '#6B7280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`w-16 h-16 rounded-2xl items-center justify-center`}
            >
              <Text style={tw`text-white text-2xl font-extrabold`}>{getInitials()}</Text>
            </LinearGradient>

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

      {/* Edit Username Modal */}
      <EditUsernameModal visible={showEditModal} currentUsername={currentUsername} userId={user?.id || ''} onClose={() => setShowEditModal(false)} onSuccess={handleUsernameUpdate} />
    </>
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
  const content = (
    <View style={[tw`flex-row items-center py-4 px-4`, !isLast && tw`border-b border-gray-100`]}>
      <View style={[tw`w-10 h-10 rounded-xl items-center justify-center mr-3.5`, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={22} color={color} />
      </View>

      <View style={tw`flex-1`}>
        <Text style={tw`text-gray-800 font-semibold text-base`}>{title}</Text>
        {subtitle && <Text style={tw`text-gray-500 text-sm mt-0.5`}>{subtitle}</Text>}
      </View>

      {trailing && <View style={tw`ml-3`}>{trailing}</View>}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View>{content}</View>;
};

// ============================================================================
// Main Settings Screen
// ============================================================================

const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayStats, setHolidayStats] = useState<any>(null);

  const [signingOut, setSigningOut] = useState(false);

  const { signOut, loading, user, checkOnboardingStatus } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    loadNotificationPreferences();
  }, [user]);

  const loadHolidayStatus = useCallback(async () => {
    if (!user) return;

    try {
      const [holiday, stats] = await Promise.all([HolidayModeService.getActiveHoliday(user.id), HolidayModeService.getHolidayStats(user.id)]);
      setActiveHoliday(holiday);
      setHolidayStats(stats);
    } catch (error) {
      Logger.error('Error loading holiday status:', error);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadHolidayStatus();
    }, [loadHolidayStatus])
  );

  const handleReviewOnboarding = async () => {
    if (!user) return;

    Alert.alert('Review Onboarding', 'Would you like to see the introduction tour again?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, Show Me',
        onPress: async () => {
          await OnboardingService.resetOnboarding(user.id);
          await checkOnboardingStatus();
          navigation.navigate('Onboarding');
        },
      },
    ]);
  };

  const loadNotificationPreferences = async () => {
    if (!user) return;

    try {
      const prefs = await NotificationPreferencesService.getPreferences(user.id);
      setNotifications(prefs.globalEnabled);
    } catch (error) {
      Logger.error('Error loading notification preferences:', error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationLoading(true);

    try {
      if (value) {
        const result = await NotificationPreferencesService.enableNotifications(user.id);

        if (!result.permissionGranted) {
          setNotifications(false);

          if (result.needsSettings) {
            Alert.alert('Permission Required', 'Notifications are disabled in your device settings. Please enable them to receive habit reminders.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Notifications.openSettingsAsync(),
              },
            ]);
          } else {
            Alert.alert('Permission Denied', 'You need to grant notification permissions to receive habit reminders.');
          }
        } else {
          setNotifications(true);
          Alert.alert('Notifications Enabled', 'You will now receive reminders for your habits with notifications enabled.', [{ text: 'OK' }]);
        }
      } else {
        Alert.alert('Disable Notifications?', 'This will cancel all scheduled habit reminders. You can re-enable them anytime.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await NotificationPreferencesService.disableNotifications(user.id);
              setNotifications(false);
            },
          },
        ]);
      }
    } catch (error) {
      Logger.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
      setNotifications(!value);
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Logger.debug('🔘 Sign Out button pressed');
    setSigningOut(true);

    try {
      await signOut();
      Logger.debug('✅ SignOut completed in SettingsScreen');
    } catch (error) {
      Logger.error('❌ SignOut error in SettingsScreen:', error);
    } finally {
      Logger.debug('🔓 SettingsScreen: Resetting signingOut to false');
      setSigningOut(false);
    }
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPremium) {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      navigation.navigate('Paywall', { source: 'settings' });
    }
  };

  const getHolidaySubtitle = () => {
    if (!activeHoliday) {
      if (isPremium) {
        return 'Unlimited holiday periods available';
      } else {
        const periodsLeft = holidayStats?.remainingAllowance ?? 1;
        const periodText = periodsLeft === 1 ? 'period' : 'periods';
        return `Max 14 days per period • ${periodsLeft} ${periodText} left`;
      }
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
        <Animated.View entering={FadeInDown.duration(600).springify()} style={tw`px-6 pt-15 pb-8`}>
          <View style={tw`items-center`}>
            {/* Icône de l'app */}
            <View style={tw`mb-4`}>
              <Image source={APP_ICON} style={{ width: 120, height: 120, borderRadius: 20 }} resizeMode="contain" />
            </View>

            <View style={tw`bg-stone-100 px-5 py-2 rounded-2xl mb-3`}>
              <Text style={tw`text-xs font-bold text-stone-600 tracking-widest`}>PREFERENCES</Text>
            </View>
            <Text style={tw`text-4xl font-black text-gray-800 text-center`}>Settings</Text>
          </View>
        </Animated.View>

        <ProfileHeader />

        <View style={tw`px-6`}>
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

          <SettingsSection title="General" delay={300} gradient={['#9333EA', '#7C3AED']}>
            <SettingsItem
              icon="notifications-outline"
              title="Notifications"
              subtitle={notifications ? 'Reminders enabled' : 'Enable habit reminders'}
              color="#9333EA"
              trailing={
                notificationLoading ? (
                  <ActivityIndicator size="small" color="#9333EA" />
                ) : (
                  <Switch
                    value={notifications}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
                    thumbColor={notifications ? '#9333EA' : '#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    disabled={notificationLoading}
                  />
                )
              }
            />

            {notifications && (
              <SettingsItem
                icon="notifications-outline"
                title="Manage Habit Notifications"
                subtitle="Customize reminders for each habit"
                color="#9333EA"
                trailing={<Icon name="chevron-forward" size={20} color="#9333EA" />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('NotificationManager');
                }}
              />
            )}

            <SettingsItem
              icon="language-outline"
              title={t('settings.language')}
              subtitle={i18n.language === 'fr' ? 'Français' : 'English'}
              color="#8B5CF6"
              trailing={<Icon name="chevron-forward" size={20} color="#8B5CF6" />}
              onPress={() => navigation.navigate('LanguageSelector')}
            />
          </SettingsSection>

          {Config.debug.showDebugScreen && (
            <SettingsSection title="Developer Tools" delay={450} gradient={['#F59E0B', '#D97706']}>
              <SettingsItem
                icon="diagnostic"
                title="System Diagnostics"
                subtitle="Check app health & XP system"
                color="#F59E0B"
                trailing={<Icon name="chevron-forward" size={20} color="#F59E0B" />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Diagnostic');
                }}
              />
              <SettingsItem
                icon="bug"
                title="Debug Tools"
                subtitle="Daily challenge utilities"
                color="#F59E0B"
                trailing={<Icon name="chevron-forward" size={20} color="#F59E0B" />}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('Debug');
                }}
                isLast
              />
            </SettingsSection>
          )}

          <SettingsSection title="Support" delay={400} gradient={['#EC4899', '#DB2777']}>
            <SettingsItem icon="information-circle-outline" title="Version" subtitle="1.0.10" color="#EC4899" />
            {/* <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              color="#EC4899"
              trailing={<Icon name="chevron-forward" size={20} color="#EC4899" />}
              onPress={() => Logger.debug('Help pressed')}
              isLast
            /> */}
          </SettingsSection>

          <View style={tw`mt-6`}>
            <Text style={tw`text-sm font-bold text-stone-500 uppercase tracking-wider mb-3 px-1`}>Help</Text>

            <Pressable onPress={handleReviewOnboarding} style={tw`bg-white rounded-2xl px-4 py-4 flex-row items-center justify-between shadow-md`}>
              <View style={tw`flex-row items-center gap-3`}>
                <View style={tw`w-10 h-10 rounded-full bg-blue-100 items-center justify-center`}>
                  <Text>📚</Text>
                </View>
                <Text style={tw`text-base font-semibold text-stone-800`}>Review Introduction Tour</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          <Animated.View entering={FadeInDown.delay(500).duration(600).springify()} style={tw`mt-8 mb-6`}>
            <TouchableOpacity activeOpacity={0.8} disabled={signingOut} onPress={handleSignOut}>
              <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[tw`rounded-2xl p-4.5 shadow-lg`, { opacity: signingOut ? 0.6 : 1 }]}>
                <View style={tw`flex-row items-center justify-center`}>
                  {signingOut ? (
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
