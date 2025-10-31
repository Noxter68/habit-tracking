// src/services/streakSaverService.ts
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

export interface StreakSaveEligibility {
  canSave: boolean;
  reason?: string;
  habitName?: string;
  previousStreak?: number;
  missedDate?: string;
}

export interface StreakSaverInventory {
  available: number;
  totalUsed: number;
}

export class StreakSaverService {
  static async getInventory(userId: string): Promise<StreakSaverInventory> {
    try {
      const { data, error } = await supabase.from('profiles').select('streak_savers, total_streak_savers_used').eq('id', userId).maybeSingle();

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

  static async checkEligibility(habitId: string, userId: string): Promise<StreakSaveEligibility> {
    try {
      const { data, error } = await supabase.rpc('check_streak_save_eligibility', {
        p_habit_id: habitId,
        p_user_id: userId,
      });

      if (error) throw error;

      // ✅ FIX: Database returns array, take first element
      const result = Array.isArray(data) ? data[0] : data;

      if (!result) {
        return { canSave: false, reason: 'No data returned' };
      }

      // ✅ FIX: Map snake_case to camelCase
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

  static async useStreakSaver(habitId: string, userId: string): Promise<{ success: boolean; message: string; newStreak?: number }> {
    try {
      const { data, error } = await supabase.rpc('use_streak_saver', {
        p_habit_id: habitId,
        p_user_id: userId,
      });

      if (error) throw error;

      // ✅ FIX: Database returns array, take first element
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

  static async addStreakSavers(userId: string, quantity: number): Promise<void> {
    const { error } = await supabase.rpc('add_streak_savers', {
      p_user_id: userId,
      p_quantity: quantity,
    });

    if (error) throw error;
  }

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

      // ✅ FIX: Map snake_case to camelCase
      return (data || []).map((item: any) => ({
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
