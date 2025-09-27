import React from 'react';
import { Svg, Defs, Rect, ClipPath, G, Image as SvgImage, Pattern } from 'react-native-svg';
import { Image as RNImage } from 'react-native';

type TierTheme = 'crystal' | 'ruby' | 'amethyst';

interface ProgressBarProps {
  progress: number | string; // "67" | "43%" | 0.67 | 120
  width?: number;
  height?: number;
  tier: TierTheme; // 👈 now required
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, width = 300, height = 50, tier }) => {
  const radius = height / 2;
  const stroke = Math.max(2, height * 0.08);

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
  const normalized = Math.max(0, Math.min(1, numericProgress / 100));

  // textures
  const woodUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/wood-seamless.png')).uri;
  const crystalUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/crystal-texture.png')).uri;
  const rubyUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/ruby-texture.png')).uri;
  const amethystUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/amethyst-texture.png')).uri;

  const themeTexture = tier === 'crystal' ? crystalUri : tier === 'ruby' ? rubyUri : amethystUri;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <ClipPath id="chamber-clip">
          <Rect x={stroke} y={stroke} width={width - stroke * 2} height={height - stroke * 2} rx={radius - stroke / 2} ry={radius - stroke / 2} />
        </ClipPath>

        <ClipPath id="progress-clip">
          <Rect x={stroke} y={stroke} width={(width - stroke * 2) * normalized} height={height - stroke * 2} rx={radius - stroke / 2} ry={radius - stroke / 2} />
        </ClipPath>

        <Pattern id="woodPattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <SvgImage href={woodUri} width="100" height="100" preserveAspectRatio="xMidYMid slice" />
        </Pattern>
      </Defs>

      <Rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} fill="url(#woodPattern)" stroke="#3a261b" strokeWidth={stroke} />

      <G clipPath="url(#chamber-clip)">
        <G clipPath="url(#progress-clip)">
          <SvgImage href={themeTexture} x={stroke} y={stroke} width={width - stroke * 2} height={height - stroke * 2} preserveAspectRatio="xMidYMid slice" />
        </G>
      </G>
    </Svg>
  );
};

export default ProgressBar;
