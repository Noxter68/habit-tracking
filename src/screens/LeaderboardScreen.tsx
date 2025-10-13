import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, ImageBackground, StatusBar, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';

// Elegant SVG Icons
const MedalIcon = ({ size = 18, color = '#9CA3AF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth={2} fill="none" />
    <Path d="M8.5 6L7 2L10 3.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M15.5 6L17 2L14 3.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="3" fill={color} opacity={0.3} />
  </Svg>
);

// Vibrant tier styles with textures
const TIER_STYLES = {
  1: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'],
    texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
    gemIcon: require('../../assets/interface/gems/amethyst-gem.png'),
    glow: 'rgba(139, 92, 246, 0.5)',
    ring: '#a78bfa',
    badge: '#4c1d95',
    name: 'Amethyst',
  },
  2: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'],
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    gemIcon: require('../../assets/interface/gems/ruby-gem.png'),
    glow: 'rgba(239, 68, 68, 0.5)',
    ring: '#f87171',
    badge: '#991b1b',
    name: 'Ruby',
  },
  3: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'],
    texture: require('../../assets/interface/progressBar/crystal.png'),
    gemIcon: require('../../assets/interface/gems/crystal-gem.png'),
    glow: 'rgba(96, 165, 250, 0.5)',
    ring: '#93c5fd',
    badge: '#1d4ed8',
    name: 'Crystal',
  },
  4: {
    gradient: ['#34d399', '#10b981', '#047857'],
    glow: 'rgba(52, 211, 153, 0.3)',
    ring: '#6ee7b7',
    badge: '#047857',
  },
  5: {
    gradient: ['#fbbf24', '#f59e0b', '#d97706'],
    glow: 'rgba(251, 191, 36, 0.3)',
    ring: '#fcd34d',
    badge: '#d97706',
  },
};

const mockLeaderboard = [
  { id: '1', name: 'Sarah Chen', avatar: 'SC', score: 2850, streak: 28, rank: 1, change: 0 },
  { id: '2', name: 'Alex Rivera', avatar: 'AR', score: 2720, streak: 25, rank: 2, change: 1 },
  { id: '3', name: 'Jordan Lee', avatar: 'JL', score: 2680, streak: 24, rank: 3, change: -1 },
  { id: '4', name: 'Morgan Blake', avatar: 'MB', score: 2540, streak: 22, rank: 4, change: 2 },
  { id: '5', name: 'Casey Morgan', avatar: 'CM', score: 2490, streak: 21, rank: 5, change: 0 },
  { id: '6', name: 'Taylor Swift', avatar: 'TS', score: 2310, streak: 19, rank: 6, change: -2 },
  { id: '7', name: 'You', avatar: 'YO', score: 2180, streak: 18, rank: 7, change: 1, isCurrentUser: true },
  { id: '8', name: 'Sam Wilson', avatar: 'SW', score: 2050, streak: 17, rank: 8, change: 0 },
  { id: '9', name: 'Riley Johnson', avatar: 'RJ', score: 1980, streak: 16, rank: 9, change: -1 },
  { id: '10', name: 'Quinn Davis', avatar: 'QD', score: 1890, streak: 15, rank: 10, change: 1 },
];

