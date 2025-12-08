// src/components/streakSaver/StreakSaverModal.tsx
// Version avec progress bar pendant le chargement

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming, Easing, ZoomIn, interpolate, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Flame, X, Clock, Sparkles, AlertTriangle, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';

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
// Animated Progress Bar Component
// ============================================================================
const AnimatedProgressBar = ({ progress, isComplete }: { progress: number; isComplete: boolean }) => {
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(progress, { duration: 300, easing: Easing.out(Easing.ease) });
  }, [progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={tw`w-full h-3 bg-purple-100 rounded-full overflow-hidden`}>
      <Animated.View style={[tw`h-full rounded-full`, progressStyle]}>
        <LinearGradient
          colors={isComplete ? ['#22c55e', '#16a34a', '#15803d'] : ['#8B5CF6', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`flex-1`}
        />
      </Animated.View>
    </View>
  );
};

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
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      glowPulse.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.3, { duration: 1500 })), -1, false);
    }
  }, [visible]);

  // Simuler une progression pendant le chargement
  useEffect(() => {
    if (loading) {
      setProgress(0);
      let currentProgress = 0;

      progressInterval.current = setInterval(() => {
        // Progression rapide au début, puis ralentit vers 90%
        const increment = currentProgress < 30 ? 8 : currentProgress < 60 ? 4 : currentProgress < 80 ? 2 : 0.5;
        currentProgress = Math.min(currentProgress + increment, 90);
        setProgress(currentProgress);
      }, 100);

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      };
    }
  }, [loading]);

  // Compléter la progression et fermer le modal après succès
  useEffect(() => {
    if (success) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      // Compléter la barre à 100%
      setProgress(100);
      HapticFeedback.success();

      // Fermer le modal après un court délai
      const timer = setTimeout(() => {
        onClose();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  // Reset progress quand le modal se ferme
  useEffect(() => {
    if (!visible) {
      setProgress(0);
    }
  }, [visible]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * 0.5,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <BlurView intensity={30} style={tw`flex-1`}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={tw`flex-1 bg-black/50 items-center justify-center px-5`}>
          <Pressable style={tw`absolute inset-0`} onPress={!loading && !success ? onClose : undefined} />

          <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl`}>
            {(loading || success) ? (
              // ============================================================
              // LOADING / SUCCESS VIEW WITH PROGRESS BAR
              // ============================================================
              <>
                <LinearGradient
                  colors={success ? ['#dcfce7', '#bbf7d0', '#86efac'] : ['#f3e8ff', '#e9d5ff', '#ddd6fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={tw`relative`}
                >
                  <View style={tw`px-5 pt-8 pb-6`}>
                    <Animated.View entering={ZoomIn.duration(600).springify()} style={tw`items-center mb-4`}>
                      <View style={tw`relative`}>
                        <View style={[tw`absolute inset-0 rounded-full opacity-30 blur-xl scale-110`, success ? tw`bg-green-300` : tw`bg-purple-300`]} />
                        <View style={tw`w-20 h-20 rounded-2xl bg-white items-center justify-center shadow-2xl`}>
                          {success ? (
                            <View style={tw`w-12 h-12 rounded-full bg-green-500 items-center justify-center`}>
                              <Check size={32} color="white" strokeWidth={3} />
                            </View>
                          ) : (
                            <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
                          )}
                        </View>
                        {success && (
                          <View style={tw`absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white`}>
                            <Sparkles size={14} color="white" fill="white" />
                          </View>
                        )}
                      </View>
                    </Animated.View>

                    <Text style={[tw`text-2xl font-black text-center mb-2`, success ? tw`text-green-900` : tw`text-purple-900`]}>
                      {success ? t('habitDetails.streakSaver.success.title') : t('habitDetails.streakSaver.loading.title')}
                    </Text>
                    <Text style={[tw`text-sm text-center font-medium mb-1`, success ? tw`text-green-700` : tw`text-purple-700`]}>
                      "{habitName}"
                    </Text>
                  </View>
                </LinearGradient>

                <View style={tw`px-5 py-6`}>
                  {/* Progress Bar */}
                  <View style={tw`mb-4`}>
                    <AnimatedProgressBar progress={progress} isComplete={success} />
                    <Text style={tw`text-center text-xs font-semibold mt-2 ${success ? 'text-green-600' : 'text-purple-600'}`}>
                      {success ? t('habitDetails.streakSaver.loading.complete') : t('habitDetails.streakSaver.loading.saving')}
                    </Text>
                  </View>

                  {/* Streak info */}
                  <View style={[tw`rounded-2xl p-4 border-2`, success ? tw`bg-green-50 border-green-200` : tw`bg-purple-50 border-purple-200`]}>
                    <View style={tw`flex-row items-center justify-center`}>
                      <Flame size={24} color={success ? '#16a34a' : '#8B5CF6'} fill={success ? '#16a34a' : '#8B5CF6'} />
                      <Text style={[tw`text-3xl font-black ml-2`, success ? tw`text-green-900` : tw`text-purple-900`]}>
                        {success ? newStreak : previousStreak}
                      </Text>
                      <Text style={[tw`text-base font-bold ml-2`, success ? tw`text-green-700` : tw`text-purple-700`]}>
                        {t('habitDetails.streakSaver.success.days')}
                      </Text>
                    </View>
                  </View>
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
