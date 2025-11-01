// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StatusBar, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { LeaderboardService, LeaderboardEntry } from '@/services/LeaderboardService';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Logger from '@/utils/logger';

const CROWN_IMAGE = require('../../assets/leaderboard/leaderboard-crown.png');

// Gem assets
const CRYSTAL_GEM = require('../../assets/interface/gems/crystal-gem.png');
const RUBY_GEM = require('../../assets/interface/gems/ruby-gem.png');
const AMETHYST_GEM = require('../../assets/interface/gems/amethyst-gem.png');

const TIER_COLORS = {
  1: { bg: '#8b5cf6', light: '#a78bfa', border: '#7c3aed', gem: AMETHYST_GEM },
  2: { bg: '#ef4444', light: '#f87171', border: '#dc2626', gem: RUBY_GEM },
  3: { bg: '#60a5fa', light: '#93c5fd', border: '#3b82f6', gem: CRYSTAL_GEM },
};

type LeaderboardMode = 'global' | 'weekly';

const LeaderboardScreen = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<LeaderboardMode>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, [])
  );

  const loadLeaderboard = async (isRefresh = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      if (mode === 'global') {
        const { leaderboard: data, currentUserRank: rank } = await LeaderboardService.getGlobalLeaderboard(user.id, 20);
        setLeaderboard(data);
        setCurrentUserRank(rank);
      } else {
        const { leaderboard: data, currentUserRank: rank } = await LeaderboardService.getWeeklyLeaderboard(user.id, 20);
        setLeaderboard(data);
        setCurrentUserRank(rank);
      }
    } catch (error) {
      Logger.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [user, mode]);

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);
  const currentUser = leaderboard.find((u) => u.isCurrentUser);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1e293b', '#0f172a', '#020617']} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLeaderboard(true)} tintColor="#8b5cf6" />}
      >
        {/* Header */}
        <LinearGradient colors={['#1F2937', '#111827', '#030712']} style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 }}>
          {/* Crown */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Image source={require('../../assets/interface/Leaderboard/leader-crown.png')} style={{ width: 120, height: 120 }} resizeMode="contain" />
          </View>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(251, 191, 36, 0.3)',
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#fcd34d', letterSpacing: 2, textTransform: 'uppercase' }}>Hall of Champions</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 }}>Leaderboard</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>Rise through the ranks</Text>
          </View>

          {/* Mode Switcher */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 14, padding: 3, gap: 3 }}>
            <Pressable onPress={() => setMode('global')} style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: mode === 'global' ? 'rgba(251, 191, 36, 0.25)' : 'transparent' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: mode === 'global' ? '#fcd34d' : '#9CA3AF', textAlign: 'center' }}>ALL TIME</Text>
            </Pressable>
            <Pressable onPress={() => setMode('weekly')} style={{ flex: 1, paddingVertical: 9, borderRadius: 11, backgroundColor: mode === 'weekly' ? 'rgba(251, 191, 36, 0.25)' : 'transparent' }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: mode === 'weekly' ? '#fcd34d' : '#9CA3AF', textAlign: 'center' }}>THIS WEEK</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Top 3 Podium */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <LinearGradient
            colors={['#2d3748', '#1a202c', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
            }}
          >
            {/* 1st Place */}
            {topThree[0] && (
              <Animated.View entering={FadeInDown.delay(100)} style={{ marginBottom: 16 }}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 20,
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 3,
                    borderColor: `${TIER_COLORS[1].bg}80`,
                    shadowColor: TIER_COLORS[1].bg,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.6,
                    shadowRadius: 16,
                  }}
                >
                  <Image source={require('../../assets/interface/Leaderboard/top1.png')} style={{ width: 80, height: 80, marginRight: 16 }} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 19, fontWeight: '900', color: '#FFFFFF', marginBottom: 10 }} numberOfLines={1}>
                      {topThree[0].username}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 28, fontWeight: '900', color: TIER_COLORS[1].light, letterSpacing: -1 }}>
                        {mode === 'weekly' ? (topThree[0].weeklyXP || 0).toLocaleString() : topThree[0].total_xp.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#9CA3AF' }}>XP</Text>
                      <View style={{ backgroundColor: `${TIER_COLORS[1].bg}30`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: TIER_COLORS[1].light }}>LVL {topThree[0].current_level}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* 2nd and 3rd Place */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              {/* 2nd Place */}
              {topThree[1] && (
                <Animated.View entering={FadeInDown.delay(200)} style={{ flex: 1, alignItems: 'center' }}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']}
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      width: '100%',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: `${TIER_COLORS[2].bg}60`,
                      shadowColor: TIER_COLORS[2].bg,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                    }}
                  >
                    <Image source={TIER_COLORS[2].gem} style={{ width: 64, height: 64, marginBottom: 10 }} resizeMode="contain" />

                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }} numberOfLines={1}>
                      {topThree[1].username}
                    </Text>

                    <Text style={{ fontSize: 22, fontWeight: '900', color: TIER_COLORS[2].light, letterSpacing: -0.5 }}>
                      {mode === 'weekly' ? (topThree[1].weeklyXP || 0).toLocaleString() : topThree[1].total_xp.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>XP</Text>

                    <View style={{ backgroundColor: `${TIER_COLORS[2].bg}30`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: TIER_COLORS[2].light }}>LVL {topThree[1].current_level}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <Animated.View entering={FadeInDown.delay(300)} style={{ flex: 1, alignItems: 'center' }}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.08)']}
                    style={{
                      borderRadius: 18,
                      padding: 14,
                      width: '100%',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: `${TIER_COLORS[3].bg}60`,
                      shadowColor: TIER_COLORS[3].bg,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.5,
                      shadowRadius: 12,
                    }}
                  >
                    <Image source={TIER_COLORS[3].gem} style={{ width: 64, height: 64, marginBottom: 10 }} resizeMode="contain" />

                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 }} numberOfLines={1}>
                      {topThree[2].username}
                    </Text>

                    <Text style={{ fontSize: 22, fontWeight: '900', color: TIER_COLORS[3].light, letterSpacing: -0.5 }}>
                      {mode === 'weekly' ? (topThree[2].weeklyXP || 0).toLocaleString() : topThree[2].total_xp.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '600' }}>XP</Text>

                    <View style={{ backgroundColor: `${TIER_COLORS[3].bg}30`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: TIER_COLORS[3].light }}>LVL {topThree[2].current_level}</Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Rest of Leaderboard */}
        {remaining.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.05)']}
              style={{ borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              {remaining.map((user, index) => (
                <View
                  key={user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.15)' : index % 2 === 0 ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    borderBottomWidth: index < remaining.length - 1 ? 1 : 0,
                    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
                    borderLeftWidth: user.isCurrentUser ? 3 : 0,
                    borderLeftColor: '#8b5cf6',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '800', color: user.isCurrentUser ? '#a78bfa' : '#6B7280', width: 40 }}>{user.rank}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>{user.username}</Text>
                      {user.isCurrentUser && (
                        <View style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 8, fontWeight: '900', color: '#a78bfa' }}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginTop: 2 }}>Level {user.current_level}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#D1D5DB' }}>{mode === 'weekly' ? (user.weeklyXP || 0).toLocaleString() : user.total_xp.toLocaleString()}</Text>
                    <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '600' }}>XP</Text>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>
        )}

        {/* Your Position (if outside top 20) */}
        {currentUser && currentUser.rank > 20 && (
          <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <LinearGradient colors={['#4B5563', '#374151']} style={{ borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, color: '#D1D5DB', fontWeight: '800', marginBottom: 2 }}>YOUR RANK</Text>
                <Text style={{ fontSize: 17, fontWeight: '900', color: '#FFFFFF' }}>{currentUser.username}</Text>
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '700', marginTop: 2 }}>
                  {mode === 'weekly' ? `${(currentUser.weeklyXP || 0).toLocaleString()} XP` : `${currentUser.total_xp.toLocaleString()} XP • Lv.${currentUser.current_level}`}
                </Text>
              </View>
              <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 }}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFFFFF' }}>{currentUserRank}</Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default LeaderboardScreen;
