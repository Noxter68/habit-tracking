import React from 'react';
import { Svg, Defs, Rect, ClipPath, G, Image as SvgImage, Pattern } from 'react-native-svg';
import { Image as RNImage } from 'react-native';

type Theme = 'potion' | 'crystal' | 'stone';

interface ProgressBarProps {
  progress: number | string; // "67" | "43%" | 0.67
  theme: Theme;
  width?: number;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, theme, width = 300, height = 50 }) => {
  const radius = height / 2;
  const stroke = Math.max(2, height * 0.08);

  // normalize progress
  let normalized = 0;
  if (typeof progress === 'string' && progress.includes('%')) {
    normalized = parseFloat(progress) / 100;
  } else if (typeof progress === 'number' && progress > 1) {
    normalized = progress / 100;
  } else {
    normalized = Number(progress);
  }
  normalized = Math.max(0, Math.min(1, normalized));

  // textures
  const woodUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/wood-seamless.png')).uri;
  const potionUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/potion.png')).uri;
  const crystalUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/crystal.png')).uri;
  const stoneUri = RNImage.resolveAssetSource(require('../../../assets/interface/progressBar/stone.png')).uri;

  const themeTexture = theme === 'potion' ? potionUri : theme === 'crystal' ? crystalUri : stoneUri;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {/* chamber shape */}
        <ClipPath id="chamber-clip">
          <Rect x={stroke} y={stroke} width={width - stroke * 2} height={height - stroke * 2} rx={radius - stroke / 2} ry={radius - stroke / 2} />
        </ClipPath>

        {/* progress mask */}
        <ClipPath id="progress-clip">
          <Rect x={stroke} y={stroke} width={(width - stroke * 2) * normalized} height={height - stroke * 2} rx={radius - stroke / 2} ry={radius - stroke / 2} />
        </ClipPath>

        {/* wood pattern */}
        <Pattern id="woodPattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <SvgImage href={woodUri} width="100" height="100" preserveAspectRatio="xMidYMid slice" />
        </Pattern>
      </Defs>

      {/* border */}
      <Rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} fill="url(#woodPattern)" stroke="#3a261b" strokeWidth={stroke} />

      {/* fill */}
      <G clipPath="url(#chamber-clip)">
        <G clipPath="url(#progress-clip)">
          <SvgImage href={themeTexture} x={stroke} y={stroke} width={width - stroke * 2} height={height - stroke * 2} preserveAspectRatio="xMidYMid slice" />
        </G>
      </G>
    </Svg>
  );
};

export default ProgressBar;
