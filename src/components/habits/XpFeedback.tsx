// src/components/XPFeedback.tsx
import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, SlideInUp, useAnimatedStyle, useSharedValue, withSpring, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, TrendingUp, Star, Award } from 'lucide-react-native';
import { XPBreakdown } from '@/services/xpService';
import tw from '@/lib/tailwind';

interface XPFeedbackProps {
  visible: boolean;
  xpEarned: number;
  breakdown?: XPBreakdown;
  onComplete?: () => void;
}

export const XPFeedback: React.FC<XPFeedbackProps> = ({ visible, xpEarned, breakdown, onComplete }) => {
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);
  const starOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Main animation
      scale.value = withSequence(withSpring(1.2, { damping: 10 }), withSpring(1, { damping: 15 }));

      // Rotation animation for the icon
      rotation.value = withSequence(withTiming(360, { duration: 500, easing: Easing.ease }), withTiming(0, { duration: 0 }));

      // Stars animation
      starOpacity.value = withDelay(200, withSequence(withTiming(1, { duration: 300 }), withTiming(0.7, { duration: 1500 }), withTiming(0, { duration: 300 })));

      // Auto dismiss
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const starsStyle = useAnimatedStyle(() => ({
    opacity: starOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={[tw`absolute inset-0 items-center justify-center z-50`, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
      <Animated.View style={containerStyle}>
        <LinearGradient colors={['#fbbf24', '#f59e0b', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`rounded-3xl p-6 shadow-2xl min-w-64`}>
          {/* Stars Background */}
          <Animated.View style={[tw`absolute inset-0 items-center justify-center`, starsStyle]}>
            <Star size={100} color="#fef3c7" style={tw`absolute opacity-20`} />
          </Animated.View>

          {/* Main Content */}
          <View style={tw`items-center`}>
            <Animated.View style={iconStyle}>
              <Zap size={40} color="#ffffff" />
            </Animated.View>

            <Text style={tw`text-4xl font-bold text-white mt-3`}>+{xpEarned} XP</Text>

            {breakdown && (
              <View style={tw`mt-4 bg-white/20 rounded-xl p-3 w-full`}>
                <View style={tw`space-y-1`}>
                  {breakdown.base > 0 && (
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-white/90 text-sm`}>Base</Text>
                      <Text style={tw`text-white font-bold text-sm`}>+{breakdown.base}</Text>
                    </View>
                  )}
                  {breakdown.tasks > 0 && (
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-white/90 text-sm`}>Tasks</Text>
                      <Text style={tw`text-white font-bold text-sm`}>+{breakdown.tasks}</Text>
                    </View>
                  )}
                  {breakdown.streak > 0 && (
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-white/90 text-sm`}>🔥 Streak</Text>
                      <Text style={tw`text-white font-bold text-sm`}>+{breakdown.streak}</Text>
                    </View>
                  )}
                  {breakdown.tier > 0 && (
                    <View style={tw`flex-row justify-between`}>
                      <Text style={tw`text-white/90 text-sm`}>⚡ Tier Bonus</Text>
                      <Text style={tw`text-white font-bold text-sm`}>+{breakdown.tier}</Text>
                    </View>
                  )}
                  {breakdown.milestone > 0 && (
                    <View style={tw`flex-row justify-between border-t border-white/20 pt-1 mt-1`}>
                      <Text style={tw`text-white/90 text-sm`}>🏆 Milestone</Text>
                      <Text style={tw`text-white font-bold text-sm`}>+{breakdown.milestone}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

// Milestone Celebration Component
interface MilestoneCelebrationProps {
  visible: boolean;
  milestone: {
    title: string;
    description: string;
    badge: string;
    xpReward: number;
  } | null;
  onDismiss: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ visible, milestone, onDismiss }) => {
  const confettiPositions = Array.from({ length: 10 }, (_, i) => ({
    x: useSharedValue(Math.random() * 300 - 150),
    y: useSharedValue(-50),
    rotation: useSharedValue(0),
  }));

  useEffect(() => {
    if (visible && milestone) {
      confettiPositions.forEach((pos, i) => {
        pos.y.value = withDelay(i * 50, withTiming(400, { duration: 2000, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }));
        pos.rotation.value = withTiming(360 * (Math.random() * 2 - 1), { duration: 2000 });
      });
    }
  }, [visible]);

  if (!visible || !milestone) return null;

  return (
    <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={[tw`absolute inset-0 items-center justify-center z-50`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      {/* Confetti */}
      {confettiPositions.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            tw`absolute w-3 h-3 rounded-full`,
            {
              backgroundColor: ['#fbbf24', '#f59e0b', '#dc2626', '#10b981', '#3b82f6'][i % 5],
              transform: [{ translateX: pos.x.value }, { translateY: pos.y.value }, { rotate: `${pos.rotation.value}deg` }],
            },
          ]}
        />
      ))}

      <Animated.View entering={SlideInUp.springify()} style={tw`bg-white rounded-3xl p-8 shadow-2xl mx-8`}>
        <View style={tw`items-center`}>
          <Text style={tw`text-6xl mb-4`}>{milestone.badge}</Text>
          <Text style={tw`text-2xl font-bold text-gray-800 text-center`}>{milestone.title}</Text>
          <Text style={tw`text-sm text-gray-600 text-center mt-2`}>{milestone.description}</Text>

          <LinearGradient colors={['#fbbf24', '#f59e0b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`rounded-xl px-6 py-3 mt-4`}>
            <Text style={tw`text-white font-bold text-xl`}>+{milestone.xpReward} XP</Text>
          </LinearGradient>

          <Pressable onPress={onDismiss} style={({ pressed }) => [tw`mt-6 bg-gray-100 px-8 py-3 rounded-xl`, pressed && tw`opacity-80`]}>
            <Text style={tw`text-gray-700 font-semibold`}>Continue</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Tier Upgrade Component
interface TierUpgradeProps {
  visible: boolean;
  tier: {
    name: string;
    icon: string;
    color: string;
    description: string;
    multiplier: number;
  } | null;
  onDismiss: () => void;
}

export const TierUpgrade: React.FC<TierUpgradeProps> = ({ visible, tier, onDismiss }) => {
  const scale = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (visible && tier) {
      scale.value = withSpring(1, { damping: 10 });
      glow.value = withSequence(withTiming(1, { duration: 500 }), withTiming(0.5, { duration: 500 }), withTiming(1, { duration: 500 }), withTiming(0.5, { duration: 500 }));
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  if (!visible || !tier) return null;

  return (
    <Animated.View entering={ZoomIn.springify()} exiting={FadeOut} style={[tw`absolute inset-0 items-center justify-center z-50`, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
      <Animated.View style={containerStyle}>
        <View style={[tw`bg-white rounded-3xl p-8 shadow-2xl mx-8 border-4`, { borderColor: tier.color }]}>
          {/* Glow Effect */}
          <Animated.View
            style={[
              tw`absolute inset-0 rounded-3xl`,
              glowStyle,
              {
                backgroundColor: tier.color,
                opacity: 0.1,
              },
            ]}
          />

          <View style={tw`items-center`}>
            <Text style={tw`text-6xl mb-4`}>{tier.icon}</Text>
            <Text style={tw`text-xs font-bold text-gray-500 uppercase tracking-wider`}>Tier Upgraded</Text>
            <Text style={[tw`text-3xl font-bold mt-2`, { color: tier.color }]}>{tier.name}</Text>
            <Text style={tw`text-sm text-gray-600 text-center mt-3`}>{tier.description}</Text>

            <View style={[tw`mt-4 px-4 py-2 rounded-xl`, { backgroundColor: tier.color + '20' }]}>
              <View style={tw`flex-row items-center`}>
                <Zap size={16} color={tier.color} />
                <Text style={[tw`font-bold ml-1`, { color: tier.color }]}>{tier.multiplier}x XP Multiplier</Text>
              </View>
            </View>

            <Pressable onPress={onDismiss} style={({ pressed }) => [tw`mt-6 px-8 py-3 rounded-xl`, { backgroundColor: tier.color }, pressed && tw`opacity-80`]}>
              <Text style={tw`text-white font-bold`}>Awesome!</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};
