/**
 * Service de planification des notifications
 *
 * Ce service gere la planification des notifications dans la base de donnees.
 * Les notifications sont envoyees par le backend a l'heure specifiee.
 * Il inclut la conversion locale/UTC et la logique intelligente pour eviter
 * les envois immediats.
 *
 * @module NotificationScheduleService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de planification des notifications
 *
 * Gere la persistance et la conversion des horaires de notification
 */
export class NotificationScheduleService {
  // ===========================================================================
  // SECTION: Planification des notifications
  // ===========================================================================

  /**
   * Planifier une notification d'habitude (stockee en DB, envoyee par le backend)
   * Definit intelligemment last_sent_at si l'heure est deja passee aujourd'hui
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param notificationTime - L'heure en format "HH:MM:SS" en heure LOCALE
   * @param enabled - Si la notification est activee
   */
  static async scheduleHabitNotification(
    habitId: string,
    userId: string,
    notificationTime: string,
    enabled: boolean = true
  ): Promise<void> {
    try {
      const utcTime = this.convertLocalTimeToUTC(notificationTime);

      Logger.debug(`Converting time: ${notificationTime} (local) to ${utcTime} (UTC)`);

      const now = new Date();
      const [hours, minutes, seconds] = notificationTime.split(':').map(Number);
      const scheduledTimeToday = new Date();
      scheduledTimeToday.setHours(hours, minutes, seconds || 0, 0);

      const hasPassedToday = scheduledTimeToday <= now;
      const last_sent_at = hasPassedToday ? now.toISOString() : null;

      Logger.debug(
        hasPassedToday
          ? `Time ${notificationTime} already passed today - marking as sent`
          : `Time ${notificationTime} hasn't passed yet - will send today`
      );

      const { error } = await supabase.from('notification_schedules').upsert(
        {
          user_id: userId,
          habit_id: habitId,
          notification_time: utcTime,
          enabled: enabled,
          last_sent_at: last_sent_at,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,habit_id',
        }
      );

      if (error) throw error;

      Logger.debug(
        `Notification scheduled for ${utcTime} UTC (${notificationTime} local)${
          hasPassedToday ? ' - will send tomorrow' : ' - will send today'
        }`
      );
    } catch (error) {
      Logger.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // ===========================================================================
  // SECTION: Conversion de temps
  // ===========================================================================

  /**
   * Convertir l'heure locale en heure UTC
   * Exemple: "14:20:00" en France (UTC+1) devient "13:20:00" UTC
   *
   * @param localTime - L'heure locale en format "HH:MM:SS"
   * @returns L'heure UTC en format "HH:MM:SS"
   */
  private static convertLocalTimeToUTC(localTime: string): string {
    const [hours, minutes, seconds] = localTime.split(':').map(Number);
    const localDate = new Date();
    localDate.setHours(hours, minutes, seconds || 0, 0);

    const utcHours = localDate.getUTCHours();
    const utcMinutes = localDate.getUTCMinutes();
    const utcSeconds = localDate.getUTCSeconds();

    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}:${utcSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Convertir l'heure UTC en heure locale pour l'affichage
   *
   * @param utcTime - L'heure UTC en format "HH:MM:SS"
   * @returns L'heure locale en format "HH:MM:SS"
   */
  static convertUTCToLocalTime(utcTime: string): string {
    const [hours, minutes, seconds] = utcTime.split(':').map(Number);
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, seconds || 0, 0);

    const localHours = utcDate.getHours();
    const localMinutes = utcDate.getMinutes();
    const localSeconds = utcDate.getSeconds();

    return `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}:${localSeconds.toString().padStart(2, '0')}`;
  }

  // ===========================================================================
  // SECTION: Gestion des notifications
  // ===========================================================================

  /**
   * Activer ou desactiver une notification
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param enabled - L'etat d'activation
   */
  static async toggleNotification(habitId: string, userId: string, enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_schedules')
        .update({
          enabled: enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('habit_id', habitId);

      if (error) throw error;

      Logger.debug(`Notification ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      Logger.error('Error toggling notification:', error);
      throw error;
    }
  }

  /**
   * Mettre a jour l'heure de notification
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param newTime - La nouvelle heure en format local
   */
  static async updateNotificationTime(habitId: string, userId: string, newTime: string): Promise<void> {
    try {
      const utcTime = this.convertLocalTimeToUTC(newTime);

      const { error } = await supabase
        .from('notification_schedules')
        .update({
          notification_time: utcTime,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('habit_id', habitId);

      if (error) throw error;

      Logger.debug(`Notification time updated to ${utcTime} UTC`);
    } catch (error) {
      Logger.error('Error updating notification time:', error);
      throw error;
    }
  }

  /**
   * Annuler une notification
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   */
  static async cancelNotification(habitId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_schedules')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', habitId);

      if (error) throw error;

      Logger.debug('Notification canceled');
    } catch (error) {
      Logger.error('Error canceling notification:', error);
      throw error;
    }
  }

  /**
   * Recuperer les planifications d'un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les planifications avec les heures locales
   */
  static async getUserSchedules(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_schedules')
        .select(`
          *,
          habits (
            id,
            name,
            type,
            current_streak
          )
        `)
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) throw error;

      const schedulesWithLocalTime = (data || []).map((schedule) => ({
        ...schedule,
        notification_time_local: this.convertUTCToLocalTime(schedule.notification_time),
      }));

      return schedulesWithLocalTime;
    } catch (error) {
      Logger.error('Error fetching schedules:', error);
      return [];
    }
  }
}
