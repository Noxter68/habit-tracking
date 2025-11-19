/**
 * @file haptics.ts
 * @description Utilitaires centralisés pour le retour haptique.
 * Basé sur les guidelines Apple Human Interface pour une UX cohérente.
 */

import * as Haptics from 'expo-haptics';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Types de feedback haptique disponibles.
 */
type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// =============================================================================
// CONSTANTES - FEEDBACK HAPTIQUE
// =============================================================================

/**
 * Utilitaires de retour haptique pour différents types d'interactions.
 * Chaque méthode correspond à un cas d'usage spécifique selon les guidelines Apple.
 */
export const HapticFeedback = {
  /**
   * Impact léger - Utilisé pour :
   * - Boutons standards
   * - Sélections dans les listes
   * - Switches/toggles
   * - Interactions mineures
   */
  light: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /**
   * Impact moyen - Utilisé pour :
   * - Actions importantes (Déconnexion, Suppression)
   * - Transitions de navigation
   * - Ouverture/fermeture de modales
   * - Changements d'état significatifs
   */
  medium: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /**
   * Impact fort - Utilisé pour :
   * - Actions critiques
   * - Complétion de tâches majeures
   * - Level up
   * - Déblocage d'achievements
   */
  heavy: (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /**
   * Notification de succès - Utilisé pour :
   * - Complétions réussies
   * - Tâches d'habitude complétées
   * - Collection d'XP
   * - Jalons de streak
   */
  success: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /**
   * Notification d'avertissement - Utilisé pour :
   * - Messages de précaution
   * - Avertissements de streak
   * - Limites premium atteintes
   */
  warning: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /**
   * Notification d'erreur - Utilisé pour :
   * - Actions échouées
   * - Erreurs de validation
   * - Erreurs critiques
   */
  error: (): void => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  /**
   * Changement de sélection - Utilisé pour :
   * - Changements de valeur dans les pickers
   * - Changements de contrôle segmenté
   * - Changements d'onglets
   */
  selection: (): void => {
    Haptics.selectionAsync();
  },
};

// =============================================================================
// FONCTIONS - WRAPPERS HAPTIQUES
// =============================================================================

/**
 * Enveloppe un callback avec un feedback haptique.
 * Utile pour ajouter du feedback haptique à n'importe quel composant pressable.
 *
 * @param callback - La fonction à exécuter après le feedback
 * @param feedbackType - Type de feedback haptique (défaut: 'light')
 * @returns Une fonction avec feedback haptique intégré
 *
 * @example
 * <TouchableOpacity onPress={withHaptic(handlePress, 'light')}>
 *   <Text>Appuyer</Text>
 * </TouchableOpacity>
 */
export const withHaptic = (
  callback: () => void,
  feedbackType: HapticFeedbackType = 'light'
): (() => void) => {
  return () => {
    HapticFeedback[feedbackType]();
    callback();
  };
};

/**
 * Version asynchrone de withHaptic pour les callbacks async.
 *
 * @param callback - La fonction async à exécuter après le feedback
 * @param feedbackType - Type de feedback haptique (défaut: 'light')
 * @returns Une fonction async avec feedback haptique intégré
 *
 * @example
 * <TouchableOpacity onPress={withHapticAsync(handleAsyncPress, 'success')}>
 *   <Text>Sauvegarder</Text>
 * </TouchableOpacity>
 */
export const withHapticAsync = (
  callback: () => Promise<void>,
  feedbackType: HapticFeedbackType = 'light'
): (() => Promise<void>) => {
  return async () => {
    HapticFeedback[feedbackType]();
    await callback();
  };
};
