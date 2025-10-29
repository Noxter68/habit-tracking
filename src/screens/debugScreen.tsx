// src/screens/DebugScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, SafeAreaView, StatusBar } from 'react-native';
import tw from '../lib/tailwind';
import { DebugUtils, useDebugDailyChallenge } from '../utils/debugUtils';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AppConfig } from '@/config/appConfig';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface IconProps {
  size?: number;
  color: string;
}

// ============================================================================
// Icon Components
// ============================================================================

const RefreshIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 4v6h6M23 20v-6h-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const TrashIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EyeIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={2} />
  </Svg>
);

const ClockIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    <Path d="M12 6v6l4 2" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const DiagnosticIcon: React.FC<IconProps> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ============================================================================
// Main Debug Screen
// ============================================================================

const DebugScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const debug = useDebugDailyChallenge();
  const navigation = useNavigation<NavigationProp>();

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    setLoading(true);
    try {
      await action();
      Alert.alert('Success', successMessage);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to perform action');
      console.error('Debug action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const debugActions = [
    {
      title: "Clear Today's Challenge",
      description: "Reset today's daily challenge for current user",
      icon: RefreshIcon,
      color: '#3b82f6',
      bgColor: '#eff6ff',
      action: () => debug.clearToday(user?.id || ''),
    },
    {
      title: 'Clear All Challenges',
      description: 'Remove all daily challenge data',
      icon: TrashIcon,
      color: '#ef4444',
      bgColor: '#fef2f2',
      action: debug.clearAll,
    },
    {
      title: 'View Status',
      description: 'Check current daily challenge status',
      icon: EyeIcon,
      color: '#10b981',
      bgColor: '#f0fdf4',
      action: () => debug.viewStatus(user?.id || ''),
    },
    {
      title: 'Clear Old Challenges',
      description: 'Remove challenges older than 7 days',
      icon: ClockIcon,
      color: '#f97316',
      bgColor: '#fff7ed',
      action: () => debug.clearOld(7),
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={tw`p-6 pb-24`}>
        {/* Header */}
        <View style={tw`mb-6`}>
          <View style={tw`bg-amber-100 px-4 py-2 rounded-xl mb-3 self-start`}>
            <Text style={tw`text-xs font-bold text-amber-700 tracking-widest`}>DEV TOOLS</Text>
          </View>
          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>Debug Utilities</Text>
          <Text style={tw`text-base text-gray-600`}>Development tools for testing and troubleshooting</Text>
        </View>

        {/* Warning Banner */}
        <View style={tw`bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Text style={tw`text-2xl mr-2`}>⚠️</Text>
            <Text style={tw`text-base font-bold text-amber-900`}>Debug Mode Active</Text>
          </View>
          <Text style={tw`text-sm text-amber-800 leading-5`}>These tools modify app data and should only be used in development. Set IS_DEBUG_MODE to false before production.</Text>
        </View>

        {/* System Diagnostics Button */}
        <Pressable onPress={() => navigation.navigate('Diagnostic')} style={({ pressed }) => [tw`bg-blue-600 rounded-2xl p-5 mb-6 shadow-lg`, pressed && tw`bg-blue-700 scale-[0.98]`]}>
          <View style={tw`flex-row items-center justify-center`}>
            <DiagnosticIcon size={24} color="#FFFFFF" />
            <Text style={tw`text-white font-bold text-lg ml-3`}>🏥 Run System Diagnostics</Text>
          </View>
          <Text style={tw`text-blue-100 text-sm text-center mt-2`}>Complete health check of XP system & database</Text>
        </Pressable>

        {/* Debug Actions */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-bold text-gray-900 mb-4`}>Daily Challenge Tools</Text>

          <View style={tw`space-y-3`}>
            {debugActions.map((action, index) => (
              <Pressable
                key={index}
                onPress={() => handleAction(action.action, `${action.title} completed`)}
                disabled={loading}
                style={({ pressed }) => [tw`bg-white rounded-2xl p-4 border-2 border-gray-200 shadow-sm`, pressed && tw`bg-gray-50 scale-[0.98]`, loading && tw`opacity-50`]}
              >
                <View style={tw`flex-row items-center`}>
                  <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: action.bgColor }]}>
                    <action.icon size={24} color={action.color} />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`font-bold text-gray-900 text-base mb-1`}>{action.title}</Text>
                    <Text style={tw`text-sm text-gray-600`}>{action.description}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* User Info */}
        {user && (
          <View style={tw`bg-white border-2 border-gray-200 rounded-2xl p-5`}>
            <Text style={tw`text-base font-bold text-gray-900 mb-3`}>Current User</Text>
            <View style={tw`space-y-2`}>
              <View>
                <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1`}>User ID</Text>
                <Text style={tw`text-xs font-mono text-gray-800 bg-gray-50 p-3 rounded-lg`}>{user.id}</Text>
              </View>
              <View>
                <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1`}>Email</Text>
                <Text style={tw`text-sm text-gray-800 bg-gray-50 p-3 rounded-lg`}>{user.email}</Text>
              </View>
            </View>
          </View>
        )}

        {!user && (
          <View style={tw`bg-red-50 border-2 border-red-200 rounded-2xl p-5`}>
            <Text style={tw`text-red-900 font-bold text-center`}>❌ No User Logged In</Text>
            <Text style={tw`text-red-700 text-sm text-center mt-2`}>Please log in to use debug tools</Text>
          </View>
        )}

        {/* Debug Info */}
        <View style={tw`bg-gray-100 rounded-2xl p-4 mt-6`}>
          <Text style={tw`text-xs font-semibold text-gray-600 mb-2`}>Debug Configuration</Text>
          <View style={tw`space-y-1`}>
            <Text style={tw`text-xs font-mono text-gray-700`}>Debug Enabled: {AppConfig.debug.enabled ? '✅' : '❌'}</Text>
            <Text style={tw`text-xs font-mono text-gray-700`}>Show Debug Screen: {AppConfig.debug.showDebugScreen ? '✅' : '❌'}</Text>
            <Text style={tw`text-xs font-mono text-gray-700`}>Environment: {AppConfig.env.name}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DebugScreen;
