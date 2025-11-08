// src/components/BeautifulLoader.tsx
import React, { useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import tw from '@/lib/tailwind';

const BeautifulLoader: React.FC = () => {
  // Animations
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Fade in initial
    opacity.value = withTiming(1, { duration: 300 });

    // Bounce doux et continu du logo
    scale.value = withRepeat(withSequence(withSpring(1, { damping: 15, stiffness: 100 }), withSpring(1.08, { damping: 8, stiffness: 80 }), withSpring(1, { damping: 15, stiffness: 100 })), -1, false);

    // Progress bar animation
    progressWidth.value = withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(100, { duration: 1500, easing: Easing.bezier(0.65, 0, 0.35, 1) })), -1, false);

    // Pulse du texte
    pulseOpacity.value = withRepeat(withSequence(withTiming(0.5, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <ImageBackground source={require('../../assets/interface/textures/texture-white.png')} style={styles.container} imageStyle={{ opacity: 0.15 }}>
      <SafeAreaView style={styles.safeArea}>
        {/* Logo animé */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <LinearGradient colors={['#8b5cf6', '#6366f1', '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoGradient}>
            <Image source={require('../../assets/icon/icon-v2.png')} style={styles.logo} contentFit="contain" />
          </LinearGradient>
        </Animated.View>

        {/* Texte principal */}
        <Animated.View style={textStyle}>
          <Text style={styles.mainText}>Nuvoria</Text>
          <Text style={styles.subText}>Loading your habits...</Text>
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
        <Text style={styles.footerText}>Preparing your dashboard</Text>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 80,
    height: 80,
  },
  mainText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 32,
    width: 240,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
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
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 16,
    fontWeight: '500',
  },
});

export default BeautifulLoader;
