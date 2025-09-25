// src/services/xpService.ts
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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

// NEW: XP Breakdown for detailed feedback
export interface XPBreakdown {
  base: number;
  tasks: number;
  streak: number;
  tier: number;
  milestone: number;
  total: number;
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
   * KEPT: Your existing implementation works perfectly
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
   * KEPT: Your existing implementation
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
   * ENHANCED: Calculate XP for habit completion with detailed breakdown
   * This replaces your simple calculateHabitXP with a more detailed version
   * that supports the new tier system
   */
  static calculateHabitXP(habitType: 'good' | 'bad', tasksCompleted: number, totalTasks: number, currentStreak: number, tierMultiplier: number = 1.0): XPBreakdown {
    const breakdown: XPBreakdown = {
      base: 0,
      tasks: 0,
      streak: 0,
      tier: 0,
      milestone: 0,
      total: 0,
    };

    // Base XP (your existing logic, slightly enhanced)
    if (habitType === 'good') {
      breakdown.base = totalTasks === 0 ? 5 : 10;
    } else {
      breakdown.base = totalTasks === 0 ? 8 : 15; // Bad habits are harder
    }

    // Task XP (enhanced from your 2 XP per task)
    breakdown.tasks = tasksCompleted * 3;

    // Bonus for completing ALL tasks
    if (tasksCompleted === totalTasks && totalTasks > 0) {
      breakdown.tasks += 10; // Perfect completion bonus
    }

    // Streak bonus (your existing logic)
    if (currentStreak >= 60) {
      breakdown.streak = 50;
    } else if (currentStreak >= 30) {
      breakdown.streak = 20;
    } else if (currentStreak >= 14) {
      breakdown.streak = 10;
    } else if (currentStreak >= 7) {
      breakdown.streak = 5;
    } else if (currentStreak >= 3) {
      breakdown.streak = 2;
    }

    // NEW: Apply tier multiplier from habit progression
    const baseTotal = breakdown.base + breakdown.tasks + breakdown.streak;
    breakdown.tier = Math.floor(baseTotal * (tierMultiplier - 1));

    // Calculate total
    breakdown.total = baseTotal + breakdown.tier + breakdown.milestone;

    return breakdown;
  }

  /**
   * ENHANCED: Complete a habit and award XP with detailed breakdown
   * This enhances your existing completeHabit method
   */
  static async completeHabitWithBreakdown(
    userId: string,
    habitId: string,
    habitType: 'good' | 'bad',
    tasksCompleted: number,
    totalTasks: number,
    currentStreak: number,
    tierMultiplier: number = 1.0
  ): Promise<{ success: boolean; xpEarned: number; breakdown: XPBreakdown }> {
    const breakdown = this.calculateHabitXP(habitType, tasksCompleted, totalTasks, currentStreak, tierMultiplier);

    const success = await this.awardXP(userId, {
      amount: breakdown.total,
      source_type: 'habit_completion',
      source_id: habitId,
      description: `Completed ${habitType} habit: ${tasksCompleted}/${totalTasks} tasks, ${currentStreak} day streak`,
    });

    return {
      success,
      xpEarned: success ? breakdown.total : 0,
      breakdown,
    };
  }

  /**
   * KEPT: Your existing completeHabit for backward compatibility
   */
  static async completeHabit(userId: string, habitId: string, habitType: 'good' | 'bad', tasksCompleted: number, currentStreak: number): Promise<number> {
    // Use the old calculation for backward compatibility
    const xpEarned = this.calculateHabitXP(habitType, tasksCompleted, tasksCompleted, currentStreak, 1.0).total;

    const success = await this.awardXP(userId, {
      amount: xpEarned,
      source_type: 'habit_completion',
      source_id: habitId,
      description: `Completed ${habitType} habit with ${tasksCompleted} tasks`,
    });

    return success ? xpEarned : 0;
  }

  /**
   * NEW: Award milestone XP (called by HabitProgressionService)
   */
  static async awardMilestoneXP(userId: string, habitId: string, milestone: { title: string; xpReward: number }): Promise<boolean> {
    return await this.awardXP(userId, {
      amount: milestone.xpReward,
      source_type: 'achievement_unlock',
      source_id: habitId,
      description: `Milestone achieved: ${milestone.title}`,
    });
  }

