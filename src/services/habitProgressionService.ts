import { supabase } from '@/lib/supabase';

export type HabitTier = 'Crystal' | 'Ruby' | 'Amethyst';

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
  tier?: HabitTier;
}

export interface TierInfo {
  name: HabitTier;
  minDays: number;
  maxDays?: number;
  multiplier: number;
  color: string; // fallback color for accent if no texture
  icon: string;
  description: string;
}

export class HabitProgressionService {
  // ---------- TIERS (3 only) ----------
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

  // ---------- TIERS HELPERS ----------
  /** Get tier info + progress to next tier from a streak value */
  static calculateTierFromStreak(streak: number): { tier: TierInfo; progress: number } {
    const tiers = this.TIERS;

    // Only Crystal, Ruby, Amethyst
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
    const { data, error } = await supabase.from('habit_milestones').select('*').order('days', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }

    return data.map((m) => ({
      id: m.id,
      days: m.days,
      title: m.title,
      description: m.description,
      xpReward: m.xp_reward,
      badge: m.badge,
      tier: m.tier as HabitTier,
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

      return consistency;
    } catch (e) {
      console.error('calculateConsistencyScore fatal', e);
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
        console.error('getPerformanceMetrics error', error);
        return null;
      }

      const totalDays = completions?.length ?? 0;
      const totalTasks = completions?.reduce((s, c) => s + ((c.completed_tasks as string[])?.length ?? 0), 0) ?? 0;
      const perfectDays = completions?.filter((c) => c.all_completed).length ?? 0;
      const totalXP = completions?.reduce((s, c) => s + (c.xp_earned ?? 0), 0) ?? 0;

      // streak from habits
      const { data: habit, error: streakError } = await supabase
        .from('habits')
        .select('current_streak, best_streak') // ✅ Also get best_streak!
        .eq('id', habitId)
        .single();

      if (streakError) {
        console.error('getPerformanceMetrics streak error', streakError);
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
        currentStreak: currentStreak, // ✅ NOW INCLUDED
        bestStreak: bestStreak,
      };
    } catch (e) {
      console.error('getPerformanceMetrics fatal', e);
      return null;
    }
  }

  // ---------- MILESTONES ----------
  static async checkMilestoneUnlock(habitId: string, userId: string, options?: { overrideStreak?: number }): Promise<{ unlocked: HabitMilestone | null; xpAwarded: number }> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return { unlocked: null, xpAwarded: 0 };

      // Current streak (from option or DB)
      let streak = options?.overrideStreak ?? 0;
      if (!streak) {
        const { data } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();
        streak = data?.current_streak ?? 0;
      }

      // Fetch milestones from DB
      const { data: milestones, error } = await supabase.from('habit_milestones').select('*').order('days', { ascending: true });

      if (error) throw error;

      const unlockedTitles = progression.milestones_unlocked ?? [];
      const milestone = milestones?.find((m: HabitMilestone) => m.days === streak && !unlockedTitles.includes(m.title));

      if (!milestone) return { unlocked: null, xpAwarded: 0 };

      // Award XP (via XPService)
      const { XPService } = await import('./xpService');
      const success = await XPService.awardXP(userId, {
        amount: milestone.xpReward,
        source_type: 'achievement_unlock',
        source_id: habitId,
        description: `Milestone: ${milestone.title}`,
      });

      if (!success) return { unlocked: null, xpAwarded: 0 };

      // Persist unlocked milestone
      const { error: updateError } = await supabase
        .from('habit_progression')
        .update({
          milestones_unlocked: [...unlockedTitles, milestone.title],
          last_milestone_date: new Date().toISOString(),
        })
        .eq('id', progression.id);

      if (updateError) throw updateError;

      return { unlocked: milestone, xpAwarded: milestone.xpReward };
    } catch (err) {
      console.error('checkMilestoneUnlock error', err);
      return { unlocked: null, xpAwarded: 0 };
    }
  }

  static async updateProgression(habitId: string, userId: string, options?: { allTasksCompleted?: boolean; overrideStreak?: number }): Promise<HabitProgression | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      // Fetch streak from habits if not passed
      let streak = options?.overrideStreak ?? 0;
      if (!streak) {
        const { data } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();
        streak = data?.current_streak ?? 0;
      }

      // Compute tier with static TIERS
      const { tier } = this.calculateTierFromStreak(streak); // 👈 always Crystal | Ruby | Amethyst

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
      console.error('updateProgression error', err);
      return null;
    }
  }

  // ---------- CORE CRUD ----------
  /** Get or create a progression row for (habit, user) */
  static async getOrCreateProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase.from('habit_progression').select('*').eq('habit_id', habitId).eq('user_id', userId).single();

      if (!error && data) return data as HabitProgression;

      const { data: habitRow } = await supabase.from('habits').select('current_streak').eq('id', habitId).single();

      const streak = habitRow?.current_streak ?? 0;
      const { tier } = this.calculateTierFromStreak(streak);

      // If not found, insert a fresh row
      const { data: created, error: createError } = await supabase
        .from('habit_progression')
        .insert({
          habit_id: habitId,
          user_id: userId,
          current_tier: tier.name, // always start at Crystal
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
      return created as HabitProgression;
    } catch (e) {
      console.error('getOrCreateProgression fatal', e);
      return null;
    }
  }
}
