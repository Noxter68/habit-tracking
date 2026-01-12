import { supabase } from '@/lib/supabase';
import {
  Quest,
  UserQuestProgress,
  QuestWithProgress,
  QuestCompletionResult,
  QuestCategory,
} from '@/types/quest.types';

export class QuestService {
  /**
   * Récupère toutes les quêtes actives avec la progression de l'utilisateur
   */
  static async getUserQuestsWithProgress(userId: string): Promise<QuestWithProgress[]> {
    try {
      // Récupérer toutes les quêtes actives
      const { data: quests, error: questsError } = await supabase
        .from('achievement_quests')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (questsError) throw questsError;

      // Récupérer la progression de l'utilisateur
      const { data: progress, error: progressError } = await supabase
        .from('user_achievement_quest_progress')
        .select('*')
        .eq('user_id', userId);

      if (progressError) throw progressError;

      // Mapper les quêtes avec leur progression
      const progressMap = new Map(
        progress?.map((p) => [p.achievement_quest_id, p]) || []
      );

      // Compter les habitudes de l'user pour ajuster les targets
      const habitsCount = await this.getUserHabitsCount(userId);

      const questsWithProgress: QuestWithProgress[] = quests.map((quest) => {
        const userProgress = progressMap.get(quest.id);
        const adjustedTarget = quest.is_dynamic
          ? this.calculateDynamicTarget(quest.target_value, habitsCount, quest.dynamic_percentage)
          : quest.target_value;

        const progressPercentage = userProgress?.is_completed
          ? 100
          : userProgress
          ? Math.min(100, Math.round((userProgress.progress_value / adjustedTarget) * 100))
          : 0;

        return {
          ...quest,
          user_progress: userProgress,
          adjusted_target: adjustedTarget,
          progress_percentage: progressPercentage,
        };
      });

      return questsWithProgress;
    } catch (error) {
      console.error('[QuestService] Error fetching user quests:', error);
      throw error;
    }
  }

  /**
   * Récupère uniquement les quêtes épinglées (max 5)
   */
  static async getPinnedQuests(userId: string): Promise<QuestWithProgress[]> {
    try {
      const allQuests = await this.getUserQuestsWithProgress(userId);
      return allQuests
        .filter((q) => q.user_progress?.is_pinned)
        .sort((a, b) => {
          const dateA = a.user_progress?.pinned_at ? new Date(a.user_progress.pinned_at).getTime() : 0;
          const dateB = b.user_progress?.pinned_at ? new Date(b.user_progress.pinned_at).getTime() : 0;
          return dateB - dateA; // Plus récent en premier
        })
        .slice(0, 5);
    } catch (error) {
      console.error('[QuestService] Error fetching pinned quests:', error);
      throw error;
    }
  }

  /**
   * Récupère les quêtes par catégorie
   */
  static async getQuestsByCategory(
    userId: string,
    category: QuestCategory
  ): Promise<QuestWithProgress[]> {
    try {
      const allQuests = await this.getUserQuestsWithProgress(userId);
      return allQuests.filter((q) => q.category === category);
    } catch (error) {
      console.error('[QuestService] Error fetching quests by category:', error);
      throw error;
    }
  }

