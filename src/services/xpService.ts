// src/services/xpService.ts
import { supabase } from '../lib/supabase';

export interface XPTransaction {
  amount: number;
  source_type: 'habit_completion' | 'task_completion' | 'streak_bonus' | 'daily_challenge' | 'weekly_quest' | 'achievement_unlock' | 'special_event';
  source_id?: string;
  description?: string;
}

export interface UserXPStats {
  user_id: string;
  total_xp: number;
  current_level: number;
  level_progress: number;
  xp_for_next_level: number;
  current_level_xp: number;
  daily_challenge_collected: boolean;
  daily_tasks_completed: number;
  daily_tasks_total: number;
}

interface DailyChallenge {
  id: string;
  user_id: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  xp_collected: boolean;
  created_at: string;
  updated_at: string;
}

export class XPService {
  /**
   * Get user's current XP stats
   */
  static async getUserXPStats(userId: string): Promise<UserXPStats | null> {
    try {
      const { data, error } = await supabase.from('user_xp_stats').select('*').eq('user_id', userId).single();

      if (error) {
        console.error('Error fetching XP stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserXPStats:', error);
      return null;
    }
  }

  /**
   * Award XP to a user
   */
  static async awardXP(userId: string, transaction: XPTransaction): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: transaction.amount,
        p_source_type: transaction.source_type,
        p_source_id: transaction.source_id || null,
        p_description: transaction.description || null,
      });

      if (error) {
        console.error('Error awarding XP:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in awardXP:', error);
      return false;
    }
  }

  /**
   * Calculate XP for habit completion
   */
  static calculateHabitXP(habitType: 'good' | 'bad', tasksCompleted: number, currentStreak: number): number {
    let baseXP = 0;
    let taskXP = 0;
    let streakBonus = 0;

    // Base XP
    if (habitType === 'good') {
      baseXP = tasksCompleted === 0 ? 5 : 3;
    } else {
      baseXP = tasksCompleted === 0 ? 8 : 5;
    }

    // Task XP
    taskXP = tasksCompleted * 2;

    // Streak bonus
    if (currentStreak >= 60) {
      streakBonus = 50;
    } else if (currentStreak >= 30) {
      streakBonus = 20;
    } else if (currentStreak >= 14) {
      streakBonus = 10;
    } else if (currentStreak >= 7) {
      streakBonus = 5;
    } else if (currentStreak >= 3) {
      streakBonus = 2;
    }

    return baseXP + taskXP + streakBonus;
  }

  /**
   * Complete a habit and award XP
   */
  static async completeHabit(userId: string, habitId: string, habitType: 'good' | 'bad', tasksCompleted: number, currentStreak: number): Promise<number> {
    const xpEarned = this.calculateHabitXP(habitType, tasksCompleted, currentStreak);

    const success = await this.awardXP(userId, {
      amount: xpEarned,
      source_type: 'habit_completion',
      source_id: habitId,
      description: `Completed ${habitType} habit with ${tasksCompleted} tasks`,
    });

    return success ? xpEarned : 0;
  }

  /**
   * Collect daily challenge XP
   */
  static async collectDailyChallenge(userId: string): Promise<boolean> {
    try {
      const challenge = await this.getDailyChallenge(userId);

      if (!challenge) return false;

      // Check if already collected
      if (challenge.xp_collected) return false;

      // Check if 100% complete
      if (challenge.completed_tasks < challenge.total_tasks) return false;

      // Award XP
      const success = await this.awardXP(userId, {
        amount: 20,
        source_type: 'daily_challenge',
        description: 'Perfect Day - All tasks completed!',
      });

      if (success) {
        // Mark as collected
        const { error } = await supabase
          .from('daily_challenges')
          .update({
            xp_collected: true,
            collected_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('date', challenge.date);

        if (error) {
          console.error('Error updating daily challenge:', error);
          return false;
        }
      }

      return success;
    } catch (error) {
      console.error('Error in collectDailyChallenge:', error);
      return false;
    }
  }

  /**
   * Update daily challenge progress
   */
  static async updateDailyProgress(userId: string, completedTasks: number, totalTasks: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('daily_challenges').upsert(
        {
          user_id: userId,
          date: today,
          completed_tasks: completedTasks,
          total_tasks: totalTasks,
          xp_collected: false,
        },
        {
          onConflict: 'user_id,date',
        }
      );

      if (error) {
        console.error('Error updating daily progress:', error);
      }
    } catch (error) {
      console.error('Error in updateDailyProgress:', error);
    }
  }

  /**
   * Get XP needed for a specific level
   */
  static getXPForLevel(level: number): number {
    if (level <= 10) {
      return 100 + (level - 1) * 10;
    } else if (level <= 20) {
      return 200 + (level - 11) * 15;
    } else if (level <= 30) {
      return 350 + (level - 21) * 20;
    } else {
      return 550 + (level - 31) * 25;
    }
  }

  /**
   * Calculate level from total XP
   */
  static calculateLevelFromXP(totalXP: number): number {
    let level = 1;
    let xpNeeded = 0;

    while (xpNeeded <= totalXP) {
      level++;
      xpNeeded += this.getXPForLevel(level - 1);
    }

    return level - 1;
  }

  /**
   * Get user's XP history
   */
  static async getXPHistory(userId: string, limit: number = 10): Promise<XPTransaction[]> {
    try {
      const { data, error } = await supabase.from('xp_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('Error fetching XP history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getXPHistory:', error);
      return [];
    }
  }

  /**
   * Get weekly quests for user
   */
  static async getWeeklyQuests(userId: string) {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Get Sunday
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase.from('weekly_quests').select('*').eq('user_id', userId).eq('week_start', weekStart.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching weekly quests:', error);
        return [];
      }

      // If no quests exist, create them
      if (!data || data.length === 0) {
        return await this.createWeeklyQuests(userId);
      }

      return data;
    } catch (error) {
      console.error('Error in getWeeklyQuests:', error);
      return [];
    }
  }

  /**
   * Create weekly quests for user
   */
  static async createWeeklyQuests(userId: string) {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const quests = [
        {
          user_id: userId,
          week_start: weekStart.toISOString().split('T')[0],
          quest_type: 'perfect_week',
          progress: 0,
          target: 7,
          xp_reward: 100,
          completed: false,
          collected: false,
        },
        {
          user_id: userId,
          week_start: weekStart.toISOString().split('T')[0],
          quest_type: 'seven_day_streak',
          progress: 0,
          target: 7,
          xp_reward: 50,
          completed: false,
          collected: false,
        },
        {
          user_id: userId,
          week_start: weekStart.toISOString().split('T')[0],
          quest_type: 'morning_routine',
          progress: 0,
          target: 5,
          xp_reward: 30,
          completed: false,
          collected: false,
        },
      ];

      const { data, error } = await supabase.from('weekly_quests').insert(quests).select();

      if (error) {
        console.error('Error creating weekly quests:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in createWeeklyQuests:', error);
      return [];
    }
  }

  /**
   * Subscribe to XP updates
   */
  static subscribeToXPUpdates(userId: string, callback: (stats: UserXPStats) => void) {
    return supabase
      .channel(`xp_updates_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        async () => {
          const stats = await this.getUserXPStats(userId);
          if (stats) callback(stats);
        }
      )
      .subscribe();
  }

  static async createDailyChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // First check if a challenge already exists for today
      const { data: existingChallenge, error: checkError } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      // If challenge exists, update it with fresh data
      if (existingChallenge && !checkError) {
        return await this.updateDailyChallenge(userId, today);
      }

      // Calculate stats for new challenge
      const stats = await this.calculateDailyStats(userId, today);

      // Create new daily challenge record
      const { data, error } = await supabase
        .from('daily_challenges')
        .insert({
          user_id: userId,
          date: today,
          total_tasks: stats.totalTasks,
          completed_tasks: stats.completedTasks,
          xp_collected: false,
        })
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, fetch the existing record
        if (error.code === '23505') {
          console.log('Challenge already exists, fetching...');
          return await this.getDailyChallenge(userId, today);
        }
        console.error('Error creating daily challenge:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createDailyChallenge:', error);
      return null;
    }
  }

  /**
   * Get or create daily challenge (preferred method)
   */
  static async getOrCreateDailyChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Calculate current stats
      const stats = await this.calculateDailyStats(userId, today);

      // Upsert: insert if not exists, update if exists
      const { data, error } = await supabase
        .from('daily_challenges')
        .upsert(
          {
            user_id: userId,
            date: today,
            total_tasks: stats.totalTasks,
            completed_tasks: stats.completedTasks,
            xp_collected: false, // Only set false on creation, not update
          },
          {
            onConflict: 'user_id,date',
            ignoreDuplicates: false, // This will update existing records
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error upserting daily challenge:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateDailyChallenge:', error);
      return null;
    }
  }

  /**
   * Update existing daily challenge with fresh stats
   */
  static async updateDailyChallenge(userId: string, date?: string): Promise<DailyChallenge | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const stats = await this.calculateDailyStats(userId, targetDate);

      const { data, error } = await supabase
        .from('daily_challenges')
        .update({
          total_tasks: stats.totalTasks,
          completed_tasks: stats.completedTasks,
          // Don't update xp_collected here - preserve existing value
        })
        .eq('user_id', userId)
        .eq('date', targetDate)
        .select()
        .single();

      if (error) {
        console.error('Error updating daily challenge:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateDailyChallenge:', error);
      return null;
    }
  }

  /**
   * Get existing daily challenge
   */
  static async getDailyChallenge(userId: string, date?: string): Promise<DailyChallenge | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', targetDate).single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error fetching daily challenge:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in getDailyChallenge:', error);
      return null;
    }
  }

  /**
   * Calculate daily stats (extracted for reusability)
   */
  private static async calculateDailyStats(userId: string, date: string) {
    // Get total tasks for today
    const { data: habits } = await supabase.from('habits').select('id, tasks').eq('user_id', userId);

    let totalTasks = 0;
    if (habits) {
      habits.forEach((habit) => {
        totalTasks += habit.tasks ? habit.tasks.length : 1;
      });
    }

    // Get completed tasks for today
    const { data: completions } = await supabase.from('task_completions').select('completed_tasks, all_completed').eq('user_id', userId).eq('date', date);

    let completedTasks = 0;
    if (completions) {
      completions.forEach((completion) => {
        if (completion.all_completed) {
          completedTasks += completion.completed_tasks?.length || 1;
        } else {
          // If not all completed, count the actual completed tasks
          completedTasks += completion.completed_tasks?.length || 0;
        }
      });
    }

    return { totalTasks, completedTasks };
  }

  /**
   * Mark XP as collected for today's challenge
   */
  static async collectDailyXP(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('daily_challenges').update({ xp_collected: true }).eq('user_id', userId).eq('date', today).eq('xp_collected', false); // Only update if not already collected

      return !error;
    } catch (error) {
      console.error('Error collecting daily XP:', error);
      return false;
    }
  }
}
