// src/screens/LeaderboardScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, StatusBar, RefreshControl, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { LeaderboardService, LeaderboardEntry, UserRankStats } from '@/services/LeaderboardService';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import Logger from '@/utils/logger';
import { getFlagFromTimezone } from '@/utils/timezoneToCountry';
import { Globe, MapPin, Zap, Clock } from 'lucide-react-native';
import { getAchievementTierTheme, tierThemes } from '@/utils/tierTheme';
import { getAchievementByLevel } from '@/utils/achievements';

const CROWN_IMAGE = require('../../assets/leaderboard/leaderboard-crown.png');
const BACKGROUND = require('../../assets/interface/background-v3.png');

// Podium icons
const FIRST_PLACE = require('../../assets/interface/Leaderboard/1st.png');
const SECOND_PLACE = require('../../assets/interface/Leaderboard/2nd.png');
const THIRD_PLACE = require('../../assets/interface/Leaderboard/3rd.png');

type LeaderboardMode = 'global' | 'weekly' | 'local';

const LeaderboardScreen = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [mode, setMode] = useState<LeaderboardMode>('weekly'); // Weekly par défaut
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserRankStats | null>(null);

  // Animation pour le toggle
  const togglePosition = useSharedValue(mode === 'weekly' ? 0 : mode === 'global' ? 1 : 2);

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

      // Charger les stats utilisateur (pour la card personnelle et les stats cards)
      const stats = await LeaderboardService.getUserRankStats(user.id);
      setUserStats(stats);

      // Charger le leaderboard selon le mode
      if (mode === 'global') {
        const { leaderboard: data, currentUserRank: rank } = await LeaderboardService.getGlobalLeaderboard(user.id, 20);
        setLeaderboard(data);
        setCurrentUserRank(rank);
      } else if (mode === 'weekly') {
        const { leaderboard: data, currentUserRank: rank } = await LeaderboardService.getWeeklyLeaderboard(user.id, 20);
        setLeaderboard(data);
        setCurrentUserRank(rank);
      } else if (mode === 'local') {
        const { leaderboard: data, currentUserRank: rank } = await LeaderboardService.getLocalLeaderboard(user.id, 20);
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

  // Calculer le temps restant jusqu'au prochain lundi (reset hebdomadaire)
  const getTimeUntilReset = (): string => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // Dimanche = 0, donc prochain lundi

    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);

    const diff = nextMonday.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  };

  // Animation style pour le toggle - DOIT être avant le if (loading)
  const animatedToggleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(togglePosition.value * 33.33, { damping: 15, stiffness: 150 }) }],
    };
  });

  const handleModeChange = (newMode: LeaderboardMode) => {
    setMode(newMode);
    togglePosition.value = newMode === 'weekly' ? 0 : newMode === 'global' ? 1 : 2;
  };

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);
  const currentUser = leaderboard.find((u) => u.isCurrentUser);

  // Calculer le tier de l'utilisateur pour la texture de fond
  const userAchievement = currentUser ? getAchievementByLevel(currentUser.current_level) : null;
  const userTier = userAchievement?.tierKey || 'novice';
  const userTierTheme = getAchievementTierTheme(userTier);

  if (loading) {
    return (
      <ImageBackground source={BACKGROUND} style={styles.background} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, tw`bg-black/40`]} />
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={tw`text-white/80 mt-4`}>{t('leaderboard.loading')}</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={BACKGROUND} style={styles.background} resizeMode="cover">
      <View style={[StyleSheet.absoluteFill, tw`bg-black/40`]} />

      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`pb-24`}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLeaderboard(true)} tintColor="#8b5cf6" />}
        >
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`px-6 pb-6`}>
            {/* Crown - réduit l'espace */}
            <View style={tw`items-center `}>
              <Image source={CROWN_IMAGE} style={tw`w-40 h-30`} resizeMode="contain" />
            </View>

            {/* Title */}
            <View style={tw`items-center mb-6`}>
              <Text style={tw`text-3xl font-bold text-white text-center mb-1`}>{t('leaderboard.title')}</Text>
              <Text style={tw`text-sm text-white/80 text-center`}>{t('leaderboard.subtitle')}</Text>
            </View>

            {/* Mode Toggle - redesigné avec animation */}
            <View style={tw`bg-white/10 rounded-xl p-1 flex-row border border-white/20`}>
              <Pressable onPress={() => handleModeChange('weekly')} style={[tw`flex-1 py-2 rounded-lg items-center justify-center`, mode === 'weekly' && tw`bg-violet-600`]}>
                <Text style={tw`text-xs font-bold ${mode === 'weekly' ? 'text-white' : 'text-white/60'}`}>{t('leaderboard.modes.weekly')}</Text>
              </Pressable>
              <Pressable onPress={() => handleModeChange('global')} style={[tw`flex-1 py-2 rounded-lg items-center justify-center`, mode === 'global' && tw`bg-violet-600`]}>
                <Text style={tw`text-xs font-bold ${mode === 'global' ? 'text-white' : 'text-white/60'}`}>{t('leaderboard.modes.global')}</Text>
              </Pressable>
              <Pressable onPress={() => handleModeChange('local')} style={[tw`flex-1 py-2 rounded-lg items-center justify-center`, mode === 'local' && tw`bg-violet-600`]}>
                <Text style={tw`text-xs font-bold ${mode === 'local' ? 'text-white' : 'text-white/60'}`}>{t('leaderboard.modes.local')}</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={tw`mb-4 mt-10 px-6`}>
              <View style={tw`flex-row items-end justify-center gap-2`}>
                {/* 2nd Place - Ruby */}
                {topThree[1] && (
                  <Animated.View entering={FadeInDown.delay(300).springify()} style={tw`flex-1 items-center relative`}>
                    {/* Gemme en absolute au top de la card avec z-index élevé */}
                    <View style={[tw`absolute`, { top: -35, zIndex: 999 }]}>
                      <Image source={SECOND_PLACE} style={{ width: 70, height: 70 }} resizeMode="contain" />
                    </View>

                    <View
                      style={[
                        tw`w-full border-2 rounded-2xl items-center overflow-hidden`,
                        {
                          borderColor: tierThemes.Ruby.accent,
                          backgroundColor: `${tierThemes.Ruby.accent}20`,
                        },
                      ]}
                    >
                      <ImageBackground source={tierThemes.Ruby.texture} resizeMode="cover" style={[tw`w-full items-center py-3`, { minHeight: 135, paddingTop: 40 }]} imageStyle={{ opacity: 0.5 }}>
                        <View style={[tw`rounded-full px-2.5  mb-2`, { backgroundColor: `${tierThemes.Ruby.accent}50` }]}>
                          <Text style={tw`text-xl font-black text-white`}>#2</Text>
                        </View>

                        {/* Username avec drapeau aligné */}
                        <Text style={{ fontSize: 12 }}>{getFlagFromTimezone(topThree[1].timezone_offset)}</Text>
                        <View style={tw`flex-row items-center gap-1.5 mt-2 mb-2`}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }} numberOfLines={1}>
                            {topThree[1].username}
                          </Text>
                        </View>

                        {/* XP et Level - deux lignes séparées */}
                        <View style={tw`items-center`}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
                            {mode === 'weekly' ? (topThree[1].weeklyXP || 0).toLocaleString() : topThree[1].total_xp.toLocaleString()}
                          </Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 8 }}>XP</Text>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>{topThree[1].current_level}</Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{t('leaderboard.labels.levelFull')}</Text>
                        </View>
                      </ImageBackground>
                    </View>
                  </Animated.View>
                )}

                {/* 1st Place - Amethyst */}
                {topThree[0] && (
                  <Animated.View entering={FadeInDown.delay(100).springify()} style={tw`flex-1 items-center relative`}>
                    {/* Gemme en absolute au top de la card avec z-index élevé */}
                    <View style={[tw`absolute`, { top: -40, zIndex: 999 }]}>
                      <Image source={FIRST_PLACE} style={{ width: 80, height: 80 }} resizeMode="contain" />
                    </View>

                    <View
                      style={[
                        tw`w-full rounded-2xl items-center border-2 overflow-hidden`,
                        {
                          borderColor: tierThemes.Amethyst.accent,
                          backgroundColor: `${tierThemes.Amethyst.accent}25`,
                        },
                      ]}
                    >
                      <ImageBackground
                        source={tierThemes.Amethyst.texture}
                        resizeMode="cover"
                        style={[tw`w-full items-center pb-8 `, { minHeight: 175, paddingTop: 35 }]}
                        imageStyle={{ opacity: 0.5 }}
                      >
                        <View style={[tw`rounded-full px-3 py-1 mb-2`, { backgroundColor: `${tierThemes.Amethyst.accent}60` }]}>
                          <Text style={tw`text-2xl font-black text-white`}>#1</Text>
                        </View>

                        {/* Username avec drapeau aligné */}
                        <Text style={{ fontSize: 14 }}>{getFlagFromTimezone(topThree[0].timezone_offset)}</Text>
                        <View style={tw`flex-row items-center gap-2 mt-2 mb-2`}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }} numberOfLines={1}>
                            {topThree[0].username}
                          </Text>
                        </View>

                        {/* XP et Level - deux lignes séparées */}
                        <View style={tw`items-center`}>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>
                            {mode === 'weekly' ? (topThree[0].weeklyXP || 0).toLocaleString() : topThree[0].total_xp.toLocaleString()}
                          </Text>
                          <Text style={{ fontSize: 10, color: 'rgba(253,224,71,0.9)', fontWeight: '700', marginBottom: 10 }}>XP</Text>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>{topThree[0].current_level}</Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700' }}>{t('leaderboard.labels.levelFull')}</Text>
                        </View>
                      </ImageBackground>
                    </View>
                  </Animated.View>
                )}

                {/* 3rd Place - Crystal */}
                {topThree[2] && (
                  <Animated.View entering={FadeInDown.delay(400).springify()} style={tw`flex-1 items-center relative`}>
                    {/* Gemme en absolute au top de la card avec z-index élevé */}
                    <View style={[tw`absolute`, { top: -35, zIndex: 999 }]}>
                      <Image source={THIRD_PLACE} style={{ width: 70, height: 70 }} resizeMode="contain" />
                    </View>

                    <View
                      style={[
                        tw`w-full border-2 rounded-2xl items-center overflow-hidden`,
                        {
                          borderColor: tierThemes.Crystal.accent,
                          backgroundColor: `${tierThemes.Crystal.accent}20`,
                        },
                      ]}
                    >
                      <ImageBackground source={tierThemes.Crystal.texture} resizeMode="cover" style={[tw`w-full items-center py-3`, { minHeight: 115, paddingTop: 30 }]} imageStyle={{ opacity: 0.5 }}>
                        <View style={[tw`rounded-full px-2.5  mb-2`, { backgroundColor: `${tierThemes.Crystal.accent}50` }]}>
                          <Text style={tw`text-xl font-black text-white`}>#3</Text>
                        </View>

                        {/* Username avec drapeau aligné */}
                        <Text style={{ fontSize: 12 }}>{getFlagFromTimezone(topThree[2].timezone_offset)}</Text>
                        <View style={tw`flex-row items-center gap-1.5 mt-2 mb-2`}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }} numberOfLines={1}>
                            {topThree[2].username}
                          </Text>
                        </View>

                        {/* XP et Level - deux lignes séparées */}
                        <View style={tw`items-center`}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>
                            {mode === 'weekly' ? (topThree[2].weeklyXP || 0).toLocaleString() : topThree[2].total_xp.toLocaleString()}
                          </Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 8 }}>XP</Text>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF' }}>{topThree[2].current_level}</Text>
                          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{t('leaderboard.labels.levelFull')}</Text>
                        </View>
                      </ImageBackground>
                    </View>
                  </Animated.View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Personal Rank Card - sous les stats avec plus d'opacité */}
          {userStats && currentUser && (
            <Animated.View entering={FadeInDown.delay(280)} style={tw`px-6 mb-2`}>
              <ImageBackground source={userTierTheme.texture} resizeMode="cover" imageStyle={{ opacity: 0.5, borderRadius: 16 }}>
                <View
                  style={[
                    tw`rounded-2xl p-4 border-2 flex-row items-center overflow-hidden`,
                    {
                      backgroundColor: `${userTierTheme.accent}30`,
                      borderColor: userTierTheme.accent,
                    },
                  ]}
                >
                  {/* Rang - plus grand */}
                  <View style={[tw`rounded-xl px-5 py-3 mr-4`, { backgroundColor: userTierTheme.accent }]}>
                    <Text style={tw`text-white font-black text-3xl`}>#{mode === 'global' ? userStats.globalRank : mode === 'local' ? userStats.localRank : currentUserRank}</Text>
                  </View>

                  {/* Message d'encouragement à droite */}
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-white/90 text-xs font-bold mb-1`}>
                      {mode === 'local' ? t('leaderboard.rankTypes.local') : mode === 'weekly' ? t('leaderboard.rankTypes.weekly') : t('leaderboard.rankTypes.global')}
                    </Text>
                    <Text style={tw`text-white text-sm font-bold leading-5`}>
                      {userStats.percentile >= 90
                        ? t('leaderboard.encouragement.top10', { percentile: userStats.percentile })
                        : userStats.percentile >= 75
                        ? t('leaderboard.encouragement.top25', { percentile: userStats.percentile })
                        : userStats.percentile >= 50
                        ? t('leaderboard.encouragement.top50', { topPercent: 100 - userStats.percentile })
                        : t('leaderboard.encouragement.other', { percentile: userStats.percentile })}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </Animated.View>
          )}

          {/* Stats Cards unifiées - XP, Global Rank & Local Rank sous le podium */}
          {userStats && currentUser && (
            <Animated.View entering={FadeInDown.delay(250)} style={tw`px-6 mb-4`}>
              <View style={tw`bg-white/15 border-2 border-white/20 rounded-2xl p-4 flex-row items-center justify-around`}>
                {/* XP */}
                <View style={tw`flex-1 items-center`}>
                  <Zap size={20} color="#ffffff" fill="transparent" strokeWidth={2} />
                  <Text style={tw`text-white/60 text-xs font-bold mt-2 mb-1`}>XP</Text>
                  <Text style={tw`text-white font-black text-xl`}>{currentUser.total_xp.toLocaleString()}</Text>
                </View>

                {/* Séparateur */}
                <View style={tw`h-16 w-px bg-white/30`} />

                {/* Global */}
                <View style={tw`flex-1 items-center`}>
                  <Globe size={20} color="#ffffff" strokeWidth={2} />
                  <Text style={tw`text-white/60 text-xs font-bold mt-2 mb-1`}>GLOBAL</Text>
                  <Text style={tw`text-white font-black text-xl`}>#{userStats.globalRank}</Text>
                </View>

                {/* Séparateur */}
                <View style={tw`h-16 w-px bg-white/30`} />

                {/* Local */}
                <View style={tw`flex-1 items-center`}>
                  <MapPin size={20} color="#ffffff" strokeWidth={2} />
                  <Text style={tw`text-white/60 text-xs font-bold mt-2 mb-1`}>LOCAL</Text>
                  <Text style={tw`text-white font-black text-xl`}>#{userStats.localRank}</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Timer de reset - petit badge en bas */}
          {mode === 'weekly' && (
            <Animated.View entering={FadeInDown.delay(300)} style={tw`px-6 mb-6 items-center`}>
              <View style={tw`bg-white/20 border border-white/30 rounded-full px-4 py-2 flex-row items-center gap-2`}>
                <Clock size={14} color="#ffffff" strokeWidth={2.5} />
                <Text style={tw`text-white/80 text-xs font-semibold`}>Reset: {getTimeUntilReset()}</Text>
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
                          {/* Drapeau du pays avec container arrondi */}
                          <View style={tw`bg-white/25 rounded-full p-0.5`}>
                            <Text style={tw`text-base`}>{getFlagFromTimezone(user.timezone_offset)}</Text>
                          </View>
                          <Text style={tw`text-white font-bold text-sm flex-shrink`} numberOfLines={1}>
                            {user.username}
                          </Text>
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
