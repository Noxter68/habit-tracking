// src/components/habits/TierCelebration.tsx

import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, ImageBackground } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn, ZoomIn, Easing } from 'react-native-reanimated';
import { Trophy, Sparkles, Star } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { TierInfo } from '@/services/habitProgressionService';
import { Image as RNImage } from 'react-native';

interface TierCelebrationProps {
  visible: boolean;
  newTier: TierInfo;
  onClose: () => void;
}

export const TierCelebration: React.FC<TierCelebrationProps> = ({ visible, newTier, onClose }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const confettiRef = React.useRef<any>(null);

  useEffect(() => {
    if (visible) {
      scale.value = 0.5;
      scale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });

      opacity.value = withTiming(1, { duration: 300 });

      setTimeout(() => {
        confettiRef.current?.startConfetti?.();
      }, 200);

      setTimeout(() => {
        confettiRef.current?.stopConfetti?.();
        onClose();
      }, 4000);
    } else {
      scale.value = withTiming(0.5, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // textures
  const crystalUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/crystal.png')).uri;
  const rubyUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/ruby-texture.png')).uri;
  const amethystUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/amethyst-texture.png')).uri;

  const themeTexture = newTier.name === 'Amethyst' ? amethystUri : newTier.name === 'Ruby' ? rubyUri : crystalUri;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={tw`flex-1 bg-black/80 items-center justify-center px-6`}>
        <Animated.View style={animatedCardStyle}>
          <Pressable onPress={onClose}>
            <ImageBackground
              source={{ uri: themeTexture }}
              resizeMode="cover"
              style={tw`rounded-3xl p-8 items-center overflow-hidden`}
              imageStyle={tw`rounded-3xl opacity-80`} // dim texture a bit
            >
              {/* Floating sparkles */}
              <View style={tw`absolute inset-0`}>
                {[...Array(6)].map((_, i) => (
                  <Animated.View
                    key={i}
                    entering={FadeIn.delay(i * 100).duration(500)}
                    style={[
                      tw`absolute`,
                      {
                        top: Math.random() * 200,
                        left: Math.random() * 250,
                      },
                    ]}
                  >
                    <Sparkles size={20} color="rgba(255,255,255,0.6)" />
                  </Animated.View>
                ))}
              </View>

              {/* Trophy Icon */}
              <Animated.View entering={ZoomIn.delay(200).springify()} style={tw`w-24 h-24 bg-black/30 rounded-full items-center justify-center mb-4`}>
                <Trophy size={50} color="#fff" strokeWidth={2} />
              </Animated.View>

              {/* Tier Up Text */}
              <Animated.Text entering={FadeIn.delay(300)} style={tw`text-white text-3xl font-black mb-2`}>
                TIER UP!
              </Animated.Text>

              {/* New Tier Name */}
              <Animated.View entering={FadeIn.delay(400)} style={tw`flex-row items-center gap-2 mb-4`}>
                <Text style={tw`text-white text-5xl`}>{newTier.icon}</Text>
                <Text style={tw`text-white text-2xl font-bold`}>{newTier.name}</Text>
              </Animated.View>

              {/* Description */}
              <Animated.Text entering={FadeIn.delay(500)} style={tw`text-white/90 text-center text-base mb-4`}>
                {newTier.description}
              </Animated.Text>

              {/* Benefits */}
              <Animated.View entering={FadeIn.delay(600)} style={tw`bg-black/40 rounded-2xl px-4 py-2 flex-row items-center gap-2`}>
                <Star size={16} color="#fff" />
                <Text style={tw`text-white font-bold`}>{newTier.multiplier}x XP Multiplier</Text>
              </Animated.View>

              {/* Tap to continue */}
              <Animated.Text entering={FadeIn.delay(800)} style={tw`text-white/60 text-xs mt-6`}>
                Tap to continue
              </Animated.Text>
            </ImageBackground>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};
