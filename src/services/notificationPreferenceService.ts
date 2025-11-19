/**
 * Service de gestion des preferences de notification
 *
 * Ce service gere les preferences globales de notification de l'utilisateur.
 * Il coordonne entre les parametres globaux et les notifications par habitude,
 * incluant la gestion des permissions systeme.
 *
 * @module NotificationPreferencesService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import * as Notifications from 'expo-notifications';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

// =============================================================================
// IMPORTS - Services internes
// =============================================================================
import { NotificationService } from './notificationService';
import { HabitService } from './habitService';
import { NotificationScheduleService } from './notificationScheduleService';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Preferences de notification de l'utilisateur
 */
export interface NotificationPreferences {
  globalEnabled: boolean;
  lastPermissionRequest?: string;
  permissionStatus?: 'granted' | 'denied' | 'undetermined';
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des preferences de notification
 *
 * Gere la coordination entre les parametres globaux et les notifications par habitude
 */
export class NotificationPreferencesService {
  // ===========================================================================
  // SECTION: Recuperation des preferences
  // ===========================================================================

  /**
   * Recuperer les preferences de notification depuis le profil utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les preferences de notification
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          globalEnabled: false,
          permissionStatus: 'undetermined',
        };
      }

      return (
        data.notification_preferences || {
          globalEnabled: false,
          permissionStatus: 'undetermined',
        }
      );
    } catch (error) {
      Logger.error('Error fetching notification preferences:', error);
      return {
        globalEnabled: false,
        permissionStatus: 'undetermined',
      };
    }
  }

  /**
   * Mettre a jour les preferences de notification
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param preferences - Les nouvelles preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const current = await this.getPreferences(userId);
      const updated = { ...current, ...preferences };

      const { error } = await supabase
        .from('profiles')
        .update({
          notification_preferences: updated,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // ===========================================================================
  // SECTION: Verification des permissions
  // ===========================================================================

  /**
   * Verifier le statut actuel des permissions systeme
   *
   * @returns Le statut des permissions
   */
  static async checkPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }

  // ===========================================================================
  // SECTION: Activation/Desactivation des notifications
  // ===========================================================================

  /**
   * Activer les notifications globales
   * 1. Demande les permissions si necessaire
   * 2. Met a jour les preferences en base
   * 3. Replanifie toutes les notifications d'habitudes
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resultat de l'operation
   */
  static async enableNotifications(userId: string): Promise<{
    success: boolean;
    permissionGranted: boolean;
    needsSettings?: boolean;
  }> {
    try {
      const currentStatus = await this.checkPermissionStatus();

      if (currentStatus === 'denied') {
        return {
          success: false,
          permissionGranted: false,
          needsSettings: true,
        };
      }

      const permissionGranted = await NotificationService.registerForPushNotifications();

      if (!permissionGranted) {
        await this.updatePreferences(userId, {
          globalEnabled: false,
          permissionStatus: 'denied',
          lastPermissionRequest: new Date().toISOString(),
        });

        return {
          success: false,
          permissionGranted: false,
          needsSettings: true,
        };
      }

      await this.updatePreferences(userId, {
        globalEnabled: true,
        permissionStatus: 'granted',
        lastPermissionRequest: new Date().toISOString(),
      });

      await this.rescheduleAllNotifications(userId);

      return {
        success: true,
        permissionGranted: true,
      };
    } catch (error) {
      Logger.error('Error enabling notifications:', error);
      return {
        success: false,
        permissionGranted: false,
      };
    }
  }

  /**
   * Desactiver les notifications globales
   * 1. Annule toutes les notifications planifiees
   * 2. Met a jour les preferences en base
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  static async disableNotifications(userId: string): Promise<void> {
    try {
      await NotificationService.cancelAllNotifications();

      await this.updatePreferences(userId, {
        globalEnabled: false,
      });

      Logger.debug('Global notifications disabled successfully');
    } catch (error) {
      Logger.error('Error disabling notifications:', error);
      throw error;
    }
  }

  /**
   * Replanifier toutes les notifications pour les habitudes avec notifications activees
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  private static async rescheduleAllNotifications(userId: string): Promise<void> {
    try {
      const habits = await HabitService.fetchHabits(userId);

      for (const habit of habits) {
        if (habit.notifications && habit.notificationTime) {
          const timeWithSeconds = habit.notificationTime.includes(':00:')
            ? habit.notificationTime
            : `${habit.notificationTime}:00`;

          await NotificationScheduleService.scheduleHabitNotification(
            habit.id,
            userId,
            timeWithSeconds,
            true
          );
        }
      }

      Logger.debug(`Re-scheduled ${habits.filter((h) => h.notifications).length} habits in database`);
    } catch (error) {
      Logger.error('Error re-scheduling notifications:', error);
      throw error;
    }
  }

  // ===========================================================================
  // SECTION: Gestion de la premiere habitude
  // ===========================================================================

  /**
   * Gerer la creation de la premiere habitude et demander les permissions
   * A appeler APRES la creation d'une nouvelle habitude
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resultat de l'operation
   */
  static async handleFirstHabitCreation(userId: string): Promise<{
    isFirstHabit: boolean;
    permissionRequested: boolean;
    permissionGranted: boolean;
  }> {
    try {
      const habits = await HabitService.fetchHabits(userId);
      const isFirstHabit = habits.length === 1;

      if (!isFirstHabit) {
        return {
          isFirstHabit: false,
          permissionRequested: false,
          permissionGranted: false,
        };
      }

      const prefs = await this.getPreferences(userId);

      if (prefs.permissionStatus === 'granted' || prefs.permissionStatus === 'denied') {
        return {
          isFirstHabit: true,
          permissionRequested: false,
          permissionGranted: prefs.permissionStatus === 'granted',
        };
      }

      const permissionGranted = await NotificationService.registerForPushNotifications();

      try {
        await this.updatePreferences(userId, {
          globalEnabled: permissionGranted,
          permissionStatus: permissionGranted ? 'granted' : 'denied',
          lastPermissionRequest: new Date().toISOString(),
        });
      } catch (updateError) {
        Logger.error('Error updating notification preferences:', updateError);
      }

      return {
        isFirstHabit: true,
        permissionRequested: true,
        permissionGranted,
      };
    } catch (error) {
      Logger.error('Error handling first habit creation:', error);
      return {
        isFirstHabit: false,
        permissionRequested: false,
        permissionGranted: false,
      };
    }
  }

  // ===========================================================================
  // SECTION: Verification du statut
  // ===========================================================================

  /**
   * Verifier si les notifications globales sont activees
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si les notifications sont activees
   */
  static async areNotificationsEnabled(userId: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);
      const systemStatus = await this.checkPermissionStatus();

      return prefs.globalEnabled && systemStatus === 'granted';
    } catch (error) {
      Logger.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Obtenir un resume du statut des notifications pour le debug
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resume du statut
   */
  static async getNotificationStatus(userId: string): Promise<{
    globalEnabled: boolean;
    systemPermission: 'granted' | 'denied' | 'undetermined';
    scheduledCount: number;
  }> {
    try {
      const prefs = await this.getPreferences(userId);
      const systemPermission = await this.checkPermissionStatus();
      const scheduled = await NotificationService.getScheduledNotifications();

      return {
        globalEnabled: prefs.globalEnabled,
        systemPermission,
        scheduledCount: scheduled.length,
      };
    } catch (error) {
      Logger.error('Error getting notification status:', error);
      return {
        globalEnabled: false,
        systemPermission: 'undetermined',
        scheduledCount: 0,
      };
    }
  }
}
