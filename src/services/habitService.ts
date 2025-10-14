// src/services/habitService.ts
import { supabase } from '../lib/supabase';
import { Habit, HabitProgression } from '../types';
import { HabitProgressionService } from './habitProgressionService';

export interface StreakHistoryEntry {
  date: string;
  streak_value: number;
  tasks_completed: number;
  total_tasks: number;
  completion_rate: number;
}

export class HabitService {
  /**
   * Toggle a specific task completion for a habit
   * Uses database-side protection to prevent XP exploitation
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
    completedTasks?: string[]; // Add this to return the updated tasks
  }> {
    try {
      console.log('Debug toggleTask:', {
        habitId,
        date,
        taskId,
        taskIdType: typeof taskId,
        taskIdValue: JSON.stringify(taskId),
      });

      // Call the protected database function
      const { data, error } = await supabase.rpc('toggle_task_with_xp_protection', {
        p_habit_id: habitId,
        p_user_id: userId,
        p_date: date,
        p_task_id: taskId,
      });

      if (error) {
        console.error('Error in toggle_task_with_xp_protection:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from toggle function');
      }

      const result = data[0];

      // The key fix: ensure completed_tasks is an array
      const completedTasks = Array.isArray(result.completed_tasks) ? result.completed_tasks : result.completed_tasks ? [result.completed_tasks] : [];

      console.log('Toggle result:', {
        success: result.success,
        xpEarned: result.xp_earned,
        completedTasks,
        allCompleted: result.all_completed,
      });

      // Handle day completion if all tasks are done
      let streakUpdated: number | undefined;
      let milestoneReached: string | undefined;

      if (result.all_completed) {
        // ... existing streak handling code ...
      }

      console.log('Debug toggleTask:', { habitId, date, taskId });
      console.log('Toggle result:', result);

      return {
        success: result.success,
        xpEarned: result.xp_earned || 0,
        allTasksComplete: result.all_completed || false,
        alreadyEarnedXP: result.already_earned || false,
        completedTasks: completedTasks,
        milestoneReached,
        streakUpdated,
      };
    } catch (error) {
      console.error('Error toggling task:', error);
      return {
        success: false,
        xpEarned: 0,
        allTasksComplete: false,
        completedTasks: [], // Return empty array on error
      };
    }
  }
  /**
   * Get XP history for a specific date
   * Useful for debugging and showing user their XP earned
   */
  static async getDailyXPHistory(
    userId: string,
    date: string
  ): Promise<
    {
      habitId: string;
      taskId: string;
      xpAmount: number;
      awardedAt: Date;
    }[]
  > {
    try {
      const { data, error } = await supabase.from('daily_task_xp').select('habit_id, task_id, xp_amount, awarded_at').eq('user_id', userId).eq('date', date).order('awarded_at', { ascending: false });

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
      console.error('Error fetching daily XP history:', error);
      return [];
    }
  }

  /**
   * Check if a task has already earned XP today
   * Useful for UI indicators
   */
  static async hasEarnedXPToday(userId: string, habitId: string, taskId: string, date: string): Promise<boolean> {
    try {
      const { count, error } = await supabase.from('daily_task_xp').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('habit_id', habitId).eq('task_id', taskId).eq('date', date);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking XP status:', error);
      return false;
    }
  }

  /**
   * Handle when all tasks for a day are completed
   */
  static async handleDayCompletion(habitId: string, userId: string, date: string, currentStreakFromHabit: number): Promise<number> {
    try {
      // Calculate streaks
      const { currentStreak, bestStreak } = await this.calculateStreaks(habitId, userId, date, true);

      // Update streaks in habits table
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

      // Determine new tier
      const { tier, progress } = HabitProgressionService.calculateTierFromStreak(currentStreak);

      // Update habit progression
      await supabase
        .from('habit_progression')
        .update({
          current_tier: tier.name, // "Crystal" | "Ruby" | "Amethyst"
          xp_multiplier: tier.multiplier,
          tier_progress: progress,
          perfect_days: supabase.rpc('increment_perfect_days', { p_habit_id: habitId, p_user_id: userId }), // optional helper function
          updated_at: new Date().toISOString(),
        })
        .eq('habit_id', habitId)
        .eq('user_id', userId);

      return currentStreak;
    } catch (error) {
      console.error('Error handling day completion:', error);
      return currentStreakFromHabit;
    }
  }

