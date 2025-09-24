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
import { HabitService } from '../../services/habitService';
import { XPService } from '../../services/xpService';
import { useAuth } from '../../context/AuthContext';
import { ImageBackground } from 'expo-image';

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
  refreshTrigger?: number;
  currentAchievement?: any; // Added for achievement icon
  currentLevelXP?: number; // Added for XP progress
  xpForNextLevel?: number; // Added for XP progress
  levelProgress?: number; // Added for progress percentage
}

// Achievement Icon Component
const AchievementIcon: React.FC<{
  achievement: any;
  size?: number;
  onPress?: () => void;
}> = ({ achievement, size = 56, onPress }) => {
  if (!achievement?.image) {
    // Fallback to Crown icon if no achievement image
    return (
      <Pressable onPress={onPress} style={tw`w-14 h-14 bg-achievement-amber-100 rounded-2xl items-center justify-center`}>
        <Crown size={24} color="#d97706" />
      </Pressable>
    );
  }

  // Map achievement image numbers to actual image assets
  const getAchievementImage = (imageId: number) => {
    const imageMap: { [key: number]: any } = {
      1: require('../../../assets/achievements/level-1.png'),
      2: require('../../../assets/achievements/level-2.png'),
      3: require('../../../assets/achievements/level-3.png'),
      4: require('../../../assets/achievements/level-4.png'),
      5: require('../../../assets/achievements/level-5.png'),
      6: require('../../../assets/achievements/level-6.png'),
      7: require('../../../assets/achievements/level-7.png'),
      8: require('../../../assets/achievements/level-8.png'),
      9: require('../../../assets/achievements/level-9.png'),
      10: require('../../../assets/achievements/level-10.png'),
      // Add more mappings as needed
    };

    // Return the image or a default if not found
    return imageMap[imageId] || require('../../../assets/achievements/level-1.png');
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [tw`w-14 h-14 bg-achievement-amber-100 rounded-2xl items-center justify-center overflow-hidden`, pressed && tw`scale-[0.95]`]}>
      <Image source={achievement.image} style={{ width: size, height: size }} resizeMode="cover" />
    </Pressable>
  );
};

