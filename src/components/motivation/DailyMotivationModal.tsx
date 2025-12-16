/**
 * DailyMotivationModal.tsx
 *
 * Beautiful gamified modal that shows a daily motivational quote
 * Appears once per day when the user opens the app
 *
 * Features:
 * - Smooth slide down + fade in animation (60fps)
 * - Auto-dismiss after 15 seconds
 * - Only dismissible via close button (not backdrop tap)
 * - Gemstone-themed design with textures
 * - Compact rectangular design
 * - Textured borders
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, Modal, Pressable, ImageBackground, Animated as RNAnimated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { getDailyQuote } from '@/utils/motivationalQuotes';

interface DailyMotivationModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional tier theme colors */
  gradientColors?: string[];
  /** Optional username for personalization */
  username?: string;
  /** Enable random quotes (for test/debug mode) */
  random?: boolean;
}

export const DailyMotivationModal: React.FC<DailyMotivationModalProps> = ({
  visible,
  onClose,
  gradientColors = ['#8B5CF6', '#7C3AED', '#6D28D9'], // Default purple gradient
  username,
  random = false,
}) => {
  const { i18n } = useTranslation();

  // In random mode, regenerate quote when modal becomes visible
  const [quote, setQuote] = useState(() => getDailyQuote(i18n.language as 'en' | 'fr', random));

  useEffect(() => {
    if (visible) {
      // Regenerate quote when modal opens (in random mode this gives a new quote each time)
      setQuote(getDailyQuote(i18n.language as 'en' | 'fr', random));
    }
  }, [visible, random, i18n.language]);

  // Get greeting based on time of day
  const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    const lang = i18n.language as 'en' | 'fr';

    if (lang === 'fr') {
      if (hour >= 5 && hour < 12) return 'Bonjour';
      if (hour >= 12 && hour < 18) return 'Bon après-midi';
      return 'Bonsoir';
    } else {
      if (hour >= 5 && hour < 12) return 'Good morning';
      if (hour >= 12 && hour < 18) return 'Good afternoon';
      return 'Good evening';
    }
  };

  const greeting = getTimeBasedGreeting();
  const greetingMessage = username
    ? i18n.language === 'fr'
      ? `${greeting} ${username}, voici ta motivation du jour !`
      : `${greeting} ${username}, here's your motivation of the day!`
    : i18n.language === 'fr'
    ? `${greeting}, voici ta motivation du jour !`
    : `${greeting}, here's your motivation of the day!`;

  // Animation values (60fps with native driver)
  const slideAnim = useRef(new RNAnimated.Value(-300)).current;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  const backdropAnim = useRef(new RNAnimated.Value(0)).current;

  // Separate progress animation (can't use native driver for width)
  const progressAnim = useRef(new RNAnimated.Value(0)).current;

  // Auto-dismiss timer
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Handle modal close with exit animation
   */
  const handleClose = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    // Exit animation - 60fps smooth
    RNAnimated.parallel([
      RNAnimated.timing(slideAnim, {
        toValue: -300,
        duration: 350,
        useNativeDriver: true,
      }),
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      RNAnimated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [slideAnim, fadeAnim, backdropAnim, onClose]);

  /**
   * Manage animations and auto-dismiss timer when modal visibility changes
   */
  useEffect(() => {
    if (visible) {
      // Entrance animation - 60fps smooth (native driver)
      RNAnimated.parallel([
        RNAnimated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        RNAnimated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start progress bar animation separately (JS thread)
      RNAnimated.timing(progressAnim, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: false, // Must be false for width
      }).start();

      // Auto-dismiss after 15 seconds
      dismissTimerRef.current = setTimeout(() => {
        handleClose();
      }, 15000);
    } else {
      // Reset animations when modal is hidden
      slideAnim.setValue(-300);
      fadeAnim.setValue(0);
      backdropAnim.setValue(0);
      progressAnim.setValue(0);
    }

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [visible, slideAnim, fadeAnim, backdropAnim, progressAnim, handleClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Backdrop with fade - No tap to dismiss, only close button */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 bg-black`,
          {
            opacity: backdropAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.4],
            }),
          },
        ]}
        pointerEvents="none"
      />

      {/* Modal content - Compact and rectangular */}
      <View style={tw`flex-1 px-4 pt-16`} pointerEvents="box-none">
        <RNAnimated.View
          style={{
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          }}
        >
          {/* Outer shadow container */}
          <View
            style={{
              borderRadius: 20,
              shadowColor: gradientColors[0],
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            {/* Border with gradient color - 2px */}
            <View style={tw`rounded-2xl overflow-hidden`}>
              <LinearGradient colors={gradientColors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-0.5 rounded-2xl`}>
                {/* Inner content container with texture background */}
                <View style={tw`rounded-2xl overflow-hidden`}>
                  <ImageBackground source={require('../../../assets/interface/textures/texture-white.png')} style={tw`overflow-hidden`} imageStyle={{ opacity: 0.9 }} resizeMode="repeat">
                    <LinearGradient colors={[...gradientColors.map((c) => c + 'D8'), gradientColors[2] + 'CC'] as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-6 py-5`}>
                      {/* Close button */}
                      <Pressable
                        onPress={handleClose}
                        style={[
                          tw`absolute top-3 right-3 z-10 w-9 h-9 rounded-full items-center justify-center`,
                          {
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                        ]}
                      >
                        <X size={18} color="#FFFFFF" strokeWidth={3} />
                      </Pressable>

                      {/* Header */}
                      <View style={tw`mb-4 pr-8`}>
                        <Text
                          style={[
                            tw`text-white text-xl font-black mb-1`,
                            {
                              textShadowColor: 'rgba(0, 0, 0, 0.4)',
                              textShadowOffset: { width: 0, height: 2 },
                              textShadowRadius: 4,
                            },
                          ]}
                        >
                          {i18n.language === 'fr' ? 'Motivation du Jour' : 'Daily Motivation'}
                        </Text>
                        <Text
                          style={[
                            tw`text-white text-sm font-bold mt-1`,
                            {
                              textShadowColor: 'rgba(0, 0, 0, 0.3)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                            },
                          ]}
                        >
                          {greetingMessage}
                        </Text>
                      </View>

                      {/* Quote content */}
                      <View
                        style={[
                          tw`rounded-2xl px-5 py-4 mb-3`,
                          {
                            backgroundColor: 'rgba(255, 255, 255, 0.18)',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.25)',
                          },
                        ]}
                      >
                        {/* Quote text */}
                        <Text
                          style={[
                            tw`text-white text-base font-bold leading-relaxed mb-3`,
                            {
                              textShadowColor: 'rgba(0, 0, 0, 0.3)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 3,
                            },
                          ]}
                        >
                          "{quote.text}"
                        </Text>

                        {/* Author */}
                        <Text
                          style={[
                            tw`text-white/95 text-sm font-bold text-right`,
                            {
                              textShadowColor: 'rgba(0, 0, 0, 0.25)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 2,
                            },
                          ]}
                        >
                          — {quote.author}
                        </Text>
                      </View>

                      {/* Progress bar - Countdown from right to left (disappears from right) */}
                      <View
                        style={[
                          tw`h-1.5 rounded-full overflow-hidden`,
                          {
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          },
                        ]}
                      >
                        <RNAnimated.View
                          style={[
                            tw`h-full rounded-full absolute left-0`,
                            {
                              backgroundColor: 'rgba(255, 255, 255, 0.75)',
                              width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['100%', '0%'], // Starts at 100%, shrinks to 0%
                              }),
                            },
                          ]}
                        />
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              </LinearGradient>
            </View>
          </View>
        </RNAnimated.View>
      </View>
    </Modal>
  );
};
