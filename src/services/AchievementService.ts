/**
 * Service de gestion des succes (achievements)
 *
 * Ce service gere le systeme de succes de l'application, incluant
 * les succes bases sur les streaks, les completions, les jours parfaits
 * et le nombre d'habitudes suivies.
 *
 * @module AchievementService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Definition d'un succes
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: 'streak' | 'completions' | 'perfect_days' | 'habits_count';
    value: number;
  };
  level: number;
  createdAt: Date;
}

/**
 * Succes deverrouille par un utilisateur
 */
export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: Date;
}

/**
 * Statistiques utilisateur pour le calcul des succes
 */
interface UserStats {
  streak: number;
  totalCompletions: number;
  perfectDays: number;
  totalHabits: number;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des succes
 *
 * Gere la definition, le deblocage et le suivi des succes utilisateur
 */
export class AchievementService {
  // ===========================================================================
  // CONSTANTES - Liste des succes predefinis
  // ===========================================================================

  static achievements: Achievement[] = [
    // Succes bases sur les streaks
    {
      id: 'streak-3',
      title: 'Starter',
      description: 'Maintain a 3-day streak',
      icon: '🚀',
      color: '#10b981',
      requirement: { type: 'streak', value: 3 },
      level: 1,
      createdAt: new Date(),
    },
    {
      id: 'streak-7',
      title: 'Committed',
      description: 'Maintain a 7-day streak',
      icon: '🎯',
      color: '#3b82f6',
      requirement: { type: 'streak', value: 7 },
      level: 2,
      createdAt: new Date(),
    },
    {
      id: 'streak-14',
      title: 'Dedicated',
      description: 'Maintain a 14-day streak',
      icon: '🛡️',
      color: '#6366f1',
      requirement: { type: 'streak', value: 14 },
      level: 3,
      createdAt: new Date(),
    },
    {
      id: 'streak-30',
      title: 'Consistent',
      description: 'Maintain a 30-day streak',
      icon: '🔥',
      color: '#f59e0b',
      requirement: { type: 'streak', value: 30 },
      level: 4,
      createdAt: new Date(),
    },
    {
      id: 'streak-60',
      title: 'Warrior',
      description: 'Maintain a 60-day streak',
      icon: '🏅',
      color: '#ef4444',
      requirement: { type: 'streak', value: 60 },
      level: 5,
      createdAt: new Date(),
    },
    {
      id: 'streak-100',
      title: 'Champion',
      description: 'Maintain a 100-day streak',
      icon: '🏆',
      color: '#d97706',
      requirement: { type: 'streak', value: 100 },
      level: 6,
      createdAt: new Date(),
    },
    // Succes bases sur les completions
    {
      id: 'completions-50',
      title: 'Achiever',
      description: 'Complete 50 total habit days',
      icon: '⭐',
      color: '#8b5cf6',
      requirement: { type: 'completions', value: 50 },
      level: 4,
      createdAt: new Date(),
    },
    {
      id: 'completions-100',
      title: 'Master',
      description: 'Complete 100 total habit days',
      icon: '👑',
      color: '#7c3aed',
      requirement: { type: 'completions', value: 100 },
      level: 7,
      createdAt: new Date(),
    },
    {
      id: 'completions-365',
      title: 'Legend',
      description: 'Complete 365 total habit days',
      icon: '✨',
      color: '#dc2626',
      requirement: { type: 'completions', value: 365 },
      level: 9,
      createdAt: new Date(),
    },
    {
      id: 'completions-1000',
      title: 'Mythic',
      description: 'Complete 1000 total habit days',
      icon: '💎',
      color: '#991b1b',
      requirement: { type: 'completions', value: 1000 },
      level: 10,
      createdAt: new Date(),
    },
    // Succes bases sur les jours parfaits
    {
      id: 'perfect-7',
      title: 'Perfectionist',
      description: 'Have 7 perfect days',
      icon: '💯',
      color: '#14b8a6',
      requirement: { type: 'perfect_days', value: 7 },
      level: 3,
      createdAt: new Date(),
    },
    {
      id: 'perfect-30',
      title: 'Flawless',
      description: 'Have 30 perfect days',
      icon: '💫',
      color: '#0d9488',
      requirement: { type: 'perfect_days', value: 30 },
      level: 6,
      createdAt: new Date(),
    },
    // Succes bases sur le nombre d'habitudes
    {
      id: 'habits-3',
      title: 'Multi-tasker',
      description: 'Track 3 habits simultaneously',
      icon: '🎪',
      color: '#ec4899',
      requirement: { type: 'habits_count', value: 3 },
      level: 2,
      createdAt: new Date(),
    },
    {
      id: 'habits-5',
      title: 'Juggler',
      description: 'Track 5 habits simultaneously',
      icon: '🎭',
      color: '#db2777',
      requirement: { type: 'habits_count', value: 5 },
      level: 4,
      createdAt: new Date(),
    },
    {
      id: 'habits-10',
      title: 'Optimizer',
      description: 'Track 10 habits simultaneously',
      icon: '🚁',
      color: '#be123c',
      requirement: { type: 'habits_count', value: 10 },
      level: 8,
      createdAt: new Date(),
    },
  ];