  // Helper methods
  static getTierFromStreak(streak: number): string {
    if (streak >= 100) return 'Legendary';
    if (streak >= 60) return 'Master';
    if (streak >= 30) return 'Expert';
    if (streak >= 14) return 'Adept';
    if (streak >= 7) return 'Novice';
    return 'Beginner';
  }

  static getTierMultiplier(tier: string): number {
    const multipliers: Record<string, number> = {
      Legendary: 2.0,
      Master: 1.75,
      Expert: 1.5,
      Adept: 1.25,
      Novice: 1.1,
      Beginner: 1.0,
    };
    return multipliers[tier] || 1.0;
  }

  static calculateTierProgress(streak: number, currentTier: string): number {
    const tierThresholds: Record<string, { min: number; max: number }> = {
      Beginner: { min: 0, max: 7 },
      Novice: { min: 7, max: 14 },
      Adept: { min: 14, max: 30 },
      Expert: { min: 30, max: 60 },
      Master: { min: 60, max: 100 },
      Legendary: { min: 100, max: 200 },
    };

    const threshold = tierThresholds[currentTier];
    if (!threshold) return 0;

    const range = threshold.max - threshold.min;
    const progress = streak - threshold.min;
    return Math.min(100, Math.round((progress / range) * 100));
  }

  /**
   * Get habit progression data
   */
  static async getHabitProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase.from('habit_progression').select('*').eq('habit_id', habitId).eq('user_id', userId).single();

