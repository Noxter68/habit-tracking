// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StatusBar, RefreshControl, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LeaderboardService, LeaderboardEntry } from '@/services/LeaderboardService';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import Logger from '@/utils/logger';

const CROWN_IMAGE = require('../../assets/leaderboard/leaderboard-crown.png');
const BACKGROUND = require('../../assets/interface/background-v3.png');

// Podium icons
const FIRST_PLACE = require('../../assets/interface/Leaderboard/1st.png');
const SECOND_PLACE = require('../../assets/interface/Leaderboard/2nd.png');
const THIRD_PLACE = require('../../assets/interface/Leaderboard/3rd.png');

const TIER_COLORS = {
  1: { bg: '#fbbf24', light: '#fde047', border: '#f59e0b' },
  2: { bg: '#94a3b8', light: '#cbd5e1', border: '#64748b' },
  3: { bg: '#cd7f32', light: '#d4a574', border: '#a0522d' },
};

type LeaderboardMode = 'global' | 'weekly';

const LeaderboardScreen = () => {
  const { t } = useTranslation();
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
      <ImageBackground source={BACKGROUND} style={styles.background} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, tw`bg-black/50`]} />
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={tw`text-white/80 mt-4`}>{t('leaderboard.loading')}</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={BACKGROUND} style={styles.background} resizeMode="cover">
      <View style={[StyleSheet.absoluteFill, tw`bg-black/50`]} />

      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`pb-24`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLeaderboard(true)} tintColor="#8b5cf6" />}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`px-6 pt-4 pb-8`}>
            {/* Crown */}
            <View style={tw`items-center `}>
              <Image source={CROWN_IMAGE} style={tw`w-40 h-40`} resizeMode="contain" />
            </View>

            {/* Title */}
            <View style={tw`items-center mb-8`}>
              <Text style={tw`text-4xl font-bold text-white text-center mb-2`}>{t('leaderboard.title')}</Text>
              <Text style={tw`text-base text-white/80 text-center`}>{t('leaderboard.subtitle')}</Text>
            </View>

            {/* Mode Toggle */}
            <View style={tw`bg-white/15 rounded-xl p-1 flex-row border-2 border-white/20`}>
              <Pressable
                onPress={() => setMode('global')}
                style={({ pressed }) => [tw`flex-1 py-2 rounded-xl items-center`, mode === 'global' ? tw`bg-violet-600` : tw`bg-transparent`, pressed && tw`opacity-80`]}
              >
                <Text style={tw`text-xs font-bold ${mode === 'global' ? 'text-white' : 'text-white/70'}`}>{t('leaderboard.modes.global')}</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('weekly')}
                style={({ pressed }) => [tw`flex-1 py-2 rounded-xl items-center`, mode === 'weekly' ? tw`bg-violet-600` : tw`bg-transparent`, pressed && tw`opacity-80`]}
              >
                <Text style={tw`text-xs font-bold ${mode === 'weekly' ? 'text-white' : 'text-white/70'}`}>{t('leaderboard.modes.weekly')}</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={tw`mb-8 px-4`}>
              <View style={tw`flex-row items-end justify-center gap-2`}>
                {/* 2nd Place */}
                {topThree[1] && (
                  <Animated.View entering={FadeInDown.delay(300).springify()} style={tw`flex-1 items-center`}>
                    <View style={tw`mb-3`}>
                      <Image source={SECOND_PLACE} style={{ width: 100, height: 100 }} resizeMode="contain" />
                    </View>

                    <View style={[tw`w-full bg-white/15 border-2 border-white/20 rounded-2xl p-2 items-center`, { minHeight: 130 }]}>
                      <View style={tw`bg-slate-500/30 rounded-full px-3 py-1 mb-2`}>
                        <Text style={tw`text-xs font-black text-slate-200`}>#2</Text>
                      </View>

                      <View style={tw`bg-white/90 rounded-full px-3 py-1 mb-3`}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#1e293b' }} numberOfLines={1}>
                          {topThree[1].username}
                        </Text>
                      </View>

                      <View style={tw`items-center`}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
                          {mode === 'weekly' ? (topThree[1].weeklyXP || 0).toLocaleString() : topThree[1].total_xp.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 8 }}>{t('leaderboard.labels.xp')}</Text>

                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{topThree[1].current_level}</Text>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{t('leaderboard.labels.level')}</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <Animated.View entering={FadeInDown.delay(100).springify()} style={tw`flex-1 items-center`}>
                    <View style={tw`mb-3`}>
                      <Image source={FIRST_PLACE} style={{ width: 120, height: 120 }} resizeMode="contain" />
                    </View>

                    <View
                      style={[
                        tw`w-full rounded-2xl p-2 items-center border-2`,
                        {
                          backgroundColor: 'rgba(251, 191, 36, 0.3)',
                          borderColor: TIER_COLORS[1].border,
                          minHeight: 180,
                        },
                      ]}
                    >
                      <View style={tw`bg-amber-500/40 rounded-full px-3 py-1 mb-2`}>
                        <Text style={tw`text-xs font-black text-amber-100`}>#1</Text>
                      </View>

                      <View style={tw`bg-white/90 rounded-full px-3 py-1.5 mb-4`}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#92400e' }} numberOfLines={1}>
                          {topThree[0].username}
                        </Text>
                      </View>

                      <View style={tw`items-center`}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
                          {mode === 'weekly' ? (topThree[0].weeklyXP || 0).toLocaleString() : topThree[0].total_xp.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 11, color: 'rgba(253,224,71,0.8)', fontWeight: '700', marginBottom: 10 }}>{t('leaderboard.labels.xp')}</Text>

                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{topThree[0].current_level}</Text>
                        <Text style={{ fontSize: 11, color: 'rgba(253,224,71,0.8)', fontWeight: '700' }}>{t('leaderboard.labels.level')}</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <Animated.View entering={FadeInDown.delay(400).springify()} style={tw`flex-1 items-center`}>
                    <View style={tw`mb-3`}>
                      <Image source={THIRD_PLACE} style={{ width: 100, height: 100 }} resizeMode="contain" />
                    </View>

                    <View style={[tw`w-full bg-white/15 border-2 border-white/20 rounded-2xl p-2 items-center`, { minHeight: 110 }]}>
                      <View style={tw`bg-orange-800/40 rounded-full px-3 py-1 mb-2`}>
                        <Text style={tw`text-xs font-black text-orange-200`}>#3</Text>
                      </View>

                      <View style={tw`bg-white/90 rounded-full px-2 py-1 mb-3`}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: '#7c2d12' }} numberOfLines={1}>
                          {topThree[2].username}
                        </Text>
                      </View>

                      <View style={tw`items-center`}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>
                          {mode === 'weekly' ? (topThree[2].weeklyXP || 0).toLocaleString() : topThree[2].total_xp.toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 6 }}>{t('leaderboard.labels.xp')}</Text>

                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFFFFF' }}>{topThree[2].current_level}</Text>
                        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{t('leaderboard.labels.level')}</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Rest of Leaderboard */}
          {remaining.length > 0 && (
            <Animated.View entering={FadeInDown.delay(500)} style={tw`px-6`}>
              <View style={tw`mb-4 flex-row items-center`}>
                <View style={tw`flex-1 h-px bg-white/20`} />
                <Text style={tw`text-xs font-bold text-white/50 mx-3 tracking-wider`}>{t('leaderboard.sections.otherChampions')}</Text>
                <View style={tw`flex-1 h-px bg-white/20`} />
              </View>

              <View style={tw`gap-2`}>
                {remaining.map((user, index) => (
                  <Animated.View key={user.id} entering={FadeInDown.delay(600 + index * 30).duration(300)}>
                    <View
                      style={[
                        tw`flex-row items-center p-4 rounded-xl border-2`,
                        {
                          backgroundColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.10)',
                          borderColor: user.isCurrentUser ? '#8b5cf6' : 'rgba(255, 255, 255, 0.20)',
                        },
                      ]}
                    >
                      <View style={tw`mr-4`}>
                        <View
                          style={[
                            tw`w-10 h-10 rounded-xl items-center justify-center`,
                            {
                              backgroundColor: user.isCurrentUser ? '#7c3aed' : 'rgba(255, 255, 255, 0.15)',
                            },
                          ]}
                        >
                          <Text style={tw`text-white font-black text-sm`}>{user.rank}</Text>
                        </View>
                      </View>

                      <View style={tw`flex-1`}>
                        <View style={tw`flex-row items-center gap-2 mb-0.5`}>
                          <Text style={tw`text-white font-bold text-sm`}>{user.username}</Text>
                          {user.isCurrentUser && (
                            <View style={tw`bg-violet-600/50 px-2 py-0.5 rounded`}>
                              <Text style={tw`text-violet-200 text-xs font-black`}>{t('leaderboard.labels.you')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={tw`text-white/60 text-xs font-semibold`}>
                          {t('leaderboard.labels.level')} {user.current_level}
                        </Text>
                      </View>

                      <View style={tw`items-end`}>
                        <Text style={tw`text-white font-bold text-sm`}>{mode === 'weekly' ? (user.weeklyXP || 0).toLocaleString() : user.total_xp.toLocaleString()}</Text>
                        <Text style={tw`text-white/50 text-xs font-semibold`}>{t('leaderboard.labels.xp')}</Text>
                      </View>
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Your Position (if outside top 20) */}
          {currentUser && currentUser.rank > 20 && (
            <Animated.View entering={FadeInUp.delay(700)} style={tw`px-6 mt-6`}>
              <View style={tw`mb-2`}>
                <Text style={tw`text-xs font-bold text-white/50 text-center tracking-wider`}>{t('leaderboard.sections.yourRank')}</Text>
              </View>

              <View style={tw`bg-slate-600/40 border-2 border-slate-500/50 rounded-2xl p-5 flex-row items-center justify-between`}>
                <View>
                  <Text style={tw`text-xs font-bold text-white/80 mb-1 tracking-wide`}>{t('leaderboard.sections.yourPosition')}</Text>
                  <Text style={tw`text-white font-black text-lg mb-1`}>{currentUser.username}</Text>
                  <Text style={tw`text-white/70 text-xs font-semibold`}>
                    {mode === 'weekly'
                      ? t('leaderboard.stats.weeklyXp', {
                          xp: (currentUser.weeklyXP || 0).toLocaleString(),
                        })
                      : t('leaderboard.stats.levelWithXp', {
                          xp: currentUser.total_xp.toLocaleString(),
                          level: currentUser.current_level,
                        })}
                  </Text>
                </View>

                <View style={tw`bg-white/15 rounded-2xl px-5 py-3`}>
                  <Text style={tw`text-white font-black text-2xl`}>{currentUserRank}</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export default LeaderboardScreen;
