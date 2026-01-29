/**
 * Service de gestion des notifications
 *
 * Ce service gere les notifications push de l'application, incluant
 * les rappels d'habitudes, les alertes de streak a risque, les coffres
 * quotidiens et la fonctionnalite de snooze.
 *
 * @module NotificationService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { supabase } from '../lib/supabase';
import { getLocalDateString } from '../utils/dateHelpers';
import { NotificationMessages } from '../utils/notificationMessages';
import Logger from '@/utils/logger';

// =============================================================================
// IMPORTS - Types
// =============================================================================
import { Habit } from '../types';

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de notification avec generation de contenu dynamique
 * Verifie le statut de completion des taches au moment de la notification
 */
export class NotificationService {
  // ===========================================================================
  // SECTION: Initialisation
  // ===========================================================================

  /**
   * Initialiser le service de notifications
   *
   * @returns Vrai si l'initialisation a reussi
   */
  static async initialize(): Promise<boolean> {
    // Check if permissions already granted (don't request here)
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      await this.setupAfterPermission();
      return true;
    }
    // Still set up handlers so they're ready when permission is granted later
    this.setupNotificationHandler();
    this.setupNotificationResponseListener();
    return false;
  }

  /**
   * Set up notification categories, handlers and Android channels.
   * Called after permission is confirmed granted.
   */
  static async setupAfterPermission(): Promise<void> {
    await this.setupNotificationCategories();
    this.setupNotificationHandler();
    this.setupNotificationResponseListener();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('habits', {
        name: 'Habit Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#14b8a6',
        sound: 'true',
      });
    }
  }

  /**
   * Demander les permissions de notification à l'utilisateur.
   * Appelé uniquement depuis l'onboarding ou les settings.
   *
   * @returns Vrai si les permissions sont accordees
   */
  static async registerForPushNotifications(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Logger.debug('Notification permissions denied');
      return false;
    }

    // Now that we have permission, set up everything
    await this.setupAfterPermission();

    return true;
  }

  /**
   * Configurer les categories de notification avec actions
   */
  private static async setupNotificationCategories(): Promise<void> {
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

  /**
   * Configurer le gestionnaire de notifications
   */
  private static setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }

  /**
   * Configurer l'ecouteur de reponses aux notifications
   */
  private static setupNotificationResponseListener(): void {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { notification, actionIdentifier } = response;
      const habitId = notification.request.content.data.habitId as string;
      const habitName = notification.request.content.title;

      if (actionIdentifier === 'snooze') {
        await this.snoozeNotification(habitId, habitName ?? undefined);
      }
    });
  }

  // ===========================================================================
  // SECTION: Notifications intelligentes d'habitudes
  // ===========================================================================

  /**
   * Planifier des notifications qui verifient dynamiquement la completion
   * Methode principale pour remplacer les anciennes notifications
   *
   * @param habit - L'habitude pour laquelle planifier
   * @param userId - L'identifiant de l'utilisateur
   */
  static async scheduleSmartHabitNotifications(habit: Habit, userId: string): Promise<void> {
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

  /**
   * Planifier une notification quotidienne intelligente
   */
  private static async scheduleDailySmartNotification(
    habit: Habit,
    userId: string,
    hours: number,
    minutes: number
  ): Promise<void> {
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
          isDynamic: true,
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

  /**
   * Planifier des notifications pour des jours personnalises
   */
  private static async scheduleCustomDaysSmartNotifications(
    habit: Habit,
    userId: string,
    hours: number,
    minutes: number
  ): Promise<void> {
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

      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      const currentDayOfWeek = now.getDay();
      let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && scheduledTime <= now)) {
        daysUntilTarget += 7;
      }

      scheduledTime.setDate(now.getDate() + daysUntilTarget);

      const message = NotificationMessages.habitReminder({
        habitName: habit.name,
        incompleteTasks: habit.tasks.map((t: any) => t.name || t),
        totalTasks: habit.tasks.length,
        currentStreak: habit.currentStreak,
        type: habit.type,
      });

      Logger.debug(`Scheduling ${day} notification for ${habit.name} at ${scheduledTime.toLocaleString()}`);

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
          weekday: targetDayOfWeek + 1,
          hour: hours,
          minute: minutes,
          repeats: true,
          channelId: 'habits',
        },
      });
    }
  }

  /**
   * Generer une notification dynamique basee sur le statut actuel
   * Appeler quand l'app est au premier plan pour mettre a jour le contenu
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   */
  static async generateDynamicNotification(habitId: string, userId: string): Promise<void> {
    try {
      const { data: habitData, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();

      if (habitError || !habitData) {
        Logger.error('Error fetching habit:', habitError);
        return;
      }

      const today = getLocalDateString(new Date());
      const { data: completionData } = await supabase
        .from('task_completions')
        .select('completed_tasks')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      const completedTaskIds = completionData?.completed_tasks || [];
      const allTasks = habitData.tasks || [];

      const incompleteTasks = allTasks.filter((taskId: string) => !completedTaskIds.includes(taskId));

      const message = NotificationMessages.habitReminder({
        habitName: habitData.name,
        incompleteTasks: incompleteTasks,
        totalTasks: allTasks.length,
        currentStreak: habitData.current_streak,
        type: habitData.type,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          data: { habitId, userId },
          sound: true,
          categoryIdentifier: 'habit_reminder',
        },
        trigger: null,
      });
    } catch (error) {
      Logger.error('Error generating dynamic notification:', error);
    }
  }

  // ===========================================================================
  // SECTION: Notifications de coffre quotidien
  // ===========================================================================

  /**
   * Planifier un rappel de coffre quotidien
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param xpAvailable - Les XP disponibles
   * @param hour - L'heure du rappel (par defaut 20h)
   */
  static async scheduleDailyChestReminder(
    userId: string,
    xpAvailable: number,
    hour: number = 20
  ): Promise<void> {
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

  /**
   * Annuler le rappel de coffre quotidien
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  static async cancelDailyChestReminder(userId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(`daily_chest_${userId}`);
  }

  // ===========================================================================
  // SECTION: Notifications de streak a risque
  // ===========================================================================

  /**
   * Envoyer une notification de streak a risque
   *
   * @param habitId - L'identifiant de l'habitude
   * @param habitName - Le nom de l'habitude
   * @param streakCount - Le nombre de jours de streak
   * @param hoursRemaining - Les heures restantes
   */
  static async sendStreakRiskNotification(
    habitId: string,
    habitName: string,
    streakCount: number,
    hoursRemaining: number
  ): Promise<void> {
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
      trigger: null,
    });
  }

  // ===========================================================================
  // SECTION: Fonctionnalite de snooze
  // ===========================================================================

  /**
   * Reporter une notification de 2 heures
   *
   * @param habitId - L'identifiant de l'habitude
   * @param habitName - Le nom de l'habitude
   */
  private static async snoozeNotification(habitId: string, habitName?: string): Promise<void> {
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

      Logger.debug(`Snoozed until ${triggerDate.toLocaleTimeString()}`);
    } catch (error) {
      Logger.error('Error snoozing notification:', error);
    }
  }

  // ===========================================================================
  // SECTION: Methodes utilitaires
  // ===========================================================================

  /**
   * Annuler les notifications pour une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   */
  static async cancelHabitNotifications(habitId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(habitId);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        try {
          await Notifications.cancelScheduledNotificationAsync(`${habitId}_${day}`);
        } catch {
          // Ignorer si n'existe pas
        }
      }

      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of scheduled) {
        if (notification.identifier.startsWith(`${habitId}_snoozed_`)) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      Logger.error('Error canceling notifications:', error);
    }
  }

  /**
   * Annuler toutes les notifications planifiees
   */
  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Recuperer toutes les notifications planifiees
   *
   * @returns Liste des notifications planifiees
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Mettre a jour l'heure de notification d'une habitude
   *
   * @param habit - L'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param newTime - La nouvelle heure
   */
  static async updateHabitNotificationTime(
    habit: Habit,
    userId: string,
    newTime: string
  ): Promise<void> {
    await this.cancelHabitNotifications(habit.id);
    const updatedHabit = { ...habit, notificationTime: newTime };
    await this.scheduleSmartHabitNotifications(updatedHabit, userId);
  }

  /**
   * Envoyer une notification de test
   */
  static async sendTestNotification(): Promise<void> {
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
