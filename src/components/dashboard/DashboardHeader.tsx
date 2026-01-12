/**
 * DashboardHeader.tsx
 *
 * En-tête du tableau de bord style Duolingo.
 * Affiche les badges en haut, puis le greeting/titre, et la progress bar.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, ImageBackground, Pressable, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react-native';

import AchievementBadge from '../shared/AchievementBadge';
import DailyChallenge from './DailyChallenge';

import { useAuth } from '../../context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { useInventory } from '@/context/InventoryContext';

import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import { getAchievementTierTheme } from '@/utils/tierTheme';
import { HapticFeedback } from '@/utils/haptics';

import { Habit } from '@/types';
import { TierKey } from '@/types/achievement.types';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  activeHabits: number;
  completedTasksToday?: number;
  totalTasksToday?: number;
  onXPCollected?: (amount: number, taskName?: string) => void;
  refreshTrigger?: number;
  currentAchievement?: any;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  levelProgress?: number;
  onStatsRefresh?: () => void;
  totalXP?: number;
  habits: Habit[];
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTitle,
  userLevel,
  totalStreak,
  onXPCollected,
  currentAchievement,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  onStatsRefresh,
  totalXP = 0,
  habits,
}) => {
  const navigation = useNavigation();
  const { user, username } = useAuth();
  const { refreshStats } = useStats();
  const { streakSavers } = useSubscription();
  const { activeBoost } = useInventory();
  const { t, i18n } = useTranslation();

  const [optimisticXP, setOptimisticXP] = React.useState(currentLevelXP);
  const [optimisticTotalXP, setOptimisticTotalXP] = React.useState(totalXP);
  const isOptimisticUpdate = React.useRef(false);
  const prevLevelRef = React.useRef(userLevel);

  React.useEffect(() => {
    const hasLeveledUp = userLevel !== prevLevelRef.current;
    if (hasLeveledUp) {
      isOptimisticUpdate.current = false;
      prevLevelRef.current = userLevel;
    }
    if (isOptimisticUpdate.current && !hasLeveledUp) {
      return;
    }
    setOptimisticXP(currentLevelXP);
    setOptimisticTotalXP(totalXP);
  }, [currentLevelXP, totalXP, userLevel]);

  const greeting = useMemo(() => getGreeting(), [i18n.language]);

  const currentTierKey = useMemo((): TierKey => {
    const title = achievementTitles.find(
      (t) => userLevel >= t.level && userLevel < (achievementTitles.find((next) => next.level > t.level)?.level || Infinity)
    );
    return (title?.tierKey as TierKey) || 'novice';
  }, [userLevel]);

  const tierTheme = useMemo(() => getAchievementTierTheme(currentTierKey), [currentTierKey]);
  const isObsidian = useMemo(() => tierTheme.gemName === 'Obsidian', [tierTheme.gemName]);

  const { displayXP, displayProgress } = useMemo(() => {
    let xpToShow = optimisticXP;
    if (optimisticXP > xpForNextLevel && isOptimisticUpdate.current) {
      xpToShow = optimisticXP % xpForNextLevel;
    } else {
      xpToShow = Math.max(0, Math.min(optimisticXP, xpForNextLevel));
    }
    const progressPercent = xpForNextLevel > 0 ? (xpToShow / xpForNextLevel) * 100 : 0;
    return {
      displayXP: Math.max(0, xpToShow),
      displayProgress: Math.max(0, Math.min(progressPercent, 100)),
    };
  }, [optimisticXP, xpForNextLevel]);

  const handleAchievementPress = useCallback(() => {
    HapticFeedback.light();
    navigation.navigate('Achievements' as never);
  }, [navigation]);

  const handleXPCollect = async (amount: number) => {
    isOptimisticUpdate.current = true;
    setOptimisticXP((prev) => prev + amount);
    setOptimisticTotalXP((prev) => prev + amount);

    // Appeler le callback avec le nom "Daily Challenge" pour afficher la popup
    if (onXPCollected) {
      onXPCollected(amount, t('dashboard.dailyChallenge.title'));
    }

    setTimeout(async () => {
      if (onStatsRefresh) {
        onStatsRefresh();
      }
      setTimeout(() => {
        isOptimisticUpdate.current = false;
      }, 500);
    }, 1000);
  };

  const handleLevelUp = useCallback(async () => {
    await refreshStats(true);
    if (onStatsRefresh) {
      onStatsRefresh();
    }
  }, [refreshStats, onStatsRefresh]);

  const GradientContainer = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => {
      const textureSource = tierTheme.texture;
      return (
        <LinearGradient
          colors={tierTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: isObsidian ? 2 : 1.5,
            borderColor: isObsidian ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)',
            shadowColor: isObsidian ? '#8b5cf6' : '#000',
            shadowOffset: { width: 0, height: isObsidian ? 12 : 8 },
            shadowOpacity: isObsidian ? 0.6 : 0.3,
            shadowRadius: isObsidian ? 24 : 20,
          }}
        >
          {textureSource ? (
            <ImageBackground source={textureSource} resizeMode="cover" imageStyle={{ opacity: 0.2 }}>
              {isObsidian && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  }}
                />
              )}
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isObsidian ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                }}
              />
              {children}
            </ImageBackground>
          ) : (
            <View>
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                }}
              />
              {children}
            </View>
          )}
        </LinearGradient>
      );
    };
  }, [tierTheme.gradient, tierTheme.texture, isObsidian]);

  return (
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 4 }}>
      <GradientContainer>
        <View style={{ padding: 16 }}>
          {/* Top section: Left content (stats + greeting) + Right achievement badge */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            {/* Left content */}
            <View style={{ flex: 1, marginRight: 12 }}>
              {/* Row 1: Stats badges */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  marginBottom: 10,
                }}
              >
                {/* Level Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginRight: 4,
                      letterSpacing: 0.5,
                    }}
                  >
                    LVL
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {userLevel}
                  </Text>
                </View>

                {/* Separator */}
                <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 12 }} />

                {/* Streak Badge - Using Flame icon like HabitCards */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame size={20} color="#FFFFFF" strokeWidth={2} fill="rgba(255, 255, 255, 0.4)" style={{ marginRight: 4 }} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {totalStreak}
                  </Text>
                </View>

                {/* Separator */}
                <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: 12 }} />

                {/* Streak Savers Badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image
                    source={require('../../../assets/interface/streak-saver.png')}
                    style={{ width: 20, height: 20, marginRight: 4 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '900',
                      color: '#FFFFFF',
                      textShadowColor: 'rgba(0, 0, 0, 0.3)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }}
                  >
                    {streakSavers}
                  </Text>
                </View>
              </View>

              {/* Active Boost Indicator */}
              {activeBoost && new Date(activeBoost.expires_at) > new Date() && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: 12,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 14, marginRight: 6 }}>🔥</Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: '#FFFFFF',
                      marginRight: 8,
                    }}
                  >
                    +{activeBoost.boost_percent}% XP
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: 'rgba(255, 255, 255, 0.8)',
                    }}
                  >
                    {(() => {
                      const now = new Date();
                      const expires = new Date(activeBoost.expires_at);
                      const diffMs = expires.getTime() - now.getTime();
                      const diffMins = Math.floor(diffMs / (1000 * 60));

                      if (diffMins < 60) {
                        return `${diffMins}m`;
                      }
                      const hours = Math.floor(diffMins / 60);
                      const mins = diffMins % 60;
                      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
                    })()}
                  </Text>
                </View>
              )}

              {/* Row 2: Greeting + Title */}
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    letterSpacing: 2,
                    textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: isObsidian ? 8 : 4,
                    marginBottom: 2,
                  }}
                >
                  {greeting.toUpperCase()}
                  {username && `, ${username.toUpperCase()}`}
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    lineHeight: 28,
                    textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: isObsidian ? 12 : 8,
                  }}
                >
                  {userTitle}
                </Text>
              </View>
            </View>

            {/* Achievement Badge - aligned to top */}
            <Pressable
              onPress={handleAchievementPress}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                height: 76,
                width: 76,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'flex-start',
              }}
            >
              <AchievementBadge
                achievement={currentAchievement}
                onPress={handleAchievementPress}
                tierTheme={tierTheme}
                size={64}
              />
            </Pressable>
          </View>

          {/* Row 3: Progress Bar - Style Duolingo épuré */}
          {userLevel < 35 && (
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                marginBottom: 12,
              }}
            >
              {/* Progress bar */}
              <View
                style={{
                  height: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: `${displayProgress}%`,
                    height: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 5,
                    shadowColor: '#FFFFFF',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 4,
                  }}
                />
              </View>

              {/* XP info */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: '#FFFFFF',
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {displayXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: '#FFFFFF',
                    }}
                  >
                    {Math.round(displayProgress)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Row 4: Daily Challenge */}
          {user?.id && (
            <DailyChallenge
              habits={habits}
              onCollect={handleXPCollect}
              userId={user.id}
              userLevel={userLevel}
              currentLevelXP={optimisticXP}
              xpForNextLevel={xpForNextLevel}
              onLevelUp={handleLevelUp}
              tierTheme={tierTheme}
            />
          )}
        </View>
      </GradientContainer>
    </Animated.View>
  );
};

export default React.memo(DashboardHeader);
