/**
 * AchievementDetailModal.tsx
 *
 * Modal affichant les détails d'un achievement.
 * Montre la progression et l'état verrouillé/déverrouillé.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React et React Native
import React from 'react';
import { Modal, View, Text, Pressable, Image, ImageBackground } from 'react-native';

// Bibliothèques externes
import Animated, { SlideInDown, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

// Utilitaires
import tw, { quartzGradients } from '../../lib/tailwind';
import { getAchievementTierTheme } from '../../utils/tierTheme';

// Types
import { Achievement } from '../../utils/achievements';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface AchievementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  achievement: Achievement | null;
  currentLevel: number;
  totalCompletions: number;
}

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

export const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  visible,
  onClose,
  achievement,
  currentLevel,
  totalCompletions,
}) => {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { t } = useTranslation();

  // ---------------------------------------------------------------------------
  // Rendu conditionnel
  // ---------------------------------------------------------------------------
  if (!achievement) return null;

  // ---------------------------------------------------------------------------
  // Valeurs calculées
  // ---------------------------------------------------------------------------
  const isUnlocked = achievement.level <= currentLevel;
  const requiredCompletions = (achievement.level - 1) * 10;
  const remaining = requiredCompletions - totalCompletions;
  const progress = Math.min((totalCompletions / requiredCompletions) * 100, 100);

  // Thème et couleurs du tier
  const tierTheme = getAchievementTierTheme(achievement.tierKey);
  const tierGradient = tierTheme.gradient;
  const tierTexture = tierTheme.texture;

  // Détermine si c'est un tier sombre (comme Mythic Glory)
  const isDarkTier = achievement.tierKey === 'mythicGlory';

  /**
   * Détermine les couleurs de texte selon le type de gemme
   * @param gemName - Nom de la gemme du tier
   * @returns Couleurs primaire et secondaire
   */
  const getTextColors = (gemName: string) => {
    // Tous les tiers utilisent du texte blanc pour une meilleure lisibilité
    return {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.9)',
    };
  };

  const textColors = getTextColors(tierTheme.gemName);

  // Gradients pour l'état verrouillé - plus opaques pour les tiers sombres
  const lockedGradient = isDarkTier
    ? [tierGradient[0] + 'ee', tierGradient[1] + 'ee', tierGradient[2] + 'dd']
    : [tierGradient[0] + '70', tierGradient[1] + '65', tierGradient[2] + '60'];
  const lockedProgressGradient = isDarkTier
    ? [tierGradient[0] + 'f5', tierGradient[1] + 'ee']
    : [tierGradient[0] + '85', tierGradient[1] + '75'];
  const lockedButtonGradient = [tierGradient[0] + 'B0', tierGradient[1] + 'B0'];

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={tw`flex-1 bg-black/60 items-center justify-center px-4`}
        onPress={onClose}
      >
        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={tw`w-full max-w-sm`}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Bordure avec gradient du tier */}
            <LinearGradient
              colors={tierGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={tw`rounded-3xl p-1`}
            >
              <View style={tw`bg-sand-50 rounded-3xl overflow-hidden relative`}>
                {/* Fond avec gradient - s'étend sur toute la hauteur */}
                <View style={tw`absolute inset-0 z-0`}>
                  <LinearGradient colors={quartzGradients.overlay} style={tw`flex-1`} />
                </View>

                {/* En-tête avec texture et gradient du tier */}
                <View style={tw`relative z-10`}>
                  <ImageBackground
                    source={tierTexture}
                    style={{ overflow: 'hidden' }}
                    imageStyle={{ opacity: isUnlocked ? 0.8 : 0.5 }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={
                        isUnlocked
                          ? [
                              tierGradient[0] + 'dd',
                              tierGradient[1] + 'dd',
                              tierGradient[2] + 'cc',
                            ]
                          : lockedGradient
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`px-6 pt-8 pb-16 items-center`}
                    >
                      {/* Badge de l'achievement */}
                      <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <Image
                          source={achievement.image}
                          style={{
                            width: 250,
                            height: 180,
                            opacity: isUnlocked ? 1 : isDarkTier ? 0.7 : 0.5,
                          }}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </LinearGradient>
                  </ImageBackground>
                </View>

                {/* Section contenu - chevauche l'en-tête */}
                <View style={tw`px-6 pb-6 -mt-10 relative z-20`}>
                  {/* Carte titre */}
                  <View
                    style={tw`bg-white rounded-2xl shadow-sm p-4 mb-4 border border-sand-200`}
                  >
                    <Text style={tw`text-xl font-bold text-stone-800 text-center mb-3`}>
                      {achievement.title}
                    </Text>

                    <View style={tw`flex-row gap-2 justify-center`}>
                      {/* Badge niveau avec gradient du tier */}
                      <LinearGradient
                        colors={isUnlocked ? tierGradient : lockedButtonGradient}
                        style={tw`rounded-full px-3.5 py-1.5`}
                      >
                        <Text style={tw`text-sm font-bold text-white`}>
                          {t('achievements.level', { level: achievement.level })}
                        </Text>
                      </LinearGradient>

                      {/* Badge tier - affiche le nom de la gemme */}
                      <View
                        style={[
                          tw`rounded-full px-3.5 py-1.5 border`,
                          {
                            backgroundColor: isUnlocked
                              ? `${tierTheme.accent}15`
                              : '#F5F5F4',
                            borderColor: isUnlocked ? `${tierTheme.accent}40` : '#D6D3D1',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            tw`text-sm font-semibold`,
                            { color: isUnlocked ? tierTheme.accent : '#78716C' },
                          ]}
                        >
                          {tierTheme.gemName}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Carte progression avec texture et gradient du tier */}
                  <ImageBackground
                    source={tierTexture}
                    style={{
                      overflow: 'hidden',
                      borderRadius: 16,
                      marginBottom: 16,
                    }}
                    imageStyle={{
                      opacity: isUnlocked ? 0.7 : 0.4,
                      borderRadius: 16,
                    }}
                    resizeMode="cover"
                  >
                    <LinearGradient
                      colors={
                        isUnlocked
                          ? [tierGradient[0] + 'dd', tierGradient[1] + 'dd']
                          : lockedProgressGradient
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={tw`rounded-2xl p-4`}
                    >
                      <Text
                        style={[
                          tw`text-sm font-semibold text-center mb-2`,
                          { color: textColors.primary },
                        ]}
                      >
                        {isUnlocked
                          ? t('achievements.achievementUnlocked')
                          : t('achievements.progressStatus')}
                      </Text>

                      <Text
                        style={[
                          tw`text-sm text-center leading-5 font-medium`,
                          { color: textColors.secondary },
                        ]}
                      >
                        {isUnlocked
                          ? t('achievements.unlockedAt', { count: requiredCompletions })
                          : t('achievements.requiresCompletions', {
                              count: requiredCompletions,
                            })}
                      </Text>

                      {!isUnlocked && (
                        <>
                          {/* Barre de progression avec gradient du tier */}
                          <View
                            style={tw`mt-3 bg-white/50 rounded-full h-2.5 overflow-hidden`}
                          >
                            <LinearGradient
                              colors={tierGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={[tw`h-full rounded-full`, { width: `${progress}%` }]}
                            />
                          </View>
                          <Text
                            style={[
                              tw`text-xs text-center mt-2 font-medium`,
                              { color: isDarkTier ? 'rgba(255, 255, 255, 0.8)' : '#78716C' },
                            ]}
                          >
                            {t('achievements.moreNeeded', {
                              count: remaining,
                              percent: Math.round(progress),
                            })}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </ImageBackground>

                  {/* Bouton d'action avec gradient du tier */}
                  <Pressable
                    onPress={onClose}
                    style={({ pressed }) => [
                      tw`overflow-hidden rounded-2xl`,
                      pressed && tw`scale-95`,
                    ]}
                  >
                    <LinearGradient
                      colors={isUnlocked ? tierGradient : lockedButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={tw`py-3.5`}
                    >
                      <Text style={tw`font-bold text-center text-base text-white`}>
                        {isUnlocked
                          ? t('achievements.awesome')
                          : t('achievements.keepGoing')}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};
