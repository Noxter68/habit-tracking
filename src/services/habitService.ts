/**
 * Service de gestion des habitudes
 *
 * Ce service gère toutes les opérations CRUD sur les habitudes ainsi que
 * le calcul des streaks, la complétion des tâches et les statistiques.
 * Il utilise une protection côté base de données pour éviter l'exploitation des XP.
 *
 * @module HabitService
 */

// =============================================================================
// IMPORTS - Bibliothèques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { getLocalDateString, getTodayString, getWeekStartMonday } from '@/utils/dateHelpers';
import { getTasksForCategory } from '@/utils/habitHelpers';
import Logger from '@/utils/logger';

// =============================================================================
// IMPORTS - Types
// =============================================================================
import { Habit, HabitProgression } from '../types';
import { HabitProgressionService } from './habitProgressionService';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Entrée de l'historique des streaks
 */
export interface StreakHistoryEntry {
  date: string;
  streak_value: number;
  tasks_completed: number;
  total_tasks: number;
  completion_rate: number;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des habitudes
 *
 * Gère les opérations CRUD, le calcul des streaks et les statistiques
 */
export class HabitService {
  // ===========================================================================
  // SECTION: Gestion des tâches
  // ===========================================================================

  /**
   * Basculer l'état de complétion d'une tâche spécifique
   * Utilise une protection côté base de données pour éviter l'exploitation des XP
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param date - La date de la tâche
   * @param taskId - L'identifiant de la tâche
   * @returns Résultat de l'opération avec XP gagné et état de complétion
   */
  static async toggleTask(
    habitId: string,
    userId: string,
    date: string,
    taskId: string
  ): Promise<{
    success: boolean;
    xpEarned: number;
    allTasksComplete: boolean;
    milestoneReached?: string;
    streakUpdated?: number;
    alreadyEarnedXP?: boolean;
    completedTasks?: string[];
  }> {
    try {
      Logger.debug('Debug toggleTask:', {
        habitId,
        date,
        taskId,
        taskIdType: typeof taskId,
        taskIdValue: JSON.stringify(taskId),
      });

      const { data, error } = await supabase.rpc('toggle_task_with_xp_protection', {
        p_habit_id: habitId,
        p_user_id: userId,
        p_date: date,
        p_task_id: taskId,
      });

      if (error) {
        Logger.error('Error in toggle_task_with_xp_protection:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from toggle function');
      }

      const result = data[0];
      const completedTasks = Array.isArray(result.completed_tasks)
        ? result.completed_tasks
        : result.completed_tasks
          ? [result.completed_tasks]
          : [];

      Logger.debug('Toggle result:', {
        success: result.success,
        xpEarned: result.xp_earned,
        completedTasks,
        allCompleted: result.all_completed,
        streakUpdated: result.streak_updated,
      });

      return {
        success: result.success ?? false,
        xpEarned: result.xp_earned ?? 0,
        allTasksComplete: result.all_completed ?? false,
        alreadyEarnedXP: result.already_earned ?? false,
        completedTasks,
        streakUpdated: result.streak_updated ?? 0,
      };
    } catch (error) {
      Logger.error('Error toggling task:', error);
      return {
        success: false,
        xpEarned: 0,
        allTasksComplete: false,
        completedTasks: [],
      };
    }
  }

