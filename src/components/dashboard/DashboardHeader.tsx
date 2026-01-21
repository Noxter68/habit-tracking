/**
 * DashboardHeader.tsx
 *
 * En-tête du tableau de bord style Duolingo.
 * Affiche les badges en haut, puis le greeting/titre, et la progress bar.
 */

import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Text, ImageBackground, Pressable, Image, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import AchievementBadge from '../shared/AchievementBadge';
import DailyChallenge from './DailyChallenge';

import { useAuth } from '../../context/AuthContext';
import { useStats } from '@/context/StatsContext';
import { useInventory } from '@/context/InventoryContext';

import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import { getAchievementTierTheme } from '@/utils/tierTheme';
import { HapticFeedback } from '@/utils/haptics';

import { Habit } from '@/types';
import { TierKey } from '@/types/achievement.types';

// ============================================================================
// ANIMATED BUBBLE COMPONENT
// ============================================================================

interface BubbleProps {
  delay: number;
  startX: number;
  size: number;
  isPaused?: boolean;
}

const AnimatedBubble: React.FC<BubbleProps> = ({ delay, startX, size, isPaused = false }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isPaused) {
      // Stop animation by setting progress to current value (freezes in place)
      progress.value = progress.value;
    } else {
      // Restart animation from the beginning with initial delay
      progress.value = 0;
      progress.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, { duration: 5000, easing: Easing.linear }),
          -1,
          false
        )
      );
    }
  }, [isPaused, delay]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    // Derive both translateY and opacity from single progress value
    const translateY = progress.value * -35;
    // Opacity: fade in during first 30%, stay visible, fade out in last 20%
    let opacity = 0.45;
    if (progress.value < 0.3) {
      opacity = progress.value * 1.5; // 0 to 0.45
    } else if (progress.value > 0.8) {
      opacity = (1 - progress.value) * 2.25; // 0.45 to 0
    }

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================================================
// BOOST BADGE COMPONENT - Square matching stats bar height
// ============================================================================

// Stats bar has paddingVertical: 8, so total height ~ 36-40px
const BOOST_SIZE = 38;

interface BoostBadgeProps {
  isPaused?: boolean;
}

const BoostBadge: React.FC<BoostBadgeProps> = ({ isPaused = false }) => {
  return (
    <View style={boostStyles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={boostStyles.gradient}
      >
        {/* Bubbles */}
        <View style={boostStyles.bubblesContainer}>
          <AnimatedBubble delay={0} startX={5} size={4} isPaused={isPaused} />
          <AnimatedBubble delay={400} startX={15} size={3} isPaused={isPaused} />
          <AnimatedBubble delay={800} startX={25} size={4} isPaused={isPaused} />
          <AnimatedBubble delay={1200} startX={10} size={3} isPaused={isPaused} />
        </View>

        {/* Icon only */}
        <Image
          source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
          style={boostStyles.icon}
          resizeMode="contain"
        />
      </LinearGradient>
    </View>
  );
};

const boostStyles = StyleSheet.create({
  container: {
    marginLeft: 8,
    width: BOOST_SIZE,
    height: BOOST_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    width: BOOST_SIZE,
    height: BOOST_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 12,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

// ============================================================================
// BOOSTED PROGRESS BAR COMPONENT - With violet gradient and bubbles
// ============================================================================

interface BoostedProgressBarProps {
  progress: number;
  displayXP: number;
  xpForNextLevel: number;
  isPaused?: boolean;
}

const BoostedProgressBar: React.FC<BoostedProgressBarProps> = ({
  progress,
  displayXP,
  xpForNextLevel,
  isPaused = false,
}) => {
  return (
    <View style={progressStyles.outerContainer}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed', '#6d28d9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={progressStyles.containerGradient}
      >
        {/* Background bubbles for container - reduced for performance */}
        <View style={progressStyles.containerBubbles}>
          <AnimatedBubble delay={0} startX={50} size={5} isPaused={isPaused} />
          <AnimatedBubble delay={700} startX={150} size={4} isPaused={isPaused} />
          <AnimatedBubble delay={1400} startX={250} size={5} isPaused={isPaused} />
        </View>

        {/* Progress bar track */}
        <View style={progressStyles.track}>
          {/* Fill with lighter gradient and bubbles */}
          <View style={[progressStyles.fillContainer, { width: `${Math.max(progress, 8)}%` }]}>
            <LinearGradient
              colors={['#c4b5fd', '#a78bfa', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={progressStyles.fillGradient}
            />
          </View>
        </View>

        {/* XP info */}
        <View style={progressStyles.infoRow}>
          <Text style={progressStyles.xpText}>
            {displayXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
          </Text>
          <View style={progressStyles.percentBadge}>
            <Text style={progressStyles.percentText}>
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  outerContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  containerGradient: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  containerBubbles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderRadius: 14,
  },
  track: {
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fillContainer: {
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
  },
  fillGradient: {
    flex: 1,
    borderRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  percentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  onXPCollected?: (amount: number, taskName?: string) => void;
  currentAchievement?: any;
  currentLevelXP?: number;
  xpForNextLevel?: number;
  onStatsRefresh?: () => void;
  totalXP?: number;
  habits: Habit[];
  isScrolling?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTitle,
  userLevel,
  onXPCollected,
  currentAchievement,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  onStatsRefresh,
  totalXP = 0,
  habits,
  isScrolling = false,
}) => {
  const navigation = useNavigation();
  const { user, username } = useAuth();
  const { refreshStats } = useStats();
  const { activeBoost } = useInventory();
  const { t, i18n } = useTranslation();

  const [optimisticXP, setOptimisticXP] = React.useState(currentLevelXP);
  const [, setOptimisticTotalXP] = React.useState(totalXP);
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
          colors={tierTheme.gradient as [string, string, ...string[]]}
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

  // Check if boost is valid
  const hasActiveBoost = activeBoost && new Date(activeBoost.expires_at) > new Date();

  return (
    <Animated.View entering={FadeIn} style={{ position: 'relative', marginBottom: 4 }}>
      <GradientContainer>
        <View style={{ padding: 16 }}>
          {/* Top section: Greeting/Title + Achievement badge */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            {/* Left content: Greeting + Title */}
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  letterSpacing: 2,
                  textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.8)' : 'rgba(0, 0, 0, 0.5)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: isObsidian ? 8 : 4,
                  marginBottom: 4,
                }}
              >
                {greeting.toUpperCase()}
                {username && `, ${username.toUpperCase()}`}
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  lineHeight: 32,
                  textShadowColor: isObsidian ? 'rgba(139, 92, 246, 0.9)' : 'rgba(0, 0, 0, 0.6)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: isObsidian ? 12 : 8,
                }}
              >
                {userTitle}
              </Text>
            </View>

            {/* Achievement Badge */}
            <View style={{ position: 'relative' }}>
              {/* Shadow layer for depth effect */}
              <View
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 0,
                  right: 0,
                  bottom: -2,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 16,
                }}
              />
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
          </View>

          {/* Row 3: Progress Bar - Boosted version when active, normal otherwise */}
          {userLevel < 40 && (
            hasActiveBoost ? (
              <BoostedProgressBar
                progress={displayProgress}
                displayXP={displayXP}
                xpForNextLevel={xpForNextLevel}
                isPaused={isScrolling}
              />
            ) : (
              <View style={{ position: 'relative', marginBottom: 12 }}>
                {/* Shadow layer for depth effect */}
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: 0,
                    right: 0,
                    bottom: -2,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: 14,
                  }}
                />
                <View
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.2)',
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
              </View>
            )
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
