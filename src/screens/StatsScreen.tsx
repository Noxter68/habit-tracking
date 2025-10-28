// src/screens/StatsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3 } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { format } from 'date-fns';

// Import components
import PremiumStatsSection from '@/components/premium/PremiumStatsSection';
import PredictionCard from '@/components/stats/PredictionCard';
import { useHabits } from '@/context/HabitContext';
import { useStats } from '@/context/StatsContext';
import { useAuth } from '@/context/AuthContext';

type TimeRange = 'week' | 'month' | '4weeks';

const StatsScreen: React.FC = () => {
  const { user } = useAuth();
  const { habits, loading: habitsLoading, refreshHabits } = useHabits();
  const { stats, refreshStats } = useStats();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('week');

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshHabits(), refreshStats(true)]);
    setRefreshing(false);
  };

  if (habitsLoading || !habits) {
    return (
      <View style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  // Ensure habits is an array
  const safeHabits = Array.isArray(habits) ? habits : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F7' }}>
      <ScrollView style={{ flex: 1, marginTop: 32 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}>
        {/* Elegant Header Section - Jade Green */}
        <LinearGradient colors={['#d1fae5', '#a7f3d0', '#6ee7b7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: 'rgba(5, 150, 105, 0.15)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857', letterSpacing: 2 }}>YOUR PROGRESS</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#064e3b', letterSpacing: -1 }}>Statistics</Text>
            <Text style={{ fontSize: 13, color: '#065f46', marginTop: 4, fontWeight: '600' }}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>

          {/* Level Badge - Jade Gradient */}
          <View style={{ alignItems: 'center', marginTop: 12 }}>
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 20,
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '700', letterSpacing: 1 }}>LEVEL {stats?.level || 1}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* Success Prediction Card */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20, paddingTop: 20 }}>
          <PredictionCard habits={safeHabits} />
        </View>

        {/* Analytics Section Header */}
        <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={18} color="#9333EA" />
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#9333EA', letterSpacing: 1.5 }}>ANALYTICS</Text>
          </View>
        </View>

        {/* Premium Analytics Section */}
        {/* <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
          <PremiumStatsSection habits={safeHabits} selectedRange={selectedRange} onRangeChange={setSelectedRange} />
        </View> */}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default StatsScreen;
