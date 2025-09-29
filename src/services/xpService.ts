// src/services/xpService.ts - FIXED UUID HANDLING

import { supabase } from '../lib/supabase';

export interface XPTransaction {
  amount: number;
  source_type: 'habit_completion' | 'task_completion' | 'streak_bonus' | 'daily_challenge' | 'achievement_unlock' | 'milestone';
  source_id?: string; // Can be string, will convert to UUID if needed
  description?: string;
  habit_id?: string; // Can be string, will convert to UUID if needed
}

export class XPService {
  /**
   * Award XP to a user - handles UUID conversion
   */
  static async awardXP(userId: string, transaction: XPTransaction): Promise<boolean> {
    try {
      // Helper function to validate and format UUID
      const toUuidOrNull = (value?: string): string | null => {
        if (!value) return null;

        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(value)) {
          return value;
        }

        console.warn(`Invalid UUID format for value: ${value}`);
        return null;
      };

      // Prepare parameters with proper types
      const params = {
        p_user_id: userId,
        p_amount: transaction.amount,
        p_source_type: transaction.source_type,
        p_source_id: toUuidOrNull(transaction.source_id), // Convert to UUID or null
        p_description: transaction.description || null,
        p_habit_id: toUuidOrNull(transaction.habit_id), // Convert to UUID or null
      };

      console.log('Calling award_xp with params:', params);

      const { error } = await supabase.rpc('award_xp', params);

      if (error) {
        console.error('Error awarding XP:', error);
        return false;
      }

      console.log('XP awarded successfully');
      return true;
    } catch (error) {
      console.error('Error in awardXP:', error);
      return false;
    }
  }

  /**
   * Collect daily challenge XP
   */
  static async collectDailyChallenge(userId: string): Promise<{
    success: boolean;
    xpEarned: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get challenge status
      const { data: challenge, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      if (error || !challenge) {
        console.log('No daily challenge found for today');
        return { success: false, xpEarned: 0 };
      }

      // Validate challenge is ready to collect
      if (challenge.xp_collected) {
        console.log('Daily challenge already collected');
        return { success: false, xpEarned: 0 };
      }

      if (!challenge.total_tasks || challenge.completed_tasks < challenge.total_tasks) {
        console.log('Daily challenge not complete:', {
          completed: challenge.completed_tasks,
          total: challenge.total_tasks,
        });
        return { success: false, xpEarned: 0 };
      }

      // Award XP - challenge.id is already a UUID
      const xpAmount = 20;
      const success = await this.awardXP(userId, {
        amount: xpAmount,
        source_type: 'daily_challenge',
        source_id: challenge.id, // This is already a UUID from the database
        description: 'Perfect Day - All tasks completed!',
        // habit_id is not passed, will be null
      });

      if (success) {
        // Mark as collected
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

  /**
   * Award XP for habit completion
   */
  static async awardHabitXP(userId: string, habitId: string, amount: number, description?: string): Promise<boolean> {
    return await this.awardXP(userId, {
      amount,
      source_type: 'habit_completion',
      source_id: habitId, // habitId is a UUID
      description: description || 'Habit completion',
      habit_id: habitId,
    });
  }

  /**
   * Award milestone XP
   */
  static async awardMilestoneXP(userId: string, habitId: string, milestone: { title: string; xpReward: number }): Promise<boolean> {
    return await this.awardXP(userId, {
      amount: milestone.xpReward,
      source_type: 'achievement_unlock',
      source_id: habitId, // habitId is a UUID
      description: `Milestone achieved: ${milestone.title}`,
      habit_id: habitId,
    });
  }

  /**
   * Get user's current XP stats
   */
  static async getUserXPStats(userId: string) {
    try {
      // First try the view
      const { data, error } = await supabase.from('user_xp_stats').select('*').eq('user_id', userId).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching XP stats:', error);

        // Fallback to profiles table
        const { data: profile } = await supabase.from('profiles').select('id, total_xp, current_level, level_progress').eq('id', userId).single();

        if (profile) {
          return {
            user_id: profile.id,
            total_xp: profile.total_xp || 0,
            current_level: profile.current_level || 1,
            level_progress: profile.level_progress || 0,
            xp_for_next_level: 100, // Calculate based on level
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

  /**
   * Get today's daily challenge status
   */
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