  /**
   * Épingle ou désépingle une quête
   */
  static async toggleQuestPin(
    userId: string,
    questId: string,
    isPinned: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('toggle_quest_pin', {
        p_user_id: userId,
        p_quest_id: questId,
        p_is_pinned: isPinned,
      });

      if (error) throw error;

      if (data?.error) {
        return { success: false, error: data.error };
      }

      return { success: true };
    } catch (error) {
      console.error('[QuestService] Error toggling quest pin:', error);
      return { success: false, error: 'Failed to update quest pin status' };
    }
  }

  /**
   * Met à jour toutes les quêtes pertinentes après une complétion d'habitude
   * Appelé par HabitContext après chaque toggleHabitDay
   */
  static async updateQuestsOnHabitCompletion(
    userId: string,
    habitId: string,
    completionDate?: string
  ): Promise<QuestCompletionResult[]> {
    try {
      const { data, error } = await supabase.rpc('update_relevant_quests_on_habit_completion', {
        p_user_id: userId,
        p_habit_id: habitId,
        p_completion_date: completionDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      // Retourner les quêtes qui viennent d'être complétées
      const completedQuests = data?.completed_quests || [];
      return completedQuests.map((result: any) => ({
        quest_id: result.quest_id || '',
        completed: result.completed || false,
        reward: result.reward,
        message: result.quest_name,
      }));
    } catch (error) {
      console.error('[QuestService] Error updating quests on habit completion:', error);
      return [];
    }
  }

  /**
   * Met à jour une seule quête (utilisé pour des tests ou refresh manuel)
   */
  static async updateSingleQuest(
    userId: string,
    questId: string,
    completionDate?: string
  ): Promise<QuestCompletionResult | null> {
    try {
      const { data, error } = await supabase.rpc('update_single_quest_progress', {
        p_user_id: userId,
        p_quest_id: questId,
        p_completion_date: completionDate || new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      if (data?.already_completed) {
        return null;
      }

      if (data?.completed) {
        return {
          quest_id: questId,
          completed: true,
          reward: data.reward,
          message: data.quest_name,
        };
      }

      return null;
    } catch (error) {
      console.error('[QuestService] Error updating single quest:', error);
      return null;
    }
  }

  /**
   * Récupère le nombre d'habitudes actives de l'utilisateur
   * Utilisé pour ajuster les targets dynamiques
   */
  static async getUserHabitsCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId);

      if (error) {
        console.error('[QuestService] Error fetching habits count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('[QuestService] Error fetching habits count:', error);
      return 0;
    }
  }

  /**
   * Calcule la target ajustée pour les quêtes dynamiques
   * Logique: si user a <= base target, garde le base
   * Sinon, applique un pourcentage arrondi
   */
  static calculateDynamicTarget(
    baseTarget: number,
    habitsCount: number,
    percentage: number = 0.6
  ): number {
    if (habitsCount <= baseTarget) {
      return baseTarget;
    }
    return Math.max(baseTarget, Math.round(habitsCount * percentage));
  }

  /**
   * Récupère les statistiques globales des quêtes pour l'utilisateur
   */
  static async getQuestStats(userId: string): Promise<{
    totalQuests: number;
    completedQuests: number;
    pinnedQuests: number;
    completionPercentage: number;
  }> {
    try {
      const quests = await this.getUserQuestsWithProgress(userId);
      const completedCount = quests.filter((q) => q.user_progress?.is_completed).length;
      const pinnedCount = quests.filter((q) => q.user_progress?.is_pinned).length;

      return {
        totalQuests: quests.length,
        completedQuests: completedCount,
        pinnedQuests: pinnedCount,
        completionPercentage: quests.length > 0 ? Math.round((completedCount / quests.length) * 100) : 0,
      };
    } catch (error) {
      console.error('[QuestService] Error fetching quest stats:', error);
      return {
        totalQuests: 0,
        completedQuests: 0,
        pinnedQuests: 0,
        completionPercentage: 0,
      };
    }
  }

  /**
   * Récupère les quêtes complétées récemment (7 derniers jours)
   */
  static async getRecentlyCompletedQuests(userId: string): Promise<QuestWithProgress[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('user_achievement_quest_progress')
        .select(`
          *,
          quest:achievement_quests(*)
        `)
        .eq('user_id', userId)
        .eq('is_completed', true)
        .gte('completed_at', sevenDaysAgo.toISOString())
        .order('completed_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.quest,
        user_progress: {
          user_id: item.user_id,
          achievement_quest_id: item.achievement_quest_id,
          progress_value: item.progress_value,
          progress_value2: item.progress_value2,
          is_completed: item.is_completed,
          completed_at: item.completed_at,
          is_pinned: item.is_pinned,
          pinned_at: item.pinned_at,
          last_updated_at: item.last_updated_at,
        },
        adjusted_target: item.quest.target_value,
        progress_percentage: 100,
      }));
    } catch (error) {
      console.error('[QuestService] Error fetching recently completed quests:', error);
      return [];
    }
  }
}
