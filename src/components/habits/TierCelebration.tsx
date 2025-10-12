// src/components/habits/TierCelebration.tsx

import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn, Easing } from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { TierInfo } from '@/services/habitProgressionService';
import { Image } from 'expo-image';
import { tierThemes } from '@/utils/tierTheme';

interface TierCelebrationProps {
  visible: boolean;
  newTier: TierInfo;
  onClose: () => void;
}

export const TierCelebration: React.FC<TierCelebrationProps> = ({ visible, newTier, onClose }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Smooth scale from 0.7 to 1
      scale.value = 0.7;
      scale.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });

      // Fade in
      opacity.value = withTiming(1, { duration: 250 });

      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } else {
      scale.value = withTiming(0.7, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const theme = tierThemes[newTier.name];

  // Get the correct gem icon based on tier
  const getGemIcon = () => {
    switch (newTier.name) {
      case 'Ruby':
        return require('../../../assets/interface/gems/ruby-gem.png');
      case 'Amethyst':
        return require('../../../assets/interface/gems/amethyst-gem.png');
      case 'Crystal':
      default:
        return require('../../../assets/interface/gems/crystal-gem.png');
    }
  };

  // Get the correct texture based on tier
  const getTexture = () => {
    switch (newTier.name) {
      case 'Ruby':
        return require('../../../assets/interface/progressBar/ruby-texture.png');
      case 'Amethyst':
        return require('../../../assets/interface/progressBar/amethyst-texture.png');
      case 'Crystal':
      default:
        return require('../../../assets/interface/progressBar/crystal.png');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={tw`flex-1 bg-black/70 items-center justify-center px-6`}>
        <Animated.View style={[animatedCardStyle, tw`w-full max-w-sm`]}>
          <View style={tw`bg-sand rounded-3xl overflow-hidden shadow-2xl`}>
            {/* Gradient Header with Texture */}
            <ImageBackground source={getTexture()} resizeMode="cover" style={tw`overflow-hidden`}>
              <LinearGradient
                colors={[...theme.gradient.map((c) => c + 'dd')]} // Semi-transparent to show texture
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={tw`px-10 pt-12 pb-10 items-center`}
              >
                {/* Gem Icon */}
                <Animated.View entering={FadeIn.delay(100).duration(400)} style={tw`mb-5`}>
                  <Image source={getGemIcon()} style={tw`w-24 h-24`} contentFit="contain" />
                </Animated.View>

                {/* Tier Name */}
                <Animated.Text entering={FadeIn.delay(200)} style={tw`text-white text-3xl font-black tracking-wider mb-2`}>
                  {newTier.name.toUpperCase()}
                </Animated.Text>

                {/* Subtle Description */}
                <Animated.Text entering={FadeIn.delay(300)} style={tw`text-white/90 text-base font-medium`}>
                  Tier Unlocked
                </Animated.Text>
              </LinearGradient>
            </ImageBackground>

            {/* Content Section */}
            <View style={tw`px-10 py-8 bg-stone-50`}>
              {/* Achievement Text */}
              <Text style={tw`text-stone-800 text-center text-lg font-semibold mb-6`}>{newTier.description}</Text>

              {/* Benefits Row - No icons, just clean text */}
              <View style={tw`flex-row items-center justify-center gap-4`}>
                <View style={tw`bg-sand rounded-2xl px-5 py-3 flex-1`}>
                  <Text style={tw`text-sand-500 text-xs font-medium text-center mb-1`}>STREAK</Text>
                  <Text style={tw`text-stone-800 font-black text-center text-base`}>{newTier.minDays}+ Days</Text>
                </View>

                <View style={tw`bg-sand rounded-2xl px-5 py-3 flex-1`}>
                  <Text style={tw`text-sand-500 text-xs font-medium text-center mb-1`}>MULTIPLIER</Text>
                  <Text style={tw`text-stone-800 font-black text-center text-base`}>{newTier.multiplier}x XP</Text>
                </View>
              </View>

              {/* Continue Hint */}
              <Text style={tw`text-stone-300 text-center text-xs mt-8`}>Tap anywhere to continue</Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
