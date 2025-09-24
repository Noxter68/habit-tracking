// src/components/dashboard/DashboardHeader.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Image, Vibration } from 'react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, interpolate, runOnJS, ZoomIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, TrendingUp, Lock, Star, Zap, Crown, Shield, Sparkles, Gift, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import tw, { achievementGradients } from '../../lib/tailwind';
import { getGreeting } from '../../utils/progressStatus';
import { achievementTitles } from '../../utils/achievements';
import { Audio } from 'expo-av';

interface DashboardHeaderProps {
  userTitle: string;
  userLevel: number;
  totalStreak: number;
  weekProgress: number;
  activeHabits: number;
  totalCompletions?: number;
  completedTasksToday?: number;
  totalTasksToday?: number;
  onXPCollected?: (amount: number) => void;
}

// Floating XP Animation Component
const FloatingXP: React.FC<{
  amount: number;
  show: boolean;
  onComplete?: () => void;
}> = ({ amount, show, onComplete }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1.2, {}, () => {
        scale.value = withSpring(1);
      });
      translateY.value = withTiming(-100, { duration: 1500 }, () => {
        opacity.value = withTiming(0, { duration: 300 }, () => {
          if (onComplete) runOnJS(onComplete)();
        });
      });
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -20,
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    zIndex: 1000,
  }));

  if (!show) return null;

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient colors={achievementGradients.unlocked.button} style={tw`rounded-full px-6 py-3 shadow-xl`}>
        <Text style={tw`text-white font-black text-xl`}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Collectible Sparkle Particles
const SparkleParticles: React.FC<{ show: boolean }> = ({ show }) => {
  const particles = Array.from({ length: 8 });

  return (
    <>
      {show &&
        particles.map((_, index) => {
          const angle = (index * 45 * Math.PI) / 180;
          const distance = 60;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;

          return (
            <Animated.View
              key={index}
              entering={ZoomIn.delay(index * 50).duration(300)}
              exiting={FadeOut.duration(500)}
              style={[
                tw`absolute`,
                {
                  top: '50%',
                  left: '50%',
                  marginLeft: x,
                  marginTop: y,
                },
              ]}
            >
              <Text style={tw`text-2xl`}>✨</Text>
            </Animated.View>
          );
        })}
    </>
  );
};

