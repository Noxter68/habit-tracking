// src/components/dashboard/DashboardHeader.tsx
import React, { createElement } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw from '../../lib/tailwind';
import { StreakFlameIcon, ActivityWaveIcon, TargetAchievedIcon } from '../icons/CustomIcons';
import { getGreeting } from '../../utils/progressStatus';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  weekProgress: number;
  activeHabits: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userTitle, userLevel, totalStreak, weekProgress, activeHabits }) => {
  const navigation = useNavigation();
  const greeting = getGreeting();

  const getTitleIcon = () => {
    const icons: Record<string, any> = {
      Newcomer: { icon: TargetAchievedIcon, color: '#6366f1' },
      Starter: { icon: TargetAchievedIcon, color: '#10b981' },
      Committed: { icon: StreakFlameIcon, color: '#f59e0b' },
      Dedicated: { icon: ActivityWaveIcon, color: '#8b5cf6' },
      Consistent: { icon: StreakFlameIcon, color: '#dc2626' },
      Warrior: { icon: TargetAchievedIcon, color: '#dc2626' },
      Champion: { icon: StreakFlameIcon, color: '#f59e0b' },
      Master: { icon: ActivityWaveIcon, color: '#6366f1' },
      Legend: { icon: TargetAchievedIcon, color: '#8b5cf6' },
      Mythic: { icon: StreakFlameIcon, color: '#dc2626' },
    };
    return icons[userTitle] || { icon: TargetAchievedIcon, color: '#6366f1' };
  };

  const titleData = getTitleIcon();

  return (
    <View style={tw`px-5 pt-5 pb-3`}>
      <Animated.View entering={FadeIn.duration(400)}>
        {/* Main Header */}
        <View style={tw`flex-row items-center justify-between mb-4`}>
          <View>
            <Text style={tw`text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{greeting}</Text>
            <Text style={tw`text-3xl font-bold text-gray-900 mt-1`}>Dashboard</Text>
          </View>

          {/* Achievement Badge */}
          {userTitle && (
            <Pressable style={({ pressed }) => [tw`bg-white rounded-2xl shadow-sm`, pressed && tw`scale-95`]} onPress={() => navigation.navigate('Achievements' as never)}>
              <LinearGradient colors={['#f8fafc', '#ffffff']} style={tw`px-4 py-3 rounded-2xl border border-gray-100`}>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`mr-3`}>{createElement(titleData.icon, { size: 28 })}</View>
                  <View>
                    <Text style={tw`text-sm font-bold text-gray-900`}>{userTitle}</Text>
                    <View style={tw`flex-row items-center mt-0.5`}>
                      <Text style={tw`text-xs text-gray-600`}>Level {userLevel}</Text>
                      <ChevronRight size={12} color="#6b7280" style={tw`ml-1`} />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          )}
        </View>

        {/* Quick Stats Cards */}
        <View style={tw`flex-row gap-2`}>
          <QuickStatCard icon={<StreakFlameIcon size={20} />} value={totalStreak} label="Streak" delay={100} />
          <QuickStatCard icon={<ActivityWaveIcon size={20} />} value={`${weekProgress}%`} label="Week" delay={200} />
          <QuickStatCard icon={<TargetAchievedIcon size={20} />} value={activeHabits} label="Active" delay={300} />
        </View>
      </Animated.View>
    </View>
  );
};

const QuickStatCard: React.FC<{
  icon: React.ReactElement;
  value: number | string;
  label: string;
  delay: number;
}> = ({ icon, value, label, delay }) => (
  <Animated.View entering={FadeIn.delay(delay).duration(400)} style={tw`flex-1`}>
    <View style={tw`bg-white rounded-2xl p-3 border border-gray-100 shadow-sm`}>
      <View style={tw`flex-row items-center justify-between mb-1`}>
        {icon}
        <Text style={tw`text-lg font-bold text-gray-900`}>{value}</Text>
      </View>
      <Text style={tw`text-xs text-gray-500 font-medium`}>{label}</Text>
    </View>
  </Animated.View>
);

export default DashboardHeader;
