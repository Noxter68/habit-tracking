// src/utils/notificationMessages.ts

export type NotificationType = 'habit_reminder' | 'daily_chest' | 'streak_risk' | 'achievement_unlock' | 'weekly_summary' | 'morning_motivation' | 'evening_reflection' | 'custom';

interface NotificationMessage {
  title: string;
  body: string;
}

interface HabitReminderData {
  habitName: string;
  incompleteTasks: string[];
  totalTasks: number;
  currentStreak?: number;
  type?: 'good' | 'bad';
}

interface DailyChestData {
  xpAvailable: number;
}

interface StreakRiskData {
  habitName: string;
  streakCount: number;
  hoursRemaining: number;
}

/**
 * Central notification message generator
 * Single source of truth for all notification texts
 * Designed for easy i18n translation support in the future
 */
export class NotificationMessages {
  // ========== HABIT REMINDER MESSAGES ==========

  /**
   * Generates dynamic notification for incomplete habit tasks
   * Message tone escalates based on task count:
   * - 3 tasks missing: Generic reminder
   * - 2 tasks missing: Cheerful encouragement
   * - 1 task missing: Maximum motivation
   * Automatically includes streak information if applicable
   */
  static habitReminder(data: HabitReminderData): NotificationMessage {
    const { habitName, incompleteTasks, totalTasks, currentStreak, type } = data;
    const taskCount = incompleteTasks.length;

    // All tasks complete
    if (taskCount === 0) {
      return {
        title: habitName,
        body: currentStreak ? `Perfect! All tasks complete. Your ${currentStreak}-day streak continues.` : 'Perfect! All tasks complete for today.',
      };
    }

    // Format task list for display
    const taskList = this.formatTaskList(incompleteTasks);
    const streakSuffix = currentStreak ? ` to save your ${currentStreak}-day streak` : '';

    // 3 tasks missing - Generic reminder
    if (taskCount === 3 || taskCount === totalTasks) {
      return {
        title: habitName,
        body: `${taskList} still need to be completed${streakSuffix}.`,
      };
    }

    // 2 tasks missing - Cheerful encouragement
    if (taskCount === 2) {
      return {
        title: habitName,
        body: `You're almost there! Just ${taskList} left${streakSuffix}. Keep going!`,
      };
    }

    // 1 task missing - Maximum motivation
    return {
      title: habitName,
      body: `So close! Only ${taskList} remaining${streakSuffix}. You've got this!`,
    };
  }

  /**
   * Formats task array into natural language list
   * Examples:
   * - ["Task 1"] → "Task 1"
   * - ["Task 1", "Task 2"] → "Task 1 and Task 2"
   * - ["Task 1", "Task 2", "Task 3"] → "Task 1, Task 2 and Task 3"
   */
  private static formatTaskList(tasks: string[]): string {
    if (tasks.length === 0) return '';
    if (tasks.length === 1) return tasks[0];
    if (tasks.length === 2) return `${tasks[0]} and ${tasks[1]}`;

    const lastTask = tasks[tasks.length - 1];
    const otherTasks = tasks.slice(0, -1).join(', ');
    return `${otherTasks} and ${lastTask}`;
  }

  // ========== DAILY CHEST MESSAGES ==========

  static dailyChestReminder(data: DailyChestData): NotificationMessage {
    const { xpAvailable } = data;

    return {
      title: 'Daily Chest Awaits',
      body: `${xpAvailable} XP is waiting for you. Don't miss your daily rewards.`,
    };
  }

  static dailyChestLastChance(hoursRemaining: number): NotificationMessage {
    return {
      title: 'Last Chance',
      body: `Your daily chest expires in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}. Collect your XP now!`,
    };
  }

  static dailyChestMissed(): NotificationMessage {
    return {
      title: 'Chest Expired',
      body: 'Your daily chest has reset. Start fresh today!',
    };
  }

  // ========== STREAK RISK MESSAGES ==========

  static streakRisk(data: StreakRiskData): NotificationMessage {
    const { habitName, streakCount, hoursRemaining } = data;

    const timePhrase = hoursRemaining <= 2 ? `only ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}` : `${hoursRemaining} hours`;

    return {
      title: `${habitName} - Streak at Risk`,
      body: `Your ${streakCount}-day streak needs attention. ${timePhrase} left to complete your tasks.`,
    };
  }

  static streakLost(habitName: string, lostStreak: number): NotificationMessage {
    return {
      title: `${habitName}`,
      body: `Your ${lostStreak}-day streak ended. Start rebuilding today - you've done it before.`,
    };
  }