  // ===========================================================================
  // SECTION: Initialisation
  // ===========================================================================

  /**
   * Initialiser la table des succes
   * Insere tous les succes predefinis dans la base de donnees
   */
  static async initializeAchievements() {
    try {
      for (const achievement of this.achievements) {
        const { error } = await supabase
          .from('achievements')
          .upsert({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            color: achievement.color,
            requirement_type: achievement.requirement.type,
            requirement_value: achievement.requirement.value,
            level: achievement.level,
          })
          .select()
          .single();

        if (error && error.code !== '23505') {
          Logger.error('Error inserting achievement:', error);
        }
      }
    } catch (error) {
      Logger.error('Error initializing achievements:', error);
    }
  }

  // ===========================================================================
  // SECTION: Recuperation des succes
  // ===========================================================================

  /**
   * Recuperer tous les succes disponibles
   *
   * @returns Liste de tous les succes
   */
  static async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('level', { ascending: true });

      if (error) throw error;

      return (
        data?.map((a) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          color: a.color,
          requirement: {
            type: a.requirement_type,
            value: a.requirement_value,
          },
          level: a.level,
          createdAt: new Date(a.created_at),
        })) || []
      );
    } catch (error) {
      Logger.error('Error fetching achievements:', error);
      return this.achievements;
    }
  }

  /**
   * Recuperer les succes d'un utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des succes deverrouilles
   */
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            title,
            description,
            icon,
            color
          )
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      return (
        data?.map((ua) => ({
          id: ua.id,
          userId: ua.user_id,
          achievementId: ua.achievement_id,
          title: ua.achievements.title,
          description: ua.achievements.description,
          icon: ua.achievements.icon,
          color: ua.achievements.color,
          unlockedAt: new Date(ua.unlocked_at),
        })) || []
      );
    } catch (error) {
      Logger.error('Error fetching user achievements:', error);
      return [];
    }
  }

  // ===========================================================================
  // SECTION: Verification et deblocage
  // ===========================================================================

  /**
   * Verifier et debloquer les succes en fonction des statistiques
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param stats - Les statistiques de l'utilisateur
   * @returns Liste des nouveaux succes deverrouilles
   */
  static async checkAndUnlockAchievements(
    userId: string,
    stats: UserStats
  ): Promise<Achievement[]> {
    try {
      const unlockedAchievements: Achievement[] = [];
      const allAchievements = await this.getAllAchievements();
      const userAchievements = await this.getUserAchievements(userId);
      const unlockedIds = userAchievements.map((ua) => ua.achievementId);

      for (const achievement of allAchievements) {
        if (unlockedIds.includes(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.requirement.type) {
          case 'streak':
            shouldUnlock = stats.streak >= achievement.requirement.value;
            break;
          case 'completions':
            shouldUnlock = stats.totalCompletions >= achievement.requirement.value;
            break;
          case 'perfect_days':
            shouldUnlock = stats.perfectDays >= achievement.requirement.value;
            break;
          case 'habits_count':
            shouldUnlock = stats.totalHabits >= achievement.requirement.value;
            break;
        }

        if (shouldUnlock) {
          const { error } = await supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id,
              unlocked_at: new Date().toISOString(),
            });

          if (!error) {
            unlockedAchievements.push(achievement);
          }
        }
      }

      return unlockedAchievements;
    } catch (error) {
      Logger.error('Error checking achievements:', error);
      return [];
    }
  }

  // ===========================================================================
  // SECTION: Titre utilisateur
  // ===========================================================================

  /**
   * Obtenir le titre actuel de l'utilisateur
   * Base sur le succes de plus haut niveau deverrouille
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le titre de l'utilisateur
   */
  static async getUserTitle(userId: string): Promise<string> {
    try {
      const userAchievements = await this.getUserAchievements(userId);

      if (userAchievements.length === 0) {
        return 'Newcomer';
      }

      const sortedByLevel = userAchievements.sort((a, b) => {
        const aAch = this.achievements.find((ach) => ach.id === a.achievementId);
        const bAch = this.achievements.find((ach) => ach.id === b.achievementId);
        return (bAch?.level || 0) - (aAch?.level || 0);
      });

      return sortedByLevel[0]?.title || 'Newcomer';
    } catch (error) {
      Logger.error('Error getting user title:', error);
      return 'Newcomer';
    }
  }
}
