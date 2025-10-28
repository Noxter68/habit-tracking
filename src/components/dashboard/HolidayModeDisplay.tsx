// src/components/dashboard/HolidayModeDisplay.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Calendar, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import tw from 'twrnc';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { HolidayModeService } from '../../services/holidayModeService';
import { HapticFeedback } from '@/utils/haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HolidayModeDisplayProps {
  endDate: string; // ISO date string (YYYY-MM-DD)
  reason?: string | null;
}

export const HolidayModeDisplay: React.FC<HolidayModeDisplayProps> = ({ endDate, reason }) => {
  const navigation = useNavigation<NavigationProp>();

  // ✅ Use the same calculation method as the service for consistency
  const daysRemaining = HolidayModeService.getDaysRemaining(endDate);
  const formattedEndDate = format(new Date(endDate), 'MMM dd, yyyy');

  const handleViewDetails = () => {
    navigation.navigate('HolidayMode');
  };

  return (
    <Animated.View entering={FadeIn.duration(600)} style={tw`mx-5 mt-6`}>
      <LinearGradient colors={['#e0f2fe', '#bfdbfe', '#93c5fd']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl overflow-hidden shadow-lg`}>
        {/* Header Section */}
        <View style={tw`px-6 pt-6 pb-4 items-center`}>
          {/* Icon Container */}
          <View style={tw`w-16 h-16 rounded-full bg-white/30 items-center justify-center mb-4 shadow-sm`}>
            <Sun size={32} color="#0369a1" strokeWidth={1.5} />
          </View>

          {/* Title */}
          <Text style={tw`text-xl font-bold text-sky-900 mb-1 text-center`}>Holiday Mode Active</Text>

          {/* Subtitle */}
          <Text style={tw`text-sm text-sky-700/80 text-center px-4`}>Enjoy your well-deserved break</Text>
        </View>

        {/* Divider */}
        <View style={tw`h-px bg-white/30 mx-6`} />

        {/* Info Section */}
        <View style={tw`px-6 py-5`}>
          {/* Days Remaining */}
          <View style={tw`items-center mb-4`}>
            <View style={tw`bg-white/40 px-5 py-2 rounded-full mb-2`}>
              <Text style={tw`text-3xl font-bold text-sky-900`}>{daysRemaining}</Text>
            </View>
            <Text style={tw`text-xs font-medium text-sky-700/70 uppercase tracking-wider`}>{daysRemaining === 1 ? 'Day Remaining' : 'Days Remaining'}</Text>
          </View>

          {/* Return Date */}
          <View style={tw`flex-row items-center justify-center mb-1`}>
            <Calendar size={14} color="#0369a1" strokeWidth={2} />
            <Text style={tw`text-xs text-sky-700/80 ml-2`}>
              Return on <Text style={tw`font-semibold text-sky-900`}>{formattedEndDate}</Text>
            </Text>
          </View>

          {/* Reason (if provided) */}
          {reason && (
            <View style={tw`mt-3 bg-white/20 px-3 py-2 rounded-2xl`}>
              <Text style={tw`text-xs text-sky-800/90 text-center italic`}>"{reason}"</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={tw`h-px bg-white/30 mx-6`} />

        {/* Motivational Message */}
        <View style={tw`px-6 py-4 items-center`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Sparkles size={14} color="#0369a1" strokeWidth={2} />
            <Text style={tw`text-sm font-semibold text-sky-900 mx-2`}>Come back stronger</Text>
            <Sparkles size={14} color="#0369a1" strokeWidth={2} />
          </View>
          <Text style={tw`text-xs text-sky-700/70 text-center leading-4`}>Your streaks are safe. Rest, recharge, and return ready to continue your journey.</Text>
        </View>

        {/* Action Buttons */}
        <View style={tw`px-5 pb-5 flex-row gap-2`}>
          <Pressable
            onPress={() => {
              HapticFeedback.light();
              handleViewDetails();
            }}
            style={({ pressed }) => [tw`flex-1 bg-white/90 rounded-2xl py-3 items-center shadow-sm`, pressed && tw`scale-95`]}
          >
            <Text style={tw`text-sm font-semibold text-sky-900`}>View Details</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              HapticFeedback.light();
              handleViewDetails();
            }}
            style={({ pressed }) => [tw`flex-1 bg-sky-900/90 rounded-2xl py-3 items-center shadow-sm`, pressed && tw`scale-95`]}
          >
            <Text style={tw`text-sm font-semibold text-white`}>End Early</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
