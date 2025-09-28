// src/components/dashboard/StatsCard.tsx
import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeIcon, LucideIcon } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import tw from '../../lib/tailwind';
import { getImage } from '@/utils/images';

// Define props with proper typing
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
    if (isStreak && streakValue >= 30) return ['#4B5563', '#374151'];
    if (isStreak && streakValue >= 7) return ['#6B7280', '#4B5563'];
    if (highlight) return ['#F3F4F6', '#E5E7EB']; // Light quartz
    return ['#ffffff', '#F3F4F6']; // White to light quartz
  };

  const getTextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white';
    return 'text-quartz-700';
  };

  const getSubtextColors = () => {
    if (isStreak && streakValue >= 7) return 'text-white opacity-90';
    return 'text-quartz-500';
  };

  const isOnFire = isStreak && streakValue >= 7;
  const containerBg = isOnFire ? 'bg-white bg-opacity-20' : 'bg-quartz-200 bg-opacity-50';

  const renderVisual = () => {
    // Check if we have an icon prop
    if ('icon' in props && props.icon) {
      const Icon = props.icon;
      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center`}>
            <Icon size={24} color={isOnFire ? '#fff' : '#6B7280'} />
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
              <HomeIcon size={24} color={isOnFire ? '#fff' : '#6B7280'} />
            </View>
          </Animated.View>
        );
      }

      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center p-1.5`}>
            <Image source={imageSource} style={tw`w-7 h-7`} resizeMode="contain" />
          </View>
        </Animated.View>
      );
    }

    // Default case - no icon or image provided
    return (
      <View style={tw`w-10 h-10 ${containerBg} rounded-xl items-center justify-center`}>
        <HomeIcon size={24} color="#6B7280" />
      </View>
    );
  };

  return (
    <LinearGradient colors={getGradientColors()} style={tw`flex-1 rounded-2xl p-4 border border-quartz-200`}>
      <View style={tw`flex-row items-center justify-between`}>
        {renderVisual()}
        <View style={tw`flex-1 ml-3`}>
          <Text style={tw`text-xs ${getSubtextColors()} font-medium`}>{label}</Text>
          <View style={tw`flex-row items-baseline gap-1`}>
            <Text style={tw`text-2xl font-black ${getTextColors()}`}>{value}</Text>
            {subtitle && <Text style={tw`text-xs ${getSubtextColors()} font-medium`}>{subtitle}</Text>}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

// Helper function to map string to image source
const getImageSource = (imageName: string): ImageSourcePropType | null => {
  const imageMap: Record<string, ImageSourcePropType> = {
    streak: require('../../../assets/interface/streak.png'),
    active: require('../../../assets/interface/streak.png'),
    // Add more mappings as needed
  };

  return imageMap[imageName] || null;
};

export default StatsCard;
