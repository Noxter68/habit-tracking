// src/services/xpService.ts - WITH VALIDATION

import { supabase } from '../lib/supabase';

export interface XPTransaction {
  amount: number;
  source_type: 'habit_completion' | 'task_completion' | 'streak_bonus' | 'daily_challenge' | 'achievement_unlock' | 'milestone';
  source_id?: string;
  description?: string;
  habit_id?: string;
}

export class XPService {
  static async awardXP(userId: string, transaction: XPTransaction): Promise<boolean> {
    try {
      // ✅ CRITICAL VALIDATION: Ensure amount exists and is a number
      if (transaction.amount === undefined || transaction.amount === null || typeof transaction.amount !== 'number') {
        console.error('❌ XP amount is invalid:', transaction.amount);
        console.error('Full transaction:', JSON.stringify(transaction, null, 2));
        throw new Error(`Invalid XP amount: ${transaction.amount}`);
      }

      const toUuidOrNull = (value?: string): string | null => {
        if (!value) return null;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) return value;
        console.warn(`Invalid UUID format for value: ${value}`);
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

      console.log('✅ Calling award_xp with params:', JSON.stringify(params, null, 2));

      const { error } = await supabase.rpc('award_xp', params);

      if (error) {
        console.error('❌ Error awarding XP:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ XP awarded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in awardXP:', error);
      return false;
    }
  }

  static async collectDailyChallenge(userId: string): Promise<{
    success: boolean;
    xpEarned: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: challenge, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      if (error || !challenge) {
        console.log('No daily challenge found for today');
        return { success: false, xpEarned: 0 };
      }

      if (challenge.xp_collected) {
        console.log('Daily challenge already collected');
        return { success: false, xpEarned: 0 };
      }

      if (!challenge.total_tasks || challenge.completed_tasks < challenge.total_tasks) {
        console.log('Daily challenge not complete');
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
      console.error('Error in collectDailyChallenge:', error);
      return { success: false, xpEarned: 0 };
    }
  }

  static async awardHabitXP(userId: string, habitId: string, amount: number, description?: string): Promise<boolean> {
    return await this.awardXP(userId, {
      amount,
      source_type: 'habit_completion',
      source_id: habitId,
      description: description || 'Habit completion',
      habit_id: habitId,
    });
  }

  static async awardMilestoneXP(userId: string, habitId: string, milestone: { title: string; xpReward: number }): Promise<boolean> {
    return await this.awardXP(userId, {
      amount: milestone.xpReward,
      source_type: 'achievement_unlock',
      source_id: habitId,
      description: `Milestone achieved: ${milestone.title}`,
      habit_id: habitId,
    });
  }

  static async getUserXPStats(userId: string) {
    try {
      const { data, error } = await supabase.from('user_xp_stats').select('*').eq('user_id', userId).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching XP stats:', error);
        const { data: profile } = await supabase.from('profiles').select('id, total_xp, current_level, level_progress').eq('id', userId).single();

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
      console.error('Error in getUserXPStats:', error);
      return null;
    }
  }

  static async getDailyChallengeStatus(userId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily challenge:', error);
      }

      return data || null;
    } catch (error) {
      console.error('Error in getDailyChallengeStatus:', error);
      return null;
    }
  }
}
