// src/components/shared/AchievementBadge.tsx
// Badge d'achievement unifié avec support pour glow et état verrouillé

import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { Achievement } from '@/types/achievement.types';

interface TierTheme {
  gradient: string[];
  accent: string;
  gemName?: string;
}

interface AchievementBadgeProps {
  /** L'achievement à afficher */
  achievement?: Achievement;
  /** Taille du badge en pixels */
  size?: number;
  /** Si l'achievement est déverrouillé */
  isUnlocked?: boolean;
  /** Callback au clic */
  onPress?: () => void;
  /** Thème de tier pour le glow */
  tierTheme?: TierTheme;
  /** Afficher un effet de glow */
  showGlow?: boolean;
}

/**
 * Badge d'achievement avec support pour différents états et styles
 *
 * @example
 * // Badge simple (liste d'achievements)
 * <AchievementBadge
 *   achievement={achievement}
 *   isUnlocked={true}
 *   size={60}
 * />
 *
 * @example
 * // Badge avec glow (dashboard)
 * <AchievementBadge
 *   achievement={latestAchievement}
 *   size={100}
 *   onPress={openModal}
 *   tierTheme={currentTierTheme}
 *   showGlow
 * />
 */
export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ achievement, size = 60, isUnlocked = true, onPress, tierTheme, showGlow = false }) => {
  // Thème par défaut (Amethyst)
  const defaultTheme: TierTheme = {
    gradient: ['#F5F3FF', '#EDE9FE'],
    accent: '#9333EA',
  };

  const theme = tierTheme || defaultTheme;

  // Si pas d'achievement, ne rien afficher
  if (!achievement) {
    // Fallback vers icône Crown si showGlow est activé (cas dashboard)
    if (showGlow) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <LinearGradient
            colors={[`${theme.accent}15`, `${theme.accent}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
            }}
          >
            <Crown size={28} color={theme.accent} strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>
      );
    }
    return null;
  }

  // Déterminer l'image à afficher
  const imageSource = isUnlocked ? achievement.image : require('../../../assets/achievements/locked.png');

  // Pas d'ajustement de taille ici - géré uniquement dans les modals
  const adjustedSize = size;

  // Composant interne pour le contenu
  const content = (
    <View style={tw`relative`}>
      {/* Gradient glow derrière l'image (optionnel) */}
      {showGlow && isUnlocked && (
        <View
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            borderRadius: 20,
          }}
        >
          <LinearGradient
            colors={[`${theme.accent}20`, `${theme.accent}10`, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 20,
            }}
          />
        </View>
      )}

      {/* Image de l'achievement */}
      <Image
        source={imageSource}
        style={{
          width: adjustedSize,
          height: adjustedSize,
          opacity: isUnlocked ? 1 : 0.6,
          zIndex: showGlow ? 10 : 1,
        }}
        resizeMode="contain"
      />
    </View>
  );

  // Si onPress est fourni, envelopper dans Pressable
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: size,
          height: size,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

export default AchievementBadge;
