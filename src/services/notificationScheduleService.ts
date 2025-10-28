// src/services/notificationScheduleService.ts
import { supabase } from '../lib/supabase';

export class NotificationScheduleService {
  /**
   * Schedule a habit notification (stored in DB, sent by backend)
   * Intelligently sets last_sent_at if time already passed today
   */
  static async scheduleHabitNotification(
    habitId: string,
    userId: string,
    notificationTime: string, // Format: "14:20:00" in LOCAL time
    enabled: boolean = true
  ): Promise<void> {
    try {
      // Convert local time to UTC
      const utcTime = this.convertLocalTimeToUTC(notificationTime);

      console.log(`📅 Converting time: ${notificationTime} (local) → ${utcTime} (UTC)`);

      // ✅ SMART LOGIC: Check if notification time has already passed today
      const now = new Date();
      const [hours, minutes, seconds] = notificationTime.split(':').map(Number);
      const scheduledTimeToday = new Date();
      scheduledTimeToday.setHours(hours, minutes, seconds || 0, 0);

      const hasPassedToday = scheduledTimeToday <= now;

      // If time has passed, set last_sent_at to today to prevent immediate sending
      const last_sent_at = hasPassedToday ? now.toISOString() : null;

      console.log(hasPassedToday ? `⏰ Time ${notificationTime} already passed today - marking as sent` : `⏰ Time ${notificationTime} hasn't passed yet - will send today`);

      const { error } = await supabase.from('notification_schedules').upsert(
        {
          user_id: userId,
          habit_id: habitId,
          notification_time: utcTime, // Store as UTC
          enabled: enabled,
          last_sent_at: last_sent_at, // ✅ Set if time passed
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,habit_id',
        }
      );

      if (error) throw error;

      console.log(`✅ Notification scheduled for ${utcTime} UTC (${notificationTime} local)${hasPassedToday ? ' - will send tomorrow' : ' - will send today'}`);
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Convert local time to UTC time
   * Example: "14:20:00" in France (UTC+1) → "13:20:00" UTC
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
   * Convert UTC time to local time for display
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

  // ... rest of your methods stay the same

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

      console.log(`✅ Notification ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling notification:', error);
      throw error;
    }
  }

  static async updateNotificationTime(habitId: string, userId: string, newTime: string): Promise<void> {
    try {
      // Convert to UTC before saving
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

      console.log(`✅ Notification time updated to ${utcTime} UTC`);
    } catch (error) {
      console.error('❌ Error updating notification time:', error);
      throw error;
    }
  }

  static async cancelNotification(habitId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('notification_schedules').delete().eq('user_id', userId).eq('habit_id', habitId);

      if (error) throw error;

      console.log('✅ Notification canceled');
    } catch (error) {
      console.error('❌ Error canceling notification:', error);
      throw error;
    }
  }

  static async getUserSchedules(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notification_schedules')
        .select(
          `
          *,
          habits (
            id,
            name,
            type,
            current_streak
          )
        `
        )
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) throw error;

      // Convert UTC times back to local for display
      const schedulesWithLocalTime = (data || []).map((schedule) => ({
        ...schedule,
        notification_time_local: this.convertUTCToLocalTime(schedule.notification_time),
      }));

      return schedulesWithLocalTime;
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
      return [];
    }
  }
}
