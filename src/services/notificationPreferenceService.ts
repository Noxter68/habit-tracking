// src/services/notificationPreferencesService.ts
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { NotificationService } from './notificationService';
import { HabitService } from './habitService';
import { NotificationScheduleService } from './notificationScheduleService';

export interface NotificationPreferences {
  globalEnabled: boolean;
  lastPermissionRequest?: string;
  permissionStatus?: 'granted' | 'denied' | 'undetermined';
}

/**
 * Service to manage global notification preferences
 * Handles the coordination between global settings and per-habit notifications
 */
export class NotificationPreferencesService {
  private static readonly STORAGE_KEY = 'notification_preferences';

  /**
   * Get current notification preferences from user profile
   */
  static async getPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase.from('profiles').select('notification_preferences').eq('id', userId).single();

      if (error) throw error;

      return (
        data?.notification_preferences || {
          globalEnabled: false,
          permissionStatus: 'undetermined',
        }
      );
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return {
        globalEnabled: false,
        permissionStatus: 'undetermined',
      };
    }
  }

  /**
   * Update notification preferences in database
   */
  static async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
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
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Check current system permission status
   */
  static async checkPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const { status } = await Notifications.getPermissionsAsync();

    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }

  /**
   * Enable global notifications
   * This will:
   * 1. Request permissions if needed
   * 2. Update preference in database
   * 3. Re-schedule all enabled habit notifications
   */
  static async enableNotifications(userId: string): Promise<{
    success: boolean;
    permissionGranted: boolean;
    needsSettings?: boolean;
  }> {
    try {
      // Check if permission was previously denied
      const currentStatus = await this.checkPermissionStatus();

      if (currentStatus === 'denied') {
        // Permission was explicitly denied - user needs to go to settings
        return {
          success: false,
          permissionGranted: false,
          needsSettings: true,
        };
      }

      // Request permission
      const permissionGranted = await NotificationService.registerForPushNotifications();

      if (!permissionGranted) {
        // User denied permission in the prompt
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

      // Update preferences
      await this.updatePreferences(userId, {
        globalEnabled: true,
        permissionStatus: 'granted',
        lastPermissionRequest: new Date().toISOString(),
      });

      // Re-schedule all habit notifications that have notifications enabled
      await this.rescheduleAllNotifications(userId);

      return {
        success: true,
        permissionGranted: true,
      };
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return {
        success: false,
        permissionGranted: false,
      };
    }
  }

  /**
   * Disable global notifications
   * This will:
   * 1. Cancel all scheduled notifications
   * 2. Update preference in database
   */
  static async disableNotifications(userId: string): Promise<void> {
    try {
      // Cancel all scheduled notifications
      await NotificationService.cancelAllNotifications();

      // Update preferences
      await this.updatePreferences(userId, {
        globalEnabled: false,
      });

      console.log('Global notifications disabled successfully');
    } catch (error) {
      console.error('Error disabling notifications:', error);
      throw error;
    }
  }

  /**
   * Re-schedule all notifications for habits that have notifications enabled
   */
  private static async rescheduleAllNotifications(userId: string): Promise<void> {
    try {
      const habits = await HabitService.fetchHabits(userId);

      for (const habit of habits) {
        if (habit.notifications && habit.notificationTime) {
          // ❌ REMOVE LOCAL SCHEDULING
          // await NotificationService.scheduleSmartHabitNotifications(habit, userId);

          // ✅ ONLY update database
          const timeWithSeconds = habit.notificationTime.includes(':00:') ? habit.notificationTime : `${habit.notificationTime}:00`;

          await NotificationScheduleService.scheduleHabitNotification(habit.id, userId, timeWithSeconds, true);
        }
      }

      console.log(`Re-scheduled ${habits.filter((h) => h.notifications).length} habits in database`);
    } catch (error) {
      console.error('Error re-scheduling notifications:', error);
      throw error;
    }
  }

  /**
   * Check if this is the user's first habit and request permissions
   * Should be called AFTER creating a new habit
   */
  static async handleFirstHabitCreation(userId: string): Promise<{
    isFirstHabit: boolean;
    permissionRequested: boolean;
    permissionGranted: boolean;
  }> {
    try {
      // Check if user has any existing habits
      const habits = await HabitService.fetchHabits(userId);
      const isFirstHabit = habits.length === 1; // ✅ Changed from === 0 to === 1

      if (!isFirstHabit) {
        return {
          isFirstHabit: false,
          permissionRequested: false,
          permissionGranted: false,
        };
      }

      // Check if we've already requested permission
      const prefs = await this.getPreferences(userId);

      // Don't request again if we already have permission or were denied
      if (prefs.permissionStatus === 'granted' || prefs.permissionStatus === 'denied') {
        return {
          isFirstHabit: true,
          permissionRequested: false,
          permissionGranted: prefs.permissionStatus === 'granted',
        };
      }

      // Request permission for first habit
      const permissionGranted = await NotificationService.registerForPushNotifications();

      // Update preferences with proper error handling
      try {
        await this.updatePreferences(userId, {
          globalEnabled: permissionGranted,
          permissionStatus: permissionGranted ? 'granted' : 'denied',
          lastPermissionRequest: new Date().toISOString(),
        });
      } catch (updateError) {
        console.error('Error updating notification preferences:', updateError);
        // Don't throw - the habit was created successfully
      }

      return {
        isFirstHabit: true,
        permissionRequested: true,
        permissionGranted,
      };
    } catch (error) {
      console.error('Error handling first habit creation:', error);
      // Return safe defaults instead of throwing
      return {
        isFirstHabit: false,
        permissionRequested: false,
        permissionGranted: false,
      };
    }
  }

  /**
   * Check if global notifications are enabled
   */
  static async areNotificationsEnabled(userId: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);
      const systemStatus = await this.checkPermissionStatus();

      // Both global preference and system permission must be enabled
      return prefs.globalEnabled && systemStatus === 'granted';
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  /**
   * Get a summary of notification status for debugging
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
      console.error('Error getting notification status:', error);
      return {
        globalEnabled: false,
        systemPermission: 'undetermined',
        scheduledCount: 0,
      };
    }
  }
}
