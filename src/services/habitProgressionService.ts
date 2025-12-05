/**
 * Service de gestion de la progression des habitudes
 *
 * Ce service gère le systeme de tiers visuels (Crystal, Ruby, Amethyst),
 * les jalons de progression (milestones) et les metriques de performance.
 * Il supporte deux systemes de tiers: visuels (3 tiers) et de progression (6 tiers).
 *
 * @module HabitProgressionService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '@/lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { getLocalDateString } from '@/utils/dateHelpers';
import Logger from '@/utils/logger';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Tiers visuels pour l'interface utilisateur (3 tiers - gemmes)
 */
export type HabitTier = 'Crystal' | 'Ruby' | 'Amethyst';

/**
 * Tiers de progression pour les jalons (6 tiers - plus de grinding!)
 */
export type MilestoneTier = 'Beginner' | 'Novice' | 'Adept' | 'Expert' | 'Master' | 'Legendary';

/**
 * Donnees de progression d'une habitude
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

/**
 * Jalon d'habitude
 */
export interface HabitMilestone {
  id: string;
  days: number;
  title: string;
  description: string;
  xpReward: number;
  badge?: string;
  tier?: MilestoneTier;
}

/**
 * Informations sur un tier
 */
export interface TierInfo {
  name: HabitTier;
  minDays: number;
  maxDays?: number;
  multiplier: number;
  color: string;
  icon: string;
  description: string;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion de la progression des habitudes
 *
 * Gere les tiers visuels, les jalons et les metriques de performance
 */
export class HabitProgressionService {
  // ===========================================================================
  // CONSTANTES - Tiers visuels (3 pour l'UI)
  // ===========================================================================

  static readonly TIERS: TierInfo[] = [
    {
      name: 'Crystal',
      minDays: 0,
      maxDays: 19,
      multiplier: 1.0,
      color: '#60a5fa',
      icon: '💎',
      description: 'Getting started',
    },
    {
      name: 'Ruby',
      minDays: 20,
      maxDays: 59,
      multiplier: 1.2,
      color: '#ef4444',
      icon: '❤️',
      description: 'Building strength',
    },
    {
      name: 'Amethyst',
      minDays: 60,
      multiplier: 1.5,
      color: '#8b5cf6',
      icon: '🔮',
      description: 'Mastery unlocked',
    },
  ];

  // ===========================================================================
  // CONSTANTES - Tiers de jalons (6 pour la progression)
  // ===========================================================================

  static readonly MILESTONE_TIERS: Record<MilestoneTier, { minDays: number; maxDays: number; color: string }> = {
    Beginner: { minDays: 0, maxDays: 6, color: '#94a3b8' },
    Novice: { minDays: 7, maxDays: 13, color: '#60a5fa' },
    Adept: { minDays: 14, maxDays: 29, color: '#10b981' },
    Expert: { minDays: 30, maxDays: 59, color: '#f59e0b' },
    Master: { minDays: 60, maxDays: 99, color: '#ef4444' },
    Legendary: { minDays: 100, maxDays: 999, color: '#8b5cf6' },
  };

  // ===========================================================================
  // SECTION: Gestion des tiers
  // ===========================================================================

