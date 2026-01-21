/**
 * AddHabitBar.tsx
 *
 * Full-width add habit button with crystal blue texture.
 * Placed above the daily habits section.
 */

import React from 'react';
import { View, Text, Pressable, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';

// Crystal blue theme colors
const CRYSTAL_GRADIENT: [string, string, string] = ['#60a5fa', '#3b82f6', '#1d4ed8'];
const CRYSTAL_SHADOW = '#1e40af';

interface AddHabitBarProps {
  onPress: () => void;
  compact?: boolean;
}

export const AddHabitBar: React.FC<AddHabitBarProps> = ({ onPress, compact = false }) => {
  const { t } = useTranslation();

  // Duolingo-style pushy button effect
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * 3 }],
  }));

  const handlePressIn = () => {
    pressed.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressed.value = withTiming(0, { duration: 100 });
  };

  const handlePress = () => {
    HapticFeedback.medium();
    onPress();
  };

  // Compact version - just a small button with icon
  if (compact) {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            {
              borderRadius: 12,
              overflow: 'hidden',
              borderBottomWidth: 3,
              borderBottomColor: CRYSTAL_SHADOW,
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={CRYSTAL_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`py-2 px-3`}
          >
            <View style={tw`flex-row items-center gap-1.5`}>
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={[
                  tw`text-sm font-bold text-white`,
                  {
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                {t('dashboard.habitsSection.addHabit')}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          {
            marginTop: 12,
            marginBottom: 8,
            borderRadius: 16,
            overflow: 'hidden',
            borderBottomWidth: 4,
            borderBottomColor: CRYSTAL_SHADOW,
          },
          animatedStyle,
        ]}
      >
        <ImageBackground
          source={require('../../../assets/interface/progressBar/crystal.png')}
          imageStyle={{ borderRadius: 12 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={[CRYSTAL_GRADIENT[0] + 'cc', CRYSTAL_GRADIENT[1] + 'cc', CRYSTAL_GRADIENT[2] + 'cc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={tw`py-3 px-4`}
          >
            <View style={tw`flex-row items-center justify-center gap-2.5`}>
              <View
                style={[
                  tw`w-8 h-8 rounded-full items-center justify-center`,
                  { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                ]}
              >
                <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text
                style={[
                  tw`text-base font-bold text-white`,
                  {
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                {t('dashboard.habitsSection.addHabit')}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    </Pressable>
  );
};

export default AddHabitBar;