const LeaderboardScreen = () => {
  const currentUser = mockLeaderboard.find((u) => u.isCurrentUser);
  const topThree = mockLeaderboard.slice(0, 3);

  // Set StatusBar to light-content when screen is focused, reset when unfocused
  useFocusEffect(
    React.useCallback(() => {
      // Set to light content when this screen is focused
      StatusBar.setBarStyle('light-content');

      // Cleanup: Reset to dark content when screen loses focus
      return () => {
        StatusBar.setBarStyle('dark-content');
      };
    }, [])
  );

  const getTierStyle = (rank: number) =>
    TIER_STYLES[rank] || {
      gradient: ['#E5E7EB', '#D1D5DB', '#9CA3AF'],
      glow: 'rgba(229, 231, 235, 0.2)',
      ring: '#F3F4F6',
      badge: '#9CA3AF',
    };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF9F7' }}>
      {/* StatusBar is now controlled by useFocusEffect hook */}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Elegant Header with Mystical Feel */}
        <LinearGradient colors={['#1F2937', '#111827', '#030712']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.3)',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#a78bfa', letterSpacing: 2.5, textTransform: 'uppercase' }}>Hall of Legends</Text>
            </View>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, textAlign: 'center', marginBottom: 8 }}>Leaderboard</Text>
            <Text style={{ fontSize: 15, color: '#9CA3AF', textAlign: 'center', fontWeight: '600' }}>Masters of the Gemstone Realm</Text>
          </View>
        </LinearGradient>

        {/* Top 3 Podium - Immersive Stone Design */}
        <View style={{ paddingHorizontal: 24, marginTop: -20, marginBottom: 32 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 32,
              padding: 28,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 30,
              elevation: 10,
            }}
          >
            {/* Physical Podium with Gem Icons */}
            <View style={{ alignItems: 'center', paddingTop: 20 }}>
              {/* Winners Row with Gem Icons - NO CROWN */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 0, zIndex: 10 }}>
                {/* 2nd Place - Ruby */}
                <View style={{ alignItems: 'center', width: 95 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      marginBottom: 14,
                      overflow: 'hidden',
                      borderWidth: 3,
                      borderColor: TIER_STYLES[2].ring,
                      shadowColor: TIER_STYLES[2].glow,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 1,
                      shadowRadius: 16,
                    }}
                  >
                    <LinearGradient colors={TIER_STYLES[2].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={TIER_STYLES[2].gemIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    </LinearGradient>
                  </View>
                  <View
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#dc2626', letterSpacing: 1 }}>RUBY</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 }} numberOfLines={1}>
                    {topThree[1]?.name}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#4B5563' }}>{topThree[1]?.score.toLocaleString()}</Text>
                </View>

                {/* 1st Place - Amethyst Champion (NO CROWN) */}
                <View style={{ alignItems: 'center', width: 110, marginTop: -24 }}>
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      marginBottom: 14,
                      overflow: 'hidden',
                      borderWidth: 4,
                      borderColor: TIER_STYLES[1].ring,
                      shadowColor: TIER_STYLES[1].glow,
                      shadowOffset: { width: 0, height: 12 },
                      shadowOpacity: 1,
                      shadowRadius: 24,
                    }}
                  >
                    <LinearGradient colors={TIER_STYLES[1].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={TIER_STYLES[1].gemIcon} style={{ width: 50, height: 50 }} resizeMode="contain" />
                    </LinearGradient>
                  </View>
                  <View
                    style={{
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      borderRadius: 10,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '900', color: '#7c3aed', letterSpacing: 1.2 }}>AMETHYST</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 6 }} numberOfLines={1}>
                    {topThree[0]?.name}
                  </Text>
                  <Text style={{ fontSize: 26, fontWeight: '900', color: '#374151' }}>{topThree[0]?.score.toLocaleString()}</Text>
                </View>

                {/* 3rd Place - Crystal */}
                <View style={{ alignItems: 'center', width: 95 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      marginBottom: 14,
                      overflow: 'hidden',
                      borderWidth: 3,
                      borderColor: TIER_STYLES[3].ring,
                      shadowColor: TIER_STYLES[3].glow,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 1,
                      shadowRadius: 16,
                    }}
                  >
                    <LinearGradient colors={TIER_STYLES[3].gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Image source={TIER_STYLES[3].gemIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    </LinearGradient>
                  </View>
                  <View
                    style={{
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      marginBottom: 6,
                      borderWidth: 1,
                      borderColor: 'rgba(96, 165, 250, 0.2)',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6', letterSpacing: 1 }}>CRYSTAL</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1F2937', marginBottom: 4 }} numberOfLines={1}>
                    {topThree[2]?.name}
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#4B5563' }}>{topThree[2]?.score.toLocaleString()}</Text>
                </View>
              </View>

              {/* Physical Podium Bases with Textures */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, width: '100%' }}>
                {/* 2nd Base - Ruby with Texture */}
                <ImageBackground
                  source={TIER_STYLES[2].texture}
                  style={{ flex: 1, height: 70, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}
                  resizeMode="cover"
                  imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                >
                  <LinearGradient
                    colors={['rgba(239, 68, 68, 0.85)', 'rgba(220, 38, 38, 0.9)', 'rgba(153, 27, 27, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  >
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>2</Text>
                  </LinearGradient>
                </ImageBackground>

                {/* 1st Base - Amethyst with Texture (Tallest) */}
                <ImageBackground
                  source={TIER_STYLES[1].texture}
                  style={{ flex: 1, height: 95, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}
                  resizeMode="cover"
                  imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                >
                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.85)', 'rgba(124, 58, 237, 0.9)', 'rgba(76, 29, 149, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  >
                    <Text style={{ fontSize: 38, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 8 }}>1</Text>
                  </LinearGradient>
                </ImageBackground>

                {/* 3rd Base - Crystal with Texture */}
                <ImageBackground
                  source={TIER_STYLES[3].texture}
                  style={{ flex: 1, height: 60, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}
                  resizeMode="cover"
                  imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                >
                  <LinearGradient
                    colors={['rgba(96, 165, 250, 0.85)', 'rgba(59, 130, 246, 0.9)', 'rgba(29, 78, 216, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  >
                    <Text style={{ fontSize: 32, fontWeight: '900', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>3</Text>
                  </LinearGradient>
                </ImageBackground>
              </View>
            </View>

            {/* Rank 4-5 - Emerald & Topaz */}
            <View style={{ gap: 12, marginTop: 28 }}>
              {mockLeaderboard.slice(3, 5).map((user) => {
                const tierStyle = getTierStyle(user.rank);
                return (
                  <View
                    key={user.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#FAF9F7',
                      borderRadius: 18,
                      padding: 14,
                      gap: 14,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                    }}
                  >
                    <View style={{ width: 32, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#9CA3AF' }}>{user.rank}</Text>
                    </View>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        overflow: 'hidden',
                        shadowColor: tierStyle.glow,
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 1,
                        shadowRadius: 10,
                        borderWidth: 2,
                        borderColor: tierStyle.ring,
                      }}
                    >
                      <LinearGradient colors={tierStyle.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>{user.avatar}</Text>
                      </LinearGradient>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 3 }}>{user.name}</Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>{user.score.toLocaleString()} pts</Text>
                    </View>
                    <View style={{ alignItems: 'center' }}>
                      <MedalIcon size={20} color={tierStyle.badge} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Your Position Card */}
        {currentUser && (
          <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
            <LinearGradient
              colors={['#4B5563', '#374151', '#1F2937']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 22,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 20,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: 'rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFFFFF' }}>{currentUser.avatar}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 11, color: '#D1D5DB', fontWeight: '800', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>Your Rank</Text>
                    <Text style={{ fontSize: 19, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 }}>{currentUser.name}</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>
                      {currentUser.score.toLocaleString()} pts • {currentUser.streak} day streak
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 36, fontWeight: '900', color: '#FFFFFF', lineHeight: 36 }}>{currentUser.rank}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Remaining Rankings - Enhanced with Gemstone Theme */}
        <View style={{ paddingHorizontal: 24 }}>
          {/* Section Header */}
          <View style={{ marginBottom: 16 }}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(139, 92, 246, 0.2)',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center' }}>Rising Contenders</Text>
            </LinearGradient>
          </View>

          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            {mockLeaderboard.slice(5).map((user, index) => {
              const isEven = index % 2 === 0;
              return (
                <View
                  key={user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 18,
                    paddingHorizontal: 20,
                    backgroundColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.08)' : isEven ? '#FAFAFA' : '#FFFFFF',
                    borderBottomWidth: index < mockLeaderboard.slice(5).length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  {/* Rank Number with Gem Style */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      marginRight: 14,
                      borderRadius: 20,
                      backgroundColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.15)' : 'rgba(107, 114, 128, 0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.2)' : 'rgba(107, 114, 128, 0.1)',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '800', color: user.isCurrentUser ? '#7c3aed' : '#6B7280' }}>{user.rank}</Text>
                  </View>

                  {/* Avatar with Gemstone Effect */}
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      marginRight: 16,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: user.isCurrentUser ? '#8b5cf6' : '#D1D5DB',
                      shadowColor: user.isCurrentUser ? 'rgba(139, 92, 246, 0.4)' : 'rgba(0, 0, 0, 0.1)',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 1,
                      shadowRadius: 8,
                    }}
                  >
                    <LinearGradient
                      colors={user.isCurrentUser ? ['#8b5cf6', '#7c3aed', '#6d28d9'] : ['#9CA3AF', '#6B7280', '#4B5563']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#FFFFFF' }}>{user.avatar}</Text>
                    </LinearGradient>
                  </View>

                  {/* User Info */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: user.isCurrentUser ? '#1F2937' : '#374151',
                        }}
                      >
                        {user.name}
                      </Text>
                      {user.isCurrentUser && (
                        <View
                          style={{
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: 'rgba(139, 92, 246, 0.25)',
                          }}
                        >
                          <Text style={{ fontSize: 9, fontWeight: '900', color: '#7c3aed', letterSpacing: 0.5 }}>YOU</Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>{user.score.toLocaleString()} pts</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' }} />
                      <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '600' }}>{user.streak} day streak</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default LeaderboardScreen;
