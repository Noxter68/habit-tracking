import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types';
import { NotificationMessages } from '../utils/notificationMessages';
import { supabase } from '../lib/supabase';
import { getLocalDateString } from '../utils/dateHelpers';

interface TaskInfo {
  id: string;
  name: string;
  isCompleted: boolean;
}

/**
 * Enhanced notification service with dynamic content generation
 * Checks task completion status at notification time and adjusts message
 */
export class NotificationService {
  // ========== INITIALIZATION ==========

  static async initialize() {
    const registered = await this.registerForPushNotifications();

    if (registered) {
      await this.setupNotificationCategories();
      this.setupNotificationHandler();
      this.setupNotificationResponseListener();
    }

    return registered;
  }

  static async registerForPushNotifications(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14b8a6',
        sound: 'true',
      });
    }

    return true;
  }

  private static async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('habit_reminder', [
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 2h',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'complete',
        buttonTitle: 'Done',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('daily_chest', [
      {
        identifier: 'collect',
        buttonTitle: 'Collect XP',
        options: { opensAppToForeground: true },
      },
    ]);

    await Notifications.setNotificationCategoryAsync('streak_risk', [
      {
        identifier: 'complete_now',
        buttonTitle: 'Complete Now',
        options: { opensAppToForeground: true },
      },
    ]);
  }

  private static setupNotificationHandler() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  private static setupNotificationResponseListener() {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { notification, actionIdentifier } = response;
      const habitId = notification.request.content.data.habitId as string;
      const habitName = notification.request.content.title;

      if (actionIdentifier === 'snooze') {
        await this.snoozeNotification(habitId, habitName);
      }
      // Handle other actions as needed
    });
  }

  // ========== SMART HABIT NOTIFICATIONS ==========

  /**
   * Schedule notifications that dynamically check task completion
   * This is the main method to replace NotificationService.scheduleHabitNotifications
   */
  static async scheduleSmartHabitNotifications(habit: Habit, userId: string) {
    if (!habit.notifications || !habit.notificationTime) {
      return;
    }

    await this.cancelHabitNotifications(habit.id);
    const [hours, minutes] = habit.notificationTime.split(':').map(Number);

    if (habit.frequency === 'daily') {
      await this.scheduleDailySmartNotification(habit, userId, hours, minutes);
    } else if (habit.frequency === 'custom' && habit.customDays) {
      await this.scheduleCustomDaysSmartNotifications(habit, userId, hours, minutes);
    }
  }

  private static async scheduleDailySmartNotification(habit: Habit, userId: string, hours: number, minutes: number) {
    // Note: React Native doesn't support dynamic content at trigger time
    // We schedule with a generic message and handle dynamic updates via foreground notifications
    // For a production solution, consider using a background task or server-side push

    const message = NotificationMessages.habitReminder({
      habitName: habit.name,
      incompleteTasks: habit.tasks.map((t: any) => t.name || t),
      totalTasks: habit.tasks.length,
      currentStreak: habit.currentStreak,
      type: habit.type,
    });

    await Notifications.scheduleNotificationAsync({
      identifier: habit.id,
      content: {
        title: message.title,
        body: message.body,
        data: {
          habitId: habit.id,
          userId: userId,
          isDynamic: true, // Flag to regenerate message on foreground
        },
        sound: true,
        categoryIdentifier: 'habit_reminder',
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
        channelId: 'habits',
      },
    });
  }

  private static async scheduleCustomDaysSmartNotifications(habit: Habit, userId: string, hours: number, minutes: number) {
    const dayMap: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const now = new Date();

    for (const day of habit.customDays!) {
      const targetDayOfWeek = dayMap[day];
      if (targetDayOfWeek === undefined) continue;

      // Calculate next occurrence of this day of week
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      const currentDayOfWeek = now.getDay();
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

      // If target day is today but time has passed, or target day is in the past this week
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && scheduledTime <= now)) {
        daysUntilTarget += 7; // Schedule for next week
      }

      scheduledTime.setDate(now.getDate() + daysUntilTarget);

      const message = NotificationMessages.habitReminder({
        habitName: habit.name,
        incompleteTasks: habit.tasks.map((t: any) => t.name || t),
        totalTasks: habit.tasks.length,
        currentStreak: habit.currentStreak,
        type: habit.type,
      });

      console.log(`📅 Scheduling ${day} notification for ${habit.name} at ${scheduledTime.toLocaleString()}`);

      await Notifications.scheduleNotificationAsync({
        identifier: `${habit.id}_${day}`,
        content: {
          title: message.title,
          body: message.body,
          data: {
            habitId: habit.id,
            userId: userId,
            isDynamic: true,
          },
          sound: true,
          categoryIdentifier: 'habit_reminder',
        },
        trigger: {
          weekday: targetDayOfWeek + 1, // Expo uses 1-7 (Sunday = 1)
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: 'habits',
        },
      });
    }
  }
  /**
   * Generate dynamic notification content based on current task status
   * Call this when app is in foreground to update notification content
   */
  static async generateDynamicNotification(habitId: string, userId: string): Promise<void> {
    try {
      // Fetch habit details
      const { data: habitData, error: habitError } = await supabase.from('habits').select('*').eq('id', habitId).eq('user_id', userId).single();

      if (habitError || !habitData) {
        console.error('Error fetching habit:', habitError);
        return;
      }

      // Fetch today's task completion
      const today = getLocalDateString(new Date());
      const { data: completionData } = await supabase.from('task_completions').select('completed_tasks').eq('habit_id', habitId).eq('user_id', userId).eq('date', today).single();

      const completedTaskIds = completionData?.completed_tasks || [];
      const allTasks = habitData.tasks || [];

      // Determine incomplete tasks
      const incompleteTasks = allTasks.filter((taskId: string) => !completedTaskIds.includes(taskId));

      // Generate smart message
      const message = NotificationMessages.habitReminder({
        habitName: habitData.name,
        incompleteTasks: incompleteTasks,
        totalTasks: allTasks.length,
        currentStreak: habitData.current_streak,
        type: habitData.type,
      });

      // Send immediate notification with updated content
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { habitId, userId },
          sound: true,
          categoryIdentifier: 'habit_reminder',
        },
        trigger: null, // Immediate delivery
      });
    } catch (error) {
      console.error('Error generating dynamic notification:', error);
    }
  }

  // ========== DAILY CHEST NOTIFICATIONS ==========

  static async scheduleDailyChestReminder(userId: string, xpAvailable: number, hour: number = 20) {
    const message = NotificationMessages.dailyChestReminder({ xpAvailable });

    await Notifications.scheduleNotificationAsync({
      identifier: `daily_chest_${userId}`,
      content: {
        title: message.title,
        body: message.body,
        data: { type: 'daily_chest', userId },
        sound: true,
        categoryIdentifier: 'daily_chest',
      },
      trigger: {
        hour: hour,
        minute: 0,
        repeats: true,
        channelId: 'habits',
      },
    });
  }

  static async cancelDailyChestReminder(userId: string) {
    await Notifications.cancelScheduledNotificationAsync(`daily_chest_${userId}`);
  }

  // ========== STREAK RISK NOTIFICATIONS ==========

  static async sendStreakRiskNotification(habitId: string, habitName: string, streakCount: number, hoursRemaining: number) {
    const message = NotificationMessages.streakRisk({
      habitName,
      streakCount,
      hoursRemaining,
    });

    await Notifications.scheduleNotificationAsync({
      identifier: `streak_risk_${habitId}_${Date.now()}`,
      content: {
        title: message.title,
        body: message.body,
        data: { type: 'streak_risk', habitId },
        sound: true,
        categoryIdentifier: 'streak_risk',
      },
      trigger: null, // Immediate
    });
  }

  // ========== SNOOZE FUNCTIONALITY ==========

  private static async snoozeNotification(habitId: string, habitName?: string) {
    try {
      const triggerDate = new Date();
      triggerDate.setHours(triggerDate.getHours() + 2);

      await Notifications.scheduleNotificationAsync({
        identifier: `${habitId}_snoozed_${Date.now()}`,
        content: {
          title: habitName || 'Habit Reminder',
          body: 'Reminder: Time to check in on your habit.',
          data: { habitId, snoozed: true },
          sound: true,
          categoryIdentifier: 'habit_reminder',
        },
        trigger: {
          date: triggerDate,
          channelId: 'habits',
        },
      });

      console.log(`Snoozed until ${triggerDate.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error snoozing notification:', error);
    }
  }

  // ========== UTILITY METHODS ==========

  static async cancelHabitNotifications(habitId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(habitId);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        try {
          await Notifications.cancelScheduledNotificationAsync(`${habitId}_${day}`);
        } catch (e) {
          // Ignore if doesn't exist
        }
      }

      // Cancel snoozed notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.identifier.startsWith(`${habitId}_snoozed_`)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async updateHabitNotificationTime(habit: Habit, userId: string, newTime: string) {
    await this.cancelHabitNotifications(habit.id);
    const updatedHabit = { ...habit, notificationTime: newTime };
    await this.scheduleSmartHabitNotifications(updatedHabit, userId);
  }

  static async sendTestNotification() {
    const permission = await this.registerForPushNotifications();
    if (!permission) {
      throw new Error('Notification permissions not granted');
    }

    const message = NotificationMessages.habitReminder({
      habitName: 'Test Habit',
      incompleteTasks: ['Task 1', 'Task 2'],
      totalTasks: 3,
      currentStreak: 5,
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: true,
        categoryIdentifier: 'habit_reminder',
        data: { habitId: 'test' },
      },
      trigger: {
        seconds: 2,
        channelId: 'habits',
      },
    });
  }
}
