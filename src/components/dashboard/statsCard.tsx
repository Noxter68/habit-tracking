// src/components/dashboard/StatsCard.tsx
import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeIcon, LucideIcon } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { getImage } from '@/utils/images';

// Define props with proper typing - use EITHER icon OR image, not both
type StatsCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  highlight?: boolean;
  isStreak?: boolean;
  streakValue?: number;
} & ({ icon: LucideIcon; image?: never } | { icon?: never; image: ImageSourcePropType | string } | { icon?: never; image?: never });

const StatsCard: React.FC<StatsCardProps> = (props) => {
  const { label, value, subtitle, highlight = false, isStreak = false, streakValue = 0 } = props;

  const fireScale = useSharedValue(1);

  React.useEffect(() => {
    if (isStreak && streakValue >= 7) {
      fireScale.value = withRepeat(withSequence(withTiming(1.1, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, true);
    }
  }, [isStreak, streakValue]);

  const fireAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  const getGradientColors = () => {
    if (isStreak && streakValue >= 30) return ['#dc2626', '#991b1b']; // Legendary
    if (isStreak && streakValue >= 7) return ['#f59e0b', '#d97706']; // Epic
    if (highlight) return ['#fef3c7', '#fed7aa'];
    return ['#ffffff', '#fef3c7'];
  };

  const getTextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white';
    return 'text-gray-900';
  };

  const getSubtextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white opacity-90';
    return 'text-amber-600';
  };

  const isOnFire = isStreak && streakValue >= 7;
  const containerBg = isOnFire ? 'bg-white bg-opacity-20' : 'bg-amber-200 bg-opacity-50';

  const renderVisual = () => {
    // Check if we have an icon prop
    if ('icon' in props && props.icon) {
      const Icon = props.icon;
      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center`}>
            <Icon size={24} color={isOnFire ? '#fff' : '#d97706'} />
          </View>
        </Animated.View>
      );
    }

    // Check if we have an image prop
    if ('image' in props && props.image) {
      const imageSource = typeof props.image === 'string' ? getImageSource(props.image) : props.image;

      // If no valid image source found, show default icon
      if (!imageSource) {
        return (
          <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
            <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center`}>
              <HomeIcon size={24} color={isOnFire ? '#fff' : '#d97706'} />
            </View>
          </Animated.View>
        );
      }

      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center`}>
            <Image source={imageSource} style={tw`w-8 h-8`} resizeMode="contain" />
          </View>
        </Animated.View>
      );
    }

    return null;
  };

  return (
    <LinearGradient colors={getGradientColors()} style={[tw`flex-1 rounded-2xl p-3`, !isOnFire && tw`border border-amber-200`]}>
      <View style={tw`flex-row items-center justify-between`}>
        <View>
          <Text style={tw`text-xs font-medium ${isOnFire ? 'text-white opacity-90' : 'text-amber-700'}`}>{label}</Text>
          <Text style={tw`text-xl font-black ${getTextColors()}`}>{value}</Text>
        </View>
        {renderVisual()}
      </View>
      {subtitle && <Text style={tw`text-xs ${getSubtextColors()} mt-1`}>{subtitle}</Text>}
      {isOnFire && <Text style={tw`text-xs font-bold text-white opacity-90 mt-1`}>{streakValue >= 30 ? 'LEGENDARY!' : 'ON FIRE!'}</Text>}
    </LinearGradient>
  );
};

// Helper function to get image source from string
const getImageSource = (imageName: string): ImageSourcePropType | null => {
  return getImage(imageName);
};

export default StatsCard;
