/**
 * ============================================================================
 * SettingsScreen.tsx
 * ============================================================================
 *
 * Ecran des paramètres de l'application permettant la configuration
 * du compte utilisateur et des préférences de l'application.
 *
 * Fonctionnalités principales:
 * - Gestion du profil utilisateur (nom, avatar)
 * - Gestion de l'abonnement premium
 * - Configuration des notifications
 * - Mode vacances (Holiday Mode)
 * - Sélection de la langue
 * - Outils de développement (debug)
 * - Déconnexion
 */

import React, { JSX, useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, SafeAreaView, StatusBar, ActivityIndicator, Linking, Alert, Pressable, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Pencil, GraduationCap } from 'lucide-react-native';
import tw from 'twrnc';

import EditUsernameModal from '@/components/settings/EditUserModal';
import DeleteAccountModal from '@/components/settings/DeleteAccountModal';
import { GroupTierUpModal } from '@/components/groups/GroupTierUpModal';
import { GroupLevelUpModal } from '@/components/groups/GroupLevelUpModal';
import { StreakSaverShopModal } from '@/components/streakSaver/StreakSaverShopModal';

import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useGroupCelebration } from '@/context/GroupCelebrationContext';
import { useDailyMotivation } from '@/hooks/useDailyMotivation';

import { HolidayModeService } from '@/services/holidayModeService';
import { NotificationPreferencesService } from '@/services/notificationPreferenceService';
import { OnboardingService } from '@/services/onboardingService';
import { AccountDeletionService } from '@/services/accountDeletionService';

import Logger from '@/utils/logger';
import { supabase } from '@/lib/supabase';

import { HolidayPeriod } from '@/types/holiday.types';
import { RootStackParamList } from '@/navigation/types';
import { Config } from '@/config';

// ============================================================================
// CONSTANTES
// ============================================================================

const APP_ICON = require('../../assets/icon/icon-v2.png');
const TEXTURE_BG = require('../../assets/interface/textures/texture-white.png');

// ============================================================================
// TYPES
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
}

interface SettingsItemProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

// ============================================================================
// COMPOSANT - Icônes SVG
// ============================================================================

/**
 * Composant d'icône SVG personnalisé pour les paramètres
 */
const Icon: React.FC<IconProps> = ({ name, size = 22, color = '#52525B' }) => {
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
// COMPOSANT - En-tête du profil
// ============================================================================

/**
 * Affiche l'en-tête du profil avec avatar, nom et statut premium
 */
const ProfileHeader: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      fetchUsername();
    }
  }, [user?.id]);

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  /**
   * Récupère le nom d'utilisateur depuis la base de données
   */
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

  /**
   * Retourne les initiales de l'utilisateur
   */
  const getInitials = () => {
    const name = currentUsername || user?.email || 'User';
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Retourne le nom d'affichage de l'utilisateur
   */
  const getDisplayName = () => {
    return currentUsername || user?.email?.split('@')[0] || 'User';
  };

  /**
   * Met à jour le nom d'utilisateur local après modification
   */
  const handleUsernameUpdate = (newUsername: string) => {
    setCurrentUsername(newUsername);
  };

  // ============================================================================
  // RENDU
  // ============================================================================

  return (
    <>
      <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={tw`mx-6 mb-6`}>
        <View style={tw`bg-white/90 rounded-3xl p-6 shadow-lg`}>
          {/* Bouton d'édition */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowEditModal(true);
            }}
            style={tw`absolute top-4 right-4 bg-zinc-100 rounded-full p-2 z-10`}
          >
            <Pencil size={18} color="#52525B" strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={tw`flex-row items-center pr-10`}>
            {/* Avatar */}
            <View style={[tw`w-16 h-16 rounded-2xl items-center justify-center`, { backgroundColor: isPremium ? '#52525B' : '#A1A1AA' }]}>
              <Text style={tw`text-white text-2xl font-extrabold`}>{getInitials()}</Text>
            </View>

            <View style={tw`flex-1 ml-4`}>
              {/* Nom et badge premium */}
              <View style={tw`flex-row items-center mb-1`}>
                <Text style={tw`text-zinc-800 font-bold text-lg`}>{getDisplayName()}</Text>
                {isPremium && (
                  <View style={tw`ml-2`}>
                    <Icon name="crown" size={18} color="#52525B" />
                  </View>
                )}
              </View>

              {/* Email */}
              <Text style={tw`text-zinc-500 text-xs mb-1`}>{user?.email || 'user@example.com'}</Text>

              {/* Badge du plan */}
              <View style={tw`mt-1`}>
                {isPremium ? (
                  <View style={tw`px-2.5 py-1 bg-zinc-200 rounded-lg self-start`}>
                    <Text style={tw`text-zinc-700 text-xs font-bold`}>{t('settings.premiumActive')}</Text>
                  </View>
                ) : (
                  <View style={tw`px-2.5 py-1 bg-zinc-100 rounded-lg self-start`}>
                    <Text style={tw`text-zinc-600 text-xs font-bold`}>{t('settings.freePlan')}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Modal d'édition du nom */}
      <EditUsernameModal visible={showEditModal} currentUsername={currentUsername} userId={user?.id || ''} onClose={() => setShowEditModal(false)} onSuccess={handleUsernameUpdate} />
    </>
  );
};

// ============================================================================
// COMPOSANT - Section de paramètres
// ============================================================================

/**
 * Conteneur pour grouper les éléments de paramètres
 */
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()} style={tw`mb-6`}>
      {/* Titre de section */}
      <View style={tw`flex-row items-center gap-2 mb-3 ml-1`}>
        <View style={tw`w-0.75 h-3 rounded-sm bg-zinc-400`} />
        <Text style={tw`text-xs font-extrabold uppercase tracking-widest text-zinc-500`}>{title}</Text>
      </View>

      {/* Contenu */}
      <View style={tw`bg-white/90 rounded-2xl overflow-hidden shadow-md`}>
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
// COMPOSANT - Élément de paramètre
// ============================================================================

