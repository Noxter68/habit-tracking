// src/services/habitProgressionService.ts - UPDATED FOR 6 TIERS
import { supabase } from '@/lib/supabase';
import { getLocalDateString } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';

// ✅ Keep both tier systems!
// Visual tiers for UI (3 tiers - gems)
export type HabitTier = 'Crystal' | 'Ruby' | 'Amethyst';

// Progression tiers for milestones (6 tiers - more grinding!)
export type MilestoneTier = 'Beginner' | 'Novice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';

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
  id: string;
  days: number;
  title: string;
  description: string;
  xpReward: number;
  badge?: string;
  tier?: MilestoneTier; // ✅ Use MilestoneTier instead of HabitTier
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
  // ---------- VISUAL TIERS (3 for UI) ----------
  static readonly TIERS: TierInfo[] = [
    {
      name: 'Crystal',
      minDays: 0,
      maxDays: 49,
      multiplier: 1.0,
      color: '#60a5fa',
      icon: '💎',
      description: 'Getting started',
    },
    {
      name: 'Ruby',
      minDays: 50,
      maxDays: 149,
      multiplier: 1.2,
      color: '#ef4444',
      icon: '❤️',
      description: 'Building strength',
    },
    {
      name: 'Amethyst',
      minDays: 150,
      multiplier: 1.5,
      color: '#8b5cf6',
      icon: '🔮',
      description: 'Mastery unlocked',
    },
  ];

  // ---------- MILESTONE TIERS (6 for progression) ----------
  static readonly MILESTONE_TIERS: Record<MilestoneTier, { minDays: number; maxDays: number; color: string }> = {
    Beginner: { minDays: 0, maxDays: 6, color: '#94a3b8' },
    Novice: { minDays: 7, maxDays: 13, color: '#60a5fa' },
    Adept: { minDays: 14, maxDays: 29, color: '#10b981' },
    Expert: { minDays: 30, maxDays: 59, color: '#f59e0b' },
    Master: { minDays: 60, maxDays: 99, color: '#ef4444' },
    Legendary: { minDays: 100, maxDays: 999, color: '#8b5cf6' },
  };

  // ---------- TIERS HELPERS ----------
  /** Get VISUAL tier info + progress from streak (for UI) */
  static calculateTierFromStreak(streak: number): { tier: TierInfo; progress: number } {
    const tiers = this.TIERS;
    const current = tiers.find((t) => (t.maxDays ? streak >= t.minDays && streak <= t.maxDays : streak >= t.minDays)) ?? tiers[0];

    let progress = 100;
    const idx = tiers.findIndex((t) => t.name === current.name);
    if (idx >= 0 && idx < tiers.length - 1) {
      const next = tiers[idx + 1];
      const inTier = streak - current.minDays;
      const span = (next.minDays ?? current.minDays + 1) - current.minDays;
      progress = Math.max(0, Math.min(100, (inTier / span) * 100));
    }

    return { tier: current, progress };
  }

  static getNextTier(currentTier: TierInfo): TierInfo | null {
    const i = this.TIERS.findIndex((t) => t.name === currentTier.name);
    return i >= 0 && i < this.TIERS.length - 1 ? this.TIERS[i + 1] : null;
  }

  // ---------- FETCH MILESTONES FROM DB ----------
  static async getMilestones(): Promise<HabitMilestone[]> {
    const { data, error } = await supabase.from('habit_milestones').select('id, days, title, description, xp_reward, badge, tier, icon').order('days', { ascending: true });

    if (error) {
      Logger.error('Error fetching milestones:', error);
      return [];
    }

    // ✅ Map xp_reward to xpReward
    return data.map((m) => ({
      id: m.id,
      days: m.days,
      title: m.title,
      description: m.description,
      xpReward: m.xp_reward, // ✅ snake_case to camelCase
      badge: m.badge,
      tier: m.tier as MilestoneTier, // ✅ Use MilestoneTier type
    }));
  }

  // ---------- STATUS ----------
  static async getMilestoneStatus(currentStreak: number, unlockedMilestones: string[]) {
    const milestones = await this.getMilestones();

    const unlocked = milestones.filter((m) => unlockedMilestones.includes(m.title) || m.days <= currentStreak);
    const upcoming = milestones.filter((m) => m.days > currentStreak && !unlockedMilestones.includes(m.title));
    const next = upcoming[0] ?? null;

    return { all: milestones, unlocked, next, upcoming: upcoming.slice(0, 3) };
  }

  // ---------- CONSISTENCY METRICS ----------
  static async calculateConsistencyScore(habitId: string, userId: string): Promise<number> {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromIso = getLocalDateString(from);

      const { data, error } = await supabase
        .from('task_completions')
        .select('date, all_completed')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('date', fromIso)
        .order('date', { ascending: true });

      if (error) {
        Logger.error('calculateConsistencyScore query error', error);
        return 0;
      }

      const completedDays = (data ?? []).filter((d) => d.all_completed).length;
      const consistency = Math.round(((completedDays ?? 0) / 30) * 100);

      return consistency;
    } catch (e) {
      Logger.error('calculateConsistencyScore fatal', e);
      return 0;
    }
  }

  // ---------- PERFORMANCE METRICS ----------
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
    currentStreak: number;
    bestStreak: number;
  } | null> {
    try {
      const { data: completions, error } = await supabase.from('task_completions').select('completed_tasks, all_completed, xp_earned').eq('habit_id', habitId).eq('user_id', userId);

      if (error) {
        Logger.error('getPerformanceMetrics error', error);
        return null;
      }

      const totalDays = completions?.length ?? 0;
      const totalTasks = completions?.reduce((s, c) => s + ((c.completed_tasks as string[])?.length ?? 0), 0) ?? 0;
      const perfectDays = completions?.filter((c) => c.all_completed).length ?? 0;
      const totalXP = completions?.reduce((s, c) => s + (c.xp_earned ?? 0), 0) ?? 0;

      const { data: habit, error: streakError } = await supabase.from('habits').select('current_streak, best_streak').eq('id', habitId).single();

      if (streakError) {
        Logger.error('getPerformanceMetrics streak error', streakError);
        return null;
      }

      const currentStreak = habit?.current_streak ?? 0;
      const bestStreak = habit?.best_streak ?? 0;
      const { tier, progress } = this.calculateTierFromStreak(currentStreak);

      const consistency = await this.calculateConsistencyScore(habitId, userId);

      return {
        avgTasksPerDay: totalDays > 0 ? totalTasks / totalDays : 0,
        perfectDayRate: totalDays > 0 ? (perfectDays / totalDays) * 100 : 0,
        currentTier: tier,
        tierProgress: progress,
        consistency: consistency,
        totalXPEarned: totalXP,
        currentStreak: currentStreak,
        bestStreak: bestStreak,
      };
    } catch (e) {
      Logger.error('getPerformanceMetrics fatal', e);
      return null;
    }
  }

  // ---------- MILESTONES ----------
  // TEMPORARY DEBUG VERSION of checkMilestoneUnlock
  // Add this to habitProgressionService.ts to replace the existing function

  // FIXED checkMilestoneUnlock - Replace in habitProgressionService.ts

  static async checkMilestoneUnlock(habitId: string, userId: string, options?: { overrideStreak?: number }): Promise<{ unlocked: HabitMilestone | null; xpAwarded: number }> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) {
        Logger.debug('❌ No progression found');
        return { unlocked: null, xpAwarded: 0 };
      }

      let streak = options?.overrideStreak ?? 0;
      if (!streak) {
        const { data } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();
        streak = data?.current_streak ?? 0;
      }

      Logger.debug('🔍 Checking milestones for streak:', streak);

      const { data: milestones, error } = await supabase.from('habit_milestones').select('id, days, title, description, xp_reward, badge, tier, icon').order('days', { ascending: true });

      if (error) {
        Logger.error('❌ Error fetching milestones:', error);
        throw error;
      }

      const unlockedList = progression.milestones_unlocked ?? [];
      Logger.debug('🔓 Already unlocked (from DB):', unlockedList);

      // ✅ FIX: Check if the milestone days <= current streak AND not already unlocked
      // The unlocked list can contain either IDs or titles (depends on your DB)
      const milestoneData = milestones?.find(
        (m: any) =>
          m.days === streak &&
          !unlockedList.includes(m.id) && // Check by ID
          !unlockedList.includes(m.title) // Also check by title for backwards compatibility
      );

      if (!milestoneData) {
        Logger.debug('ℹ️ No new milestone for streak', streak);
        return { unlocked: null, xpAwarded: 0 };
      }

      Logger.debug('🎯 FOUND NEW MILESTONE:', milestoneData.title);

      const xpReward = milestoneData.xp_reward;

      if (xpReward === undefined || xpReward === null || xpReward <= 0) {
        Logger.error('❌ XP REWARD IS INVALID!');
        return { unlocked: null, xpAwarded: 0 };
      }

      const milestone: HabitMilestone = {
        id: milestoneData.id,
        days: milestoneData.days,
        title: milestoneData.title,
        description: milestoneData.description,
        xpReward: xpReward,
        badge: milestoneData.badge,
        tier: milestoneData.tier as MilestoneTier,
      };

      Logger.debug('💫 Awarding milestone XP:', {
        title: milestone.title,
        xpReward: milestone.xpReward,
      });

      const { XPService } = await import('./xpService');

      const success = await XPService.awardXP(userId, {
        amount: milestone.xpReward,
        source_type: 'achievement_unlock',
        source_id: habitId,
        description: `Milestone: ${milestone.title}`,
        habit_id: habitId,
      });

      if (!success) {
        Logger.error('❌ Failed to award XP');
        return { unlocked: null, xpAwarded: 0 };
      }

      // ✅ Store the milestone TITLE (not ID) for consistency
      const { error: updateError } = await supabase
        .from('habit_progression')
        .update({
          milestones_unlocked: [...unlockedList, milestone.title], // Use title
          last_milestone_date: new Date().toISOString(),
        })
        .eq('id', progression.id);

      if (updateError) {
        Logger.error('❌ Error updating progression:', updateError);
        throw updateError;
      }

      Logger.debug('🎉 Milestone unlocked successfully!');
      return { unlocked: milestone, xpAwarded: milestone.xpReward };
    } catch (err) {
      Logger.error('❌ checkMilestoneUnlock error:', err);
      return { unlocked: null, xpAwarded: 0 };
    }
  }

  static async updateProgression(habitId: string, userId: string, options?: { allTasksCompleted?: boolean; overrideStreak?: number }): Promise<HabitProgression | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      let streak = options?.overrideStreak ?? 0;
      if (!streak) {
        const { data } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();
        streak = data?.current_streak ?? 0;
      }

      const { tier } = this.calculateTierFromStreak(streak);

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
        perfectDays: options?.allTasksCompleted ? metrics.perfectDays + 1 : metrics.perfectDays,
        totalTasksCompleted: metrics.totalTasksCompleted + 1,
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

      if (error) throw error;

      return data as HabitProgression;
    } catch (err) {
      Logger.error('updateProgression error', err);
      return null;
    }
  }

  static async getOrCreateProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase.from('habit_progression').select('*').eq('habit_id', habitId).eq('user_id', userId).single();

      if (!error && data) return data as HabitProgression;

      const { data: habitRow } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();

      const streak = habitRow?.current_streak ?? 0;
      const { tier } = this.calculateTierFromStreak(streak);

      const { data: created, error: createError } = await supabase
        .from('habit_progression')
        .insert({
          habit_id: habitId,
          user_id: userId,
          current_tier: tier.name,
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
        Logger.error('getOrCreateProgression insert error', createError);
        return null;
      }
      return created as HabitProgression;
    } catch (e) {
      Logger.error('getOrCreateProgression fatal', e);
      return null;
    }
  }
}