      if (error) {
        console.error('Error fetching habit progression:', error);
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
      console.error('Error in getHabitProgression:', error);
      return null;
    }
  }

  /**
   * Fetch all habits
   */
  static async fetchHabits(userId: string): Promise<Habit[]> {
    try {
      const { data: habitsData, error } = await supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (error) throw error;
      if (!habitsData) return [];

      const habitIds = habitsData.map((h) => h.id);
      const { data: completions } = await supabase.from('task_completions').select('*').in('habit_id', habitIds);

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
          currentStreak: habit.current_streak || 0, // ✅ EXPLICITLY MAP THIS
          bestStreak: habit.best_streak || 0,
          createdAt: new Date(habit.created_at),
        };
      });
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  }

  /**
   * Create a new habit
   */
  static async createHabit(habit: Habit, userId: string): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name: habit.name,
        type: habit.type,
        category: habit.category,
        tasks: habit.tasks,
        frequency: habit.frequency,
        custom_days: habit.customDays,
        notifications: habit.notifications,
        notification_time: habit.notificationTime,
        has_end_goal: habit.hasEndGoal,
        end_goal_days: habit.endGoalDays,
        total_days: habit.totalDays,
        current_streak: habit.currentStreak,
        best_streak: habit.bestStreak,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...habit,
      id: data.id,
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Update habit
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

  // Update notification settings
  static async updateHabitNotification(habitId: string, userId: string, enabled: boolean, time?: string): Promise<void> {
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
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  // Update task completion
  static async updateTaskCompletion(habitId: string, userId: string, date: string, completedTasks: string[], totalTasks: number): Promise<void> {
    try {
      const allCompleted = completedTasks.length === totalTasks && totalTasks > 0;

      // Check if a record exists
      const { data: existing, error: fetchError } = await supabase.from('task_completions').select('id').eq('habit_id', habitId).eq('date', date).single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            completed_tasks: completedTasks,
            all_completed: allCompleted,
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase.from('task_completions').insert({
          habit_id: habitId,
          user_id: userId,
          date,
          completed_tasks: completedTasks,
          all_completed: allCompleted,
        });

        if (insertError) throw insertError;
      }

      // Update streak in habits table
      await this.updateStreak(habitId, userId);
    } catch (error) {
      console.error('Error updating task completion:', error);
      throw error;
    }
  }

  // Calculate streaks with better logic
  // In src/services/habitService.ts
  static async calculateStreaks(habitId: string, userId: string, date: string, allCompleted: boolean): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      // ✅ Get ALL completions (any progress counts for streak)
      const { data: completions, error } = await supabase
        .from('task_completions')
        .select('date, all_completed')
        .eq('habit_id', habitId)
        // ✅ REMOVE: .eq('all_completed', true)
        .order('date', { ascending: false });

      if (error) throw error;

      let currentStreak = 0;
      let bestStreak = 0;

      if (completions && completions.length > 0) {
        const today = new Date().toISOString().split('T')[0];

        // ✅ Get unique dates (any progress on that day)
        const dates = [...new Set(completions.map((c) => c.date))];

        // Calculate current streak - check if we have activity today or yesterday
        const todayHasProgress = dates.includes(today) || date === today;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayHasProgress = dates.includes(yesterdayStr);

        // Start counting if today OR yesterday has progress
        if (todayHasProgress || yesterdayHasProgress) {
          currentStreak = 1;

          // Start from yesterday if today has no progress
          let startDay = todayHasProgress ? 0 : 1;

          for (let i = 1; i < 365; i++) {
            const checkDate = new Date();
            checkDate.setDate(checkDate.getDate() - (i + startDay));
            const dateStr = checkDate.toISOString().split('T')[0];

            if (dates.includes(dateStr)) {
              currentStreak++;
            } else {
              break; // Stop at first gap
            }
          }
        }

        // Calculate best streak ever
        let tempStreak = 0;
        const sortedDates = [...dates].sort();

        for (let i = 0; i < sortedDates.length; i++) {
          if (i === 0) {
            tempStreak = 1;
          } else {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              tempStreak++;
            } else {
              tempStreak = 1;
            }
          }
          bestStreak = Math.max(bestStreak, tempStreak);
        }
      }

      return {
        currentStreak,
        bestStreak: Math.max(bestStreak, currentStreak),
      };
    } catch (error) {
      console.error('Error calculating streaks:', error);
      return { currentStreak: 0, bestStreak: 0 };
    }
  }

  /**
   * Update streak in habits table
   */
  static async updateStreak(habitId: string, userId: string): Promise<void> {
    try {
      const { currentStreak, bestStreak } = await this.calculateStreaks(habitId, userId, new Date().toISOString().split('T')[0], false);

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
      console.error('Error updating streak:', error);
    }
  }

  /**
   * Delete habit
   */
  static async deleteHabit(habitId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);
    if (error) throw error;
  }

  // Get streak history for a habit
  static async getStreakHistory(habitId: string, startDate?: string, endDate?: string): Promise<StreakHistoryEntry[]> {
    try {
      let query = supabase.from('streak_history').select('*').eq('habit_id', habitId).order('date', { ascending: false });

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
      console.error('Error fetching streak history:', error);
      return [];
    }
  }

  // Get aggregated stats for all habits
  static async getAggregatedStats(userId: string) {
    try {
      // Get all streak history for user
      const { data: streakHistory, error: streakError } = await supabase
        .from('streak_history')
        .select('date, completion_rate, tasks_completed')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (streakError) throw streakError;

      const { data: progressions } = await supabase.from('habit_progression').select('habit_xp, current_tier').eq('user_id', userId);

      const totalHabitXP = progressions?.reduce((sum, p) => sum + p.habit_xp, 0) || 0;

      // Get unique dates
      const uniqueDates = new Set(streakHistory?.map((h) => h.date) || []);
      const totalDaysTracked = uniqueDates.size;

      // Calculate total completions
      const totalCompletions = streakHistory?.reduce((sum, h) => sum + (h.tasks_completed || 0), 0) || 0;

      // Calculate average completion rate
      const avgRate = streakHistory?.length ? streakHistory.reduce((sum, h) => sum + (h.completion_rate || 0), 0) / streakHistory.length : 0;

      // Prepare streak data for visualization (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentStreaks = streakHistory?.filter((h) => new Date(h.date) >= thirtyDaysAgo) || [];

      // Group by date and get max completion rate
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
        totalHabitXP, // Add only if not already present
        habitsWithProgress: progressions?.length || 0, // Add only if not already present
      };
    } catch (error) {
      console.error('Error getting aggregated stats:', error);
      return {
        totalDaysTracked: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        streakData: [],
      };
    }
  }

  // Get count of active habits for a user
  static async getActiveHabitsCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting active habits count:', error);
      // If is_active field doesn't exist, get all habits
      try {
        const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId);

        if (error) throw error;
        return count || 0;
      } catch (fallbackError) {
        console.error('Error getting habits count:', fallbackError);
        return 0;
      }
    }
  }

  /**
   * Get today's stats for dashboard
   * Keep existing implementation - it's more robust
   */
  static async getTodayStats(userId: string): Promise<{
    completed: number;
    total: number;
    completionRate: number;
    // Add these aliases for compatibility if needed
    completedTasks?: number;
    totalTasks?: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all habits for the user
      const { data: habits, error: habitsError } = await supabase.from('habits').select('id, tasks').eq('user_id', userId);

      if (habitsError) throw habitsError;

      if (!habits || habits.length === 0) {
        return {
          completed: 0,
          total: 0,
          completionRate: 0,
          completedTasks: 0, // Alias for compatibility
          totalTasks: 0, // Alias for compatibility
        };
      }

      // Get today's completions
      const habitIds = habits.map((h) => h.id);
      const { data: completions, error: completionsError } = await supabase
        .from('task_completions')
        .select('habit_id, completed_tasks, all_completed')
        .eq('user_id', userId)
        .eq('date', today)
        .in('habit_id', habitIds);

      if (completionsError) throw completionsError;

      // Calculate totals
      let totalTasks = 0;
      let completedTasks = 0;

      habits.forEach((habit) => {
        const taskCount = Array.isArray(habit.tasks) ? habit.tasks.length : 0;
        totalTasks += taskCount;

        const completion = completions?.find((c) => c.habit_id === habit.id);
        if (completion && completion.completed_tasks) {
          completedTasks += Array.isArray(completion.completed_tasks) ? completion.completed_tasks.length : 0;
        }
      });

      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        completed: completedTasks,
        total: totalTasks,
        completionRate,
        completedTasks, // Alias for compatibility with new code
        totalTasks, // Alias for compatibility with new code
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
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
   * Check if user has completed all tasks for today
   */
  static async checkDailyChallenge(userId: string): Promise<{
    allComplete: boolean;
    totalXPAvailable: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await this.getTodayStats(userId);

      const allComplete = (todayStats.totalTasks ?? 0) > 0 && (todayStats.completedTasks ?? 0) === (todayStats.totalTasks ?? 0);
      // Daily challenge gives 100 XP bonus
      return {
        allComplete,
        totalXPAvailable: allComplete ? 100 : 0,
      };
    } catch (error) {
      console.error('Error checking daily challenge:', error);
      return { allComplete: false, totalXPAvailable: 0 };
    }
  }

  // Get weekly stats for a user
  static async getWeeklyStats(userId: string): Promise<{
    daysActive: number;
    totalCompletions: number;
    averageCompletionRate: number;
    streakDays: number;
  }> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Get completions for the past week
      const { data: completions, error } = await supabase.from('task_completions').select('date, all_completed, completed_tasks').eq('user_id', userId).gte('date', weekAgoStr).lte('date', today);

      if (error) throw error;

      if (!completions || completions.length === 0) {
        return {
          daysActive: 0,
          totalCompletions: 0,
          averageCompletionRate: 0,
          streakDays: 0,
        };
      }

      // Calculate stats
      const uniqueDates = new Set(completions.map((c) => c.date));
      const daysActive = uniqueDates.size;

      const totalCompletions = completions.reduce((sum, c) => {
        return sum + (Array.isArray(c.completed_tasks) ? c.completed_tasks.length : 0);
      }, 0);

      // Count days with all tasks completed
      const streakDays = completions.filter((c) => c.all_completed).length;

      // Calculate average completion rate
      const { data: habits, error: habitsError } = await supabase.from('habits').select('id, tasks').eq('user_id', userId);

      if (habitsError) throw habitsError;

      let totalPossibleTasks = 0;
      uniqueDates.forEach((date) => {
        habits?.forEach((habit) => {
          totalPossibleTasks += Array.isArray(habit.tasks) ? habit.tasks.length : 0;
        });
      });

      const averageCompletionRate = totalPossibleTasks > 0 ? Math.round((totalCompletions / totalPossibleTasks) * 100) : 0;

      return {
        daysActive,
        totalCompletions,
        averageCompletionRate,
        streakDays,
      };
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return {
        daysActive: 0,
        totalCompletions: 0,
        averageCompletionRate: 0,
        streakDays: 0,
      };
    }
  }

  // Check if user has any habits
  static async hasHabits(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId).limit(1);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking if user has habits:', error);
      return false;
    }
  }
}
