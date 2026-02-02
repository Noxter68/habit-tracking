// App.tsx - With RevenueCat Initialization and Unified Config
import React, { useState, useEffect, useMemo } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, LogBox, StatusBar, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { diagnoseRevenueCatSetup } from './src/utils/RevenueCatDiagnostic';
import * as Linking from 'expo-linking';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HabitWizard from './src/screens/HabitWizard';
import Dashboard from './src/screens/Dashboard';
import HabitDetails from './src/screens/HabitDetails';
import CalendarScreen from './src/screens/CalendarScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AchievementsScreen from './src/screens/AchievementScreen';
import DiagnosticScreen from './src/screens/DiagnosticScreen';
import DebugScreen from './src/screens/debugScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import HolidayModeScreen from './src/screens/HolidayModeScreen';
import NotificationManagerScreen from './src/screens/NotificationManagerScreen';
import { QuestScreen } from './src/screens/QuestScreen';
import { InventoryScreen } from './src/screens/InventoryScreen';

// Contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HabitProvider } from './src/context/HabitContext';
import { AchievementProvider } from './src/context/AchievementContext';
import { StatsProvider } from './src/context/StatsContext';
import { CelebrationQueueProvider } from './src/context/CelebrationQueueContext';
import { LevelUpProvider } from './src/context/LevelUpContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { QuestProvider } from './src/context/QuestContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { QuestNotificationProvider } from './src/context/QuestNotificationContext';
import { FeedbackProvider } from './src/context/FeedbackContext';

// Components
import { CelebrationRenderer } from '@/components/celebrations/CelebrationRenderer';
import { FeedbackRenderer } from '@/components/feedback/FeedbackRenderer';
import DashboardLoader from '@/components/DashboardLoader';
import CustomTabBar from '@/components/CustomTabBar';
import { ConnectionToast } from '@/components/ConnectionToast';

// Hooks
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Utils & Config
import { Config } from './src/config';
import Logger from './src/utils/logger';
import { PerformanceMonitor } from './src/utils/performanceMonitor';
import { RevenueCatService } from '@/services/RevenueCatService';
import { NotificationService } from '@/services/notificationService';
import notificationBadgeService from '@/services/notificationBadgeService';
import LanguageSelectorScreen from '@/components/settings/LanguageSelector';
import { LanguageDetectionService } from '@/services/languageDetectionService';
import ResetPasswordScreen from '@/screens/ResetPasswordScreen';
import { GroupsNavigator } from '@/navigation/GroupsNavigator';
import GroupTiersScreen from '@/screens/GroupTierScreen';
import { GroupCelebrationProvider } from '@/context/GroupCelebrationContext';
import './src/i18n';

// Stats Context pour la couleur du tier
import { useStats } from '@/context/StatsContext';
import { getAchievementByLevel } from '@/utils/achievements';
import { achievementTierThemes } from '@/utils/tierTheme';

// Type Definitions
export type RootStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  HabitWizard: undefined;
  MainTabs: undefined;
  HabitDetails: { habitId: string };
  Achievements: undefined;
  Quests: undefined;
  Inventory: undefined;
  Paywall: { source?: 'habit_limit' | 'streak_saver' | 'settings' | 'stats' };
  Diagnostic: undefined;
  Debug: undefined;
  NotificationManager: undefined;
  HolidayMode: undefined;
  Onboarding: { isReview?: boolean } | undefined;
  ResetPassword: undefined;

  GroupsList: undefined;
  GroupDashboard: { groupId: string };
  CreateGroupHabit: { groupId: string };
  GroupSettings: { groupId: string };
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Leaderboard: undefined;
  Quests: undefined;
  Groups: undefined;
  Settings: undefined;
};

// ============================================
// Configuration
// ============================================

Logger.configure({ enabled: Config.debug.enabled });

if (Config.debug.enabled) {
  Logger.info('🚀 App Starting');
  Logger.debug('Environment:', Config.env.name);
  Logger.debug('Debug Mode:', Config.debug.enabled);
  Logger.debug('API URL:', Config.api.baseUrl);
}

configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

LogBox.ignoreLogs(['[Reanimated]', "It looks like you might be using shared value's"]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ============================================
// Navigation Components
// ============================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

/**
 * Composant de navigation principale avec tabs.
 * Utilise la couleur du tier de l'utilisateur pour les onglets actifs
 * et une animation heart bip au tap.
 */
function MainTabs() {
  const { stats } = useStats();

  // Obtenir la couleur du tier actuel de l'utilisateur (basé sur achievementTierThemes)
  const tierColor = React.useMemo(() => {
    if (stats?.level) {
      const achievement = getAchievementByLevel(stats.level);
      const tierKey = achievement?.tierKey as keyof typeof achievementTierThemes;
      // Utiliser la première couleur du gradient pour le thème
      if (tierKey && achievementTierThemes[tierKey]) {
        return achievementTierThemes[tierKey].gradient[1]; // Couleur principale du gradient
      }
    }
    return '#1e293b'; // Couleur par défaut
  }, [stats?.level]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} tierColor={tierColor} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Quests" component={QuestScreen} />
      <Tab.Screen name="Groups" component={GroupsNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ============================================
// Main Navigator
// ============================================

function AppNavigator() {
  const { user, loading: authLoading, hasCompletedOnboarding, hasConnectionError } = useAuth();
  const networkStatus = useNetworkStatus();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);
  const [minLoadingTimePassed, setMinLoadingTimePassed] = useState(false);
  const [languageInitialized, setLanguageInitialized] = useState(false);

  // Combine les erreurs de connexion : soit du réseau, soit de Supabase
  const showConnectionError = hasConnectionError || networkStatus.hasConnectionIssue;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        if (user?.id) {
          Logger.debug('🌍 Loading user language from database');
          await LanguageDetectionService.loadUserLanguage(user.id);
        } else {
          Logger.debug('🌍 Loading device language (no user connected)');
          await LanguageDetectionService.initializeDefaultLanguage();
        }
      } catch (error) {
        Logger.error('Error initializing language:', error);
      } finally {
        setLanguageInitialized(true); // ✅ Marque comme initialisé
      }
    };

    initializeLanguage();
  }, [user?.id]);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    NotificationService.initialize();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(hasLaunched === null && user !== null);
    } catch (error) {
      Logger.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    } finally {
      setIsCheckingFirstLaunch(false);
    }
  };

  // ============================================================================
  // SMART LOADING SYSTEM
  // ============================================================================

  // Minimum 800ms pour éviter le flash
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTimePassed(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Détermine si on peut afficher l'UI
  const canShowUI = useMemo(() => {
    return languageInitialized && !authLoading && !isCheckingFirstLaunch && minLoadingTimePassed;
  }, [authLoading, isCheckingFirstLaunch, minLoadingTimePassed]);

  // ============================================================================
  // RENDER: LOADER
  // ============================================================================

  if (!canShowUI) {
    return (
      <>
        <DashboardLoader />
        <ConnectionToast visible={showConnectionError} />
      </>
    );
  }

  // ============================================================================
  // RENDER: AUTH SCREEN
  // ============================================================================

  if (!user) {
    return (
      <>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
        <ConnectionToast visible={showConnectionError} />
      </>
    );
  }

  // ============================================================================
  // RENDER: MAIN APP
  // ============================================================================

  return (
    <>
      <Stack.Navigator initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'} screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="HabitWizard" component={HabitWizard} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="HabitDetails" component={HabitDetails} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="Quests" component={QuestScreen} options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="Inventory" component={InventoryScreen} options={{ animation: 'slide_from_right', presentation: 'card' }} />
        <Stack.Screen name="NotificationManager" component={NotificationManagerScreen} options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="HolidayMode" component={HolidayModeScreen} options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GroupTiers" component={GroupTiersScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="LanguageSelector"
          component={LanguageSelectorScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            presentation: 'card',
          }}
        />

        {Config.debug.showDebugScreen && (
          <>
            <Stack.Screen
              name="Debug"
              component={DebugScreen}
              options={{
                title: 'Debug Tools',
                animation: 'slide_from_right',
                headerShown: true,
                headerStyle: { backgroundColor: '#1e293b' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
            <Stack.Screen
              name="Diagnostic"
              component={DiagnosticScreen}
              options={{
                title: '🏥 System Diagnostics',
                animation: 'slide_from_right',
                headerShown: true,
                headerStyle: { backgroundColor: '#3b82f6' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' },
              }}
            />
          </>
        )}
      </Stack.Navigator>

      <CelebrationRenderer />
      <FeedbackRenderer />
      <ConnectionToast visible={showConnectionError} />
    </>
  );
}

// ============================================
// Hooks
// ============================================

function useNotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      // Don't request permissions here — only during onboarding (NotificationStep)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        Logger.debug('Notification permissions not yet granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1e293b',
        });
      }
    };

    setupNotifications();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      Logger.debug('Notification tapped:', response);
      const habitId = response.notification.request.content.data?.habitId;
      if (habitId) {
        Logger.debug('Navigate to habit:', habitId);
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      Logger.debug('Notification received:', notification);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);
}