  /**
   * Calculer le tier visuel et la progression a partir du streak
   *
   * @param streak - Le streak actuel
   * @returns Le tier et le pourcentage de progression
   */
  static calculateTierFromStreak(streak: number): { tier: TierInfo; progress: number } {
    const tiers = this.TIERS;
    const current = tiers.find((t) =>
      t.maxDays ? streak >= t.minDays && streak <= t.maxDays : streak >= t.minDays
    ) ?? tiers[0];

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

  /**
   * Obtenir le tier suivant
   *
   * @param currentTier - Le tier actuel
   * @returns Le tier suivant ou null si dernier tier
   */
  static getNextTier(currentTier: TierInfo): TierInfo | null {
    const i = this.TIERS.findIndex((t) => t.name === currentTier.name);
    return i >= 0 && i < this.TIERS.length - 1 ? this.TIERS[i + 1] : null;
  }

  // ===========================================================================
  // SECTION: Gestion des jalons
  // ===========================================================================

  /**
   * Recuperer les jalons depuis la base de donnees
   *
   * @returns Liste des jalons disponibles
   */
  static async getMilestones(): Promise<HabitMilestone[]> {
    const { data, error } = await supabase
      .from('habit_milestones')
      .select('id, days, title, description, xp_reward, badge, tier, icon')
      .order('days', { ascending: true });

    if (error) {
      Logger.error('Error fetching milestones:', error);
      return [];
    }

    return data.map((m) => ({
      id: m.id,
      days: m.days,
      title: m.title,
      description: m.description,
      xpReward: m.xp_reward,
      badge: m.badge,
      tier: m.tier as MilestoneTier,
    }));
  }

  /**
   * Obtenir le statut des jalons basé sur l'ancienneté de l'habitude (jours depuis création)
   * Les milestones sont débloqués en fonction du temps passé depuis la création,
   * pas du streak - car on construit une habitude même si on rate quelques jours.
   *
   * @param habitAge - Nombre de jours depuis la création de l'habitude
   * @param unlockedMilestones - Liste des jalons deja debloques (titres) OU nombre de milestones debloques
   * @returns Les jalons debloques, a venir et le prochain
   */
  static async getMilestoneStatus(habitAge: number, unlockedMilestones: string[] | number) {
    const milestones = await this.getMilestones();

    // Si c'est un nombre (current_tier_level), on prend les N premiers milestones comme débloqués
    const unlockedCount = typeof unlockedMilestones === 'number'
      ? unlockedMilestones
      : unlockedMilestones.length;

    const unlocked = milestones.filter(
      (m, index) => {
        // Débloqué UNIQUEMENT si l'ancienneté est suffisante (on vérifie toujours l'âge)
        // Le nombre de milestones débloqués (current_tier_level) est juste une indication,
        // mais la vraie condition est: habitAge >= jours requis
        if (typeof unlockedMilestones === 'number') {
          return m.days <= habitAge;
        }
        // Fallback: comparaison par titre (legacy)
        return unlockedMilestones.includes(m.title) || m.days <= habitAge;
      }
    );

    const upcoming = milestones.filter(
      (m, index) => {
        if (typeof unlockedMilestones === 'number') {
          return index >= unlockedMilestones && m.days > habitAge;
        }
        return m.days > habitAge && !unlockedMilestones.includes(m.title);
      }
    );
    const next = upcoming[0] ?? null;

    return { all: milestones, unlocked, next, upcoming: upcoming.slice(0, 3) };
  }

  /**
   * Vérifie et octroie l'XP pour les milestones éligibles
   * Appelé à l'arrivée sur HabitDetails - vérifie en DB si l'XP a déjà été donnée
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param createdAt - Date de création de l'habitude
   * @returns Les milestones nouvellement débloqués et le total d'XP octroyé
   */
  static async checkAndAwardMilestoneXP(
    habitId: string,
    userId: string,
    createdAt: Date
  ): Promise<{ newlyUnlocked: HabitMilestone[]; totalXpAwarded: number }> {
    try {
      // 1. Calculer l'âge de l'habitude
      const created = new Date(createdAt);
      const today = new Date();
      created.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const habitAge = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      Logger.debug('checkAndAwardMilestoneXP - habitAge:', habitAge);

      // 2. Récupérer tous les milestones éligibles (days <= habitAge)
      const { data: allMilestones, error: milestonesError } = await supabase
        .from('habit_milestones')
        .select('id, days, title, description, xp_reward, badge, tier, icon')
        .lte('days', habitAge)
        .order('days', { ascending: true });

      if (milestonesError) {
        Logger.error('Error fetching milestones:', milestonesError);
        return { newlyUnlocked: [], totalXpAwarded: 0 };
      }

      if (!allMilestones || allMilestones.length === 0) {
        Logger.debug('No eligible milestones for habitAge:', habitAge);
        return { newlyUnlocked: [], totalXpAwarded: 0 };
      }

      // 3. Récupérer les transactions XP existantes pour cette habitude (milestones déjà récompensés)
      const { data: existingTransactions, error: txError } = await supabase
        .from('xp_transactions')
        .select('description')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('source_type', 'achievement_unlock')
        .like('description', 'Milestone:%');

      if (txError) {
        Logger.error('Error fetching xp_transactions:', txError);
        return { newlyUnlocked: [], totalXpAwarded: 0 };
      }

      // Extraire les titres des milestones déjà récompensés
      const rewardedTitles = new Set<string>();
      existingTransactions?.forEach((tx) => {
        // Format: "Milestone: {title}"
        const match = tx.description?.match(/^Milestone:\s*(.+)$/);
        if (match) {
          rewardedTitles.add(match[1]);
        }
      });

      Logger.debug('Already rewarded milestones:', Array.from(rewardedTitles));

      // 4. Filtrer les milestones non encore récompensés
      const milestonesToReward = allMilestones.filter(
        (m) => !rewardedTitles.has(m.title)
      );

      if (milestonesToReward.length === 0) {
        Logger.debug('All eligible milestones already rewarded');
        return { newlyUnlocked: [], totalXpAwarded: 0 };
      }

      Logger.debug('Milestones to reward:', milestonesToReward.map((m) => m.title));

      // 5. Octroyer l'XP pour chaque nouveau milestone
      const { XPService } = await import('./xpService');
      const newlyUnlocked: HabitMilestone[] = [];
      let totalXpAwarded = 0;

      for (const m of milestonesToReward) {
        const xpReward = m.xp_reward;

        if (!xpReward || xpReward <= 0) {
          Logger.warn('Invalid XP reward for milestone:', m.title);
          continue;
        }

        const success = await XPService.awardXP(userId, {
          amount: xpReward,
          source_type: 'achievement_unlock',
          source_id: habitId,
          description: `Milestone: ${m.title}`,
          habit_id: habitId,
        });

        if (success) {
          newlyUnlocked.push({
            id: m.id,
            days: m.days,
            title: m.title,
            description: m.description,
            xpReward: xpReward,
            badge: m.badge,
            tier: m.tier as MilestoneTier,
          });
          totalXpAwarded += xpReward;
          Logger.debug('XP awarded for milestone:', m.title, xpReward);
        } else {
          Logger.error('Failed to award XP for milestone:', m.title);
        }
      }

      // 6. Mettre à jour habit_progression.milestones_unlocked
      if (newlyUnlocked.length > 0) {
        const progression = await this.getOrCreateProgression(habitId, userId);
        if (progression) {
          const existingUnlocked = progression.milestones_unlocked ?? [];
          const newTitles = newlyUnlocked.map((m) => m.title);
          const updatedUnlocked = [...new Set([...existingUnlocked, ...newTitles])];

          await supabase
            .from('habit_progression')
            .update({
              milestones_unlocked: updatedUnlocked,
              last_milestone_date: new Date().toISOString(),
            })
            .eq('id', progression.id);

          // Mettre à jour current_tier_level dans habits
          await supabase
            .from('habits')
            .update({ current_tier_level: updatedUnlocked.length })
            .eq('id', habitId);

          Logger.debug('Updated milestones_unlocked:', updatedUnlocked);
        }
      }

      Logger.debug('checkAndAwardMilestoneXP completed:', {
        newlyUnlocked: newlyUnlocked.length,
        totalXpAwarded,
      });

      return { newlyUnlocked, totalXpAwarded };
    } catch (err) {
      Logger.error('checkAndAwardMilestoneXP error:', err);
      return { newlyUnlocked: [], totalXpAwarded: 0 };
    }
  }

  /**
   * @deprecated Utiliser checkAndAwardMilestoneXP à la place
   * Verifier et debloquer un jalon basé sur l'ancienneté de l'habitude
   * Les milestones sont débloqués quand l'habitude atteint un certain âge (jours depuis création),
   * indépendamment du streak.
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param options - Options avec ancienneté optionnelle (overrideAge)
   * @returns Le jalon debloque et les XP accordes
   */
  static async checkMilestoneUnlock(
    habitId: string,
    userId: string,
    options?: { overrideAge?: number }
  ): Promise<{ unlocked: HabitMilestone | null; xpAwarded: number }> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) {
        Logger.debug('No progression found');
        return { unlocked: null, xpAwarded: 0 };
      }

