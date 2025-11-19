/**
 * Service de gestion des badges de notification
 *
 * Ce service gere les badges de notification sur l'icone de l'application,
 * permettant de definir, recuperer et effacer le compteur de badges.
 * Supporte les specificites iOS et Android.
 *
 * @module NotificationBadgeService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des badges de notification
 *
 * Gere l'affichage des badges sur l'icone de l'application
 */
class NotificationBadgeService {
  // ===========================================================================
  // SECTION: Gestion des badges
  // ===========================================================================

  /**
   * Reinitialiser le badge de notification a 0
   */
  async clearBadge(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(0);
      } else if (Platform.OS === 'android') {
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch (error) {
      Logger.error('Error clearing notification badge:', error);
    }
  }

  /**
   * Definir le badge a un nombre specifique (iOS uniquement)
   *
   * @param count - Le nombre a afficher sur le badge
   */
  async setBadge(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      Logger.error('Error setting notification badge:', error);
    }
  }

  /**
   * Recuperer le nombre actuel de badges (iOS uniquement)
   *
   * @returns Le nombre de badges actuels
   */
  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await Notifications.getBadgeCountAsync();
      }
      return 0;
    } catch (error) {
      Logger.error('Error getting notification badge:', error);
      return 0;
    }
  }

  /**
   * Effacer toutes les notifications et reinitialiser le badge
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.clearBadge();
    } catch (error) {
      Logger.error('Error clearing all notifications:', error);
    }
  }
}

export default new NotificationBadgeService();
