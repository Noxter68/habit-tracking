// src/components/streakSaver/StreakSaverModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming, Easing, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Flame, X, Clock, Sparkles, TrendingUp } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';

interface StreakSaverModalProps {
  visible: boolean;
  habitName: string;
  previousStreak: number;
  availableSavers: number;
  loading?: boolean;
  success?: boolean;
  newStreak?: number;
  onUse: () => void;
  onClose: () => void;
}

const FlaskIcon = () => {
  const bounce = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withSpring(1.08, { damping: 3, stiffness: 80 }), // Less aggressive
        withSpring(1, { damping: 3, stiffness: 80 })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={tw`relative`}>
        <View style={tw`absolute inset-0 bg-orange-400 rounded-full opacity-30 blur-xl scale-110`} />
        <View style={tw`w-20 h-20 rounded-full bg-white items-center justify-center shadow-2xl`}>
          <Image
            source={require('../../../assets/interface/streak-saver.png')}
            style={{ width: 48, height: 48 }} // Larger icon
            resizeMode="contain"
          />
        </View>
        <View style={tw`absolute -top-1 -right-1`}>
          <Text style={{ fontSize: 16 }}>✨</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const StreakSaverButton = ({ onPress, loading, disabled }: any) => {
  const buttonBounce = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!loading && !disabled) {
      buttonBounce.value = withRepeat(
        withSequence(
          withSpring(1.03, { damping: 4 }), // Gentler bounce
          withSpring(1, { damping: 4 })
        ),
        -1,
        false
      );
    }
  }, [loading, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonBounce.value * scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={loading || disabled} style={tw`overflow-hidden rounded-2xl shadow-xl`}>
        <LinearGradient
          colors={['#C2410C', '#EA580C', '#F97316']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[tw`py-4 px-6 items-center justify-center`, (loading || disabled) && tw`opacity-60`]}
        >
          {loading ? (
            <View style={tw`flex-row items-center`}>
              <ActivityIndicator color="white" size="small" />
              <Text style={tw`text-white font-bold text-base ml-3`}>Restoring...</Text>
            </View>
          ) : (
            <Text style={tw`text-white font-black text-base`}>USE STREAK SAVER</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export const StreakSaverModal: React.FC<StreakSaverModalProps> = ({ visible, habitName, previousStreak, availableSavers, loading = false, success = false, newStreak = 0, onUse, onClose }) => {
  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.3, { duration: 1500 })), -1, false);
    }
  }, [visible]);

  // Auto-close after 8 seconds on success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.5,
  }));

  const motivationalMessages = [
    'Consistency is the key to mastery!',
    'Every day counts towards your goal!',
    'Your dedication is inspiring!',
    'Small steps lead to big changes!',
    "You're building an incredible habit!",
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <BlurView intensity={30} style={tw`flex-1`}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={tw`flex-1 bg-black/50 items-center justify-center px-5`}>
          <Pressable style={tw`absolute inset-0`} onPress={onClose} disabled={loading || success} />

          <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl`}>
            {success ? (
              // SUCCESS VIEW
              <>
                <LinearGradient colors={['#10b981', '#059669', '#047857']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`relative`}>
                  <View style={tw`px-5 pt-8 pb-6`}>
                    <Animated.View entering={ZoomIn.duration(600).springify()} style={tw`items-center mb-3`}>
                      <View style={tw`relative`}>
                        <View style={tw`w-20 h-20 rounded-full bg-white items-center justify-center shadow-2xl`}>
                          <Sparkles size={40} color="#10b981" fill="#10b981" strokeWidth={2} />
                        </View>
                      </View>
                    </Animated.View>

                    <Text style={tw`text-3xl font-black text-center text-white mb-2`}>Streak Restored!</Text>
                    <Text style={tw`text-base text-center text-emerald-50 font-medium`}>Your dedication is back on track</Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-6`}>
                  <View style={tw`bg-emerald-50 rounded-2xl p-4 mb-4 border-2 border-emerald-200`}>
                    <View style={tw`flex-row items-center justify-center mb-3`}>
                      <Flame size={28} color="#059669" fill="#059669" />
                      <Text style={tw`text-4xl font-black text-emerald-900 ml-2`}>{newStreak}</Text>
                      <Text style={tw`text-lg font-bold text-emerald-700 ml-2`}>days</Text>
                    </View>
                    <Text style={tw`text-center text-sm font-semibold text-emerald-800`}>"{habitName}"</Text>
                  </View>

                  <View style={tw`bg-amber-50 rounded-xl p-4 border border-amber-200`}>
                    <View style={tw`flex-row items-start`}>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-xs font-bold text-amber-900 mb-1`}>Keep Going!</Text>
                        <Text style={tw`text-xs text-amber-800 leading-4`}>{randomMessage}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={tw`text-center text-xs text-stone-400 mt-4`}>Closing in 8 seconds...</Text>
                </View>
              </>
            ) : (
              // ORIGINAL SAVE VIEW
              <>
                <LinearGradient colors={['#FEF3C7', '#FED7AA', '#FDBA74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`relative`}>
                  <Animated.View style={[tw`absolute inset-0 bg-orange-300`, glowStyle]} />

                  <View style={tw`px-5 pt-6 pb-4`}>
                    <Pressable onPress={onClose} disabled={loading} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow`}>
                      <X size={18} color="#78716C" strokeWidth={2.5} />
                    </Pressable>

                    <View style={tw`items-center mb-2`}>
                      <FlaskIcon />
                    </View>

                    <Text style={tw`text-2xl font-black text-center text-orange-900`}>Streak Rescue!</Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-4`}>
                  <Text style={tw`text-sm text-stone-700 text-center leading-5 mb-4`}>
                    Your <Text style={tw`font-black text-orange-600`}>{previousStreak}-day streak</Text> for <Text style={tw`font-bold`}>"{habitName}"</Text> doesn't have to end!
                  </Text>

                  <View style={tw`flex-row gap-2 mb-3`}>
                    <View style={tw`flex-1 bg-orange-50 rounded-xl p-3 items-center border border-orange-200`}>
                      <Flame size={40} color="#EA580C" fill="#EA580C" />
                      <Text style={tw`text-2xl font-black text-orange-900 mt-1`}>{previousStreak}</Text>
                      <Text style={tw`text-xs font-semibold text-orange-700`}>Days</Text>
                    </View>

                    <View style={tw`flex-1 bg-orange-50 rounded-xl p-3 items-center border border-orange-200`}>
                      <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
                      <Text style={tw`text-2xl font-black text-orange-900 mt-1`}>{availableSavers}</Text>
                      <Text style={tw`text-xs font-semibold text-orange-700`}>Left</Text>
                    </View>
                  </View>

                  <View style={tw`bg-red-50 border border-red-200 rounded-xl p-3 mb-4`}>
                    <View style={tw`flex-row items-start`}>
                      <Clock size={16} color="#DC2626" strokeWidth={2.5} style={tw`mr-2 mt-0.5`} />
                      <Text style={tw`text-xs text-red-800 leading-4 flex-1`}>
                        <Text style={tw`font-bold`}>24h window:</Text> After that, this streak is permanently lost.
                      </Text>
                    </View>
                  </View>

                  <View style={tw`gap-2`}>
                    <StreakSaverButton onPress={onUse} loading={loading} disabled={availableSavers < 1} />

                    <Pressable onPress={onClose} disabled={loading} style={({ pressed }) => [tw`bg-stone-100 rounded-xl py-3 items-center`, pressed && tw`opacity-70`, loading && tw`opacity-50`]}>
                      <Text style={tw`text-stone-600 font-semibold text-sm`}>Maybe Later</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
