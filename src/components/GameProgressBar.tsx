import React, { useEffect, useRef } from 'react';
import { View, Image, ImageBackground, Animated, Easing } from 'react-native';
import tw from '@/lib/tailwind';

interface GameProgressBarProps {
  progress: number; // percentage 0–100
  theme?: 'wood' | 'stone' | 'crystal' | 'potion';
  width?: number | string;
  height?: number;
}

export const GameProgressBar: React.FC<GameProgressBarProps> = ({ progress, theme = 'wood', width = '100%', height = 48 }) => {
  const themes = {
    wood: {
      texture: require('../../assets/interface/progressBar/wood.png'),
      overlays: [
        { src: require('../../assets/interface/progressBar/crackle.png'), opacity: 0.3 },
        { src: require('../../assets/interface/progressBar/sparkle.png'), opacity: 0.4 },
      ],
    },
    stone: {
      texture: require('../../assets/interface/progressBar/stone.png'),
      overlays: [{ src: require('../../assets/interface/progressBar/crackle.png'), opacity: 0.35 }],
    },
    crystal: {
      texture: require('../../assets/interface/progressBar/crystal.png'),
      overlays: [
        { src: require('../../assets/interface/progressBar/crackle.png'), opacity: 0.3 },
        { src: require('../../assets/interface/progressBar/sparkle.png'), opacity: 0.5 },
      ],
    },
    potion: {
      texture: require('../../assets/interface/progressBar/potion.png'),
      overlays: [
        { src: require('../../assets/interface/progressBar/bubble.png'), opacity: 0.5 },
        { src: require('../../assets/interface/progressBar/sparkle.png'), opacity: 0.6 },
      ],
      wave: require('../../assets/interface/progressBar/wave.png'),
    },
  };

  const { texture, overlays, wave } = themes[theme];

  // 🔥 Animated progress
  const animatedProgress = useRef(new Animated.Value(progress)).current;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const animatedWidth = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // 🌊 Wave animation (only for potion)
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (theme === 'potion') {
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [theme]);

  const translateX = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -100],
  });

  return (
    <View style={[tw`items-center`, { width }]}>
      {/* Outer brown border around wood texture */}
      <View
        style={{
          width: '100%',
          height,
          borderWidth: 3,
          borderColor: '#5C4033', // dark brown
          borderRadius: height / 2,
          overflow: 'hidden', // clip the wood texture
        }}
      >
        {/* ✅ Wood-textured outer border */}
        <ImageBackground
          source={require('../../assets/interface/progressBar/wood.png')}
          resizeMode="cover"
          style={{
            width: '100%',
            height,
            borderRadius: height / 2,
            padding: 2, // space for yellow border inside
          }}
        >
          {/* Inner yellow border */}
          <View
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: '#fbbf24',
              borderRadius: (height - 8) / 2,
              overflow: 'hidden',
            }}
          >
            {/* Progress fill */}
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: animatedWidth,
                overflow: 'hidden',
                borderWidth: 2, // ✅ new brown border
                borderColor: '#92400e', // dark brown stroke
                borderRadius: (height - 8) / 2, // same radius as inner container
              }}
            >
              <ImageBackground source={texture} resizeMode="cover" style={{ width: '100%', height: '100%' }}>
                {overlays.map((o, i) => (
                  <Image key={i} source={o.src} resizeMode="repeat" style={[tw`absolute inset-0`, { opacity: o.opacity }]} />
                ))}

                {/* 🌊 Potion wave effect */}
                {theme === 'potion' && wave && (
                  <Animated.Image
                    source={wave}
                    resizeMode="repeat"
                    style={[
                      tw`absolute inset-0`,
                      {
                        opacity: 0.5,
                        transform: [{ translateX }],
                      },
                    ]}
                  />
                )}
              </ImageBackground>
            </Animated.View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
};