  /**
   * NEW: Get XP preview before completing tasks
   * Shows users how much XP they'll earn
   */
  static getXPPreview(habitType: 'good' | 'bad', tasksToComplete: number, totalTasks: number, currentStreak: number, wouldCompleteDay: boolean, tierMultiplier: number = 1.0): number {
    const streakForCalc = wouldCompleteDay ? currentStreak + 1 : currentStreak;
    const breakdown = this.calculateHabitXP(habitType, tasksToComplete, totalTasks, streakForCalc, tierMultiplier);
    return breakdown.total;
  }

  /**
   * KEPT: Collect daily challenge XP
   */
  static async collectDailyChallenge(userId: string): Promise<boolean> {
    try {
      const challenge = await this.getDailyChallenge(userId);

      if (!challenge) return false;
      if (challenge.xp_collected) return false;
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
   * KEPT: Update daily challenge progress
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
   * KEPT: Get XP needed for a specific level
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
   * KEPT: Calculate level from total XP
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
   * KEPT: Get user's XP history
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
   * KEPT: All your weekly quest methods
   */
  static async getWeeklyQuests(userId: string) {
    try {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase.from('weekly_quests').select('*').eq('user_id', userId).eq('week_start', weekStart.toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching weekly quests:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return await this.createWeeklyQuests(userId);
      }

      return data;
    } catch (error) {
      console.error('Error in getWeeklyQuests:', error);
      return [];
    }
  }

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
   * ENHANCED: Subscribe to XP updates with multiple tables
   */
  static subscribeToXPUpdates(userId: string, callback: (stats: UserXPStats) => void): RealtimeChannel {
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_challenges',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const stats = await this.getUserXPStats(userId);
          if (stats) callback(stats);
        }
      )
      .subscribe();
  }

  /**
   * KEPT: All your daily challenge methods
   */
  static async createDailyChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingChallenge, error: checkError } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      if (existingChallenge && !checkError) {
        return await this.updateDailyChallenge(userId, today);
      }

      const stats = await this.calculateDailyStats(userId, today);

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

  static async getOrCreateDailyChallenge(userId: string): Promise<DailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await this.calculateDailyStats(userId, today);

      const { data, error } = await supabase
        .from('daily_challenges')
        .upsert(
          {
            user_id: userId,
            date: today,
            total_tasks: stats.totalTasks,
            completed_tasks: stats.completedTasks,
            xp_collected: false,
          },
          {
            onConflict: 'user_id,date',
            ignoreDuplicates: false,
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

  static async updateDailyChallenge(userId: string, date?: string): Promise<DailyChallenge | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const stats = await this.calculateDailyStats(userId, targetDate);

      const { data, error } = await supabase
        .from('daily_challenges')
        .update({
          total_tasks: stats.totalTasks,
          completed_tasks: stats.completedTasks,
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

  static async getDailyChallenge(userId: string, date?: string): Promise<DailyChallenge | null> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];

      const { data, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', targetDate).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily challenge:', error);
      }

      return data;
    } catch (error) {
      console.error('Error in getDailyChallenge:', error);
      return null;
    }
  }

  private static async calculateDailyStats(userId: string, date: string) {
    const { data: habits } = await supabase.from('habits').select('id, tasks').eq('user_id', userId);

    let totalTasks = 0;
    if (habits) {
      habits.forEach((habit) => {
        totalTasks += habit.tasks ? habit.tasks.length : 1;
      });
    }

    const { data: completions } = await supabase.from('task_completions').select('completed_tasks, all_completed').eq('user_id', userId).eq('date', date);

    let completedTasks = 0;
    if (completions) {
      completions.forEach((completion) => {
        if (completion.all_completed) {
          completedTasks += completion.completed_tasks?.length || 1;
        } else {
          completedTasks += completion.completed_tasks?.length || 0;
        }
      });
    }

    return { totalTasks, completedTasks };
  }

  static async collectDailyXP(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('daily_challenges').update({ xp_collected: true }).eq('user_id', userId).eq('date', today).eq('xp_collected', false);

      return !error;
    } catch (error) {
      console.error('Error collecting daily XP:', error);
      return false;
    }
  }
}
