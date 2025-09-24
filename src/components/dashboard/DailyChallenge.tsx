// src/components/dashboard/DailyChallenge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Gift, Check, Sparkles } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, interpolate } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '../../lib/tailwind';
import { XPService } from '../../services/xpService';

interface DailyChallengeProps {
  completedToday: number;
  totalTasksToday: number;
  onCollect: (amount: number) => void;
  userId: string;
}

const DailyChallenge: React.FC<DailyChallengeProps> = ({ completedToday, totalTasksToday, onCollect, userId }) => {
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
      const collectedKey = `daily_challenge_${userId}_${today}`;
      const localCollected = await AsyncStorage.getItem(collectedKey);

      if (localCollected === 'true') {
        setIsCollected(true);
      }
    } catch (error) {
      console.error('Error checking daily challenge:', error);
    }
  };

  const handlePress = async () => {
    if (!isComplete || isCollected || loading || !userId) return;

    setLoading(true);
    try {
      setIsCollected(true);
      onCollect(20);

      const today = new Date().toISOString().split('T')[0];
      const collectedKey = `daily_challenge_${userId}_${today}`;
      await AsyncStorage.setItem(collectedKey, 'true');

      // Update backend
      await XPService.awardXP(userId, {
        amount: 20,
        source_type: 'daily_challenge',
        description: 'Daily challenge reward',
      });
    } catch (error) {
      console.error('Error collecting daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceAnim.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnim.value, [0, 0.5, 1], [0, 0.3, 0]),
  }));

  const getGradientColors = () => {
    if (isCollected) return ['#e7e5e4', '#d6d3d1'];
    if (isComplete) return ['#f59e0b', '#d97706'];
    return ['#ffffff', '#fef3c7'];
  };

  const getBorderColor = () => {
    if (isCollected) return tw`border-gray-300`;
    if (isComplete) return tw`border-amber-400`;
    return tw`border-amber-200`;
  };

  return (
    <Pressable onPress={handlePress} disabled={!isComplete || isCollected || loading} style={({ pressed }) => [pressed && isComplete && !isCollected && tw`scale-[0.98]`]}>
      <Animated.View style={isComplete && !isCollected ? bounceStyle : undefined}>
        <LinearGradient colors={getGradientColors()} style={[tw`rounded-2xl p-3 border`, getBorderColor(), isComplete && !isCollected && tw`shadow-lg`]}>
          <View style={tw`flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
              <View>{isCollected ? <Check size={20} color="#78716c" /> : isComplete ? <Gift size={20} color="#fff" /> : <Sparkles size={20} color="#d97706" />}</View>
              <View style={tw`ml-2`}>
                <Text style={tw`text-xs font-bold ${isCollected ? 'text-gray-600' : isComplete ? 'text-white' : 'text-amber-800'}`}>DAILY CHALLENGE</Text>
                <Text style={tw`text-xs ${isCollected ? 'text-gray-500' : isComplete ? 'text-white opacity-90' : 'text-amber-700'}`}>
                  {isCollected ? 'Reward Collected!' : isComplete ? 'Tap to collect reward!' : `Complete ${totalTasksToday - completedToday} more tasks`}
                </Text>
              </View>
            </View>
            <View style={tw`items-end`}>
              <View style={tw`${isCollected ? 'bg-gray-400' : isComplete ? 'bg-white bg-opacity-20' : 'bg-amber-800'} rounded-full px-3 py-1 ${isComplete && !isCollected ? 'shadow-md' : ''}`}>
                <Text style={tw`text-xs font-bold text-white`}>{isCollected ? 'COLLECTED' : isComplete ? 'TAP TO CLAIM' : '+20 XP'}</Text>
              </View>
              {!isCollected && <Text style={tw`text-xs ${isComplete ? 'text-white opacity-80' : 'text-amber-600'} mt-0.5`}>{completionPercentage}% done</Text>}
            </View>
          </View>

          {!isComplete && !isCollected && (
            <View style={tw`mt-2`}>
              <View style={tw`h-1.5 bg-amber-100 rounded-full overflow-hidden`}>
                <LinearGradient colors={['#fbbf24', '#f59e0b', '#d97706']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[tw`h-full rounded-full`, { width: `${completionPercentage}%` }]} />
              </View>
            </View>
          )}

          {isComplete && !isCollected && (
            <Animated.View style={[tw`absolute inset-0 rounded-2xl`, shimmerStyle]} pointerEvents="none">
              <LinearGradient colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`flex-1 rounded-2xl`} />
            </Animated.View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

export default DailyChallenge;
