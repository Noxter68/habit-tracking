// src/components/dashboard/FloatingXp.tsx
import React, { useEffect } from 'react';
import { Text, View, Image, ImageBackground } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Logger from '@/utils/logger';

interface FloatingXPProps {
  amount?: number;
  show: boolean;
  onComplete?: () => void;
  type?: 'xp' | 'level-up';
  message?: string;
  accentColor?: string;
  texture?: any;
}

// Textures disponibles en dur
const TEXTURES = {
  crystal: require('../../../assets/interface/progressBar/crystal.png'),
  ruby: require('../../../assets/interface/progressBar/ruby-texture.png'),
  amethyst: require('../../../assets/interface/progressBar/amethyst-texture.png'),
  jade: require('../../../assets/interface/progressBar/jade-texture.png'),
  topaz: require('../../../assets/interface/progressBar/topaz-texture.png'),
  obsidian: require('../../../assets/interface/progressBar/obsidian-texture.png'),
};

const FloatingXP: React.FC<FloatingXPProps> = ({ amount = 20, show, onComplete, type = 'xp', message, accentColor = '#9333EA', texture }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  const isLevelUp = type === 'level-up';
  const displayText = message || (isLevelUp ? 'LEVEL UP!' : `+${amount} XP`);

  // Déterminer la texture à utiliser
  const getTexture = () => {
    if (texture) return texture;
    // Fallback sur amethyst par défaut
    return TEXTURES.amethyst;
  };

  const selectedTexture = getTexture();

  useEffect(() => {
    if (show) {
      Logger.debug('FloatingXP: Starting animation for type:', type);

      // Reset values
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;

      // Fade in and scale up with spring
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 100,
      });

      // Float upward
      translateY.value = withTiming(-100, { duration: 1800 }, (finished) => {
        if (finished) {
          Logger.debug('FloatingXP: Float animation finished');
          // Fade out
          opacity.value = withTiming(0, { duration: 400 }, (finished) => {
            if (finished && onComplete) {
              runOnJS(onComplete)();
            }
          });
        }
      });
    } else {
      // Reset when not showing
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.5;
    }
  }, [show, type]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!show) {
    return null;
  }

  Logger.debug('FloatingXP: Rendering with text:', displayText);

  // Si c'est un level-up, utiliser l'ancien style
  if (isLevelUp) {
    return (
      <View
        style={{
          position: 'absolute',
          top: -50,
          left: 0,
          right: 0,
          zIndex: 9999,
          elevation: 999,
          alignItems: 'center',
        }}
        pointerEvents="none"
      >
        <Animated.View style={animatedStyle}>
          <View
            style={{
              backgroundColor: '#7c3aed',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: 20,
              }}
            >
              {displayText}
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // Style avec texture pour daily challenge
  return (
    <View
      style={{
        position: 'absolute',
        top: '50%',
        left: '48%',
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateX: -60 }, { translateY: -30 }],
      }}
      pointerEvents="none"
    >
      <Animated.View style={animatedStyle}>
        {/* Outer Glow Effect */}
        <View
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 24,
            backgroundColor: accentColor,
            opacity: 0.3,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.6,
            shadowRadius: 16,
            elevation: 12,
          }}
        />

        {/* Main Badge Container */}
        <View
          style={{
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.6,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          {/* Texture Background Layer */}
          <ImageBackground
            source={selectedTexture}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
            }}
            imageStyle={{
              opacity: 0.4,
            }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={[`${accentColor}F2`, `${accentColor}E6`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: accentColor,
                minWidth: 100,
              }}
            >
              {/* XP Icon */}
              <Image source={require('../../../assets/interface/consumable-xp.png')} style={{ width: 50, height: 50, marginRight: 4 }} resizeMode="contain" />

              {/* XP Text */}
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  textShadowColor: 'rgba(0, 0, 0, 0.4)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                +{amount} XP
              </Text>
            </LinearGradient>
          </ImageBackground>
        </View>
      </Animated.View>
    </View>
  );
};

export default FloatingXP;