function usePerformanceMonitoring() {
  useEffect(() => {
    if (!Config.debug.enabled) return;

    Logger.debug('🚀 App started in', Config.env.name, 'mode');
    Logger.debug('📝 Debug features:', Config.debug);

    const reportInterval = setInterval(() => {
      Logger.debug('📊 Performance Report:');
      PerformanceMonitor.getReport();
    }, 30000);

    const checkInterval = setInterval(() => {
      const report = PerformanceMonitor.getReport();
      const slowOps = Object.entries(report.avgTimes).filter(([_, time]) => time > 500);

      if (slowOps.length > 0) {
        Logger.warn('🐌 Slow operations detected:', slowOps);
      }
    }, 10000);

    return () => {
      clearInterval(reportInterval);
      clearInterval(checkInterval);
    };
  }, []);
}

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'nuvoria://'],
  config: {
    screens: {
      Auth: 'auth',
      ResetPassword: 'reset-password',
      MainTabs: {
        screens: {
          Dashboard: 'dashboard',
          Calendar: 'calendar',
          Leaderboard: 'leaderboard',
          Stats: 'stats',
          Settings: 'settings',
        },
      },
    },
  },
};

// ============================================================================
// Composant principal App
// ============================================================================
export default function App() {
  useNotificationSetup();
  usePerformanceMonitoring();

  // ============================================================================
  // 🛒 REVENUECAT & APP STATE
  // ============================================================================
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        const isExpoGo = typeof expo !== 'undefined' && expo?.modules?.ExpoGo;
        if (isExpoGo) {
          Logger.warn('⚠️ Running in Expo Go - RevenueCat will NOT work!');
          return;
        }

        if (Config.debug.enabled) {
          diagnoseRevenueCatSetup();
        }

        Logger.debug('✅ [App] RevenueCat will initialize with user context');
      } catch (error) {
        Logger.error('❌ [App] Setup error:', error);
      }
    };

    initRevenueCat();
    notificationBadgeService.clearBadge();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        notificationBadgeService.clearAllNotifications();

        if (RevenueCatService.isInitialized()) {
          RevenueCatService.getSubscriptionStatus().catch(() => {});
        }
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <StatsProvider>
              <CelebrationQueueProvider>
                <HabitProvider>
                  <FeedbackProvider>
                  <AchievementProvider>
                    <QuestNotificationProvider>
                      <QuestProvider>
                        <InventoryProvider>
                          <LevelUpProvider>
                            <GroupCelebrationProvider>
                              <NavigationContainer linking={linking} fallback={<DashboardLoader />}>
                                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
                                <AppNavigator />
                              </NavigationContainer>
                            </GroupCelebrationProvider>
                          </LevelUpProvider>
                        </InventoryProvider>
                      </QuestProvider>
                    </QuestNotificationProvider>
                  </AchievementProvider>
                  </FeedbackProvider>
                </HabitProvider>
              </CelebrationQueueProvider>
            </StatsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
