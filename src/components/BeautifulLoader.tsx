// src/components/BeautifulLoader.tsx
import React, { useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, Easing, interpolate, Extrapolation } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

const BeautifulLoader: React.FC = () => {
  const { t } = useTranslation();

  // Animations
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(0.95);

  useEffect(() => {
    // Fade in élégant
    opacity.value = withTiming(1, { duration: 600, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });

    // Bounce subtil du logo
    scale.value = withRepeat(withSequence(withSpring(1, { damping: 12, stiffness: 90 }), withSpring(1.05, { damping: 10, stiffness: 100 }), withSpring(1, { damping: 12, stiffness: 90 })), -1, false);

    // Glow effect
    glowScale.value = withRepeat(
      withSequence(withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) }), withTiming(0.95, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.6, 1) })),
      -1,
      true
    );

    // Progress bar fluide
    progressWidth.value = withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(100, { duration: 2000, easing: Easing.bezier(0.4, 0, 0.2, 1) })), -1, false);

    // Pulse doux du texte
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.6, 1) }), withTiming(1, { duration: 1200, easing: Easing.bezier(0.4, 0, 0.6, 1) })),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: interpolate(glowScale.value, [0.95, 1], [0.3, 0.6], Extrapolation.CLAMP),
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <ImageBackground source={require('../../assets/interface/textures/texture-white.png')} style={styles.container} imageStyle={{ opacity: 0.2 }}>
      <SafeAreaView style={styles.safeArea}>
        {/* Glow effect derrière le logo */}
        <Animated.View style={[styles.glowContainer, glowStyle]}>
          <LinearGradient colors={['rgba(139, 92, 246, 0.4)', 'rgba(99, 102, 241, 0.3)', 'rgba(59, 130, 246, 0.2)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.glow} />
        </Animated.View>

        {/* Logo animé */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient colors={['#8b5cf6', '#6366f1', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
            <Image source={require('../../assets/icon/icon-v2.png')} style={styles.logo} contentFit="contain" />
          </LinearGradient>
        </Animated.View>

        {/* Texte principal */}
        <Animated.View style={textStyle}>
          <Text style={styles.mainText}>{t('loader.title')}</Text>
          <Text style={styles.subText}>{t('loader.subtitle')}</Text>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressStyle]}>
              <LinearGradient colors={['#8b5cf6', '#6366f1', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.progressGradient} />
            </Animated.View>
          </View>
        </View>

        {/* Footer text */}
        <Text style={styles.footerText}>{t('loader.footer')}</Text>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
  },
  glow: {
    flex: 1,
    borderRadius: 80,
  },
  logoContainer: {
    marginBottom: 20,
    zIndex: 10,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  logo: {
    width: 84,
    height: 84,
  },
  mainText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  subText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748b',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 40,
    width: 200,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 20,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default BeautifulLoader;
