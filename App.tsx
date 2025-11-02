// App.tsx - With RevenueCat Initialization and Unified Config
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform, LogBox, StatusBar, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { diagnoseRevenueCatSetup } from './src/utils/RevenueCatDiagnostic';
import tw from './src/lib/tailwind';
import { DEBUG_MODE } from '@env';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HabitWizard from './src/screens/HabitWizard';
import Dashboard from './src/screens/Dashboard';
import HabitDetails from './src/screens/HabitDetails';
import CalendarScreen from './src/screens/CalendarScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AchievementsScreen from './src/screens/AchievementScreen';
import DiagnosticScreen from './src/screens/DiagnosticScreen';
import DebugScreen from './src/screens/debugScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import HolidayModeScreen from './src/screens/HolidayModeScreen';
import NotificationManagerScreen from './src/screens/NotificationManagerScreen';

// Contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HabitProvider } from './src/context/HabitContext';
import { AchievementProvider } from './src/context/AchievementContext';
import { StatsProvider } from './src/context/StatsContext';
import { LevelUpProvider } from './src/context/LevelUpContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

// Components
import TabBarIcon from './src/components/TabBarIcon';
import { EpicLevelUpModal } from '@/components/dashboard/EpicLevelUpModal';

// Utils & Config
import { Config } from './src/config';
import Logger from './src/utils/logger';
import { PerformanceMonitor } from './src/utils/performanceMonitor';
import { RevenueCatService } from '@/services/RevenueCatService';
import { NotificationService } from '@/services/notificationService';
import { HapticFeedback } from '@/utils/haptics';

// Type Definitions
export type RootStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  HabitWizard: undefined;
  MainTabs: undefined;
  HabitDetails: { habitId: string };
  Achievements: undefined;
  Paywall: { source?: 'habit_limit' | 'streak_saver' | 'settings' | 'stats' };
  Diagnostic: undefined;
  Debug: undefined;
  NotificationManager: undefined;
  HolidayMode: undefined;
  Onboarding: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Leaderboard: undefined;
  Stats: undefined;
  Settings: undefined;
};

// ============================================
// Configuration
// ============================================

// 🔍 DEBUG LOGS - BEFORE Logger configuration
console.log('\n========= PRE-CONFIG DEBUG =========');
console.log('1. Raw DEBUG_MODE from @env:', DEBUG_MODE);
console.log('2. Config.debug.enabled BEFORE configure:', Config.debug.enabled);
console.log('====================================\n');

// Configure Logger from environment - DO THIS FIRST!
Logger.configure({ enabled: Config.debug.enabled });

// 🔍 DEBUG LOGS - AFTER Logger configuration
console.log('========= POST-CONFIG DEBUG =========');
console.log('Logger configured with enabled:', Config.debug.enabled);
console.log('Config.isDebug:', Config.isDebug);
console.log('__DEV__:', __DEV__);
console.log('====================================\n');

// Log startup info (these will only show if debug is enabled)
if (Config.debug.enabled) {
  Logger.info('🚀 App Starting');
  Logger.debug('Environment:', Config.env.name);
  Logger.debug('Debug Mode:', Config.debug.enabled);
  Logger.debug('API URL:', Config.api.baseUrl);
} else {
  console.log('✅ Logger is DISABLED - No debug logs should appear below\n');
}

// Configure Reanimated Logger
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

// Configure LogBox
LogBox.ignoreLogs(['[Reanimated]', "It looks like you might be using shared value's"]);

// Configure Notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ============================================
// Navigation Components
// ============================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1e293b',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 20,
          left: 20,
          right: 20,
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          height: Platform.OS === 'ios' ? 64 : 58,
          paddingBottom: Platform.OS === 'ios' ? 8 : 6,
          paddingTop: 6,
          paddingHorizontal: 12,
          borderWidth: 2,
          borderColor: '#cbd5e1',
          shadowColor: '#1e293b',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          marginTop: 1,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            HapticFeedback.selection();
          },
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="calendar" color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            HapticFeedback.selection();
          },
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarLabel: 'League',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="leaderboard" color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            HapticFeedback.selection();
          },
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="chart" color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            HapticFeedback.selection();
          },
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="settings" color={color} focused={focused} />,
        }}
        listeners={{
          tabPress: () => {
            HapticFeedback.selection();
          },
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// Main Navigator
// ============================================

function AppNavigator() {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);

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

  if (loading || isCheckingFirstLaunch) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-slate-50`}>
        <ActivityIndicator size="large" color="#1e293b" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? 'Onboarding' : 'MainTabs'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="HabitWizard" component={HabitWizard} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="HabitDetails" component={HabitDetails} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="NotificationManager"
          component={NotificationManagerScreen}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="HolidayMode"
          component={HolidayModeScreen}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />

        {/* ✅ DEBUG MODE SCREENS - Only show when debug is enabled */}
        {Config.debug.showDebugScreen && (
          <>
            <Stack.Screen
              name="Debug"
              component={DebugScreen}
              options={{
                title: 'Debug Tools',
                animation: 'slide_from_right',
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#1e293b',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen
              name="Diagnostic"
              component={DiagnosticScreen}
              options={{
                title: '🏥 System Diagnostics',
                animation: 'slide_from_right',
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#3b82f6',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>

      <EpicLevelUpModal />
    </>
  );
}

// ============================================
// Hooks
// ============================================

function useNotificationSetup() {
  useEffect(() => {
    const setupNotifications = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Logger.debug('Notification permissions not granted');
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

// ============================================
// Main App Component
// ============================================

export default function App() {
  useNotificationSetup();
  usePerformanceMonitoring();

  useEffect(() => {
    // Initialize RevenueCat with proper async handling
    const initRevenueCat = async () => {
      try {
        // Check if we're in Expo Go (where RevenueCat won't work)
        const isExpoGo = typeof expo !== 'undefined' && expo?.modules?.ExpoGo;

        if (isExpoGo) {
          Logger.warn('⚠️  [App] Running in Expo Go - RevenueCat will NOT work!');
          Logger.warn('⚠️  [App] You need to build a development build to test purchases');
          Logger.warn('⚠️  [App] Run: npx expo run:ios or eas build --profile development');
          return;
        }

        // Run diagnostic if in debug mode
        if (Config.debug.enabled) {
          diagnoseRevenueCatSetup();
        }

        Logger.debug('🚀 [App] Starting RevenueCat initialization...');
        await RevenueCatService.initialize();
        Logger.debug('✅ [App] RevenueCat initialized successfully');
      } catch (error) {
        Logger.error('❌ [App] Failed to initialize RevenueCat:', error);
      }
    };

    initRevenueCat();

    // Listen to app state changes to sync purchases
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && RevenueCatService.isInitialized()) {
        Logger.debug('🔄 [App] App became active, syncing purchases...');
        RevenueCatService.getSubscriptionStatus().catch((error) => {
          Logger.error('❌ [App] Error syncing purchases:', error);
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <StatsProvider>
              <HabitProvider>
                <AchievementProvider>
                  <LevelUpProvider>
                    <NavigationContainer>
                      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
                      <AppNavigator />
                    </NavigationContainer>
                  </LevelUpProvider>
                </AchievementProvider>
              </HabitProvider>
            </StatsProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