// Level Badge with Achievement Image
const LevelBadge: React.FC<{ level: number; size?: number }> = ({ level, size = 72 }) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Get the achievement for current level
  const currentAchievement = achievementTitles.find((t) => t.level === level);

  useEffect(() => {
    // Very subtle rotation animation
    rotation.value = withRepeat(withSequence(withTiming(-3, { duration: 3000 }), withTiming(3, { duration: 3000 })), -1, true);

    // Gentle pulse animation for milestone levels
    if (level % 5 === 0) {
      scale.value = withRepeat(withSequence(withTiming(1.05, { duration: 2000 }), withTiming(1, { duration: 2000 })), -1, true);
    }
  }, [level]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  // If we have the achievement image, show it
  if (currentAchievement?.image) {
    return (
      <Animated.View style={animatedStyle}>
        <View style={tw`relative`}>
          <LinearGradient colors={['rgba(254, 243, 199, 0.3)', 'rgba(253, 230, 138, 0.3)']} style={tw`absolute -inset-1 rounded-full`} />
          <Image
            source={currentAchievement.image}
            style={{
              width: size,
              height: size,
            }}
            resizeMode="contain"
          />
          <View style={tw`absolute -bottom-2 -right-2 bg-achievement-amber-800 rounded-full px-2 py-1 shadow-lg border-2 border-white`}>
            <Text style={tw`text-sm font-black text-white`}>{level}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Fallback to icon-based badge if no image
  const getBadgeIcon = () => {
    if (level >= 25) return Crown;
    if (level >= 15) return Shield;
    if (level >= 10) return Star;
    if (level >= 5) return Trophy;
    return Zap;
  };

  const BadgeIcon = getBadgeIcon();

  return (
    <Animated.View style={animatedStyle}>
      <View style={tw`relative`}>
        <LinearGradient
          colors={
            level >= 25
              ? achievementGradients.tiers['Mythic Glory']
              : level >= 15
              ? achievementGradients.tiers['Epic Mastery']
              : level >= 10
              ? achievementGradients.tiers['Legendary Ascent']
              : achievementGradients.tiers['Rising Hero']
          }
          style={[tw`rounded-full items-center justify-center shadow-lg`, { width: size, height: size }]}
        >
          <BadgeIcon size={size * 0.45} color="#fff" strokeWidth={2.5} />
        </LinearGradient>
        <View style={tw`absolute -bottom-2 -right-2 bg-achievement-amber-800 rounded-full px-2 py-1 shadow-lg border-2 border-white`}>
          <Text style={tw`text-sm font-black text-white`}>{level}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

// XP Progress Bar with Animation
const XPProgressBar: React.FC<{
  currentXP: number;
  nextLevelXP: number;
  level: number;
  animateIncrease?: boolean;
}> = ({ currentXP, nextLevelXP, level, animateIncrease = false }) => {
  const progressPercentage = (currentXP / nextLevelXP) * 100;
  const animatedWidth = useSharedValue(progressPercentage);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (animateIncrease) {
      // Glow effect when XP increases
      glowOpacity.value = withSequence(withTiming(1, { duration: 300 }), withTiming(0, { duration: 500 }));
    }
    animatedWidth.value = withSpring(progressPercentage, {
      damping: 15,
      stiffness: 150,
    });
  }, [progressPercentage, animateIncrease]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={tw`mt-3`}>
      <View style={tw`flex-row items-center justify-between mb-1`}>
        <Text style={tw`text-xs font-bold text-achievement-amber-700`}>LEVEL {level} PROGRESS</Text>
        <Text style={tw`text-xs font-bold text-achievement-amber-800`}>
          {currentXP}/{nextLevelXP} XP
        </Text>
      </View>
      <View style={tw`h-3 bg-achievement-amber-100 rounded-full overflow-hidden relative`}>
        <Animated.View style={animatedStyle}>
          <LinearGradient colors={achievementGradients.levelProgress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full rounded-full`} />
        </Animated.View>
        {/* Glow overlay */}
        <Animated.View style={[tw`absolute inset-0 rounded-full`, glowStyle]}>
          <LinearGradient colors={['rgba(217, 119, 6, 0.5)', 'rgba(245, 158, 11, 0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`h-full rounded-full`} />
        </Animated.View>
      </View>
      {progressPercentage >= 80 && (
        <Text style={tw`text-xs text-achievement-amber-700 font-medium mt-1 text-center`}>
          🎯 {nextLevelXP - currentXP} XP to Level {level + 1}!
        </Text>
      )}
    </View>
  );
};

// Daily Challenge Card - Collectible
const DailyChallenge: React.FC<{
  completedToday: number;
  totalTasksToday: number;
  onCollect: () => void;
}> = ({ completedToday, totalTasksToday, onCollect }) => {
  const [isCollected, setIsCollected] = useState(false);
  const [showFloatingXP, setShowFloatingXP] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const bounceScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const completionPercentage = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0;
  const isComplete = completionPercentage === 100 && !isCollected;
  const canCollect = completionPercentage === 100;

  useEffect(() => {
    if (isComplete && !isCollected) {
      // Gentle breathing pulse animation for collectible state
      bounceScale.value = withRepeat(withSequence(withTiming(1.02, { duration: 1500 }), withTiming(0.98, { duration: 1500 })), -1, true);

      // Subtle glow effect
      glowOpacity.value = withRepeat(withSequence(withTiming(0.5, { duration: 1500 }), withTiming(0.2, { duration: 1500 })), -1, true);
    }
  }, [isComplete, isCollected]);

  const playCollectSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: 'https://www.soundjay.com/misc/coin-drop-1.wav' }, { shouldPlay: true });
      await sound.playAsync();
    } catch (error) {
      // Fallback to vibration if sound fails
      Vibration.vibrate(100);
    }
  };

  const handleCollect = async () => {
    if (!canCollect || isCollected) return;

    // Play sound effect
    await playCollectSound();

    // Trigger animations
    setShowSparkles(true);
    setShowFloatingXP(true);

    // Gentle collection animation
    bounceScale.value = withSpring(1.08, {}, () => {
      bounceScale.value = withSpring(0.97, {}, () => {
        bounceScale.value = withSpring(1);
      });
    });

    // Mark as collected
    setTimeout(() => {
      setIsCollected(true);
      onCollect();
    }, 500);

    // Clean up animations
    setTimeout(() => {
      setShowSparkles(false);
    }, 1000);

    setTimeout(() => {
      setShowFloatingXP(false);
    }, 2000);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Pressable onPress={handleCollect} disabled={!canCollect || isCollected} style={({ pressed }) => [pressed && canCollect && !isCollected && tw`scale-95`]}>
      <Animated.View style={[tw`relative`, animatedStyle]}>
        {/* Glow effect for collectible state */}
        {isComplete && !isCollected && (
          <Animated.View style={[tw`absolute inset-0 rounded-2xl`, glowStyle]}>
            <LinearGradient colors={['rgba(217, 119, 6, 0.3)', 'rgba(245, 158, 11, 0.3)']} style={tw`absolute inset-0 rounded-2xl blur-xl`} />
          </Animated.View>
        )}

        {/* Sparkle particles */}
        <SparkleParticles show={showSparkles} />

        {/* Floating XP */}
        <FloatingXP amount={20} show={showFloatingXP} />

        <LinearGradient
          colors={isCollected ? ['#e7e5e4', '#d6d3d1'] : isComplete ? achievementGradients.unlocked.button : ['#ffffff', '#fef3c7']}
          style={tw`rounded-2xl p-3 border ${isCollected ? 'border-gray-300' : isComplete ? 'border-achievement-amber-400' : 'border-achievement-amber-200'} ${
            isComplete && !isCollected ? 'shadow-lg' : ''
          }`}
        >
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <View>{isCollected ? <Check size={20} color="#78716c" /> : isComplete ? <Gift size={20} color="#fff" /> : <Sparkles size={20} color="#d97706" />}</View>
              <View style={tw`ml-2`}>
                <Text style={tw`text-xs font-bold ${isCollected ? 'text-gray-600' : isComplete ? 'text-white' : 'text-achievement-amber-800'}`}>DAILY CHALLENGE</Text>
                <Text style={tw`text-xs ${isCollected ? 'text-gray-500' : isComplete ? 'text-white/90' : 'text-achievement-amber-700'}`}>
                  {isCollected ? 'Reward Collected!' : isComplete ? 'Tap to collect reward!' : `Complete ${totalTasksToday - completedToday} more tasks`}
                </Text>
              </View>
            </View>
            <View style={tw`items-end`}>
              <View style={tw`${isCollected ? 'bg-gray-400' : isComplete ? 'bg-white/20' : 'bg-achievement-amber-800'} rounded-full px-3 py-1 ${isComplete && !isCollected ? 'shadow-md' : ''}`}>
                <Text style={tw`text-xs font-bold text-white`}>{isCollected ? 'COLLECTED' : isComplete ? 'TAP TO CLAIM' : '+20 XP'}</Text>
              </View>
              {!isCollected && <Text style={tw`text-xs ${isComplete ? 'text-white/80' : 'text-achievement-amber-600'} mt-0.5`}>{completionPercentage}% done</Text>}
            </View>
          </View>

          {!isComplete && !isCollected && (
            <View style={tw`mt-2`}>
              <View style={tw`h-1.5 bg-achievement-amber-100 rounded-full overflow-hidden`}>
                <LinearGradient colors={achievementGradients.levelProgress} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// Main Dashboard Header Component
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userTitle,
  userLevel,
  totalStreak,
  weekProgress,
  activeHabits,
  totalCompletions = 0,
  completedTasksToday = 0,
  totalTasksToday = 0,
  onXPCollected,
}) => {
  const navigation = useNavigation();
  const greeting = getGreeting();
  const [collectedXP, setCollectedXP] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);

  // XP-based leveling system (100 XP per level)
  const baseXP = totalCompletions * 10;
  const totalXP = baseXP + collectedXP;
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const currentLevelXP = totalXP % 100;
  const nextLevelXP = 100;

  // Get current and next achievement titles
  const currentTitle = achievementTitles.find((t) => t.level === currentLevel);
  const nextTitle = achievementTitles.find((t) => t.level === currentLevel + 1);

  // Streak fire animation
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (totalStreak >= 7) {
      fireScale.value = withRepeat(withSequence(withTiming(1.3, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
    }
  }, [totalStreak]);

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const handleXPCollect = useCallback(() => {
    setCollectedXP((prev) => prev + 20);
    setAnimateProgress(true);
    setTimeout(() => setAnimateProgress(false), 1000);
    if (onXPCollected) {
      onXPCollected(20);
    }
  }, [onXPCollected]);

  return (
    <View>
      {/* Main Header Section */}
      <Animated.View entering={FadeInUp.duration(600)}>
        <View style={tw`flex-row items-start justify-between mb-4`}>
          {/* User Greeting & Title - Left Side */}
          <View style={tw`flex-1 pr-4`}>
            <Text style={tw`text-xl text-achievement-amber-700 font-bold mb-0.5`}>{greeting}</Text>
            <View style={tw`mb-1`}>
              <Text style={tw`text-2xl font-black text-gray-900 mb-1`}>{userTitle}</Text>
              <View style={tw`flex-row items-center`}>
                {currentLevel >= 10 && (
                  <LinearGradient colors={achievementGradients.unlocked.button} style={tw`rounded-full px-2.5 py-1 mr-2`}>
                    <Text style={tw`text-xs font-bold text-white`}>PRO</Text>
                  </LinearGradient>
                )}
                <View style={tw`bg-achievement-amber-100 rounded-full px-2.5 py-1`}>
                  <Text style={tw`text-xs text-achievement-amber-800 font-bold`}>{totalXP} XP</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Level Badge - Top Right with better positioning */}
          <View style={tw`items-center`}>
            <LevelBadge level={currentLevel} />
            <Text style={tw`text-xs text-achievement-amber-600 font-medium mt-1`}>Rank {currentLevel}</Text>
          </View>
        </View>

        {/* XP Progress with animation */}
        <XPProgressBar currentXP={currentLevelXP} nextLevelXP={nextLevelXP} level={currentLevel} animateIncrease={animateProgress} />

        {/* Stats Row */}
        <View style={tw`flex-row gap-2 mt-4`}>
          {/* Streak Card */}
          <LinearGradient
            colors={totalStreak >= 7 ? achievementGradients.tiers['Legendary Ascent'] : ['#ffffff', '#fef3c7']}
            style={tw`flex-1 rounded-2xl p-3 ${totalStreak >= 7 ? '' : 'border border-achievement-amber-200'}`}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-xs font-medium ${totalStreak >= 7 ? 'text-white/90' : 'text-achievement-amber-700'}`}>Streak</Text>
                <Text style={tw`text-xl font-black ${totalStreak >= 7 ? 'text-white' : 'text-gray-900'}`}>{totalStreak}</Text>
              </View>
              <Animated.View style={totalStreak >= 7 ? fireAnimatedStyle : undefined}>
                <Image source={require('../../../assets/interface/streak.png')} style={{ width: 60, height: 60 }} resizeMode="cover" />
              </Animated.View>
            </View>
            {totalStreak >= 7 && <Text style={tw`text-xs font-bold text-white/90 mt-1`}>{totalStreak >= 30 ? 'LEGENDARY!' : 'ON FIRE!'}</Text>}
          </LinearGradient>

          {/* Active Quests Card */}
          <LinearGradient colors={['#ffffff', '#fef3c7']} style={tw`flex-1 rounded-2xl p-3 border border-achievement-amber-200`}>
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-xs font-medium text-achievement-amber-700`}>Active</Text>
                <Text style={tw`text-xl font-black text-gray-900`}>{activeHabits}</Text>
              </View>
              <View style={tw`w-8 h-8 bg-achievement-amber-200/50 rounded-xl items-center justify-center`}>
                <Image source={require('../../../assets/interface/quest.png')} style={{ width: 60, height: 60, marginTop: 15 }} resizeMode="cover" />
              </View>
            </View>
            <Text style={tw`text-xs text-achievement-amber-600 mt-1`}>Quests</Text>
          </LinearGradient>
        </View>

        {/* Collectible Daily Challenge - with more spacing */}
        <View style={tw`mt-6`}>
          <DailyChallenge completedToday={completedTasksToday} totalTasksToday={totalTasksToday} onCollect={handleXPCollect} />
        </View>

        {/* Next Achievement Preview */}
        {nextTitle && (
          <Animated.View entering={FadeIn.delay(300)}>
            <Pressable onPress={() => navigation.navigate('Achievements' as never)} style={({ pressed }) => [tw`mt-3`, pressed && tw`scale-[0.98]`]}>
              <LinearGradient colors={achievementGradients.overlay} style={tw`rounded-2xl p-3 border border-achievement-amber-100`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-row items-center flex-1`}>
                    <View style={tw`w-10 h-10 bg-achievement-amber-100 rounded-xl items-center justify-center mr-3`}>
                      <Lock size={18} color="#d97706" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-xs font-bold text-achievement-amber-800`}>NEXT: {nextTitle.title.toUpperCase()}</Text>
                      <View style={tw`flex-row items-center mt-0.5`}>
                        <Text style={tw`text-xs text-achievement-amber-700`}>{100 - currentLevelXP} XP needed</Text>
                      </View>
                    </View>
                  </View>
                  <TrendingUp size={16} color="#d97706" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
};

export default DashboardHeader;
