// src/services/habitProgressionService.ts
import { supabase } from '../lib/supabase';
import { HabitTier } from '../types';

export interface HabitProgression {
  id: string;
  habit_id: string;
  user_id: string;
  current_tier: HabitTier;
  tier_progress: number;
  total_completions: number;
  perfect_days: number;
  consistency_score: number;
  best_streak_at_tier: number;
  xp_multiplier: number;
  milestones_unlocked: string[];
  created_at: string;
  updated_at: string;
}

export interface HabitMilestone {
  days: number;
  title: string;
  description: string;
  xpReward: number;
  badge?: string;
}

export interface TierInfo {
  name: HabitTier;
  minDays: number;
  maxDays?: number;
  multiplier: number;
  color: string;
  icon: string;
  description: string;
}

export class HabitProgressionService {
  // Tier configuration
  static readonly TIERS: TierInfo[] = [
    {
      name: 'Beginner',
      minDays: 0,
      maxDays: 6,
      multiplier: 1.0,
      color: '#94a3b8',
      icon: '🌱',
      description: 'Just getting started',
    },
    {
      name: 'Novice',
      minDays: 7,
      maxDays: 13,
      multiplier: 1.1,
      color: '#60a5fa',
      icon: '🌿',
      description: 'Building momentum',
    },
    {
      name: 'Adept',
      minDays: 14,
      maxDays: 29,
      multiplier: 1.2,
      color: '#34d399',
      icon: '🌳',
      description: 'Forming the habit',
    },
    {
      name: 'Expert',
      minDays: 30,
      maxDays: 59,
      multiplier: 1.3,
      color: '#fbbf24',
      icon: '⭐',
      description: 'Habit established',
    },
    {
      name: 'Master',
      minDays: 60,
      maxDays: 99,
      multiplier: 1.5,
      color: '#f97316',
      icon: '🔥',
      description: 'Mastery achieved',
    },
    {
      name: 'Legendary',
      minDays: 100,
      multiplier: 2.0,
      color: '#dc2626',
      icon: '👑',
      description: 'Legendary status',
    },
  ];

  // Milestone configuration
  static readonly MILESTONES: HabitMilestone[] = [
    { days: 3, title: 'Getting Started', description: 'Complete 3 days', xpReward: 50, badge: '🎯' },
    { days: 7, title: 'Week Warrior', description: 'One week streak', xpReward: 100, badge: '📅' },
    { days: 14, title: 'Fortnight Fighter', description: 'Two weeks strong', xpReward: 200, badge: '💪' },
    { days: 21, title: 'Habit Former', description: '21 days to form a habit', xpReward: 300, badge: '🧠' },
    { days: 30, title: 'Monthly Master', description: 'One month achieved', xpReward: 500, badge: '🏆' },
    { days: 60, title: 'Committed', description: 'Two months of dedication', xpReward: 750, badge: '💎' },
    { days: 90, title: 'Quarter Champion', description: 'Three months strong', xpReward: 1000, badge: '🌟' },
    { days: 100, title: 'Century', description: '100 days milestone', xpReward: 1500, badge: '💯' },
    { days: 365, title: 'Year Legend', description: 'One full year', xpReward: 5000, badge: '🎊' },
  ];

  /**
   * Get or create habit progression record
   */
  static async getOrCreateProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      // Try to get existing progression
      let { data, error } = await supabase.from('habit_progression').select('*').eq('habit_id', habitId).eq('user_id', userId).single();

      if (error && error.code === 'PGRST116') {
        // No record exists, create one
        const { data: newData, error: createError } = await supabase
          .from('habit_progression')
          .insert({
            habit_id: habitId,
            user_id: userId,
            current_tier: 'Beginner',
            tier_progress: 0,
            total_completions: 0,
            perfect_days: 0,
            consistency_score: 0,
            best_streak_at_tier: 0,
            xp_multiplier: 1.0,
            milestones_unlocked: [],
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating progression:', createError);
          return null;
        }

        return newData;
      }

      if (error) {
        console.error('Error fetching progression:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateProgression:', error);
      return null;
    }
  }

  /**
   * Calculate tier from current streak
   */
  static calculateTierFromStreak(currentStreak: number): { tier: TierInfo; progress: number } {
    // Find current tier
    const currentTier =
      this.TIERS.find((tier) => {
        if (tier.maxDays) {
          return currentStreak >= tier.minDays && currentStreak <= tier.maxDays;
        }
        return currentStreak >= tier.minDays;
      }) || this.TIERS[0];

    // Calculate progress to next tier
    let progress = 0;
    const currentTierIndex = this.TIERS.indexOf(currentTier);

    if (currentTierIndex < this.TIERS.length - 1) {
      const nextTier = this.TIERS[currentTierIndex + 1];
      const daysInCurrentTier = currentStreak - currentTier.minDays;
      const totalDaysNeeded = nextTier.minDays - currentTier.minDays;
      progress = (daysInCurrentTier / totalDaysNeeded) * 100;
    } else {
      progress = 100; // Max tier reached
    }

    return { tier: currentTier, progress };
  }

