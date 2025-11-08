// services/notificationBadgeService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

class NotificationBadgeService {
  /**
   * Réinitialise le badge de notification à 0
   */
  async clearBadge(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(0);
      } else if (Platform.OS === 'android') {
        await Notifications.dismissAllNotificationsAsync();
      }
    } catch (error) {
      console.error('Error clearing notification badge:', error);
    }
  }

  /**
   * Définit le badge à un nombre spécifique (iOS uniquement)
   */
  async setBadge(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting notification badge:', error);
    }
  }

  /**
   * Récupère le nombre actuel de badges (iOS uniquement)
   */
  async getBadgeCount(): Promise<number> {
    try {
      if (Platform.OS === 'ios') {
        return await Notifications.getBadgeCountAsync();
      }
      return 0;
    } catch (error) {
      console.error('Error getting notification badge:', error);
      return 0;
    }
  }

  /**
   * Efface toutes les notifications et réinitialise le badge
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.clearBadge();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }
}

export default new NotificationBadgeService();
