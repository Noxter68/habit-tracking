// src/services/habitService.ts
import { supabase } from '../lib/supabase';
import { Habit } from '../types';

export class HabitService {
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

  // Update task completion
  static async updateTaskCompletion(habitId: string, userId: string, date: string, completedTasks: string[], totalTasks: number): Promise<void> {
    try {
      const allCompleted = completedTasks.length === totalTasks;

      // First, check if a record exists
      const { data: existing, error: fetchError } = await supabase.from('task_completions').select('id').eq('habit_id', habitId).eq('date', date).single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is fine
        throw fetchError;
      }

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('task_completions')
          .update({
            completed_tasks: completedTasks,
            all_completed: allCompleted,
            // Don't set updated_at manually - let the trigger handle it
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

  // Update streak calculation
  static async updateStreak(habitId: string, userId: string): Promise<void> {
    try {
      // Get all completions for this habit
      const { data: completions, error } = await supabase.from('task_completions').select('date, all_completed').eq('habit_id', habitId).eq('all_completed', true).order('date', { ascending: false });

      if (error) throw error;

      // Calculate current streak
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const today = new Date().toISOString().split('T')[0];
      const dates = completions?.map((c) => c.date) || [];

      // Check if today is completed
      if (dates.includes(today)) {
        currentStreak = 1;

        // Count consecutive days backwards from today
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

      // Calculate best streak
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

      // Update habit with new streaks
      const { error: updateError } = await supabase
        .from('habits')
        .update({
          current_streak: currentStreak,
          best_streak: Math.max(bestStreak, currentStreak),
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

  // Sync local data with database
  static async syncHabits(habits: Habit[], userId: string): Promise<void> {
    try {
      // This is a batch sync operation for offline support
      for (const habit of habits) {
        // Check if habit exists
        const { data: existing } = await supabase.from('habits').select('id').eq('id', habit.id).single();

        if (existing) {
          // Update existing habit
          await supabase
            .from('habits')
            .update({
              current_streak: habit.currentStreak,
              best_streak: habit.bestStreak,
              updated_at: new Date().toISOString(),
            })
            .eq('id', habit.id)
            .eq('user_id', userId);
        }

        // Sync task completions
        for (const [date, tasks] of Object.entries(habit.dailyTasks)) {
          await this.updateTaskCompletion(habit.id, userId, date, tasks.completedTasks, habit.tasks.length);
        }
      }
    } catch (error) {
      console.error('Error syncing habits:', error);
      throw error;
    }
  }
}