      // Calculer l'ancienneté de l'habitude (jours depuis création)
      let habitAge = options?.overrideAge ?? 0;
      if (!habitAge) {
        const { data } = await supabase
          .from('habits')
          .select('created_at')
          .eq('id', habitId)
          .single();

        if (data?.created_at) {
          const createdAt = new Date(data.created_at);
          const today = new Date();
          createdAt.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          habitAge = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 car le jour de création compte
        }
      }

      Logger.debug('Checking milestones for habit age:', habitAge);

      const { data: milestones, error } = await supabase
        .from('habit_milestones')
        .select('id, days, title, description, xp_reward, badge, tier, icon')
        .order('days', { ascending: true });

      if (error) {
        Logger.error('Error fetching milestones:', error);
        throw error;
      }

      const unlockedList = progression.milestones_unlocked ?? [];
      Logger.debug('Already unlocked (from DB):', unlockedList);

      // Trouver le milestone correspondant à l'ancienneté exacte de l'habitude
      const milestoneData = milestones?.find(
        (m: any) =>
          m.days === habitAge &&
          !unlockedList.includes(m.id) &&
          !unlockedList.includes(m.title)
      );

      if (!milestoneData) {
        Logger.debug('No new milestone for habit age', habitAge);
        return { unlocked: null, xpAwarded: 0 };
      }