  /**
   * Supprimer une tâche d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param taskId - L'identifiant de la tâche à supprimer
   */
  static async deleteTask(habitId: string, userId: string, taskId: string): Promise<void> {
    try {
      const { data: habit, error: fetchError } = await supabase
        .from('habits')
        .select('tasks')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!habit) throw new Error('Habit not found');

      const updatedTasks = (habit.tasks || []).filter((task: any) => {
        const currentTaskId = typeof task === 'string' ? task : task.id;
        return currentTaskId !== taskId;
      });

      const { error: updateError } = await supabase
        .from('habits')
        .update({
          tasks: updatedTasks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('id, completed_tasks')
        .eq('habit_id', habitId)
        .eq('user_id', userId);

      if (completionsError) throw completionsError;

      if (completions && completions.length > 0) {
        for (const completion of completions) {
          const updatedCompletedTasks = (completion.completed_tasks || []).filter(
            (id: string) => id !== taskId
          );

          if (updatedCompletedTasks.length !== completion.completed_tasks?.length) {
            const { error: updateCompletionError } = await supabase
              .from('task_completions')
              .update({
                completed_tasks: updatedCompletedTasks,
                all_completed: updatedCompletedTasks.length === updatedTasks.length && updatedTasks.length > 0,
              })
              .eq('id', completion.id);

            if (updateCompletionError) {
              Logger.error('Error updating task completion:', updateCompletionError);
            }
          }
        }
      }

      Logger.debug('Task deleted successfully:', {
        habitId,
        taskId,
        remainingTasks: updatedTasks.length,
      });
    } catch (error) {
      Logger.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Ajouter une tâche à une habitude existante
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param task - Les informations de la nouvelle tâche
   */
  static async addTask(
    habitId: string,
    userId: string,
    task: { id: string; name: string; description?: string; duration?: string; category?: string }
  ): Promise<void> {
    try {
      const { data: habit, error: fetchError } = await supabase
        .from('habits')
        .select('tasks, category')
        .eq('id', habitId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;
      if (!habit) throw new Error('Habit not found');

      // Parse tasks if stored as JSON string
      let existingTasks = habit.tasks || [];
      if (typeof existingTasks === 'string') {
        try {
          existingTasks = JSON.parse(existingTasks);
        } catch (e) {
          Logger.error('Failed to parse existing tasks:', e);
          existingTasks = [];
        }
      }

      const newTask = {
        id: task.id,
        name: task.name,
        description: task.description || '',
        duration: task.duration || '',
        category: task.category || habit.category || 'custom',
      };

      const updatedTasks = [...(Array.isArray(existingTasks) ? existingTasks : []), newTask];

      const { error: updateError } = await supabase
        .from('habits')
        .update({
          tasks: updatedTasks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      Logger.debug('Task added successfully:', {
        habitId,
        taskId: task.id,
        taskName: task.name,
        totalTasks: updatedTasks.length,
      });
    } catch (error) {
      Logger.error('Error adding task:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la complétion des tâches
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param date - La date de complétion
   * @param completedTasks - Liste des tâches complétées
   * @param totalTasks - Nombre total de tâches
   */
  static async updateTaskCompletion(
    habitId: string,
    userId: string,
    date: string,
    completedTasks: string[],
    totalTasks: number
  ): Promise<void> {
    try {
      const allCompleted = completedTasks.length === totalTasks && totalTasks > 0;

      const { data: existing, error: fetchError } = await supabase
        .from('task_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            completed_tasks: completedTasks,
            all_completed: allCompleted,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('task_completions')
          .insert({
            habit_id: habitId,
            user_id: userId,
            date,
            completed_tasks: completedTasks,
            all_completed: allCompleted,
          });

        if (insertError) throw insertError;
      }

      await this.updateStreak(habitId, userId);
    } catch (error) {
      Logger.error('Error updating task completion:', error);
      throw error;
    }
  }

  // ===========================================================================
  // SECTION: Gestion de l'historique XP
  // ===========================================================================

  /**
   * Récupérer l'historique XP pour une date spécifique
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param date - La date à consulter
   * @returns Liste des XP gagnés ce jour
   */
  static async getDailyXPHistory(
    userId: string,
    date: string
  ): Promise<{
    habitId: string;
    taskId: string;
    xpAmount: number;
    awardedAt: Date;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('daily_task_xp')
        .select('habit_id, task_id, xp_amount, awarded_at')
        .eq('user_id', userId)
        .eq('date', date)
        .order('awarded_at', { ascending: false });

      if (error) throw error;

      return (
        data?.map((item) => ({
          habitId: item.habit_id,
          taskId: item.task_id,
          xpAmount: item.xp_amount,
          awardedAt: new Date(item.awarded_at),
        })) || []
      );
    } catch (error) {
      Logger.error('Error fetching daily XP history:', error);
      return [];
    }
  }

  /**
   * Vérifier si une tâche a déjà gagné des XP aujourd'hui
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @param taskId - L'identifiant de la tâche
   * @param date - La date à vérifier
   * @returns Vrai si des XP ont déjà été gagnés
   */
  static async hasEarnedXPToday(
    userId: string,
    habitId: string,
    taskId: string,
    date: string
  ): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('daily_task_xp')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('task_id', taskId)
        .eq('date', date);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      Logger.error('Error checking XP status:', error);
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Gestion de la complétion journalière
  // ===========================================================================

  /**
   * Gérer la complétion d'une journée complète
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param date - La date de complétion
   * @param currentStreakFromHabit - Le streak actuel de l'habitude
   * @returns Le nouveau streak
   */
  static async handleDayCompletion(
    habitId: string,
    userId: string,
    date: string,
    currentStreakFromHabit: number
  ): Promise<number> {
    try {
      const { currentStreak, bestStreak } = await this.calculateStreaks(habitId, userId, date, true);

      await supabase
        .from('habits')
        .update({
          current_streak: currentStreak,
          best_streak: bestStreak,
          last_completed_date: date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      const { tier, progress } = HabitProgressionService.calculateTierFromStreak(currentStreak);

      await supabase
        .from('habit_progression')
        .update({
          current_tier: tier.name,
          xp_multiplier: tier.multiplier,
          tier_progress: progress,
          perfect_days: supabase.rpc('increment_perfect_days', {
            p_habit_id: habitId,
            p_user_id: userId
          }),
          updated_at: new Date().toISOString(),
        })
        .eq('habit_id', habitId)
        .eq('user_id', userId);

      return currentStreak;
    } catch (error) {
      Logger.error('Error handling day completion:', error);
      return currentStreakFromHabit;
    }
  }

  // ===========================================================================
  // SECTION: Gestion de la progression
  // ===========================================================================

  /**
   * Récupérer les données de progression d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les données de progression ou null
   */
  static async getHabitProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase
        .from('habit_progression')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single();

      if (error) {
        Logger.error('Error fetching habit progression:', error);
        return null;
      }

      return {
        id: data.id,
        habitId: data.habit_id,
        userId: data.user_id,
        currentTier: data.current_tier,
        habitXP: data.habit_xp,
        milestonesUnlocked: data.milestones_unlocked,
        lastMilestoneDate: data.last_milestone_date,
        performanceMetrics: data.performance_metrics,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      Logger.error('Error in getHabitProgression:', error);
      return null;
    }
  }

  // ===========================================================================
  // SECTION: Opérations CRUD sur les habitudes
  // ===========================================================================

  /**
   * Récupérer toutes les habitudes d'un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des habitudes avec leurs complétions
   */
  static async fetchHabits(userId: string): Promise<Habit[]> {
    try {
      const { data: habitsData, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!habitsData) return [];

      const habitIds = habitsData.map((h) => h.id);
      const { data: completions } = await supabase
        .from('task_completions')
        .select('*')
        .in('habit_id', habitIds);

      return habitsData.map((habit) => {
        const habitCompletions = completions?.filter((c) => c.habit_id === habit.id) || [];
        const dailyTasks: any = {};
        const completedDays: string[] = [];

        habitCompletions.forEach((c) => {
          dailyTasks[c.date] = {
            completedTasks: c.completed_tasks,
            allCompleted: c.all_completed,
          };
          if (c.all_completed) completedDays.push(c.date);
        });

        return {
          ...habit,
          dailyTasks,
          completedDays,
          currentStreak: habit.current_streak || 0,
          bestStreak: habit.best_streak || 0,
          createdAt: new Date(habit.created_at),
          currentTierLevel: habit.current_tier_level ?? 0,
          hasEndGoal: habit.has_end_goal ?? false,
          endGoalDays: habit.end_goal_days,
          totalDays: habit.total_days,
        };
      });
    } catch (error) {
      Logger.error('Error fetching habits:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle habitude
   *
   * @param habit - Les données de l'habitude à créer
   * @param userId - L'identifiant de l'utilisateur
   * @returns L'habitude créée
   */
  static async createHabit(habit: Habit, userId: string): Promise<Habit> {
    try {
      let tasksToSave: any[];
      const isCustomHabit = habit.category === 'custom';

      if (isCustomHabit) {
        tasksToSave = habit.tasks.map((task, index) => {
          const taskName = typeof task === 'string' ? task : task.name || task;
          return {
            id: `custom-task-${Date.now()}-${index}`,
            name: taskName,
          };
        });
      } else {
        const availableTasks = getTasksForCategory(habit.category, habit.type);

        tasksToSave = habit.tasks.map((task) => {
          const taskId = typeof task === 'string' ? task : task.id;
          const taskDetails = availableTasks.find((t) => t.id === taskId);

          if (taskDetails) {
            return {
              id: taskDetails.id,
              name: taskDetails.name,
              description: taskDetails.description || '',
              duration: taskDetails.duration || '',
            };
          }

          return {
            id: taskId,
            name: typeof task === 'string' ? task : task.name || 'Task',
            description: '',
            duration: '',
          };
        });
      }

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: userId,
          name: habit.name,
          type: habit.type,
          category: habit.category,
          tasks: tasksToSave,
          frequency: habit.frequency,
          custom_days: habit.customDays,
          notifications: habit.notifications,
          notification_time: habit.notificationTime,
          has_end_goal: habit.hasEndGoal,
          end_goal_days: habit.endGoalDays,
          total_days: habit.totalDays,
          current_streak: habit.currentStreak || 0,
          best_streak: habit.bestStreak || 0,
        })
        .select()
        .single();

      if (error) {
        Logger.error('Error creating habit:', error);
        throw error;
      }

      Logger.debug('Habit created:', {
        habitId: data.id,
        isCustom: isCustomHabit,
        taskCount: tasksToSave.length,
      });

      return {
        ...habit,
        id: data.id,
        tasks: tasksToSave,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      Logger.error('Error in createHabit:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param updates - Les mises à jour à appliquer
   */
  static async updateHabit(habitId: string, userId: string, updates: Partial<Habit>): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Mettre à jour les paramètres de notification d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param enabled - Activer ou désactiver les notifications
   * @param time - L'heure de notification (optionnel)
   */
  static async updateHabitNotification(
    habitId: string,
    userId: string,
    enabled: boolean,
    time?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          notifications: enabled,
          notification_time: time,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      Logger.error('Error updating notification:', error);
      throw error;
    }
  }

  /**
   * Supprimer une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   */
  static async deleteHabit(habitId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // ===========================================================================
  // SECTION: Calcul des streaks
  // ===========================================================================

  /**
   * Calculer les streaks avec support des habitudes hebdomadaires
   *
   * Pour les habitudes HEBDOMADAIRES:
   * - Créée au Jour 0
   * - Peut compléter les tâches pendant une fenêtre de 7 jours
   * - Le streak s'incrémente quand TOUTES les tâches sont complétées dans la semaine
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param date - La date de référence
   * @param allCompleted - Si toutes les tâches sont complétées
   * @returns Le streak actuel et le meilleur streak
   */
  static async calculateStreaks(
    habitId: string,
    userId: string,
    date: string,
    allCompleted: boolean
  ): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('frequency, created_at')
        .eq('id', habitId)
        .single();

      if (habitError) throw habitError;

      const frequency = habit.frequency as 'daily' | 'weekly' | 'monthly' | 'custom';
      const createdAt = new Date(habit.created_at);

      const { data: completions, error } = await supabase
        .from('task_completions')
        .select('date, all_completed, completed_tasks')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!completions || completions.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
      }

      if (frequency === 'weekly') {
        return this.calculateWeeklyStreaks(completions, createdAt);
      } else if (frequency === 'daily' || frequency === 'custom') {
        return this.calculateDailyStreaks(completions);
      }

      return { currentStreak: 0, bestStreak: 0 };
    } catch (error) {
      Logger.error('Error calculating streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }

  /**
   * Calculer les streaks pour les habitudes hebdomadaires
   * Utilise les semaines calendaires (lundi-dimanche) pour cohérence avec le reset hebdomadaire
   *
   * @param completions - Les données de complétion
   * @param createdAt - La date de création de l'habitude
   * @returns Le streak actuel et le meilleur streak
   */
  private static calculateWeeklyStreaks(
    completions: any[],
    createdAt: Date
  ): { currentStreak: number; bestStreak: number } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const created = new Date(createdAt);
    created.setHours(0, 0, 0, 0);

    // Utilise les semaines calendaires (lundi-dimanche)
    const currentWeekStart = getWeekStartMonday(today);
    const createdWeekStart = getWeekStartMonday(created);

    // Calcul de l'index de la semaine courante par rapport à la semaine de création
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const currentWeekIndex = Math.floor(
      (currentWeekStart.getTime() - createdWeekStart.getTime()) / msPerWeek
    );

    // Map des semaines complétées (index basé sur semaines calendaires depuis création)
    const weekCompletions = new Map<number, boolean>();

    completions.forEach((completion) => {
      const completionDate = new Date(completion.date);
      const completionWeekStart = getWeekStartMonday(completionDate);
      const weekIndex = Math.floor(
        (completionWeekStart.getTime() - createdWeekStart.getTime()) / msPerWeek
      );

      if (completion.all_completed && weekIndex >= 0) {
        weekCompletions.set(weekIndex, true);
      }
    });

    // Calcul du streak actuel (en partant de la semaine courante vers le passé)
    let currentStreak = 0;
    for (let week = currentWeekIndex; week >= 0; week--) {
      if (weekCompletions.get(week)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calcul du meilleur streak
    let bestStreak = 0;
    let tempStreak = 0;

    const weekKeys = Array.from(weekCompletions.keys());
    if (weekKeys.length > 0) {
      const maxWeek = Math.max(...weekKeys);
      for (let week = 0; week <= maxWeek; week++) {
        if (weekCompletions.get(week)) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  }

  /**
   * Calculer les streaks pour les habitudes quotidiennes
   *
   * @param completions - Les données de complétion
   * @returns Le streak actuel et le meilleur streak
   */
  private static calculateDailyStreaks(
    completions: any[]
  ): { currentStreak: number; bestStreak: number } {
    let currentStreak = 0;
    let bestStreak = 0;

    const today = getTodayString();
    const dates = [...new Set(completions.map((c) => c.date))];

    const todayHasProgress = dates.includes(today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    const yesterdayHasProgress = dates.includes(yesterdayStr);

    if (todayHasProgress || yesterdayHasProgress) {
      currentStreak = 1;
      const startDay = todayHasProgress ? 0 : 1;

      for (let i = 1; i < 365; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - (i + startDay));
        const dateStr = getLocalDateString(checkDate);

        if (dates.includes(dateStr)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    let tempStreak = 0;
    const sortedDates = [...dates].sort();

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);
    }

    return {
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
    };
  }

  /**
   * Mettre à jour le streak dans la table des habitudes
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   */
  static async updateStreak(habitId: string, userId: string): Promise<void> {
    try {
      const { currentStreak, bestStreak } = await this.calculateStreaks(
        habitId,
        userId,
        getTodayString(),
        false
      );

      await supabase
        .from('habits')
        .update({
          current_streak: currentStreak,
          best_streak: bestStreak,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);
    } catch (error) {
      Logger.error('Error updating streak:', error);
    }
  }

  // ===========================================================================
  // SECTION: Historique et statistiques
  // ===========================================================================

  /**
   * Récupérer l'historique des streaks pour une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param startDate - Date de début (optionnel)
   * @param endDate - Date de fin (optionnel)
   * @returns L'historique des streaks
   */
  static async getStreakHistory(
    habitId: string,
    startDate?: string,
    endDate?: string
  ): Promise<StreakHistoryEntry[]> {
    try {
      let query = supabase
        .from('streak_history')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      Logger.error('Error fetching streak history:', error);
      return [];
    }
  }

  /**
   * Récupérer les statistiques agrégées pour toutes les habitudes
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques agrégées
   */
  static async getAggregatedStats(userId: string) {
    try {
      const { data: streakHistory, error: streakError } = await supabase
        .from('streak_history')
        .select('date, completion_rate, tasks_completed')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (streakError) throw streakError;

      const { data: progressions } = await supabase
        .from('habit_progression')
        .select('habit_xp, current_tier')
        .eq('user_id', userId);

      const totalHabitXP = progressions?.reduce((sum, p) => sum + p.habit_xp, 0) || 0;

      const uniqueDates = new Set(streakHistory?.map((h) => h.date) || []);
      const totalDaysTracked = uniqueDates.size;

      const totalCompletions = streakHistory?.reduce(
        (sum, h) => sum + (h.tasks_completed || 0),
        0
      ) || 0;

      const avgRate = streakHistory?.length
        ? streakHistory.reduce((sum, h) => sum + (h.completion_rate || 0), 0) / streakHistory.length
        : 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStreaks = streakHistory?.filter(
        (h) => new Date(h.date) >= thirtyDaysAgo
      ) || [];

      const streakMap = new Map<string, number>();
      recentStreaks.forEach((h) => {
        const current = streakMap.get(h.date) || 0;
        streakMap.set(h.date, Math.max(current, h.completion_rate || 0));
      });

      const streakData = Array.from(streakMap.entries()).map(([date, value]) => ({
        date,
        value,
      }));

      return {
        totalDaysTracked,
        totalCompletions,
        averageCompletionRate: Math.round(avgRate),
        streakData,
        totalHabitXP,
        habitsWithProgress: progressions?.length || 0,
      };
    } catch (error) {
      Logger.error('Error getting aggregated stats:', error);
      return {
        totalDaysTracked: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        streakData: [],
      };
    }
  }

  /**
   * Récupérer le nombre d'habitudes actives d'un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le nombre d'habitudes actives
   */
  static async getActiveHabitsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      Logger.error('Error getting active habits count:', error);
      try {
        const { count, error } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (error) throw error;
        return count || 0;
      } catch (fallbackError) {
        Logger.error('Error getting habits count:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Récupérer les statistiques du jour pour le tableau de bord
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques du jour
   */
  static async getTodayStats(userId: string): Promise<{
    completed: number;
    total: number;
    completionRate: number;
    completedTasks?: number;
    totalTasks?: number;
  }> {
    try {
      const today = getTodayString();

      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, tasks')
        .eq('user_id', userId);

      if (habitsError) throw habitsError;

      if (!habits || habits.length === 0) {
        return {
          completed: 0,
          total: 0,
          completionRate: 0,
          completedTasks: 0,
          totalTasks: 0,
        };
      }

      const habitIds = habits.map((h) => h.id);
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('habit_id, completed_tasks, all_completed')
        .eq('user_id', userId)
        .eq('date', today)
        .in('habit_id', habitIds);

      if (completionsError) throw completionsError;

      let totalTasks = 0;
      let completedTasks = 0;

      habits.forEach((habit) => {
        const taskCount = Array.isArray(habit.tasks) ? habit.tasks.length : 0;
        totalTasks += taskCount;

        const completion = completions?.find((c) => c.habit_id === habit.id);
        if (completion && completion.completed_tasks) {
          completedTasks += Array.isArray(completion.completed_tasks)
            ? completion.completed_tasks.length
            : 0;
        }
      });

      const completionRate = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      return {
        completed: completedTasks,
        total: totalTasks,
        completionRate,
        completedTasks,
        totalTasks,
      };
    } catch (error) {
      Logger.error('Error getting today stats:', error);
      return {
        completed: 0,
        total: 0,
        completionRate: 0,
        completedTasks: 0,
        totalTasks: 0,
      };
    }
  }

  /**
   * Vérifier si l'utilisateur a complété toutes les tâches du jour
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Si le défi quotidien est complété et les XP disponibles
   */
  static async checkDailyChallenge(userId: string): Promise<{
    allComplete: boolean;
    totalXPAvailable: number;
  }> {
    try {
      const todayStats = await this.getTodayStats(userId);

      const allComplete = (todayStats.totalTasks ?? 0) > 0 &&
        (todayStats.completedTasks ?? 0) === (todayStats.totalTasks ?? 0);

      return {
        allComplete,
        totalXPAvailable: allComplete ? 100 : 0,
      };
    } catch (error) {
      Logger.error('Error checking daily challenge:', error);
      return { allComplete: false, totalXPAvailable: 0 };
    }
  }

  /**
   * Récupérer les statistiques hebdomadaires d'un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques de la semaine
   */
  static async getWeeklyStats(userId: string): Promise<{
    daysActive: number;
    totalCompletions: number;
    averageCompletionRate: number;
    streakDays: number;
  }> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = getLocalDateString(weekAgo);
      const today = getTodayString();

      const { data: completions, error } = await supabase
        .from('task_completions')
        .select('date, all_completed, completed_tasks')
        .eq('user_id', userId)
        .gte('date', weekAgoStr)
        .lte('date', today);

      if (error) throw error;

      if (!completions || completions.length === 0) {
        return {
          daysActive: 0,
          totalCompletions: 0,
          averageCompletionRate: 0,
          streakDays: 0,
        };
      }

      const uniqueDates = new Set(completions.map((c) => c.date));
      const daysActive = uniqueDates.size;

      const totalCompletions = completions.reduce((sum, c) => {
        return sum + (Array.isArray(c.completed_tasks) ? c.completed_tasks.length : 0);
      }, 0);

      const streakDays = completions.filter((c) => c.all_completed).length;

      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, tasks')
        .eq('user_id', userId);

      if (habitsError) throw habitsError;

      let totalPossibleTasks = 0;
      uniqueDates.forEach(() => {
        habits?.forEach((habit) => {
          totalPossibleTasks += Array.isArray(habit.tasks) ? habit.tasks.length : 0;
        });
      });

      const averageCompletionRate = totalPossibleTasks > 0
        ? Math.round((totalCompletions / totalPossibleTasks) * 100)
        : 0;

      return {
        daysActive,
        totalCompletions,
        averageCompletionRate,
        streakDays,
      };
    } catch (error) {
      Logger.error('Error getting weekly stats:', error);
      return {
        daysActive: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        streakDays: 0,
      };
    }
  }

  /**
   * Récupérer le streak global de l'utilisateur
   * Le streak global compte les jours consécutifs où TOUTES les habitudes sont complétées
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le streak global actuel
   */
  static async getGlobalStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_global_streak')
        .eq('id', userId)
        .single();

      if (error) {
        Logger.error('Error fetching global streak:', error);
        return 0;
      }

      return data?.current_global_streak || 0;
    } catch (error) {
      Logger.error('Error in getGlobalStreak:', error);
      return 0;
    }
  }

  /**
   * Forcer le recalcul du streak global
   * Utile après une modification manuelle ou pour debug
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le nouveau streak calculé
   */
  static async recalculateGlobalStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('update_user_global_streak', {
        p_user_id: userId,
      });

      if (error) {
        Logger.error('Error recalculating global streak:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      Logger.error('Error in recalculateGlobalStreak:', error);
      return 0;
    }
  }

  /**
   * Vérifier si l'utilisateur a des habitudes
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si l'utilisateur a au moins une habitude
   */
  static async hasHabits(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      Logger.error('Error checking if user has habits:', error);
      return false;
    }
  }
}
