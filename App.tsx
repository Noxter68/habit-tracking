// App.tsx - Updated with Achievement System
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text, Platform, LogBox } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming, configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
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

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { HabitProvider } from './src/context/HabitContext';
import { AchievementProvider } from './src/context/AchievementContext';

// Icons Component
import TabBarIcon from './src/components/TabBarIcon';

import * as Notifications from 'expo-notifications';
import AchievementsScreen from '@/screens/AchievementScreen';
import { AppConfig } from '@/config/appConfig';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import { StatsProvider } from '@/context/StatsContext';

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

LogBox.ignoreLogs([
  '[Reanimated]', // Replace with actual warning text
  "It looks like you might be using shared value's", // Example: React Native require cycle warning
]);
configureReanimatedLogger({
  level: ReanimatedLogLevel.error, // only show errors
  strict: false, // disable strict warnings
});

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Clean Tab Navigator with modern design
function MainTabs() {
  const tabBarHeight = Platform.OS === 'ios' ? 88 : 68;
  useEffect(() => {
    // Only log in debug mode
    if (AppConfig.debug.enabled) {
      console.log('🚀 App started in', AppConfig.env.name, 'mode');
      console.log('📝 Debug features:', AppConfig.debug);
    }
  }, []);

  useEffect(() => {
    // Enable performance monitoring in development
    if (__DEV__) {
      // Log performance report every 30 seconds
      const interval = setInterval(() => {
        console.log('📊 Performance Report:');
        PerformanceMonitor.getReport();
      }, 30000);

      // Warn if app is sluggish
      const checkPerformance = () => {
        const report = PerformanceMonitor.getReport();
        const slowOps = Object.entries(report.avgTimes).filter(([_, time]) => time > 500);

        if (slowOps.length > 0) {
          console.warn('🐌 Slow operations detected:', slowOps);
        }
      };

      const perfInterval = setInterval(checkPerformance, 10000);

      return () => {
        clearInterval(interval);
        clearInterval(perfInterval);
      };
    }
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1', // Indigo for active
        tabBarInactiveTintColor: '#9ca3af', // Gray for inactive
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarHeight,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
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

// Main Navigator Component
function AppNavigator() {
  const { user, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isCheckingFirstLaunch, setIsCheckingFirstLaunch] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null && user) {
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
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

  // Show loading screen while checking auth and first launch
  if (loading || isCheckingFirstLaunch) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-white`}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Not authenticated - show auth screen
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

  // Authenticated - show main app
  return (
    <Stack.Navigator
      initialRouteName={isFirstLaunch ? 'Welcome' : 'MainTabs'}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome">{(props) => <WelcomeScreen {...props} onComplete={handleWelcomeComplete} />}</Stack.Screen>
      <Stack.Screen
        name="HabitWizard"
        component={HabitWizard}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="HabitDetails"
        component={HabitDetails}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
}

// Notification setup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App(): React.JSX.Element {
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
          lightColor: '#6366f1',
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <HabitProvider>
            <AchievementProvider>
              <StatsProvider>
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
              </StatsProvider>
            </AchievementProvider>
          </HabitProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