  static streakSaved(habitName: string, savedStreak: number): NotificationMessage {
    return {
      title: 'Streak Saved!',
      body: `Your ${savedStreak}-day ${habitName} streak is safe. Great recovery!`,
    };
  }

  // ========== ACHIEVEMENT MESSAGES ==========

  static achievementUnlock(achievementName: string, xpReward: number): NotificationMessage {
    return {
      title: 'Achievement Unlocked',
      body: `${achievementName} - ${xpReward} XP earned!`,
    };
  }

  static milestoneReached(habitName: string, days: number, tier: string): NotificationMessage {
    return {
      title: `${habitName} Milestone`,
      body: `${days} days completed! You've reached ${tier} tier. Keep building.`,
    };
  }

  static tierUpgrade(habitName: string, newTier: string): NotificationMessage {
    return {
      title: 'Tier Upgrade',
      body: `${habitName} is now ${newTier} tier. Your dedication is paying off!`,
    };
  }

  // ========== WEEKLY SUMMARY MESSAGES ==========

  static weeklyProgress(habitsCompleted: number, totalHabits: number, xpEarned: number, perfectDays: number): NotificationMessage {
    const completionRate = Math.round((habitsCompleted / totalHabits) * 100);

    return {
      title: 'Weekly Progress',
      body: `${completionRate}% completion rate. ${xpEarned} XP earned across ${perfectDays} perfect day${perfectDays === 1 ? '' : 's'}.`,
    };
  }

  static weeklyGoalMet(): NotificationMessage {
    return {
      title: 'Weekly Goal Complete',
      body: 'Exceptional week! You hit all your targets. Rest well, you earned it.',
    };
  }

  // ========== MOTIVATIONAL MESSAGES ==========

  static morningMotivation(): NotificationMessage {
    const messages = [
      'A new day, a fresh start. Make it count.',
      'Your future self will thank you for starting today.',
      'Small steps today lead to big changes tomorrow.',
      'Consistency is the bridge between goals and achievement.',
      'Today is another opportunity to grow.',
    ];

    return {
      title: 'Good Morning',
      body: messages[Math.floor(Math.random() * messages.length)],
    };
  }

  static eveningReflection(tasksCompleted: number, totalTasks: number): NotificationMessage {
    if (tasksCompleted === totalTasks) {
      return {
        title: 'Perfect Day',
        body: `All ${totalTasks} tasks completed. Exceptional work today.`,
      };
    }

    const remaining = totalTasks - tasksCompleted;
    return {
      title: 'Evening Check-in',
      body: `${remaining} task${remaining === 1 ? '' : 's'} remaining. There's still time to finish strong.`,
    };
  }

  static restDay(): NotificationMessage {
    return {
      title: 'Rest is Progress',
      body: 'Taking time to recharge is part of building lasting habits. Enjoy your rest.',
    };
  }

  // ========== CUSTOM/GENERAL MESSAGES ==========

  static custom(title: string, body: string): NotificationMessage {
    return { title, body };
  }

  static featureAnnouncement(featureName: string): NotificationMessage {
    return {
      title: 'New Feature',
      body: `${featureName} is now available. Check it out in the app!`,
    };
  }

  static maintenanceNotice(hours: number): NotificationMessage {
    return {
      title: 'Scheduled Maintenance',
      body: `Nuvoria will be offline for ${hours} hour${hours === 1 ? '' : 's'} for improvements. Your data is safe.`,
    };
  }

  // ========== FALLBACK MESSAGE ==========

  static fallback(habitName?: string): NotificationMessage {
    return {
      title: habitName || 'Habit Reminder',
      body: 'Time to check in on your habits.',
    };
  }
}

// ========== TRANSLATION SUPPORT (Future Implementation) ==========

/**
 * Structure for i18n translations
 * Use with react-i18next or similar library
 */
export interface TranslationKeys {
  habitReminder: {
    allComplete: string;
    allCompleteWithStreak: string;
    generic: string;
    cheerful: string;
    motivational: string;
    streakSuffix: string;
  };
  dailyChest: {
    reminder: string;
    lastChance: string;
    missed: string;
  };
  streak: {
    risk: string;
    lost: string;
    saved: string;
  };
  achievement: {
    unlock: string;
    milestone: string;
    tierUpgrade: string;
  };
  weekly: {
    progress: string;
    goalMet: string;
  };
  motivational: {
    morning: string[];
    evening: string;
    eveningPerfect: string;
    rest: string;
  };
}

/**
 * Example usage with i18n (future):
 *
 * import { useTranslation } from 'react-i18next';
 *
 * const { t } = useTranslation();
 * const body = t('habitReminder.cheerful', {
 *   taskList: formattedTasks,
 *   streak: currentStreak
 * });
 */
