// src/screens/DebugScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Eye, Clock, RefreshCw } from 'lucide-react-native';
import tw from '../lib/tailwind';
import { DebugUtils, useDebugDailyChallenge } from '../utils/debugUtils';

interface DebugScreenProps {
  userId: string;
}

const DebugScreen: React.FC<DebugScreenProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const debug = useDebugDailyChallenge();

  const handleAction = async (action: () => Promise<void>, successMessage: string) => {
    setLoading(true);
    try {
      await action();
      Alert.alert('Success', successMessage);
    } catch (error) {
      Alert.alert('Error', 'Failed to perform action');
    } finally {
      setLoading(false);
    }
  };

  const debugActions = [
    {
      title: "Clear Today's Challenge",
      description: "Reset today's daily challenge for current user",
      icon: RefreshCw,
      color: 'blue',
      action: () => debug.clearToday(userId),
    },
    {
      title: 'Clear All Challenges',
      description: 'Remove all daily challenge data',
      icon: Trash2,
      color: 'red',
      action: debug.clearAll,
    },
    {
      title: 'View Status',
      description: 'Check current daily challenge status',
      icon: Eye,
      color: 'green',
      action: () => debug.viewStatus(userId),
    },
    {
      title: 'Clear Old Challenges',
      description: 'Remove challenges older than 7 days',
      icon: Clock,
      color: 'orange',
      action: () => debug.clearOld(7),
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-stone-50`}>
      <ScrollView contentContainerStyle={tw`p-4`}>
        <View style={tw`mb-6`}>
          <Text style={tw`text-2xl font-bold text-gray-800 mb-2`}>Debug Tools</Text>
          <Text style={tw`text-sm text-sand-500`}>Development utilities for testing</Text>
        </View>

        <View style={tw`bg-stone-50 border border-stone-200 rounded-lg p-3 mb-6`}>
          <Text style={tw`text-sm text-stone-800 font-medium`}>⚠️ Debug Mode Only</Text>
          <Text style={tw`text-xs text-stone-700 mt-1`}>These tools should be disabled in production</Text>
        </View>

        <View style={tw`space-y-3`}>
          {debugActions.map((action, index) => (
            <Pressable
              key={index}
              onPress={() => handleAction(action.action, `${action.title} completed`)}
              disabled={loading}
              style={({ pressed }) => [tw`bg-sand rounded-xl p-4 border border-sand-200`, pressed && tw`bg-stone-50 scale-[0.98]`]}
            >
              <View style={tw`flex-row items-center`}>
                <View style={tw`w-10 h-10 rounded-full bg-${action.color}-100 items-center justify-center mr-3`}>
                  <action.icon size={20} color={getIconColor(action.color)} />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`font-semibold text-gray-800`}>{action.title}</Text>
                  <Text style={tw`text-xs text-sand-500 mt-0.5`}>{action.description}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={tw`mt-8 p-4 bg-sand-100 rounded-lg`}>
          <Text style={tw`text-xs font-medium text-gray-600 mb-2`}>Current User ID:</Text>
          <Text style={tw`text-xs font-mono text-gray-800 bg-sand p-2 rounded`}>{userId}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get icon colors
const getIconColor = (color: string): string => {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    red: '#ef4444',
    green: '#10b981',
    orange: '#f97316',
  };
  return colors[color] || '#6b7280';
};

export default DebugScreen;
