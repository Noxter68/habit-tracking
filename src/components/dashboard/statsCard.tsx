// src/components/dashboard/StatsCard.tsx
import React from 'react';
import { View, Text, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeIcon, LucideIcon } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName: string;
}

type StatsCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  highlight?: boolean;
  isStreak?: boolean;
  streakValue?: number;
  tierTheme?: TierTheme;
} & ({ icon: LucideIcon; image?: never } | { icon?: never; image: ImageSourcePropType | string } | { icon?: never; image?: never });

const StatsCard: React.FC<StatsCardProps> = (props) => {
  const { label, value, subtitle, highlight = false, isStreak = false, streakValue = 0, tierTheme } = props;

  // Default to Amethyst if no tier theme provided
  const defaultTheme = {
    gradient: ['#9333EA', '#7C3AED'],
    accent: '#9333EA',
    gemName: 'Amethyst',
  };

  const theme = tierTheme || defaultTheme;
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
    if (isStreak && streakValue >= 30) {
      // Legendary streak (30+ days) - Use tier theme gradient for ultimate achievement
      return theme.gradient;
    }
    if (isStreak && streakValue >= 7) {
      // Epic streak (7+ days) - Lighter version of tier theme
      return [`${theme.gradient[0]}`, `${theme.gradient[1]}`];
    }
    if (highlight) {
      // Highlighted - Use tier theme
      return theme.gradient;
    }
    // Default - clean white
    return ['#FFFFFF', '#FAF9F7'];
  };

  const getBorderColor = () => {
    if (isStreak && streakValue >= 30) return `${theme.accent}40`; // Legendary - stronger border
    if (isStreak && streakValue >= 7) return `${theme.accent}40`; // Epic - strong border
    if (highlight) return `${theme.accent}30`;
    // Default - subtle border
    return 'rgba(0, 0, 0, 0.06)';
  };

  const getTextColors = () => {
    if (isStreak && streakValue >= 7) return '#FFFFFF';
    return '#1F2937';
  };

  const getSubtextColors = () => {
    if (isStreak && streakValue >= 7) return 'rgba(255, 255, 255, 0.9)';
    return '#9CA3AF';
  };

  const getIconBg = () => {
    if (isStreak && streakValue >= 30) return 'rgba(255, 255, 255, 0.25)';
    if (isStreak && streakValue >= 7) return 'rgba(255, 255, 255, 0.25)';
    // Use tier theme for default state
    return `${theme.accent}15`;
  };

  const getIconColor = () => {
    if (isStreak && streakValue >= 7) return '#FFFFFF';
    // Use tier theme accent
    return theme.accent;
  };

  const getShadowColor = () => {
    if (isStreak && streakValue >= 30) return '#DC2626';
    if (isStreak && streakValue >= 7) return '#EC4899';
    // Use tier theme accent
    return theme.accent;
  };

  const isOnFire = isStreak && streakValue >= 7;

  const renderVisual = () => {
    // Check if we have an icon prop
    if ('icon' in props && props.icon) {
      const Icon = props.icon;
      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: getIconBg(),
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            }}
          >
            <Icon size={22} color={getIconColor()} />
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
            <View
              style={{
                width: 40,
                height: 40,
                backgroundColor: getIconBg(),
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
              }}
            >
              <HomeIcon size={22} color={getIconColor()} />
            </View>
          </Animated.View>
        );
      }

      return (
        <Animated.View style={isOnFire ? fireAnimatedStyle : undefined}>
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: getIconBg(),
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
            }}
          >
            <Image source={imageSource} style={{ width: 35, height: 35 }} resizeMode="contain" />
          </View>
        </Animated.View>
      );
    }

    // Default case - no icon or image provided
    return (
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: getIconBg(),
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        }}
      >
        <HomeIcon size={22} color={getIconColor()} />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: getBorderColor(),
        shadowColor: getShadowColor(),
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {renderVisual()}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              fontSize: 11,
              color: getSubtextColors(),
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            {label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: getTextColors() }}>{value}</Text>
            {subtitle && (
              <Text
                style={{
                  fontSize: 12,
                  color: getSubtextColors(),
                  fontWeight: '600',
                }}
              >
                {subtitle}
              </Text>
            )}
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
    active: require('../../../assets/interface/quest.png'),
    // Add more mappings as needed
  };

  return imageMap[imageName] || null;
};

export default StatsCard;
