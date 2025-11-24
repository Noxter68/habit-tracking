/**
 * SwipeableHabitCard.tsx
 *
 * Carte d'habitude avec gestion du swipe pour suppression.
 * Utilise PanGestureHandler pour les interactions gestuelles.
 *
 * @author HabitTracker Team
 */

// =============================================================================
// IMPORTS
// =============================================================================

// React et React Native
import React, { useRef } from 'react';
import { View, Alert, Animated as RNAnimated, Dimensions } from 'react-native';

// Bibliothèques externes
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

// Composants internes
import { HabitCard } from './habits/HabitCard';

// Utilitaires
import tw from '../lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';
import { getTodayString } from '@/utils/dateHelpers';

// Types
import { Habit } from '../types';

// =============================================================================
// CONSTANTES
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Seuil de swipe pour déclencher la suppression (25% de la largeur) */
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

interface SwipeableHabitCardProps {
  habit: Habit;
  onDelete: (habitId: string) => void;
  onToggleDay?: (habitId: string, date: string) => void;
  onToggleTask?: (habitId: string, date: string, taskId: string) => void;
  onPress?: () => void;
  index?: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  /** Nombre de milestones debloques pour afficher l'icone du palier */
  unlockedMilestonesCount?: number;
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Retourne le nom traduit de l'habitude
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }
  return habit.name;
};

// =============================================================================
// COMPOSANT PRINCIPAL
// =============================================================================

const SwipeableHabitCard: React.FC<SwipeableHabitCardProps> = ({
  habit,
  onDelete,
  onPress,
  index = 0,
  pausedTasks = {},
  unlockedMilestonesCount = 0,
}) => {
  // ---------------------------------------------------------------------------
  // Hooks
  // ---------------------------------------------------------------------------
  const { t } = useTranslation();

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const translateX = useRef(new RNAnimated.Value(0)).current;

  // ---------------------------------------------------------------------------
  // Valeurs calculées
  // ---------------------------------------------------------------------------
  const today = getTodayString();
  const todayTasks = habit.dailyTasks?.[today];
  const completedToday = todayTasks?.allCompleted || false;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  /**
   * Gère l'événement de geste pan
   * Limite le swipe uniquement vers la gauche (valeurs négatives)
   */
  const handleGestureEvent = (event: any) => {
    const { translationX: translation } = event.nativeEvent;
    // Only allow left swipe (negative values), block right swipe
    if (translation <= 0) {
      translateX.setValue(translation);
    } else {
      translateX.setValue(0);
    }
  };

  /**
   * Gère le changement d'état du geste
   * Affiche une alerte de confirmation si le seuil est atteint
   */
  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: translation } = event.nativeEvent;

      if (translation < SWIPE_THRESHOLD) {
        HapticFeedback.medium();

        Alert.alert(
          t('dashboard.removeHabit'),
          t('dashboard.removeHabitConfirm', {
            name: getTranslatedHabitName(habit, t),
            streak: habit.currentStreak,
          }),
          [
            {
              text: t('habits.keepHabit'),
              onPress: () => {
                HapticFeedback.light();
                RNAnimated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 40,
                  friction: 8,
                }).start();
              },
              style: 'cancel',
            },
            {
              text: t('common.delete'),
              onPress: () => {
                HapticFeedback.medium();
                RNAnimated.timing(translateX, {
                  toValue: -SCREEN_WIDTH,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  onDelete(habit.id);
                });
              },
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
      } else {
        // Retour à la position initiale
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      }
    }
  };

  /**
   * Gère le press sur la carte
   */
  const handlePress = onPress
    ? () => {
        HapticFeedback.light();
        onPress();
      }
    : undefined;

  // ---------------------------------------------------------------------------
  // Valeurs animées
  // ---------------------------------------------------------------------------

  /** Opacité du fond de suppression */
  const deleteOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------
  return (
    <View style={tw`relative`}>
      {/* Fond de suppression */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 justify-center items-end pr-6 rounded-3xl overflow-hidden`,
          { opacity: deleteOpacity },
        ]}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`absolute inset-0`}
        />
        <View style={tw`bg-white/20 rounded-xl p-3`}>
          <Trash2 size={24} color="#ffffff" />
        </View>
      </RNAnimated.View>

      {/* Carte d'habitude swipeable */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 1000]}
        failOffsetY={[-5, 5]}
      >
        <RNAnimated.View
          style={[
            { transform: [{ translateX }] },
            tw`bg-transparent rounded-3xl`,
          ]}
        >
          <HabitCard
            habit={habit}
            completedToday={completedToday}
            onPress={handlePress}
            index={index}
            pausedTasks={pausedTasks}
            unlockedMilestonesCount={unlockedMilestonesCount}
          />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableHabitCard;
