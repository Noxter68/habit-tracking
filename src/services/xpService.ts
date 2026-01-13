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

/**
 * Calcule l'XP progressif basé sur le niveau de l'utilisateur
 * Les tiers sont de 5 niveaux chacun avec une progression de 20 XP par tier
 *
 * Tier 1 (1-5):   20 XP
 * Tier 2 (6-10):  40 XP
 * Tier 3 (11-15): 60 XP
 * Tier 4 (16-20): 80 XP
 * Tier 5 (21-25): 100 XP
 * Tier 6 (26-30): 120 XP
 * Tier 7 (31+):   140 XP
 *
 * @param level - Le niveau actuel de l'utilisateur
 * @returns Le montant d'XP à attribuer
 */
export const getProgressiveXPReward = (level: number): number => {
  const tier = Math.floor((level - 1) / 5);
  const baseXP = 20;
  const xpPerTier = 20;
  return baseXP + (tier * xpPerTier);
};

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
   * L'XP est progressif selon le niveau de l'utilisateur:
   * - Tier 1 (1-5):   20 XP
   * - Tier 2 (6-10):  40 XP
   * - Tier 3 (11-15): 60 XP
   * - Tier 4 (16-20): 80 XP
   * - Tier 5 (21-25): 100 XP
   * - Tier 6 (26-30): 120 XP
   * - Tier 7 (31+):   140 XP
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param userLevel - Le niveau actuel de l'utilisateur (defaut: 1)
   * @returns Le resultat de la collection
   */
  static async collectDailyChallenge(userId: string, userLevel: number = 1): Promise<{
    success: boolean;
    xpEarned: number;
  }> {
    try {
      const today = getTodayString();

      // 1. Check if already collected today
      const { data: existingChallenge } = await supabase
        .from('daily_challenges')
        .select('id, xp_collected')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (existingChallenge?.xp_collected) {
        Logger.debug('Daily challenge already collected');
        return { success: false, xpEarned: 0 };
      }

      // 2. Calculate stats from daily habits only (not weekly)
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, tasks, frequency')
        .eq('user_id', userId);

      if (habitsError || !habits) {
        Logger.error('Error fetching habits:', habitsError);
        return { success: false, xpEarned: 0 };
      }

      // Filter only daily habits
      const dailyHabits = habits.filter(h => h.frequency === 'daily');

      if (dailyHabits.length === 0) {
        Logger.debug('No daily habits found');
        return { success: false, xpEarned: 0 };
      }

      const dailyHabitIds = dailyHabits.map(h => h.id);

      // 3. Get today's completions for daily habits
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('habit_id, completed_tasks')
        .eq('user_id', userId)
        .eq('date', today)
        .in('habit_id', dailyHabitIds);

      if (completionsError) {
        Logger.error('Error fetching completions:', completionsError);
        return { success: false, xpEarned: 0 };
      }

      // 4. Calculate totals
      let totalDailyTasks = 0;
      let completedDailyTasks = 0;

      dailyHabits.forEach(habit => {
        const taskCount = Array.isArray(habit.tasks) ? habit.tasks.length : 0;
        totalDailyTasks += taskCount;

        const completion = completions?.find(c => c.habit_id === habit.id);
        if (completion?.completed_tasks) {
          completedDailyTasks += Array.isArray(completion.completed_tasks)
            ? completion.completed_tasks.length
            : 0;
        }
      });

      // 5. Check if all daily tasks are complete
      if (totalDailyTasks === 0 || completedDailyTasks < totalDailyTasks) {
        return { success: false, xpEarned: 0 };
      }

      // 6. XP progressif basé sur le niveau
      const baseXpAmount = getProgressiveXPReward(userLevel);

      // 6b. Check for active boost to calculate display amount
      const { data: activeBoost } = await supabase
        .from('active_boosts')
        .select('boost_percent')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single();

      const boostMultiplier = activeBoost?.boost_percent
        ? 1 + activeBoost.boost_percent / 100
        : 1;
      const xpWithBoost = Math.ceil(baseXpAmount * boostMultiplier);

      // 7. Award XP (SQL will also apply boost, but we need the value for display)
      const success = await this.awardXP(userId, {
        amount: baseXpAmount,
        source_type: 'daily_challenge',
        source_id: existingChallenge?.id || `daily_${today}`,
        description: `Perfect Day - All tasks completed! (Level ${userLevel} bonus)`,
      });

      if (success) {
        // 8. Update or insert daily_challenges record
        if (existingChallenge?.id) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('daily_challenges')
            .update({
              total_tasks: totalDailyTasks,
              completed_tasks: completedDailyTasks,
              xp_collected: true,
              collected_at: new Date().toISOString(),
            })
            .eq('id', existingChallenge.id);

          if (updateError) {
            Logger.error('Error updating daily challenge:', updateError);
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('daily_challenges')
            .insert({
              user_id: userId,
              date: today,
              total_tasks: totalDailyTasks,
              completed_tasks: completedDailyTasks,
              xp_collected: true,
              collected_at: new Date().toISOString(),
            });

          if (insertError) {
            Logger.error('Error inserting daily challenge:', insertError);
          }
        }

        return { success: true, xpEarned: xpWithBoost };
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
