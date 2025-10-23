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
  streakImage?: any;
  questImage?: any;
  backgroundGradient?: string[];
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
    streakImage: require('../../../assets/interface/streak-amethyst.png'),
    questImage: require('../../../assets/interface/quest-amethyst.png'),
    backgroundGradient: ['#faf5ff', '#f3e8ff', '#e9d5ff'],
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
    // Lighter background for Ruby (red) and Topaz (yellow) gems
    if (['Ruby', 'Topaz'].includes(theme.gemName)) {
      return ['rgba(0, 20, 10, 0.25)', 'rgba(0, 30, 15, 0.35)'];
    }
    // Standard dark green gradient for other cards
    return ['rgba(0, 20, 10, 0.4)', 'rgba(0, 30, 15, 0.5)'];
  };

  const getBorderColor = () => {
    // Lighter border for Ruby and Topaz
    if (['Ruby', 'Topaz'].includes(theme.gemName)) {
      return 'rgba(100, 200, 150, 0.2)';
    }
    // Subtle green border
    return 'rgba(100, 200, 150, 0.15)';
  };

  const getTextColors = () => {
    // Light text for dark background
    return 'rgba(220, 255, 230, 1)';
  };

  const getSubtextColors = () => {
    // Muted green subtext
    return 'rgba(150, 220, 180, 0.85)';
  };

  const getIconBg = () => {
    // Subtle green icon background
    return 'rgba(100, 200, 150, 0.12)';
  };

  const getIconColor = () => {
    // Light icon color
    return 'rgba(200, 255, 220, 0.9)';
  };

  const getShadowColor = () => {
    // Dark shadow
    return '#000';
  };

  const isOnFire = isStreak && streakValue >= 7;

  const renderVisual = () => {
    // For streak cards, use the tier-based streak image
    if (isStreak && theme.streakImage) {
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
            <Image source={theme.streakImage} style={{ width: 35, height: 35 }} resizeMode="contain" />
          </View>
        </Animated.View>
      );
    }

    // For quest/active cards with image prop set to "active", use tier-based quest image
    if ('image' in props && props.image === 'active' && theme.questImage) {
      return (
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
          <Image source={theme.questImage} style={{ width: 35, height: 35 }} resizeMode="contain" />
        </View>
      );
    }

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
        shadowOpacity: 0.25,
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

// Helper function to map string to image source (deprecated - now uses tier-based images)
const getImageSource = (imageName: string): ImageSourcePropType | null => {
  // Legacy support for non-tier images
  const imageMap: Record<string, ImageSourcePropType> = {
    // 'active' and 'streak' now handled by tier theme
  };

  return imageMap[imageName] || null;
};

export default StatsCard;
