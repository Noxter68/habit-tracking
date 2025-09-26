// src/services/habitProgressionService.ts
import { supabase } from '@/lib/supabase';
import { HabitTier } from '@/types';

/**
 * DB shape for habit_progression
 * (intentionally does NOT include current_streak — that's on `habits`)
 */
export interface HabitProgression {
  id: string;
  habit_id: string;
  user_id: string;
  current_tier: HabitTier;
  habit_xp: number;
  milestones_unlocked: string[];
  last_milestone_date: string | null;
  performance_metrics: {
    perfectDays: number;
    completionRate: number;
    bestWeeklyStreak: number;
    consistencyScore: number;
    averageTasksPerDay: number;
    totalTasksCompleted: number;
  } | null;
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
  // ---------- TIERS ----------
  static readonly TIERS: TierInfo[] = [
    { name: 'Beginner', minDays: 0, maxDays: 6, multiplier: 1.0, color: '#94a3b8', icon: '🌱', description: 'Just getting started' },
    { name: 'Novice', minDays: 7, maxDays: 13, multiplier: 1.1, color: '#60a5fa', icon: '🌿', description: 'Building momentum' },
    { name: 'Adept', minDays: 14, maxDays: 29, multiplier: 1.2, color: '#34d399', icon: '🌳', description: 'Forming the habit' },
    { name: 'Expert', minDays: 30, maxDays: 59, multiplier: 1.3, color: '#fbbf24', icon: '⭐', description: 'Habit established' },
    { name: 'Master', minDays: 60, maxDays: 99, multiplier: 1.5, color: '#f97316', icon: '🔥', description: 'Mastery achieved' },
    { name: 'Legendary', minDays: 100, multiplier: 2.0, color: '#dc2626', icon: '👑', description: 'Legendary status' },
  ];

  // ---------- MILESTONES ----------
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

  // ---------- HELPERS ----------
  /** Get tier info + progress to next tier from a streak value */
  static calculateTierFromStreak(currentStreak: number): { tier: TierInfo; progress: number } {
    const current = this.TIERS.find((t) => (t.maxDays ? currentStreak >= t.minDays && currentStreak <= t.maxDays : currentStreak >= t.minDays)) ?? this.TIERS[0];

    let progress = 100;
    const idx = this.TIERS.findIndex((t) => t.name === current.name);
    if (idx >= 0 && idx < this.TIERS.length - 1) {
      const next = this.TIERS[idx + 1];
      const inTier = currentStreak - current.minDays;
      const span = next.minDays - current.minDays;
      progress = Math.max(0, Math.min(100, (inTier / span) * 100));
    }

    return { tier: current, progress };
  }

  /** Next tier (or null if max) */
  static getNextTier(currentTier: TierInfo): TierInfo | null {
    const i = this.TIERS.findIndex((t) => t.name === currentTier.name);
    return i >= 0 && i < this.TIERS.length - 1 ? this.TIERS[i + 1] : null;
  }

  /** Fetch current_streak from `habits` */
  static async getHabitStreak(habitId: string): Promise<number> {
    const { data, error } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();
    if (error) {
      console.error('getHabitStreak error', error);
      return 0;
    }
    return data?.current_streak ?? 0;
  }

  // ---------- CORE CRUD ----------
  /** Get or create a progression row for (habit, user) */
  static async getOrCreateProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase.from('habit_progression').select('*').eq('habit_id', habitId).eq('user_id', userId).single();

      if (!error && data) return data;

      // If not found (PGRST116), insert a fresh row
      const { data: created, error: createError } = await supabase
        .from('habit_progression')
        .insert({
          habit_id: habitId,
          user_id: userId,
          current_tier: 'Beginner',
          habit_xp: 0,
          milestones_unlocked: [],
          last_milestone_date: null,
          performance_metrics: {
            perfectDays: 0,
            completionRate: 0,
            bestWeeklyStreak: 0,
            consistencyScore: 0,
            averageTasksPerDay: 0,
            totalTasksCompleted: 0,
          },
        })
        .select()
        .single();

