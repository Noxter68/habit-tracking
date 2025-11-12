// src/components/habits/TierCelebration.tsx

import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, FadeIn, Easing } from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { TierInfo } from '@/services/habitProgressionService';
import { Image } from 'expo-image';
import { tierThemes } from '@/utils/tierTheme';
import { useTranslation } from 'react-i18next';

interface TierCelebrationProps {
  visible: boolean;
  newTier: TierInfo;
  onClose: () => void;
}

export const TierCelebration: React.FC<TierCelebrationProps> = ({ visible, newTier, onClose }) => {
  const { t } = useTranslation();
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const [countdown, setCountdown] = React.useState(8);

  useEffect(() => {
    if (visible) {
      // Reset countdown
      setCountdown(8);

      // Smooth scale from 0.7 to 1
      scale.value = 0.7;
      scale.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });

      // Fade in
      opacity.value = withTiming(1, { duration: 250 });

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto close after 8 seconds
      const closeTimer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(closeTimer);
      };
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
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={tw`flex-1 bg-black/70 items-center justify-center px-6`}>
        <Animated.View style={[animatedCardStyle, tw`w-full max-w-sm`]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={tw`bg-white rounded-3xl overflow-hidden shadow-2xl`}>
              {/* Gradient Header with Texture */}
              <ImageBackground source={getTexture()} resizeMode="cover" style={tw`overflow-hidden`}>
                <LinearGradient
                  colors={theme.gradient.map((c) => c + 'dd')} // Semi-transparent
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

                  {/* Subtitle */}
                  <Text style={tw`text-white/90 text-base font-medium`}>{t('habitDetails.tierCelebration.unlocked')}</Text>
                </LinearGradient>
              </ImageBackground>

              {/* Content Section */}
              <View style={tw`px-6 py-8 bg-slate-50`}>
                {/* Achievement Text */}
                {/* <Text style={tw`text-slate-800 text-center text-lg font-semibold mb-6`}>{newTier.description}</Text> */}

                {/* Benefits Row - Side by side */}
                <View style={tw`flex-row gap-3 mb-6`}>
                  {/* Streak Days */}
                  <View style={tw`bg-white rounded-2xl px-4 py-4 flex-1 shadow-sm`}>
                    <Text style={tw`text-slate-500 text-xs font-semibold text-center mb-1.5`}>{t('habitDetails.tierCelebration.streak').toUpperCase()}</Text>
                    <Text style={tw`text-slate-900 font-black text-center text-2xl`}>{t('habitDetails.tierCelebration.days', { days: newTier.minDays })}</Text>
                  </View>

                  {/* XP Multiplier */}
                  <View style={tw`bg-white rounded-2xl px-4 py-4 flex-1 shadow-sm`}>
                    <Text style={tw`text-slate-500 text-xs font-semibold text-center mb-1.5`}>{t('habitDetails.tierCelebration.multiplier').toUpperCase()}</Text>
                    <Text style={tw`text-slate-900 font-black text-center text-2xl`}>
                      {t('habitDetails.tierCelebration.xpBonus', {
                        multiplier: newTier.multiplier,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Continue Hint with Countdown */}
                <Text style={tw`text-slate-400 text-center text-xs`}>{t('habitDetails.tierCelebration.closingIn', { seconds: countdown })}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
