/**
 * AchievementCard.tsx
 *
 * Carte d'affichage d'un achievement individuel.
 * Gère les états verrouillé/déverrouillé avec gradient selon le tier.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React et React Native
import React from 'react';
import { View, Text, Pressable } from 'react-native';

// Bibliothèques externes
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

// Composants internes
import { AchievementBadge } from '../shared/AchievementBadge';

// Utilitaires
import tw from '../../lib/tailwind';
import { getAchievementTierTheme } from '../../utils/tierTheme';

// Types
import { Achievement, TierKey } from '../../types/achievement.types';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  isFromBackend: boolean;
  index: number;
  onPress: (achievement: Achievement) => void;
  tierName?: string;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isUnlocked,
  isFromBackend,
  index,
  onPress,
  tierName,
}) => {
  // ---------------------------------------------------------------------------
  // Valeurs calculées
  // ---------------------------------------------------------------------------

  // Récupère le thème du tier pour les couleurs du gradient
  const tierTheme = tierName ? getAchievementTierTheme(tierName as TierKey) : null;

  /**
   * Crée une version plus claire du gradient pour l'état déverrouillé
   * Style similaire au DashboardHeader avec fond blanc opaque
   * @param tierGradient - Couleurs du gradient du tier
   * @returns Gradient avec opacité réduite
   */
  const getLightGradient = (tierGradient: string[]): string[] => {
    return [
      'rgba(255, 255, 255, 0.95)',
      'rgba(255, 255, 255, 0.90)',
      'rgba(255, 255, 255, 0.95)',
    ];
  };

  // Couleurs du gradient selon l'état
  const unlockedGradient = tierTheme
    ? getLightGradient(tierTheme.gradient)
    : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.90)', 'rgba(255, 255, 255, 0.95)'];

  const lockedGradient = ['rgba(250, 250, 250, 1)', 'rgba(245, 245, 245, 1)', 'rgba(238, 238, 238, 1)'];

  // Taille du badge (légèrement plus grand pour les niveaux 36-40)
  const isInfernalLevel = achievement.level >= 36 && achievement.level <= 40;
  const badgeSize = isInfernalLevel ? 70 : 60;

  // Couleurs de bordure et d'accent (style DashboardHeader avec bordure blanche)
  const borderColor = isUnlocked
    ? 'rgba(255, 255, 255, 0.9)' // Bordure blanche opaque pour les débloqués
    : 'rgba(224, 224, 224, 1)'; // Bordure grise pour les verrouillés

  const accentColor = tierTheme ? tierTheme.gradient[1] : '#6B7280';

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <Animated.View entering={FadeIn.delay(index * 50)} style={tw`mb-3`}>
      <Pressable
        onPress={() => onPress(achievement)}
        style={({ pressed }) => [pressed && tw`scale-[0.98]`, tw`relative`]}
      >
        {/* Effet de lueur externe pour les achievements déverrouillés */}
        {isUnlocked && tierTheme && (
          <View
            style={[
              tw`absolute inset-0 rounded-2xl`,
              {
                backgroundColor: tierTheme.gradient[1] + '15',
                transform: [{ scale: 1.02 }],
                opacity: 0.5,
              },
            ]}
          />
        )}

        <LinearGradient
          colors={isUnlocked ? unlockedGradient : lockedGradient}
          style={[
            tw`rounded-2xl relative`,
            {
              height: 170,
              width: '100%',
              borderWidth: 2,
              borderColor: borderColor,
              backgroundColor: isUnlocked
                ? 'rgba(255, 255, 255, 0.95)'
                : 'rgba(245, 245, 245, 1)',
              shadowColor: isUnlocked ? accentColor : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isUnlocked ? 0.2 : 0.08,
              shadowRadius: isUnlocked ? 8 : 4,
              elevation: isUnlocked ? 6 : 2,
            },
          ]}
        >
          {/* Effet de brillance en haut pour l'état déverrouillé */}
          {isUnlocked && tierTheme && (
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
              style={[tw`absolute top-0 left-0 right-0 rounded-t-2xl`, { height: '40%' }]}
            />
          )}

          {/* Conteneur du contenu - flexbox pour espacement cohérent */}
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 20,
              paddingHorizontal: 12,
            }}
          >
            {/* Badge avec opacité pour l'état verrouillé */}
            <View
              style={{
                opacity: isUnlocked ? 1 : 0.3,
                height: badgeSize,
                width: badgeSize,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <AchievementBadge
                level={achievement.level}
                achievement={achievement}
                isUnlocked={true}
                size={badgeSize}
              />
            </View>

            {/* Titre - hauteur fixe 32px */}
            <View
              style={{
                height: 32,
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Text
                style={{
                  color: isUnlocked ? '#1F2937' : '#9CA3AF',
                  letterSpacing: 0.3,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  lineHeight: 12,
                  fontWeight: '700',
                  textAlign: 'center',
                  paddingHorizontal: 4,
                }}
                numberOfLines={2}
              >
                {achievement.title}
              </Text>
            </View>

            {/* Badge de niveau */}
            <LinearGradient
              colors={
                isUnlocked && tierTheme
                  ? [tierTheme.gradient[0], tierTheme.gradient[1]]
                  : ['#D1D5DB', '#9CA3AF']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 4,
                shadowColor: isUnlocked ? accentColor : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isUnlocked ? 0.3 : 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  color: '#fff',
                  fontSize: 11,
                  letterSpacing: 0.5,
                  fontWeight: '900',
                }}
              >
                LEVEL {achievement.level}
              </Text>
            </LinearGradient>
          </View>

          {/* Indicateur de synchronisation backend */}
          {isFromBackend && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'rgba(20, 184, 166, 0.9)',
                shadowColor: '#14B8A6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