  /**
   * Update habit progression after completion
   */
  static async updateProgression(habitId: string, userId: string, currentStreak: number, allTasksCompleted: boolean): Promise<HabitProgression | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      const { tier, progress } = this.calculateTierFromStreak(currentStreak);

      // Update progression data
      const updates = {
        current_tier: tier.name,
        tier_progress: progress,
        total_completions: progression.total_completions + 1,
        perfect_days: allTasksCompleted ? progression.perfect_days + 1 : progression.perfect_days,
        best_streak_at_tier: Math.max(currentStreak, progression.best_streak_at_tier),
        xp_multiplier: tier.multiplier,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('habit_progression').update(updates).eq('id', progression.id).select().single();

      if (error) {
        console.error('Error updating progression:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProgression:', error);
      return null;
    }
  }

  /**
   * Check and award milestone rewards
   */
  static async checkMilestoneUnlock(habitId: string, userId: string, currentStreak: number): Promise<{ unlocked: HabitMilestone | null; xpAwarded: number }> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return { unlocked: null, xpAwarded: 0 };

      // Find milestones that should be unlocked
      const unlockedMilestones = progression.milestones_unlocked || [];
      const milestone = this.MILESTONES.find((m) => m.days === currentStreak && !unlockedMilestones.includes(m.title));

      if (!milestone) return { unlocked: null, xpAwarded: 0 };

      // Award XP for milestone
      const { XPService } = await import('./xpService');
      const success = await XPService.awardXP(userId, {
        amount: milestone.xpReward,
        source_type: 'achievement_unlock',
        source_id: habitId,
        description: `Milestone: ${milestone.title}`,
      });

      if (success) {
        // Update milestones unlocked
        const newMilestones = [...unlockedMilestones, milestone.title];
        await supabase.from('habit_progression').update({ milestones_unlocked: newMilestones }).eq('id', progression.id);

        return { unlocked: milestone, xpAwarded: milestone.xpReward };
      }

      return { unlocked: null, xpAwarded: 0 };
    } catch (error) {
      console.error('Error checking milestone:', error);
      return { unlocked: null, xpAwarded: 0 };
    }
  }

  /**
   * Get milestone status for a habit
   */
  static getMilestoneStatus(
    currentStreak: number,
    unlockedMilestones: string[]
  ): {
    unlocked: HabitMilestone[];
    next: HabitMilestone | null;
    upcoming: HabitMilestone[];
  } {
    const unlocked = this.MILESTONES.filter((m) => unlockedMilestones.includes(m.title) || m.days <= currentStreak);

    const upcoming = this.MILESTONES.filter((m) => m.days > currentStreak && !unlockedMilestones.includes(m.title));

    const next = upcoming.length > 0 ? upcoming[0] : null;

    return { unlocked, next, upcoming: upcoming.slice(0, 3) };
  }

  /**
   * Calculate consistency score (last 30 days)
   */
  static async calculateConsistencyScore(habitId: string, userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('task_completions')
        .select('date, all_completed')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) {
        console.error('Error calculating consistency:', error);
        return 0;
      }

      if (!data || data.length === 0) return 0;

      const completedDays = data.filter((d) => d.all_completed).length;
      const consistency = (completedDays / 30) * 100;

      // Update in database
      await supabase
        .from('habit_progression')
        .update({ consistency_score: Math.round(consistency) })
        .eq('habit_id', habitId)
        .eq('user_id', userId);

      return Math.round(consistency);
    } catch (error) {
      console.error('Error in calculateConsistencyScore:', error);
      return 0;
    }
  }

  /**
   * Get performance metrics for habit
   */
  static async getPerformanceMetrics(
    habitId: string,
    userId: string
  ): Promise<{
    avgTasksPerDay: number;
    perfectDayRate: number;
    currentTier: TierInfo;
    tierProgress: number;
    consistency: number;
    totalXPEarned: number;
  } | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      // Get completion data for metrics
      const { data: completions } = await supabase.from('task_completions').select('completed_tasks, all_completed, xp_earned').eq('habit_id', habitId).eq('user_id', userId);

      const totalDays = completions?.length || 0;
      const totalTasks = completions?.reduce((sum, c) => sum + (c.completed_tasks?.length || 0), 0) || 0;
      const perfectDays = completions?.filter((c) => c.all_completed).length || 0;
      const totalXP = completions?.reduce((sum, c) => sum + (c.xp_earned || 0), 0) || 0;

      const { tier, progress } = this.calculateTierFromStreak(progression.best_streak_at_tier);

      return {
        avgTasksPerDay: totalDays > 0 ? totalTasks / totalDays : 0,
        perfectDayRate: totalDays > 0 ? (perfectDays / totalDays) * 100 : 0,
        currentTier: tier,
        tierProgress: progress,
        consistency: progression.consistency_score,
        totalXPEarned: totalXP,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }

  /**
   * Reset tier progress (for breaking streaks)
   */
  static async resetTierProgress(habitId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('habit_progression')
        .update({
          current_tier: 'Beginner',
          tier_progress: 0,
          best_streak_at_tier: 0,
          xp_multiplier: 1.0,
        })
        .eq('habit_id', habitId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error resetting tier progress:', error);
    }
  }
}
