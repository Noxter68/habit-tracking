// src/components/streakSaver/StreakSaverModal.tsx
// Version avec gestion d'erreur

import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming, Easing, ZoomIn, interpolate } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Flame, X, Clock, Sparkles, AlertTriangle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';

interface StreakSaverModalProps {
  visible: boolean;
  habitName: string;
  previousStreak: number;
  availableSavers: number;
  loading?: boolean;
  success?: boolean;
  error?: string | null;
  newStreak?: number;
  onUse: () => void;
  onClose: () => void;
}

// ============================================================================
// Animated Icon Component
// ============================================================================
const StreakSaverIcon = () => {
  const breathe = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(breathe.value, [0, 1], [1, 1.1]);
    return {
      transform: [{ scale }, { rotate: `${rotate.value}deg` }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View style={tw`relative`}>
        <View style={tw`absolute inset-0 bg-purple-300 rounded-full opacity-30 blur-xl scale-110`} />
        <View style={tw`w-20 h-20 rounded-2xl bg-white items-center justify-center shadow-2xl`}>
          <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
        </View>
        <View style={tw`absolute -top-1 -right-1`}>
          <Sparkles size={18} color="#8B5CF6" fill="#8B5CF6" />
        </View>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// Action Button Component
// ============================================================================
const StreakSaverButton = ({ onPress, loading, disabled }: any) => {
  const { t } = useTranslation();
  const breathe = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!loading && !disabled) {
      breathe.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    }
  }, [loading, disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    const buttonScale = interpolate(breathe.value, [0, 1], [1, 1.03]);
    return {
      transform: [{ scale: buttonScale * scale.value }],
    };
  });

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
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[tw`py-4 px-6 items-center justify-center`, (loading || disabled) && tw`opacity-60`]}
        >
          {loading ? (
            <View style={tw`flex-row items-center`}>
              <ActivityIndicator color="white" size="small" />
              <Text style={tw`text-white font-bold text-base ml-3`}>{t('habitDetails.streakSaver.buttons.restoring')}</Text>
            </View>
          ) : (
            <Text style={tw`text-white font-black text-base`}>{t('habitDetails.streakSaver.buttons.use')}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// ============================================================================
// Main Modal Component
// ============================================================================
export const StreakSaverModal: React.FC<StreakSaverModalProps> = ({
  visible,
  habitName,
  previousStreak,
  availableSavers,
  loading = false,
  success = false,
  error = null,
  newStreak = 0,
  onUse,
  onClose,
}) => {
  const { t } = useTranslation();
  const glowPulse = useSharedValue(0);
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (visible) {
      glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.3, { duration: 1500 })), -1, false);
    }
  }, [visible]);

  // Auto-close countdown on success
  useEffect(() => {
    if (success) {
      setCountdown(8);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [success, onClose]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.5,
  }));

  const motivationalMessages = t('habitDetails.streakSaver.motivational', {
    returnObjects: true,
  }) as string[];
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <BlurView intensity={30} style={tw`flex-1`}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={tw`flex-1 bg-black/50 items-center justify-center px-5`}>
          <Pressable style={tw`absolute inset-0`} onPress={!loading && !success ? onClose : undefined} />

          <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl`}>
            {success ? (
              // ============================================================
              // SUCCESS VIEW
              // ============================================================
              <>
                <LinearGradient colors={['#f3e8ff', '#e9d5ff', '#ddd6fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`relative`}>
                  <View style={tw`px-5 pt-8 pb-6`}>
                    <Animated.View entering={ZoomIn.duration(600).springify()} style={tw`items-center mb-3`}>
                      <View style={tw`relative`}>
                        <View style={tw`absolute inset-0 bg-purple-300 rounded-full opacity-30 blur-xl scale-110`} />
                        <View style={tw`w-20 h-20 rounded-2xl bg-white items-center justify-center shadow-2xl`}>
                          <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
                        </View>
                        <View style={tw`absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white`}>
                          <Sparkles size={14} color="white" fill="white" />
                        </View>
                      </View>
                    </Animated.View>

                    <Text style={tw`text-3xl font-black text-center text-purple-900 mb-2`}>{t('habitDetails.streakSaver.success.title')}</Text>
                    <Text style={tw`text-base text-center text-purple-700 font-medium`}>{t('habitDetails.streakSaver.success.subtitle')}</Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-6`}>
                  <View style={tw`bg-purple-50 rounded-2xl p-4 mb-4 border-2 border-purple-200`}>
                    <View style={tw`flex-row items-center justify-center mb-3`}>
                      <Flame size={28} color="#8B5CF6" fill="#8B5CF6" />
                      <Text style={tw`text-4xl font-black text-purple-900 ml-2`}>{newStreak}</Text>
                      <Text style={tw`text-lg font-bold text-purple-700 ml-2`}>{t('habitDetails.streakSaver.success.days')}</Text>
                    </View>
                    <Text style={tw`text-center text-sm font-semibold text-purple-800`}>"{habitName}"</Text>
                  </View>

                  <View style={tw`bg-amber-50 rounded-xl p-4 border border-amber-200`}>
                    <View style={tw`flex-row items-start`}>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-xs font-bold text-amber-900 mb-1`}>{t('habitDetails.streakSaver.success.keepGoing')}</Text>
                        <Text style={tw`text-xs text-amber-800 leading-4`}>{randomMessage}</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={tw`text-center text-xs text-stone-400 mt-4`}>{t('habitDetails.streakSaver.success.closingIn', { seconds: countdown })}</Text>
                </View>
              </>
            ) : error ? (
              // ============================================================
              // ERROR VIEW
              // ============================================================
              <>
                <LinearGradient colors={['#fee2e2', '#fecaca', '#fca5a5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <View style={tw`px-5 pt-6 pb-4`}>
                    <Pressable onPress={onClose} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow`}>
                      <X size={18} color="#78716C" strokeWidth={2.5} />
                    </Pressable>

                    <View style={tw`items-center mb-2`}>
                      <View style={tw`relative`}>
                        <View style={tw`absolute inset-0 bg-red-300 rounded-full opacity-30 blur-xl scale-110`} />
                        <View style={tw`w-20 h-20 rounded-2xl bg-white items-center justify-center shadow-2xl`}>
                          <AlertTriangle size={48} color="#DC2626" strokeWidth={2} />
                        </View>
                      </View>
                    </View>

                    <Text style={tw`text-2xl font-black text-center text-red-900`}>Something Went Wrong</Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-6`}>
                  <View style={tw`bg-red-50 rounded-2xl p-4 mb-4 border-2 border-red-200`}>
                    <Text style={tw`text-sm text-red-800 text-center leading-5`}>{error}</Text>
                  </View>

                  <Pressable onPress={onClose} style={({ pressed }) => [tw`bg-stone-100 rounded-xl py-3 items-center`, pressed && tw`opacity-70`]}>
                    <Text style={tw`text-stone-600 font-semibold text-sm`}>Close</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              // ============================================================
              // SAVE VIEW
              // ============================================================
              <>
                <LinearGradient colors={['#f3e8ff', '#e9d5ff', '#ddd6fe']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`relative`}>
                  <Animated.View style={[tw`absolute inset-0 bg-purple-300`, glowStyle]} />

                  <View style={tw`px-5 pt-6 pb-4`}>
                    <Pressable onPress={onClose} disabled={loading} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 items-center justify-center shadow`}>
                      <X size={18} color="#78716C" strokeWidth={2.5} />
                    </Pressable>

                    <View style={tw`items-center mb-2`}>
                      <StreakSaverIcon />
                    </View>

                    <Text style={tw`text-2xl font-black text-center text-purple-900`}>{t('habitDetails.streakSaver.title')}</Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-4`}>
                  <Text style={tw`text-sm text-stone-700 text-center leading-5 mb-4`}>
                    {t('habitDetails.streakSaver.description', {
                      streak: previousStreak,
                      habitName,
                    })}
                  </Text>

                  {/* Stats Cards */}
                  <View style={tw`flex-row gap-2 mb-3`}>
                    <View style={tw`flex-1 bg-purple-50 rounded-xl p-3 items-center border border-purple-200`}>
                      <Flame size={40} color="#8B5CF6" fill="#8B5CF6" />
                      <Text style={tw`text-2xl font-black text-purple-900 mt-1`}>{previousStreak}</Text>
                      <Text style={tw`text-xs font-semibold text-purple-700`}>{t('habitDetails.streakSaver.stats.days')}</Text>
                    </View>

                    <View style={tw`flex-1 bg-purple-50 rounded-xl p-3 items-center border border-purple-200`}>
                      <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
                      <Text style={tw`text-2xl font-black text-purple-900 mt-1`}>{availableSavers}</Text>
                      <Text style={tw`text-xs font-semibold text-purple-700`}>{t('habitDetails.streakSaver.stats.left')}</Text>
                    </View>
                  </View>

                  {/* Warning Card */}
                  <View style={tw`bg-red-50 border border-red-200 rounded-xl p-3 mb-4`}>
                    <View style={tw`flex-row items-start`}>
                      <Clock size={16} color="#DC2626" strokeWidth={2.5} style={tw`mr-2 mt-0.5`} />
                      <Text style={tw`text-xs text-red-800 leading-4 flex-1`}>
                        <Text style={tw`font-bold`}>{t('habitDetails.streakSaver.warning.title')}</Text> {t('habitDetails.streakSaver.warning.message')}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={tw`gap-2`}>
                    <StreakSaverButton onPress={onUse} loading={loading} disabled={availableSavers < 1} />

                    <Pressable onPress={onClose} disabled={loading} style={({ pressed }) => [tw`bg-stone-100 rounded-xl py-3 items-center`, pressed && tw`opacity-70`, loading && tw`opacity-50`]}>
                      <Text style={tw`text-stone-600 font-semibold text-sm`}>{t('habitDetails.streakSaver.buttons.maybeLater')}</Text>
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