      if (createError) {
        console.error('getOrCreateProgression insert error', createError);
        return null;
      }
      return created;
    } catch (e) {
      console.error('getOrCreateProgression fatal', e);
      return null;
    }
  }

  /**
   * Update progression after a day’s completion toggles.
   * - Reads streak from `habits` (or accepts `overrideStreak` to save a fetch).
   * - Updates current_tier and performance_metrics.
   */
  static async updateProgression(habitId: string, userId: string, options?: { allTasksCompleted?: boolean; overrideStreak?: number }): Promise<HabitProgression | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      const currentStreak = options?.overrideStreak ?? (await this.getHabitStreak(habitId));
      const { tier } = this.calculateTierFromStreak(currentStreak);

      const metrics = progression.performance_metrics ?? {
        perfectDays: 0,
        completionRate: 0,
        bestWeeklyStreak: 0,
        consistencyScore: 0,
        averageTasksPerDay: 0,
        totalTasksCompleted: 0,
      };

      const updatedMetrics = {
        ...metrics,
        perfectDays: options?.allTasksCompleted ? (metrics.perfectDays ?? 0) + 1 : metrics.perfectDays ?? 0,
        totalTasksCompleted: (metrics.totalTasksCompleted ?? 0) + 1,
      };

      const { data, error } = await supabase
        .from('habit_progression')
        .update({
          current_tier: tier.name,
          performance_metrics: updatedMetrics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', progression.id)
        .select()
        .single();

      if (error) {
        console.error('updateProgression error', error);
        return null;
      }

      return data;
    } catch (e) {
      console.error('updateProgression fatal', e);
      return null;
    }
  }

  // ---------- MILESTONES ----------
  static getMilestoneStatus(currentStreak: number, unlockedMilestones: string[]) {
    const unlocked = this.MILESTONES.filter((m) => unlockedMilestones.includes(m.title) || m.days <= currentStreak);
    const upcoming = this.MILESTONES.filter((m) => m.days > currentStreak && !unlockedMilestones.includes(m.title));
    const next = upcoming[0] ?? null;
    return { unlocked, next, upcoming: upcoming.slice(0, 3) };
  }

  /** Check & award a milestone if streak just hit exact day. */
  static async checkMilestoneUnlock(habitId: string, userId: string, options?: { overrideStreak?: number }): Promise<{ unlocked: HabitMilestone | null; xpAwarded: number }> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return { unlocked: null, xpAwarded: 0 };

      const currentStreak = options?.overrideStreak ?? (await this.getHabitStreak(habitId));
      const unlockedTitles = progression.milestones_unlocked ?? [];
      const milestone = this.MILESTONES.find((m) => m.days === currentStreak && !unlockedTitles.includes(m.title));
      if (!milestone) return { unlocked: null, xpAwarded: 0 };

      // Award XP
      const { XPService } = await import('./xpService');
      const success = await XPService.awardXP(userId, {
        amount: milestone.xpReward,
        source_type: 'achievement_unlock',
        source_id: habitId,
        description: `Milestone: ${milestone.title}`,
      });

      if (!success) return { unlocked: null, xpAwarded: 0 };

      // Persist unlocked milestone
      const { error } = await supabase
        .from('habit_progression')
        .update({ milestones_unlocked: [...unlockedTitles, milestone.title], last_milestone_date: new Date().toISOString() })
        .eq('id', progression.id);

      if (error) {
        console.error('checkMilestoneUnlock update error', error);
        return { unlocked: null, xpAwarded: 0 };
      }

      return { unlocked: milestone, xpAwarded: milestone.xpReward };
    } catch (e) {
      console.error('checkMilestoneUnlock fatal', e);
      return { unlocked: null, xpAwarded: 0 };
    }
  }

  // ---------- METRICS ----------
  /** Recompute & persist consistency score for last 30 days; returns score (0–100). */
  static async calculateConsistencyScore(habitId: string, userId: string): Promise<number> {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromIso = from.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('task_completions')
        .select('date, all_completed')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('date', fromIso)
        .order('date', { ascending: true });

      if (error) {
        console.error('calculateConsistencyScore query error', error);
        return 0;
      }

      const completedDays = (data ?? []).filter((d) => d.all_completed).length;
      const consistency = Math.round(((completedDays ?? 0) / 30) * 100);

      // Store inside performance_metrics.consistencyScore
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (progression) {
        const metrics = progression.performance_metrics ?? {
          perfectDays: 0,
          completionRate: 0,
          bestWeeklyStreak: 0,
          consistencyScore: 0,
          averageTasksPerDay: 0,
          totalTasksCompleted: 0,
        };

        await supabase
          .from('habit_progression')
          .update({ performance_metrics: { ...metrics, consistencyScore: consistency } })
          .eq('id', progression.id);
      }

      return consistency;
    } catch (e) {
      console.error('calculateConsistencyScore fatal', e);
      return 0;
    }
  }

  /**
   * Read-only metrics bundle for UI.
   * - Calculates: avgTasksPerDay, perfectDayRate, currentTier, tierProgress, consistency, totalXPEarned
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

      const { data: completions, error: compErr } = await supabase.from('task_completions').select('completed_tasks, all_completed, xp_earned').eq('habit_id', habitId).eq('user_id', userId);

      if (compErr) {
        console.error('getPerformanceMetrics completions error', compErr);
        return null;
      }

      const totalDays = completions?.length ?? 0;
      const totalTasks = completions?.reduce((s, c) => s + ((c.completed_tasks as string[])?.length ?? 0), 0) ?? 0;
      const perfectDays = completions?.filter((c) => c.all_completed).length ?? 0;
      const totalXP = completions?.reduce((s, c) => s + (c.xp_earned ?? 0), 0) ?? 0;

      // pull streak from habits
      const streak = await this.getHabitStreak(habitId);
      const { tier, progress } = this.calculateTierFromStreak(streak);

      return {
        avgTasksPerDay: totalDays > 0 ? totalTasks / totalDays : 0,
        perfectDayRate: totalDays > 0 ? (perfectDays / totalDays) * 100 : 0,
        currentTier: tier,
        tierProgress: progress,
        consistency: progression.performance_metrics?.consistencyScore ?? 0,
        totalXPEarned: totalXP,
      };
    } catch (e) {
      console.error('getPerformanceMetrics fatal', e);
      return null;
    }
  }

  // ---------- RESET HELPERS ----------
  /** Clear tier-ish things if a streak is broken (optional helper). */
  static async resetTierProgress(habitId: string, userId: string): Promise<void> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return;

      await supabase
        .from('habit_progression')
        .update({
          current_tier: 'Beginner',
          // keep metrics, we’re not wiping user history
          updated_at: new Date().toISOString(),
        })
        .eq('id', progression.id);
    } catch (e) {
      console.error('resetTierProgress error', e);
    }
  }
}
