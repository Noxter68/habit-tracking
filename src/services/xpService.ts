/**
 * Service de gestion des points d'experience (XP)
 *
 * Ce service gere l'attribution des XP aux utilisateurs pour differentes actions:
 * completion d'habitudes, defis quotidiens, jalons atteints, etc.
 * Il inclut une validation stricte pour eviter les exploitations.
 *
 * @module XPService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { getTodayString } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Transaction XP
 */
export interface XPTransaction {
  amount: number;
  source_type: 'habit_completion' | 'task_completion' | 'streak_bonus' | 'daily_challenge' | 'achievement_unlock' | 'milestone';
  source_id?: string;
  description?: string;
  habit_id?: string;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des XP
 *
 * Gere l'attribution et le suivi des points d'experience
 */
export class XPService {
  // ===========================================================================
  // SECTION: Attribution des XP
  // ===========================================================================

  /**
   * Attribuer des XP a un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param transaction - Les details de la transaction XP
   * @returns Vrai si l'attribution a reussi
   */
  static async awardXP(userId: string, transaction: XPTransaction): Promise<boolean> {
    try {
      if (transaction.amount === undefined || transaction.amount === null || typeof transaction.amount !== 'number') {
        Logger.error('XP amount is invalid', { amount: transaction.amount, transaction });
        throw new Error(`Invalid XP amount: ${transaction.amount}`);
      }

      const toUuidOrNull = (value?: string): string | null => {
        if (!value) return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return value;
        Logger.warn(`Invalid UUID format for value: ${value}`);
        return null;
      };

      const params = {
        p_user_id: userId,
        p_amount: transaction.amount,
        p_source_type: transaction.source_type,
        p_source_id: toUuidOrNull(transaction.source_id),
        p_description: transaction.description || null,
        p_habit_id: toUuidOrNull(transaction.habit_id),
      };

      Logger.debug('Calling award_xp', { params });

      const { error } = await supabase.rpc('award_xp', params);

      if (error) {
        Logger.error('Failed to award XP', { error });
        return false;
      }

      Logger.success('XP awarded successfully');
      return true;
    } catch (error) {
      Logger.error('Error in awardXP', error);
      return false;
    }
  }

  /**
   * Attribuer des XP pour une completion d'habitude
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @param amount - Le montant d'XP
   * @param description - Description optionnelle
   * @returns Vrai si l'attribution a reussi
   */
  static async awardHabitXP(
    userId: string,
    habitId: string,
    amount: number,
    description?: string
  ): Promise<boolean> {
    return await this.awardXP(userId, {
      amount,
      source_type: 'habit_completion',
      source_id: habitId,
      description: description || 'Habit completion',
      habit_id: habitId,
    });
  }

  /**
   * Attribuer des XP pour un jalon atteint
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @param milestone - Les informations du jalon
   * @returns Vrai si l'attribution a reussi
   */
  static async awardMilestoneXP(
    userId: string,
    habitId: string,
    milestone: { title: string; xpReward: number }
  ): Promise<boolean> {
    return await this.awardXP(userId, {
      amount: milestone.xpReward,
      source_type: 'achievement_unlock',
      source_id: habitId,
      description: `Milestone achieved: ${milestone.title}`,
      habit_id: habitId,
    });
  }

  // ===========================================================================
  // SECTION: Defi quotidien
  // ===========================================================================

  /**
   * Collecter les XP du defi quotidien
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resultat de la collection
   */
  static async collectDailyChallenge(userId: string): Promise<{
    success: boolean;
    xpEarned: number;
  }> {
    try {
      const today = getTodayString();
      const { data: challenge, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error || !challenge) {
        Logger.debug('No daily challenge found for today');
        return { success: false, xpEarned: 0 };
      }

      if (challenge.xp_collected) {
        Logger.debug('Daily challenge already collected');
        return { success: false, xpEarned: 0 };
      }

      if (!challenge.total_tasks || challenge.completed_tasks < challenge.total_tasks) {
        Logger.debug('Daily challenge not complete');
        return { success: false, xpEarned: 0 };
      }

      const xpAmount = 20;
      const success = await this.awardXP(userId, {
        amount: xpAmount,
        source_type: 'daily_challenge',
        source_id: challenge.id,
        description: 'Perfect Day - All tasks completed!',
      });

      if (success) {
        await supabase
          .from('daily_challenges')
          .update({
            xp_collected: true,
            collected_at: new Date().toISOString(),
          })
          .eq('id', challenge.id);

        return { success: true, xpEarned: xpAmount };
      }

      return { success: false, xpEarned: 0 };
    } catch (error) {
      Logger.error('Error in collectDailyChallenge:', error);
      return { success: false, xpEarned: 0 };
    }
  }

  /**
   * Obtenir le statut du defi quotidien
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les donnees du defi ou null
   */
  static async getDailyChallengeStatus(userId: string) {
    try {
      const today = getTodayString();
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.error('Error fetching daily challenge:', error);
      }

      return data || null;
    } catch (error) {
      Logger.error('Error in getDailyChallengeStatus:', error);
      return null;
    }
  }

  // ===========================================================================
  // SECTION: Statistiques XP
  // ===========================================================================

  /**
   * Obtenir les statistiques XP de l'utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques XP ou null
   */
  static async getUserXPStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_xp_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        Logger.error('Error fetching XP stats:', error);
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, total_xp, current_level, level_progress')
          .eq('id', userId)
          .single();

        if (profile) {
          return {
            user_id: profile.id,
            total_xp: profile.total_xp || 0,
            current_level: profile.current_level || 1,
            level_progress: profile.level_progress || 0,
            xp_for_next_level: 100,
            current_level_xp: profile.level_progress || 0,
            daily_challenge_collected: false,
            daily_tasks_completed: 0,
            daily_tasks_total: 0,
          };
        }
      }

      return data;
    } catch (error) {
      Logger.error('Error in getUserXPStats:', error);
      return null;
    }
  }
}
