// App.tsx - Sand/Stone Theme Version
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Platform, LogBox, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import tw from './src/lib/tailwind';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HabitWizard from './src/screens/HabitWizard';
import Dashboard from './src/screens/Dashboard';
import HabitDetails from './src/screens/HabitDetails';
import CalendarScreen from './src/screens/CalendarScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AchievementsScreen from './src/screens/AchievementScreen';

// Contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HabitProvider } from './src/context/HabitContext';
import { AchievementProvider } from './src/context/AchievementContext';
import { StatsProvider } from './src/context/StatsContext';
import { LevelUpProvider } from './src/context/LevelUpContext';

// Components
import TabBarIcon from './src/components/TabBarIcon';

// Utils & Config
import { AppConfig } from './src/config/appConfig';
import { PerformanceMonitor } from './src/utils/performanceMonitor';
import { EpicLevelUpModal } from '@/components/dashboard/EpicLevelUpModal';
import { useDebugMode } from '@/hooks/useDebugMode';
import { DebugButton } from '@/components/debug/DebugButton';
import DebugScreen from '@/screens/debugScreen';
import { DEBUG_MODE } from '@env';

// Type Definitions
export type RootStackParamList = {
  Auth: undefined;
  Welcome: undefined;
  HabitWizard: undefined;
  MainTabs: undefined;
  HabitDetails: { habitId: string };
  Achievements: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Stats: undefined;
  Settings: undefined;
};

// ============================================
// Configuration
// ============================================

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
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 68;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Sand/Stone theme colors
        tabBarActiveTintColor: '#726454', // sand-700
        tabBarInactiveTintColor: '#BFB3A3', // sand-400
        tabBarStyle: {
          backgroundColor: '#FFFFFF', // white
          borderTopWidth: 1,
          borderTopColor: '#F5F2ED', // sand-100
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        tabBarIconStyle: {
          marginTop: 4,
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
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="calendar" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="chart" color={color} focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="settings" color={color} focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ============================================
// Main Navigator
// ============================================

function AppNavigator() {
  const { user, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);

  const { showDebugScreen } = useDebugMode();

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      setIsFirstLaunch(hasLaunched === null && user !== null);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setIsFirstLaunch(false);
    } finally {
      setIsCheckingFirstLaunch(false);
    }
  };

  const handleWelcomeComplete = async () => {
    try {
      await AsyncStorage.setItem('hasLaunched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('Error setting first launch:', error);
    }
  };

  // Loading state - Updated with sand colors
  if (loading || isCheckingFirstLaunch) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-sand-50`}>
        <ActivityIndicator size="large" color="#726454" />
      </View>
    );
  }

  // Auth Navigation
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

  // Main App Navigation
  return (
    <>
      <Stack.Navigator
        initialRouteName={isFirstLaunch ? 'Welcome' : 'MainTabs'}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Welcome">{(props) => <WelcomeScreen {...props} onComplete={handleWelcomeComplete} />}</Stack.Screen>
        <Stack.Screen name="HabitWizard" component={HabitWizard} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="HabitDetails" component={HabitDetails} options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="Achievements"
          component={AchievementsScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        {showDebugScreen && (
          <Stack.Screen
            name="Debug"
            component={DebugScreen}
            options={{
              title: 'Debug Tools',
              animation: 'slide_from_right',
              headerShown: true,
            }}
          />
        )}
      </Stack.Navigator>

      {/* Global Components */}
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
        console.log('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#726454', // sand-700
        });
      }
    };

    setupNotifications();

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const habitId = response.notification.request.content.data?.habitId;
      if (habitId) {
        console.log('Navigate to habit:', habitId);
      }
    });

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);
}

function usePerformanceMonitoring() {
  useEffect(() => {
    if (!AppConfig.debug.enabled) return;

    // Log initial app start
    if (AppConfig.debug.enabled) {
      console.log('🚀 App started in', AppConfig.env.name, 'mode');
      console.log('📝 Debug features:', AppConfig.debug);
    }

    // Performance monitoring
    const reportInterval = setInterval(() => {
      console.log('📊 Performance Report:');
      PerformanceMonitor.getReport();
    }, 30000);

    const checkInterval = setInterval(() => {
      const report = PerformanceMonitor.getReport();
      const slowOps = Object.entries(report.avgTimes).filter(([_, time]) => time > 500);

      if (slowOps.length > 0) {
        console.warn('🐌 Slow operations detected:', slowOps);
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatsProvider>
            <HabitProvider>
              <AchievementProvider>
                <LevelUpProvider>
                  <NavigationContainer>
                    {/* Status Bar Configuration */}
                    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

                    {/* Main App */}
                    <AppNavigator />
                  </NavigationContainer>
                </LevelUpProvider>
              </AchievementProvider>
            </HabitProvider>
          </StatsProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