/**
 * Élément individuel dans une section de paramètres
 */
const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, trailing, onPress, isLast = false }) => {
  const content = (
    <View style={[tw`flex-row items-center py-4 px-4`, !isLast && tw`border-b border-zinc-100`]}>
      {/* Icône */}
      <View style={tw`w-10 h-10 rounded-xl items-center justify-center mr-3.5 bg-zinc-100`}>
        <Icon name={icon} size={22} color="#52525B" />
      </View>

      {/* Texte */}
      <View style={tw`flex-1`}>
        <Text style={tw`text-zinc-800 font-semibold text-base`}>{title}</Text>
        {subtitle && <Text style={tw`text-zinc-500 text-sm mt-0.5`}>{subtitle}</Text>}
      </View>

      {/* Élément à droite */}
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
// COMPOSANT PRINCIPAL
// ============================================================================

const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { signOut, user, checkOnboardingStatus } = useAuth();
  const { isPremium } = useSubscription();
  const navigation = useNavigation<NavigationProp>();
  const { triggerTierUp, triggerLevelUp } = useGroupCelebration();
  const { forceShow: showDailyMotivation, isEnabled: dailyMotivationEnabled, toggleEnabled: toggleDailyMotivation } = useDailyMotivation();

  // ============================================================================
  // HOOKS - State
  // ============================================================================

  const [notifications, setNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [activeHoliday, setActiveHoliday] = useState<HolidayPeriod | null>(null);
  const [holidayStats, setHolidayStats] = useState<any>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [showStreakSaverShop, setShowStreakSaverShop] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // ============================================================================
  // HOOKS - useCallback
  // ============================================================================

  /**
   * Charge le statut du mode vacances
   */
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

  // ============================================================================
  // HOOKS - useEffect
  // ============================================================================

  useEffect(() => {
    loadNotificationPreferences();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('dark-content');
      loadHolidayStatus();
    }, [loadHolidayStatus])
  );

  // ============================================================================
  // FONCTIONS UTILITAIRES
  // ============================================================================

  /**
   * Charge les préférences de notification
   */
  const loadNotificationPreferences = async () => {
    if (!user) return;

    try {
      const prefs = await NotificationPreferencesService.getPreferences(user.id);
      setNotifications(prefs.globalEnabled);
    } catch (error) {
      Logger.error('Error loading notification preferences:', error);
    }
  };

  /**
   * Retourne le sous-titre pour le mode vacances
   */
  const getHolidaySubtitle = () => {
    if (!activeHoliday) {
      if (isPremium) {
        return t('settings.holidayUnlimited');
      } else {
        const periodsLeft = holidayStats?.remainingAllowance ?? 1;
        return t('settings.holidayLimited', { periods: periodsLeft });
      }
    }

    const daysRemaining = activeHoliday.daysRemaining || 0;
    // Format the end date for display
    const [year, month, day] = activeHoliday.endDate.split('-').map(Number);
    const endDate = new Date(year, month - 1, day);
    const formattedEndDate = endDate.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'long',
    });

    return t('settings.holidayDaysRemaining', { count: daysRemaining, date: formattedEndDate });
  };

  // ============================================================================
  // GESTIONNAIRES D'EVENEMENTS
  // ============================================================================

  /**
   * Relance le tutoriel d'onboarding
   */
  const handleReviewOnboarding = async () => {
    if (!user) return;

    Alert.alert(t('settings.reviewTour'), t('settings.reviewTourPrompt'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.reviewTourConfirm'),
        onPress: async () => {
          await OnboardingService.resetOnboarding(user.id);
          await checkOnboardingStatus();
          navigation.navigate('Onboarding');
        },
      },
    ]);
  };

  /**
   * Gère le toggle des notifications
   */
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
            Alert.alert(t('notifications.permissionRequired'), t('notifications.permissionMessage'), [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('notifications.openSettings'),
                onPress: () => Notifications.openSettingsAsync(),
              },
            ]);
          } else {
            Alert.alert(t('notifications.permissionDenied'), t('notifications.permissionDeniedMessage'));
          }
        } else {
          setNotifications(true);
          Alert.alert(t('notifications.enabled'), t('notifications.enabledMessage'), [{ text: t('common.confirm') }]);
        }
      } else {
        Alert.alert(t('notifications.disableTitle'), t('notifications.disableMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('notifications.disable'),
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
      Alert.alert(t('common.error'), t('notifications.toggleError'));
      setNotifications(!value);
    } finally {
      setNotificationLoading(false);
    }
  };

  /**
   * Gère la déconnexion
   */
  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Logger.debug('Sign Out button pressed');
    setSigningOut(true);

    try {
      await signOut();
      Logger.debug('SignOut completed in SettingsScreen');
    } catch (error) {
      Logger.error('SignOut error in SettingsScreen:', error);
    } finally {
      Logger.debug('SettingsScreen: Resetting signingOut to false');
      setSigningOut(false);
    }
  };

  /**
   * Gère la navigation vers la gestion d'abonnement
   */
  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPremium) {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      navigation.navigate('Paywall', { source: 'settings' });
    }
  };

  /**
   * Gère la suppression du compte utilisateur
   */
  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Supprimer le compte via le service
      await AccountDeletionService.deleteAccount(user.id);

      // Afficher un message de succès
      Alert.alert(
        t('common.success'),
        t('settings.deleteAccountSuccess'),
        [
          {
            text: t('common.confirm'),
            onPress: async () => {
              // Déconnecter l'utilisateur
              await signOut();
            }
          }
        ]
      );
    } catch (error) {
      Logger.error('Error deleting account:', error);
      Alert.alert(
        t('common.error'),
        t('settings.deleteAccountError')
      );
    }
  };

  // ============================================================================
  // RENDU PRINCIPAL
  // ============================================================================

  return (
    <ImageBackground source={TEXTURE_BG} style={tw`flex-1`} resizeMode="repeat" imageStyle={{ opacity: 0.15 }}>
      <SafeAreaView style={tw`flex-1`}>
        <StatusBar barStyle="dark-content" />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-24`}>
          {/* En-tête avec icône de l'app */}
          <Animated.View entering={FadeInDown.duration(600).springify()} style={tw`px-6 pt-8 pb-8`}>
            <View style={tw`items-center`}>
              <View style={tw`mb-4`}>
                <Image source={APP_ICON} style={{ width: 120, height: 120, borderRadius: 20 }} resizeMode="contain" />
              </View>

              <View style={tw`bg-zinc-200 px-5 py-2 rounded-2xl mb-3`}>
                <Text style={tw`text-xs font-bold text-zinc-600 tracking-widest`}>{t('settings.preferences').toUpperCase()}</Text>
              </View>
              <Text style={tw`text-4xl font-black text-zinc-800 text-center`}>{t('settings.title')}</Text>
            </View>
          </Animated.View>

          {/* En-tête du profil */}
          <ProfileHeader />

          <View style={tw`px-6`}>
            {/* Section Abonnement */}
            <SettingsSection title={t('settings.subscription')} delay={200}>
              <SettingsItem
                icon={isPremium ? 'credit-card' : 'sparkles'}
                title={isPremium ? t('settings.managePremium') : t('settings.upgradePremium')}
                subtitle={isPremium ? t('settings.managePremiumSubtitle') : t('settings.upgradePremiumSubtitle')}
                onPress={handleManageSubscription}
                trailing={
                  isPremium ? (
                    <Icon name="chevron-forward" size={20} color="#52525B" />
                  ) : (
                    <View style={tw`px-3 py-1.5 bg-zinc-700 rounded-lg`}>
                      <Text style={tw`text-white text-xs font-bold`}>{t('settings.upgrade').toUpperCase()}</Text>
                    </View>
                  )
                }
                isLast
              />
            </SettingsSection>

            {/* Section Mode Vacances */}
            <SettingsSection title={t('settings.breakMode')} delay={200}>
              <SettingsItem
                icon="beach-outline"
                title={t('settings.holidayMode')}
                subtitle={getHolidaySubtitle()}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate('HolidayMode');
                }}
                trailing={
                  activeHoliday ? (
                    <View style={tw`px-3 py-1.5 bg-zinc-700 rounded-lg`}>
                      <Text style={tw`text-white text-xs font-bold`}>{t('settings.active').toUpperCase()}</Text>
                    </View>
                  ) : (
                    <Icon name="chevron-forward" size={20} color="#52525B" />
                  )
                }
                isLast
              />
            </SettingsSection>

            {/* Section Général */}
            <SettingsSection title={t('settings.general')} delay={300}>
              {/* Notifications */}
              <SettingsItem
                icon="notifications-outline"
                title={t('settings.notifications')}
                subtitle={notifications ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled')}
                trailing={
                  notificationLoading ? (
                    <ActivityIndicator size="small" color="#52525B" />
                  ) : (
                    <Switch
                      value={notifications}
                      onValueChange={handleNotificationToggle}
                      trackColor={{ false: '#E4E4E7', true: '#A1A1AA' }}
                      thumbColor={notifications ? '#52525B' : '#FFFFFF'}
                      ios_backgroundColor="#E4E4E7"
                      disabled={notificationLoading}
                    />
                  )
                }
              />

              {/* Gestion des notifications (visible si activées) */}
              {notifications && (
                <SettingsItem
                  icon="notifications-outline"
                  title={t('settings.manageNotifications')}
                  subtitle={t('settings.manageNotificationsSubtitle')}
                  trailing={<Icon name="chevron-forward" size={20} color="#52525B" />}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('NotificationManager');
                  }}
                />
              )}

              {/* Langue */}
              <SettingsItem
                icon="language-outline"
                title={t('settings.language')}
                subtitle={i18n.language === 'fr' ? 'Français' : 'English'}
                trailing={<Icon name="chevron-forward" size={20} color="#52525B" />}
                onPress={() => navigation.navigate('LanguageSelector')}
              />

              {/* Motivation Quotidienne */}
              <SettingsItem
                icon="sparkles"
                title={t('settings.dailyMotivation')}
                subtitle={dailyMotivationEnabled ? t('settings.dailyMotivationEnabled') : t('settings.dailyMotivationDisabled')}
                trailing={
                  <Switch
                    value={dailyMotivationEnabled}
                    onValueChange={(value) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      toggleDailyMotivation(value);
                    }}
                    trackColor={{ false: '#E4E4E7', true: '#A1A1AA' }}
                    thumbColor={dailyMotivationEnabled ? '#52525B' : '#FFFFFF'}
                    ios_backgroundColor="#E4E4E7"
                  />
                }
                isLast
              />
            </SettingsSection>

            {/* Section Outils développeur */}
            {Config.debug.showDebugScreen && (
              <SettingsSection title={t('settings.developerTools')} delay={450}>
                <SettingsItem
                  icon="diagnostic"
                  title={t('settings.debug.systemDiagnostics')}
                  subtitle={t('settings.debug.checkHealth')}
                  trailing={<Icon name="chevron-forward" size={20} color="#52525B" />}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Diagnostic');
                  }}
                />
                <SettingsItem
                  icon="bug"
                  title={t('settings.debug.title')}
                  subtitle={t('settings.debug.dailyChallenge')}
                  trailing={<Icon name="chevron-forward" size={20} color="#52525B" />}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Debug');
                  }}
                  isLast
                />
              </SettingsSection>
            )}

            {/* Section Debug Tools (tests) */}
            {Config.debug.showDebugScreen && (
              <SettingsSection title="Debug Tools" delay={500}>
                <SettingsItem icon="bug" title="Test Level Up" subtitle="Celebration simple (5s)" onPress={() => triggerLevelUp(30, 14)} />
                <SettingsItem icon="sparkles" title="Test Tier Up" subtitle="Celebration epique (8s)" onPress={() => triggerTierUp(50, 9)} />
                <SettingsItem
                  icon="sparkles"
                  title="Test Daily Motivation"
                  subtitle="Afficher la citation du jour"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showDailyMotivation();
                  }}
                />
                <SettingsItem
                  icon="sparkles"
                  title="Test Streak Saver Shop"
                  subtitle="Ouvrir la modal d'achat"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowStreakSaverShop(true);
                  }}
                />
                <SettingsItem
                  icon="crown"
                  title="Test Paywall Screen"
                  subtitle="Voir l'écran d'abonnement"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate('Paywall', { source: 'settings' });
                  }}
                  isLast
                />
              </SettingsSection>
            )}

            {/* Section Support */}
            <SettingsSection title={t('settings.support')} delay={400}>
              <SettingsItem icon="information-circle-outline" title={t('settings.version')} subtitle={Constants.expoConfig?.version || '1.0.0'} />
            </SettingsSection>

            {/* Section Compte - Suppression */}
            <SettingsSection title={t('settings.account')} delay={450}>
              <SettingsItem
                icon="log-out-outline"
                title={t('settings.deleteAccount')}
                subtitle={t('settings.deleteAccountSubtitle')}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowDeleteAccountModal(true);
                }}
                trailing={<Icon name="chevron-forward" size={20} color="#DC2626" />}
                isLast
              />
            </SettingsSection>

            {/* Bouton Revoir le tutoriel */}
            <View style={tw`mt-6`}>
              <Text style={tw`text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3 px-1`}>{t('settings.help')}</Text>

              <Pressable onPress={handleReviewOnboarding} style={tw`bg-white/90 rounded-2xl px-4 py-4 flex-row items-center justify-between shadow-md`}>
                <View style={tw`flex-row items-center gap-3`}>
                  <View style={tw`w-10 h-10 rounded-xl bg-zinc-100 items-center justify-center`}>
                    <GraduationCap size={20} color="#52525B" strokeWidth={2.5} />
                  </View>
                  <Text style={tw`text-base font-semibold text-zinc-800`}>{t('settings.reviewTour')}</Text>
                </View>
                <ChevronRight size={20} color="#A1A1AA" />
              </Pressable>
            </View>

            {/* Modals de célébration de groupe */}
            <GroupTierUpModal />
            <GroupLevelUpModal />

            {/* Modal Streak Saver Shop (debug) */}
            <StreakSaverShopModal visible={showStreakSaverShop} onClose={() => setShowStreakSaverShop(false)} />

            {/* Modal de suppression de compte */}
            <DeleteAccountModal
              visible={showDeleteAccountModal}
              onClose={() => setShowDeleteAccountModal(false)}
              onConfirm={handleDeleteAccount}
            />

            {/* Bouton de déconnexion */}
            <Animated.View entering={FadeInDown.delay(500).duration(600).springify()} style={tw`mt-8 mb-6`}>
              <TouchableOpacity activeOpacity={0.8} disabled={signingOut} onPress={handleSignOut}>
                <LinearGradient colors={['#DC2626', '#B91C1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[tw`rounded-2xl p-4.5 shadow-lg`, { opacity: signingOut ? 0.6 : 1 }]}>
                  <View style={tw`flex-row items-center justify-center`}>
                    {signingOut ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Icon name="log-out-outline" size={22} color="#FFFFFF" />
                        <Text style={tw`ml-2.5 text-white font-bold text-base tracking-wide`}>{t('auth.signOut')}</Text>
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default SettingsScreen;