// Floating XP Animation Component
const FloatingXP: React.FC<{
  amount: number;
  show: boolean;
  onComplete?: () => void;
}> = ({ amount, show, onComplete }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (show) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSequence(
        withTiming(-60, { duration: 800 }),
        withTiming(-80, { duration: 400 }, () => {
          runOnJS(() => onComplete?.())();
        })
      );
      opacity.value = withTiming(0, { duration: 400 }, undefined, true);
    } else {
      opacity.value = 0;
      translateY.value = 0;
    }
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!show) return null;

  return (
    <Animated.View style={[tw`absolute top-0 right-4 z-50`, animatedStyle]}>
      <LinearGradient colors={achievementGradients.tiers} style={tw`px-4 py-2 rounded-full shadow-xl`}>
        <Text style={tw`text-white font-bold text-lg`}>+{amount} XP</Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Daily Challenge Component with Backend Integration
const DailyChallenge: React.FC<{
  completedToday: number;
  totalTasksToday: number;
  onCollect: (amount: number) => void;
  userId: string;
}> = ({ completedToday, totalTasksToday, onCollect, userId }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [loading, setLoading] = useState(false);
  const bounceAnim = useSharedValue(1);
  const shimmerAnim = useSharedValue(0);

  const completionPercentage = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0;

  useEffect(() => {
    setIsComplete(completionPercentage >= 100);
    if (userId) {
      checkIfCollected();
    }
  }, [completionPercentage, userId]);

  useEffect(() => {
    if (isComplete && !isCollected) {
      bounceAnim.value = withRepeat(withSequence(withTiming(1.05, { duration: 600 }), withTiming(0.98, { duration: 600 })), -1, true);
      shimmerAnim.value = withRepeat(withTiming(1, { duration: 2000 }), -1);
    }
  }, [isComplete, isCollected]);

  const checkIfCollected = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      if (XPService.getDailyChallenge) {
        const dailyChallenge = await XPService.getDailyChallenge(userId, today);
        if (dailyChallenge && typeof dailyChallenge === 'object') {
          setIsCollected(dailyChallenge.collected || dailyChallenge.xp_collected || false);
        }
      }
    } catch (error) {
      console.error('Error checking daily challenge:', error);
    }
  };

  const handlePress = async () => {
    if (!isComplete || isCollected || loading || !userId) return;

    setLoading(true);
    try {
      let success = false;

      if (XPService.collectDailyChallenge) {
        try {
          const today = new Date().toISOString().split('T')[0];
          success = await XPService.collectDailyChallenge(userId, today);
        } catch (serviceError) {
          console.warn('XPService.collectDailyChallenge failed, using fallback:', serviceError);
          if (XPService.addXP) {
            await XPService.addXP(userId, 20, 'daily_challenge');
            success = true;
          }
        }
      } else if (XPService.addXP) {
        await XPService.addXP(userId, 20, 'daily_challenge');
        success = true;
      } else {
        success = true;
      }

      if (success) {
        await playCollectSound();
        Vibration.vibrate([0, 50, 100, 50]);
        setIsCollected(true);
        onCollect(20);
      }
    } catch (error) {
      console.error('Error collecting daily challenge:', error);
      setIsCollected(true);
      onCollect(20);
    } finally {
      setLoading(false);
    }
  };

  const playCollectSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(require('../../../assets/sounds/collect.mp3'));
      await sound.playAsync();
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  };

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceAnim.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnim.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  return (
    <Pressable onPress={handlePress} disabled={!isComplete || isCollected || loading}>
      <Animated.View style={isComplete && !isCollected ? bounceStyle : undefined}>
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

          {isComplete && !isCollected && (
            <Animated.View style={[tw`absolute inset-0 rounded-2xl`, shimmerStyle]}>
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1 rounded-2xl`} />
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// Main Dashboard Header Component with Backend Integration
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
  refreshTrigger = 0,
  currentAchievement,
  currentLevelXP = 0,
  xpForNextLevel = 100,
  levelProgress = 0,
}) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const greeting = getGreeting();

  const [collectedXP, setCollectedXP] = useState(0);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState({
    totalXP: 0,
    weeklyXP: 0,
    dailyStreak: totalStreak,
  });

  const [showFloatingXP, setShowFloatingXP] = useState(false);
  const [floatingXPAmount, setFloatingXPAmount] = useState(0);

  // Fetch real-time stats from backend
  useEffect(() => {
    fetchRealTimeStats();
  }, [refreshTrigger, user?.id]);

  const fetchRealTimeStats = async () => {
    if (!user?.id) return;

    try {
      const xpStats = await XPService.getUserXPStats(user.id);
      const habitStats = await HabitService.getAggregatedStats(user.id);

      setRealTimeStats({
        totalXP: xpStats?.totalXP || 0,
        weeklyXP: xpStats?.weeklyXP || 0,
        dailyStreak: habitStats?.totalDaysTracked || totalStreak,
      });
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };

  // Use the actual XP values from props
  const currentLevel = userLevel;
  const nextTitle = achievementTitles.find((t) => t.level === currentLevel + 1);
  const xpToNextLevel = xpForNextLevel - currentLevelXP;

  // Animation for fire streak
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (totalStreak >= 7) {
      fireScale.value = withRepeat(withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    }
  }, [totalStreak]);

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const handleXPCollect = async (amount: number) => {
    setFloatingXPAmount(amount);
    setShowFloatingXP(true);

    if (user?.id) {
      await XPService.addXP(user.id, amount, 'daily_challenge');
      await fetchRealTimeStats();
    }

    setTimeout(() => {
      setCollectedXP((prev) => prev + amount);
      setAnimateProgress(true);
      onXPCollected?.(amount);
    }, 800);
  };

  // Navigate to achievements screen when icon is pressed
  const handleAchievementPress = () => {
    navigation.navigate('Achievements' as never);
  };

  console.log(currentAchievement);
  return (
    <View style={tw`relative`}>
      <FloatingXP amount={floatingXPAmount} show={showFloatingXP} onComplete={() => setShowFloatingXP(false)} />

      <Animated.View entering={FadeIn}>
        {/* Greeting and Level with Achievement Icon */}
        <View style={tw`mb-4`}>
          <Text style={tw`text-lg font-medium text-achievement-amber-700`}>{greeting}</Text>
          <View style={tw`flex-row items-center justify-between mt-1`}>
            <View>
              <Text style={tw`text-2xl font-black text-achievement-amber-00`}>{userTitle}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                <View style={tw`bg-achievement-amber-800 rounded-full px-2 py-0.5 mr-2`}>
                  <Text style={tw`text-xs font-bold text-white`}>LEVEL {currentLevel}</Text>
                </View>
                <Text style={tw`text-xs text-achievement-amber-600`}>{currentLevelXP + collectedXP} Total XP</Text>
              </View>
            </View>
            {/* Display Achievement Icon instead of Crown */}
            <AchievementIcon achievement={currentAchievement} onPress={handleAchievementPress} />
          </View>
        </View>

        {/* Level Progress Bar with correct XP values */}
        <View style={tw`mb-4`}>
          {/* Header */}
          <View style={tw`flex-row justify-between mb-1`}>
            <Text style={tw`text-xs font-semibold text-achievement-amber-700`}>Progress to Level {currentLevel + 1}</Text>
            <Text style={tw`text-xs font-bold text-achievement-amber-800`}>
              {currentLevelXP}/{xpForNextLevel} XP
            </Text>
          </View>

          {/* Rope Progress Bar */}
          <View style={tw`h-5 rounded-full overflow-hidden`}>
            <Animated.View
              style={[
                tw`h-full`,
                {
                  width: withSpring(`${levelProgress}%`, { damping: 15 }),
                },
              ]}
            >
              <ImageBackground source={require('../../../assets/interface/rope.png')} style={[tw`h-full rounded-full`, { width: `${levelProgress}%` }]} />
            </Animated.View>
          </View>

          {/* XP Remaining */}
          {xpToNextLevel > 0 && <Text style={tw`text-xs text-achievement-amber-600 mt-1`}>{xpToNextLevel} XP to next level</Text>}
        </View>

        {/* Stats Grid */}
        <View style={tw`flex-row gap-3 mb-4`}>
          {/* Streak Card */}
          <LinearGradient
            colors={totalStreak >= 30 ? achievementGradients.tiers['Legendary Ascent'] : totalStreak >= 7 ? achievementGradients.tiers['Epic Mastery'] : ['#ffffff', '#fef3c7']}
            style={tw`flex-1 rounded-2xl p-3 ${totalStreak >= 7 ? '' : 'border border-achievement-amber-200'}`}
          >
            <View style={tw`flex-row items-center justify-between`}>
              <View>
                <Text style={tw`text-xs font-medium ${totalStreak >= 7 ? 'text-white/90' : 'text-achievement-amber-700'}`}>Streak</Text>
                <Text style={tw`text-xl font-black ${totalStreak >= 7 ? 'text-white' : 'text-gray-900'}`}>{realTimeStats.dailyStreak}</Text>
              </View>
              <Animated.View style={totalStreak >= 7 ? fireAnimatedStyle : undefined}>
                <Image source={require('../../../assets/interface/streak-2.png')} style={{ width: 60, height: 60 }} resizeMode="cover" />
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

        {/* Daily Challenge with Backend Integration */}
        <View style={tw`mt-6`}>{user?.id && <DailyChallenge completedToday={completedTasksToday} totalTasksToday={totalTasksToday} onCollect={handleXPCollect} userId={user.id} />}</View>

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
                        <Text style={tw`text-xs text-achievement-amber-700`}>{xpToNextLevel} XP needed</Text>
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