      Logger.debug('FOUND NEW MILESTONE:', milestoneData.title);

      const xpReward = milestoneData.xp_reward;

      if (xpReward === undefined || xpReward === null || xpReward <= 0) {
        Logger.error('XP REWARD IS INVALID!');
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

      Logger.debug('Awarding milestone XP:', {
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
        Logger.error('Failed to award XP');
        return { unlocked: null, xpAwarded: 0 };
      }

      const newUnlockedList = [...unlockedList, milestone.title];

      const { error: updateError } = await supabase
        .from('habit_progression')
        .update({
          milestones_unlocked: newUnlockedList,
          last_milestone_date: new Date().toISOString(),
        })
        .eq('id', progression.id);

      if (updateError) {
        Logger.error('Error updating progression:', updateError);
        throw updateError;
      }

      // Mettre à jour current_tier_level dans habits (0-14 basé sur le nombre de milestones)
      const newTierLevel = newUnlockedList.length;
      const { error: habitUpdateError } = await supabase
        .from('habits')
        .update({ current_tier_level: newTierLevel })
        .eq('id', habitId);

      if (habitUpdateError) {
        Logger.error('Error updating habit tier level:', habitUpdateError);
        // Ne pas throw, le milestone est déjà débloqué
      }

      Logger.debug('Milestone unlocked successfully! Tier level:', newTierLevel);
      return { unlocked: milestone, xpAwarded: milestone.xpReward };
    } catch (err) {
      Logger.error('checkMilestoneUnlock error:', err);
      return { unlocked: null, xpAwarded: 0 };
    }
  }

  // ===========================================================================
  // SECTION: Metriques de performance
  // ===========================================================================

  /**
   * Calculer le score de consistance sur 30 jours
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le score de consistance (0-100)
   */
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

  /**
   * Obtenir les metriques de performance detaillees
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les metriques de performance ou null
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
    currentStreak: number;
    bestStreak: number;
  } | null> {
    try {
      const { data: completions, error } = await supabase
        .from('task_completions')
        .select('completed_tasks, all_completed, xp_earned')
        .eq('habit_id', habitId)
        .eq('user_id', userId);

      if (error) {
        Logger.error('getPerformanceMetrics error', error);
        return null;
      }

      const totalDays = completions?.length ?? 0;
      const totalTasks = completions?.reduce(
        (s, c) => s + ((c.completed_tasks as string[])?.length ?? 0),
        0
      ) ?? 0;
      const perfectDays = completions?.filter((c) => c.all_completed).length ?? 0;
      const totalXP = completions?.reduce((s, c) => s + (c.xp_earned ?? 0), 0) ?? 0;

      const { data: habit, error: streakError } = await supabase
        .from('habits')
        .select('current_streak, best_streak')
        .eq('id', habitId)
        .single();

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

  // ===========================================================================
  // SECTION: Gestion de la progression
  // ===========================================================================

  /**
   * Mettre a jour la progression d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @param options - Options de mise a jour
   * @returns La progression mise a jour ou null
   */
  static async updateProgression(
    habitId: string,
    userId: string,
    options?: { allTasksCompleted?: boolean; overrideStreak?: number }
  ): Promise<HabitProgression | null> {
    try {
      const progression = await this.getOrCreateProgression(habitId, userId);
      if (!progression) return null;

      let streak = options?.overrideStreak ?? 0;
      if (!streak) {
        const { data } = await supabase
          .from('habits')
          .select('current_streak')
          .eq('id', habitId)
          .single();
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

  /**
   * Obtenir ou creer la progression d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   * @returns La progression existante ou nouvellement creee
   */
  static async getOrCreateProgression(habitId: string, userId: string): Promise<HabitProgression | null> {
    try {
      const { data, error } = await supabase
        .from('habit_progression')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .single();

      if (!error && data) return data as HabitProgression;

      const { data: habitRow } = await supabase
        .from('habits')
        .select('current_streak')
        .eq('id', habitId)
        .single();

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
