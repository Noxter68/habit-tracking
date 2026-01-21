// src/components/DashboardLoader.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Config } from '@/config';
import tw from '@/lib/tailwind';

// Amethyst colors from tierTheme.ts
const amethystGradient: readonly [string, string, string] = ['#a78bfa', '#8b5cf6', '#7c3aed'];

// Loading message keys
const loadingMessageKeys = [
  'loader.loading_dashboard',
  'loader.preparing_gems',
  'loader.syncing_habits',
  'loader.calculating_progress',
];

interface DashboardLoaderProps {
  /** Force show loader for debug preview */
  debugPreview?: boolean;
  /** Callback when debug preview is closed */
  onCloseDebug?: () => void;
}

const DashboardLoader: React.FC<DashboardLoaderProps> = ({ debugPreview = false, onCloseDebug }) => {
  const { t } = useTranslation();

  // Message rotation state
  const [messageIndex, setMessageIndex] = useState(0);

  // Animation values
  const floatY = useSharedValue(0);
  const fadeIn = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const textTranslateY = useSharedValue(0);

  useEffect(() => {
    // Fade in on mount
    fadeIn.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // Floating animation - smooth up and down (infinite)
    floatY.value = withRepeat(
      withSequence(
        withTiming(-16, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Rotate loading messages
    const messageInterval = setInterval(() => {
      // Fade out and move up
      textOpacity.value = withTiming(0, { duration: 200 });
      textTranslateY.value = withTiming(-10, { duration: 200 });

      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessageKeys.length);
        // Reset position and fade in
        textTranslateY.value = 10;
        textOpacity.value = withTiming(1, { duration: 300 });
        textTranslateY.value = withTiming(0, { duration: 300 });
      }, 200);
    }, 2500);

    return () => clearInterval(messageInterval);
  }, []);

  // Animated styles
  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const showDebugClose = debugPreview && Config.debug.enabled;

  return (
    <Animated.View style={[debugPreview ? styles.containerOverlay : styles.container, containerStyle]}>
      {/* Background gradient */}
      <LinearGradient
        colors={amethystGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Background texture */}
      <Image
        source={require('../../assets/interface/background-v3.png')}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.2 }]}
        contentFit="cover"
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Debug close button */}
        {showDebugClose && (
          <Pressable
            onPress={onCloseDebug}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
          >
            <X size={24} color="white" />
          </Pressable>
        )}

        {/* Main content */}
        <View style={styles.content}>
          {/* Floating gem/logo */}
          <Animated.View style={[styles.logoContainer, floatingStyle]}>
            <Image
              source={require('../../assets/icon/icon_app.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {/* Loading text with rotation */}
          <Animated.Text style={[styles.loadingText, textStyle]}>
            {t(loadingMessageKeys[messageIndex])}
          </Animated.Text>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

/**
 * Debug button to preview the loader
 */
export const DashboardLoaderDebugButton: React.FC = () => {
  const [showPreview, setShowPreview] = useState(false);

  if (!Config.debug.showTestButtons) return null;

  return (
    <>
      <Pressable
        onPress={() => setShowPreview(true)}
        style={({ pressed }) => [
          tw`bg-violet-600 rounded-lg px-4 py-2.5 flex-row items-center justify-center mb-2`,
          pressed && tw`opacity-75`,
        ]}
      >
        <Text style={tw`text-white font-semibold text-xs`}>Preview Dashboard Loader</Text>
      </Pressable>

      <Modal visible={showPreview} animationType="fade" statusBarTranslucent>
        <StatusBar barStyle="light-content" />
        <DashboardLoader debugPreview onCloseDebug={() => setShowPreview(false)} />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: 140,
    height: 140,
  },
  loadingText: {
    marginTop: 32,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});

export default DashboardLoader;
