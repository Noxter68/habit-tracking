// src/components/dashboard/HolidayModeDisplay.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Calendar, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import tw from 'twrnc';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { HolidayModeService } from '../../services/holidayModeService';
import { HapticFeedback } from '@/utils/haptics';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HolidayModeDisplayProps {
  endDate: string;
  reason?: string | null;
  onEndEarly?: () => void;
}

export const HolidayModeDisplay: React.FC<HolidayModeDisplayProps> = ({ endDate, reason, onEndEarly }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const daysRemaining = HolidayModeService.getDaysRemaining(endDate);
  const formattedEndDate = format(new Date(endDate), 'MMM dd, yyyy');

  const handleViewDetails = () => {
    navigation.navigate('HolidayMode');
  };

  return (
    <Animated.View entering={FadeIn.duration(600)} style={tw`mx-5 mt-6`}>
      <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl overflow-hidden shadow-lg`}>
        {/* Header Section */}
        <View style={tw`px-6 pt-6 pb-4 items-center`}>
          <View style={tw`w-16 h-16 rounded-full bg-white/30 items-center justify-center mb-4 shadow-sm`}>
            <Sun size={32} color="#FFFFFF" strokeWidth={1.5} />
          </View>

          <Text style={tw`text-xl font-bold text-white mb-1 text-center`}>{t('holidayMode.active')}</Text>

          <Text style={tw`text-sm text-white/80 text-center px-4`}>{t('holidayMode.enjoyBreak')}</Text>
        </View>

        <View style={tw`h-px bg-white/30 mx-6`} />

        {/* Info Section */}
        <View style={tw`px-6 py-5`}>
          <View style={tw`items-center mb-4`}>
            <View style={tw`bg-white/40 px-5 py-2 rounded-full mb-2`}>
              <Text style={tw`text-3xl font-bold text-white`}>{daysRemaining}</Text>
            </View>
            <Text style={tw`text-xs font-medium text-white/70 uppercase tracking-wider`}>{t('holidayMode.daysRemaining', { count: daysRemaining })}</Text>
          </View>

          <View style={tw`flex-row items-center justify-center mb-1`}>
            <Calendar size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={tw`text-xs text-white/80 ml-2`}>{t('holidayMode.returnOn', { date: formattedEndDate })}</Text>
          </View>

          {reason && (
            <View style={tw`mt-3 bg-white/20 px-3 py-2 rounded-2xl`}>
              <Text style={tw`text-xs text-white/90 text-center italic`}>"{reason}"</Text>
            </View>
          )}
        </View>

        <View style={tw`h-px bg-white/30 mx-6`} />

        {/* Motivational Message */}
        <View style={tw`px-6 py-4 items-center`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={tw`text-sm font-semibold text-white mx-2`}>{t('holidayMode.comeBackStronger')}</Text>
            <Sparkles size={14} color="#FFFFFF" strokeWidth={2} />
          </View>
          <Text style={tw`text-xs text-white/80 text-center leading-4`}>{t('holidayMode.motivationalMessage')}</Text>
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
            <Text style={tw`text-sm font-semibold text-amber-900`}>{t('holidayMode.viewDetails')}</Text>
          </Pressable>

          {onEndEarly && (
            <Pressable
              onPress={() => {
                HapticFeedback.light();
                onEndEarly();
              }}
              style={({ pressed }) => [tw`flex-1 bg-amber-900/20 rounded-2xl py-3 items-center shadow-sm border border-white/30`, pressed && tw`scale-95`]}
            >
              <Text style={tw`text-sm font-semibold text-white`}>{t('holidayMode.endEarly')}</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};
