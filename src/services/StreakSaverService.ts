/**
 * Service de gestion des Streak Savers
 *
 * Ce service gere le systeme de sauvegarde de streak, permettant aux utilisateurs
 * de recuperer leur streak apres avoir manque un jour. Il inclut la gestion
 * de l'inventaire, la verification d'eligibilite et l'utilisation des savers.
 *
 * @module StreakSaverService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '@/lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Resultat de la verification d'eligibilite pour sauvegarder un streak
 */
export interface StreakSaveEligibility {
  canSave: boolean;
  reason?: string;
  habitName?: string;
  previousStreak?: number;
  missedDate?: string;
}

/**
 * Inventaire des Streak Savers de l'utilisateur
 */
export interface StreakSaverInventory {
  available: number;
  totalUsed: number;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des Streak Savers
 *
 * Gere l'inventaire, l'eligibilite et l'utilisation des sauvegardeurs de streak
 */
export class StreakSaverService {
  // ===========================================================================
  // SECTION: Inventaire
  // ===========================================================================

  /**
   * Recuperer l'inventaire de Streak Savers de l'utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns L'inventaire avec le nombre disponible et utilise
   */
  static async getInventory(userId: string): Promise<StreakSaverInventory> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('streak_savers, total_streak_savers_used')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      return {
        available: data?.streak_savers || 0,
        totalUsed: data?.total_streak_savers_used || 0,
      };
    } catch (error) {
      Logger.error('Error fetching streak saver inventory:', error);
      return { available: 0, totalUsed: 0 };
    }
  }

  /**
   * Ajouter des Streak Savers a l'inventaire de l'utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param quantity - Le nombre de savers a ajouter
   */
  static async addStreakSavers(userId: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc('add_streak_savers', {
      p_user_id: userId,
      p_quantity: quantity,
    });

    if (error) throw error;
  }

  // ===========================================================================
  // SECTION: Verification d'eligibilite
  // ===========================================================================

  /**
   * Verifier si une habitude est eligible pour une sauvegarde de streak
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns L'eligibilite avec les details
   */
  static async checkEligibility(
    habitId: string,
    userId: string
  ): Promise<StreakSaveEligibility> {
    try {
      const { data, error } = await supabase.rpc('check_streak_save_eligibility', {
        p_habit_id: habitId,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        return { canSave: false, reason: 'No data returned' };
      }

      return {
        canSave: result.can_save || false,
        reason: result.reason,
        habitName: result.habit_name,
        previousStreak: result.previous_streak,
        missedDate: result.missed_date,
      };
    } catch (error) {
      Logger.error('Error checking eligibility:', error);
      return { canSave: false, reason: 'Failed to check eligibility' };
    }
  }

  // ===========================================================================
  // SECTION: Utilisation des Streak Savers
  // ===========================================================================

  /**
   * Utiliser un Streak Saver pour recuperer un streak
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resultat de l'operation avec le nouveau streak
   */
  static async useStreakSaver(
    habitId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; newStreak?: number }> {
    try {
      const { data, error } = await supabase.rpc('use_streak_saver', {
        p_habit_id: habitId,
        p_user_id: userId,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        return { success: false, message: 'No data returned' };
      }

      return {
        success: result.success || false,
        message: result.message || 'Unknown error',
        newStreak: result.new_streak,
      };
    } catch (error: any) {
      Logger.error('Error using streak saver:', error);
      return {
        success: false,
        message: error.message || 'An error occurred',
      };
    }
  }

  // ===========================================================================
  // SECTION: Habitudes sauvegardables
  // ===========================================================================

  /**
   * Recuperer les habitudes eligibles pour une sauvegarde de streak
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des habitudes sauvegardables
   */
  static async getSaveableHabits(userId: string): Promise<
    Array<{
      habitId: string;
      habitName: string;
      previousStreak: number;
      missedDate: string;
    }>
  > {
    try {
      const { data, error } = await supabase.rpc('get_saveable_habits', {
        p_user_id: userId,
      });

      if (error) throw error;

      // ✅ Fetch habit frequencies to exclude weekly habits
      const habits = data || [];
      if (habits.length === 0) return [];

      const habitIds = habits.map((h: any) => h.habit_id);
      const { data: habitData } = await supabase
        .from('habits')
        .select('id, frequency')
        .in('id', habitIds);

      const frequencyMap = new Map(
        (habitData || []).map((h: any) => [h.id, h.frequency])
      );

      // ✅ Filter: only include habits with previousStreak >= 1 and NOT weekly
      return habits
        .filter((item: any) => {
          const frequency = frequencyMap.get(item.habit_id);
          const previousStreak = item.previous_streak || 0;

          // Exclude weekly habits (they don't break daily streaks)
          if (frequency === 'weekly') {
            Logger.debug(`⏭️ Excluding weekly habit: ${item.habit_name}`);
            return false;
          }

          // Exclude habits with previousStreak < 1 (no active streak to save)
          if (previousStreak < 1) {
            Logger.debug(`⏭️ Excluding habit with streak 0: ${item.habit_name}`);
            return false;
          }

          return true;
        })
        .map((item: any) => ({
          habitId: item.habit_id,
          habitName: item.habit_name,
          previousStreak: item.previous_streak,
          missedDate: item.missed_date,
        }));
    } catch (error) {
      Logger.error('Error fetching saveable habits:', error);
      return [];
    }
  }
}
