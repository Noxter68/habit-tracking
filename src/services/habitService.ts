// src/services/habitService.ts
import { supabase } from '../lib/supabase';
import { Habit, HabitProgression } from '../types';

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
   * This is the main entry point for task completion with XP calculation
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
  }> {
    try {
      // 1. Get current task completion state
      const { data: existingCompletion } = await supabase.from('task_completions').select('*').eq('habit_id', habitId).eq('user_id', userId).eq('date', date).single();

      // 2. Get habit details for calculations
      const { data: habit } = await supabase.from('habits').select('*').eq('id', habitId).single();

      if (!habit) throw new Error('Habit not found');

      let completedTasks = existingCompletion?.completed_tasks || [];
      let xpEarned = 0;
      let milestoneReached: string | undefined;

      // 3. Toggle the task (taskId is a string like "morning-routine")
      if (completedTasks.includes(taskId)) {
        // Remove task (uncomplete)
        completedTasks = completedTasks.filter((t: string) => t !== taskId);
      } else {
        // Add task (complete)
        completedTasks.push(taskId);
      }

      const allTasksComplete = completedTasks.length === habit.tasks.length;

      // 4. Calculate XP if completing (not uncompleting)
      if (!existingCompletion?.completed_tasks?.includes(taskId) && completedTasks.includes(taskId)) {
        // Use the enhanced function with tier multiplier
        const { data: xpData } = await supabase.rpc('calculate_habit_xp_with_tier', {
          p_habit_type: habit.type,
          p_tasks_completed: completedTasks.length,
          p_current_streak: habit.current_streak,
          p_habit_id: habitId,
        });

        xpEarned = xpData || 10; // Fallback XP

        // Award XP to user
        await supabase.rpc('award_xp', {
          p_user_id: userId,
          p_amount: xpEarned,
          p_source_type: 'task_completion',
          p_source_id: habitId,
          p_description: `${habit.name} - Task completed`,
          p_habit_id: habitId,
        });
      }

      // 5. Update or create task completion record
      if (existingCompletion) {
        await supabase
          .from('task_completions')
          .update({
            completed_tasks: completedTasks,
            all_completed: allTasksComplete,
            xp_earned: existingCompletion.xp_earned + xpEarned,
            streak_at_completion: habit.current_streak,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCompletion.id);
      } else {
        await supabase.from('task_completions').insert({
          habit_id: habitId,
          user_id: userId,
          date,
          completed_tasks: completedTasks,
          all_completed: allTasksComplete,
          xp_earned: xpEarned,
          streak_at_completion: habit.current_streak,
        });
      }

      // 6. Handle day completion (all tasks done)
      let streakUpdated: number | undefined;
      if (allTasksComplete && !existingCompletion?.all_completed) {
        streakUpdated = await this.handleDayCompletion(habitId, userId, date, habit.current_streak);

        // Check for milestone rewards
        const { data: milestoneData } = await supabase.rpc('check_and_award_milestone_xp', {
          p_habit_id: habitId,
          p_user_id: userId,
          p_current_streak: streakUpdated,
        });

        if (milestoneData > 0) {
          // Get the milestone name for feedback
          const { data: milestone } = await supabase.from('habit_milestones').select('title').eq('days', streakUpdated).single();

          milestoneReached = milestone?.title;
        }
      }

      return {
        success: true,
        xpEarned,
        allTasksComplete,
        milestoneReached,
        streakUpdated,
      };
    } catch (error) {
      console.error('Error toggling task:', error);
      return {
        success: false,
        xpEarned: 0,
        allTasksComplete: false,
      };
    }
  }

  /**
   * Handle when all tasks for a day are completed
   */
  private static async handleDayCompletion(habitId: string, userId: string, date: string, currentStreak: number): Promise<number> {
    try {
      // 1. Update streak
      const newStreak = currentStreak + 1;

      // First, get current best streak
      const { data: habitData } = await supabase.from('habits').select('best_streak').eq('id', habitId).single();

      const { error: streakError } = await supabase
        .from('habits')
        .update({
          current_streak: newStreak,
          best_streak: Math.max(habitData?.best_streak || 0, newStreak),
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId);

      if (streakError) throw streakError;

      // 2. Award day completion bonus XP
      await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: 25, // Day completion bonus
        p_source_type: 'habit_completion',
        p_source_id: habitId,
        p_description: 'All tasks completed for the day!',
        p_habit_id: habitId,
      });

      // 3. Update habit progression tier
      await supabase.rpc('update_habit_progression', {
        p_habit_id: habitId,
        p_user_id: userId,
        p_xp_amount: 25,
      });

      return newStreak;
    } catch (error) {
      console.error('Error handling day completion:', error);
      return currentStreak;
    }
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

  // Fetch all habits for the current user
  static async fetchHabits(userId: string): Promise<Habit[]> {
    try {
      const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (habitsError) throw habitsError;

      // Fetch task completions for all habits
      const habitIds = habitsData?.map((h) => h.id) || [];
      const { data: completions, error: completionsError } = await supabase.from('task_completions').select('*').in('habit_id', habitIds);

      if (completionsError) throw completionsError;

      // Transform to Habit type with daily tasks
      const habits: Habit[] =
        habitsData?.map((habit) => {
          const habitCompletions = completions?.filter((c) => c.habit_id === habit.id) || [];

          const dailyTasks: any = {};
          const completedDays: string[] = [];

          habitCompletions.forEach((completion) => {
            dailyTasks[completion.date] = {
              completedTasks: completion.completed_tasks,
              allCompleted: completion.all_completed,
            };
            if (completion.all_completed) {
              completedDays.push(completion.date);
            }
          });

          return {
            id: habit.id,
            name: habit.name,
            type: habit.type,
            category: habit.category,
            tasks: habit.tasks,
            dailyTasks,
            frequency: habit.frequency,
            customDays: habit.custom_days,
            notifications: habit.notifications,
            notificationTime: habit.notification_time,
            hasEndGoal: habit.has_end_goal,
            endGoalDays: habit.end_goal_days,
            totalDays: habit.total_days,
            currentStreak: habit.current_streak,
            bestStreak: habit.best_streak,
            completedDays,
            createdAt: new Date(habit.created_at),
          };
        }) || [];

      return habits;
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  }

  // Create a new habit
  static async createHabit(habit: Habit, userId: string): Promise<Habit> {
    try {
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
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  // Update habit
  static async updateHabit(habitId: string, userId: string, updates: Partial<Habit>): Promise<void> {
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: updates.name,
          type: updates.type,
          category: updates.category,
          tasks: updates.tasks,
          frequency: updates.frequency,
          custom_days: updates.customDays,
          notifications: updates.notifications,
          notification_time: updates.notificationTime,
          has_end_goal: updates.hasEndGoal,
          end_goal_days: updates.endGoalDays,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
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
  static async calculateStreaks(habitId: string, userId: string, date: string, allCompleted: boolean): Promise<{ currentStreak: number; bestStreak: number }> {
    try {
      // Get all completions for this habit
      const { data: completions, error } = await supabase.from('task_completions').select('date, all_completed').eq('habit_id', habitId).eq('all_completed', true).order('date', { ascending: false });

      if (error) throw error;

      let currentStreak = 0;
      let bestStreak = 0;

      if (completions && completions.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const dates = completions.map((c) => c.date);

        // Calculate current streak
        if (dates.includes(today) || (date === today && allCompleted)) {
          currentStreak = 1;
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          for (let i = 1; i < 365; i++) {
            const checkDate = new Date(yesterday);
            checkDate.setDate(checkDate.getDate() - (i - 1));
            const dateStr = checkDate.toISOString().split('T')[0];

            if (dates.includes(dateStr)) {
              currentStreak++;
            } else {
              break;
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
            const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

  // Update streak
  static async updateStreak(habitId: string, userId: string): Promise<void> {
    try {
      const { currentStreak, bestStreak } = await this.calculateStreaks(habitId, userId, new Date().toISOString().split('T')[0], false);

      // Update habit with new streaks
      const { error: updateError } = await supabase
        .from('habits')
        .update({
          current_streak: currentStreak,
          best_streak: bestStreak,
          updated_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Delete habit
  static async deleteHabit(habitId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
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

      const allComplete = todayStats.totalTasks > 0 && todayStats.completedTasks === todayStats.totalTasks;

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
