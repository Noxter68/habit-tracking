// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habit } from '../types';

export class NotificationService {
  // Register for push notifications
  static async registerForPushNotifications() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14b8a6',
        sound: true,
      });
    }

    return true;
  }

  // Schedule notifications for a habit
  static async scheduleHabitNotifications(habit: Habit) {
    if (!habit.notifications || !habit.notificationTime) {
      return;
    }

    // Cancel existing notifications for this habit
    await this.cancelHabitNotifications(habit.id);

    // Parse time (format: "HH:MM")
    const [hours, minutes] = habit.notificationTime.split(':').map(Number);

    // Schedule based on frequency
    if (habit.frequency === 'daily') {
      await Notifications.scheduleNotificationAsync({
        identifier: habit.id,
        content: {
          title: `🎯 ${habit.name}`,
          body: this.getMotivationalMessage(habit.type),
          data: { habitId: habit.id },
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
    } else if (habit.frequency === 'custom' && habit.customDays) {
      // Schedule for specific days of the week
      const dayMap: { [key: string]: number } = {
        Sunday: 1,
        Monday: 2,
        Tuesday: 3,
        Wednesday: 4,
        Thursday: 5,
        Friday: 6,
        Saturday: 7,
      };

      for (const day of habit.customDays) {
        const weekday = dayMap[day];
        if (weekday) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${habit.id}_${day}`,
            content: {
              title: `🎯 ${habit.name}`,
              body: this.getMotivationalMessage(habit.type),
              data: { habitId: habit.id },
              sound: true,
              categoryIdentifier: 'habit_reminder',
            },
            trigger: {
              weekday,
              hour: hours,
              minute: minutes,
              repeats: true,
              channelId: 'habits',
            },
          });
        }
      }
    }
  }

  // Cancel notifications for a habit
  static async cancelHabitNotifications(habitId: string) {
    try {
      // Cancel main notification
      await Notifications.cancelScheduledNotificationAsync(habitId);

      // Cancel any day-specific notifications
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        try {
          await Notifications.cancelScheduledNotificationAsync(`${habitId}_${day}`);
        } catch (e) {
          // Ignore if notification doesn't exist
        }
      }
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  // Get motivational message based on habit type
  static getMotivationalMessage(type?: string): string {
    const buildMessages = [
      'Time to build your better self! 💪',
      'Your future self will thank you! ⭐',
      'Small steps lead to big changes! 🚀',
      "You've got this! Let's do it! 🎯",
      'Consistency is key! Keep going! 🔑',
    ];

    const quitMessages = [
      'Stay strong! You can resist! 💪',
      'Every moment of resistance counts! ⭐',
      "You're stronger than your cravings! 🛡️",
      'Choose your long-term goals! 🎯',
      "You're doing amazing! Keep it up! 🏆",
    ];

    const messages = type === 'quit' ? quitMessages : buildMessages;
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Get all scheduled notifications
  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel all notifications
  static async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Send test notification
  static async sendTestNotification() {
    const permission = await this.registerForPushNotifications();
    if (!permission) {
      throw new Error('Notification permissions not granted');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Test Notification',
        body: 'Your notifications are working perfectly!',
        sound: true,
        categoryIdentifier: 'test',
      },
      trigger: {
        seconds: 2,
        channelId: 'habits',
      },
    });
  }

  // Update notification time for a habit
  static async updateHabitNotificationTime(habit: Habit, newTime: string) {
    // Cancel existing notifications
    await this.cancelHabitNotifications(habit.id);

    // Schedule new ones with updated time
    const updatedHabit = { ...habit, notificationTime: newTime };
    await this.scheduleHabitNotifications(updatedHabit);
  }
}
