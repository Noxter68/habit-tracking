// src/components/ui/ProgressBar.tsx
import React, { useEffect } from 'react';
import { Svg, Defs, Rect, ClipPath, G, Image as SvgImage, LinearGradient, Stop } from 'react-native-svg';
import { Image as RNImage } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';

type TierTheme = 'crystal' | 'ruby' | 'amethyst';

interface ProgressBarProps {
  progress: number | string; // "67" | "43%" | 0.67 | 120
  width?: number;
  height?: number;
  tier: TierTheme;
}

// Create animated version of Rect for smooth progress animation
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, width = 300, height = 24, tier }) => {
  const radius = height / 2;

  // normalize progress for % width
  let numericProgress = 0;
  if (typeof progress === 'string' && progress.includes('%')) {
    numericProgress = parseFloat(progress);
  } else if (typeof progress === 'number' && progress <= 1) {
    numericProgress = progress * 100;
  } else {
    numericProgress = Number(progress);
  }

  // clamp between 0 and 100 for rendering bar fill
  const targetNormalized = Math.max(0, Math.min(1, numericProgress / 100));

  // Animated value for smooth transitions - initialize with current value to avoid jump on mount
  const animatedProgress = useSharedValue(targetNormalized);

  useEffect(() => {
    // Animate to new value with smooth cubic easing
    // No need to check if value changed - withTiming handles that internally
    animatedProgress.value = withTiming(targetNormalized, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetNormalized, animatedProgress]);

  // textures
  const crystalUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/crystal-texture.png')).uri;
  const rubyUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/ruby-texture.png')).uri;
  const amethystUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/amethyst-texture.png')).uri;

  const themeTexture = tier === 'crystal' ? crystalUri : tier === 'ruby' ? rubyUri : amethystUri;

  // Simple tier colors
  const tierColors = {
    crystal: '#3b82f6',
    ruby: '#ef4444',
    amethyst: '#8b5cf6',
  };

  const borderColor = tierColors[tier];

  // Animated props for the clip path
  const animatedClipProps = useAnimatedProps(() => {
    return {
      width: Math.max(0, (width - 4) * animatedProgress.value),
    };
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {/* Simple background gradient */}
        <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#f8fafc" />
          <Stop offset="100%" stopColor="#e2e8f0" />
        </LinearGradient>

        {/* Clip for progress fill - animated */}
        <ClipPath id="progressClip">
          <AnimatedRect
            x={2}
            y={2}
            animatedProps={animatedClipProps}
            height={height - 4}
            rx={radius - 2}
            ry={radius - 2}
          />
        </ClipPath>
      </Defs>

      {/* Background track */}
      <Rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} fill="url(#bgGradient)" stroke={borderColor} strokeWidth={1} opacity={0.3} />

      {/* Progress fill with texture */}
      <G clipPath="url(#progressClip)">
        <SvgImage href={themeTexture} x={2} y={2} width={width - 4} height={height - 4} preserveAspectRatio="xMidYMid slice" />
      </G>

      {/* Simple border */}
      <Rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} fill="none" stroke={borderColor} strokeWidth={1.5} opacity={0.5} />
    </Svg>
  );
};

export default ProgressBar;
