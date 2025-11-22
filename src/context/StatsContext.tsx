/**
 * ============================================================================
 * StatsContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des statistiques utilisateur.
 *
 * Ce contexte centralise toutes les donnees statistiques de l'utilisateur:
 * niveau, XP, progression, streaks et achievements.
 *
 * Fonctionnalites principales:
 * - Chargement des stats depuis le backend (non-bloquant)
 * - Mise a jour optimiste pour un feedback immediat
 * - Calcul automatique du niveau et de la progression
 * - Cache avec debounce pour eviter les requetes excessives
 *
 * @module StatsContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { XPService } from '../services/xpService';
import { HabitService } from '../services/habitService';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import { getAchievementByLevel } from '../utils/achievements';
import { getXPForNextLevel } from '../utils/xpCalculations';
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Donnees statistiques de l'utilisateur
 */
interface Stats {
  /** Titre actuel (basé sur le niveau) */
  title: string;
  /** Niveau actuel */
  level: number;
  /** XP dans le niveau actuel */
  currentLevelXP: number;
  /** XP requis pour le prochain niveau */
  xpForNextLevel: number;
  /** Progression en pourcentage */
  levelProgress: number;
  /** Streak total en jours */
  totalStreak: number;
  /** Nombre d'habitudes actives */
  activeHabits: number;
  /** Taches completees aujourd'hui */
  completedTasksToday: number;
  /** Total des taches aujourd'hui */
  totalTasksToday: number;
  /** Achievement actuel */
  currentAchievement: any;
  /** XP total accumule */
  totalXP: number;
}

/**
 * Type du contexte des statistiques
 */
interface StatsContextType {
  /** Statistiques actuelles */
  stats: Stats | null;
  /** Indicateur de chargement */
  loading: boolean;
  /** Rafraichit les statistiques */
  refreshStats: (forceRefresh?: boolean) => Promise<void>;
  /** Mise a jour optimiste des stats */
  updateStatsOptimistically: (xpAmount: number) => { leveledUp: boolean; newLevel: number } | null;
  /** Timestamp de la derniere mise a jour */
  lastUpdated: number;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const StatsContext = createContext<StatsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte des statistiques
 *
 * Gere l'etat global des statistiques et fournit les methodes
 * de rafraichissement et mise a jour optimiste.
 *
 * @param children - Composants enfants
 */
export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const lastUpdatedRef = useRef(0);

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { user } = useAuth();

  // ==========================================================================
  // CALLBACKS - Rafraichissement
  // ==========================================================================

  /**
   * Rafraichit les statistiques depuis le backend
   * Non-bloquant pour l'UI
   *
   * @param forceRefresh - Force le rafraichissement (ignore le debounce)
   */
  const refreshStats = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!user?.id) {
        Logger.debug('StatsContext: No user, clearing stats');
        setStats(null);
        return;
      }

      // Skip debounce si force refresh
      if (!forceRefresh) {
        const now = Date.now();
        if (lastUpdatedRef.current && now - lastUpdatedRef.current < 1000) {
          Logger.debug('StatsContext: Skipping refresh (debounced)');
          return;
        }
      }

      try {
        Logger.debug('StatsContext: Fetching fresh data from backend...');

        // Fetch tout en parallele
        const [xpStats, habitStats, activeHabitsCount, todayStats, globalStreak] = await Promise.all([
          XPService.getUserXPStats(user.id),
          HabitService.getAggregatedStats(user.id),
          HabitService.getActiveHabitsCount(user.id),
          HabitService.getTodayStats(user.id),
          HabitService.getGlobalStreak(user.id),
        ]);

        Logger.debug('StatsContext: Raw XP data from backend:', {
          total_xp: xpStats?.total_xp,
          current_level: xpStats?.current_level,
          current_level_xp: xpStats?.current_level_xp,
          xp_for_next_level: xpStats?.xp_for_next_level,
        });

        // Utilise les donnees de la base
        const totalXP = xpStats?.total_xp || 0;
        const level = xpStats?.current_level || 1;
        const currentLevelXP = xpStats?.current_level_xp || 0;
        const nextLevelXP = xpStats?.xp_for_next_level || getXPForNextLevel(level);

        // Calcule le pourcentage de progression
        const adjustedCurrentXP = Math.max(0, currentLevelXP);
        const progress = nextLevelXP > 0 ? Math.min((adjustedCurrentXP / nextLevelXP) * 100, 100) : 0;

        Logger.debug('StatsContext: Calculated values:', {
          level,
          currentLevelXP: adjustedCurrentXP,
          xpForNextLevel: nextLevelXP,
          progress: `${progress.toFixed(1)}%`,
        });

        // Recupere l'achievement pour le niveau actuel
        const currentAchievement = getAchievementByLevel(level);

        const newStats: Stats = {
          title: currentAchievement?.title || 'Novice',
          level,
          currentLevelXP: adjustedCurrentXP,
          xpForNextLevel: nextLevelXP,
          levelProgress: progress,
          totalStreak: globalStreak || 0,
          activeHabits: activeHabitsCount || 0,
          completedTasksToday: todayStats?.completed || todayStats?.completedTasks || 0,
          totalTasksToday: todayStats?.total || todayStats?.totalTasks || 0,
          currentAchievement: currentAchievement || { level: 1, title: 'Novice' },
          totalXP,
        };

        Logger.debug('StatsContext: Final stats object:', newStats);
        setStats(newStats);
        lastUpdatedRef.current = Date.now();
      } catch (err) {
        Logger.error('StatsContext: Error refreshing stats:', err);
        // Ne pas effacer les stats en cas d'erreur
      }
    },
    [user?.id]
  );

  // ==========================================================================
  // CALLBACKS - Mise a jour optimiste
  // ==========================================================================

  /**
   * Met a jour les stats de maniere optimiste pour un feedback immediat
   *
   * @param xpAmount - Quantite d'XP a ajouter
   * @returns Information sur le level up ou null
   */
  const updateStatsOptimistically = useCallback(
    (xpAmount: number) => {
      if (!stats) {
        Logger.warn('StatsContext: Cannot update optimistically, no stats available');
        return null;
      }

      Logger.debug('StatsContext: Optimistic update', {
        currentXP: stats.currentLevelXP,
        xpAmount,
        xpForNextLevel: stats.xpForNextLevel,
      });

      const newCurrentLevelXP = stats.currentLevelXP + xpAmount;
      let newLevel = stats.level;
      let newXPForNextLevel = stats.xpForNextLevel;
      let adjustedCurrentXP = newCurrentLevelXP;

      // Verifie si level up
      if (newCurrentLevelXP >= stats.xpForNextLevel) {
        newLevel = stats.level + 1;
        adjustedCurrentXP = newCurrentLevelXP - stats.xpForNextLevel;
        newXPForNextLevel = getXPForNextLevel(newLevel);

        Logger.debug('StatsContext: LEVEL UP!', {
          previousLevel: stats.level,
          newLevel,
          overflow: adjustedCurrentXP,
        });
      }

      const newProgress = newXPForNextLevel > 0
        ? Math.min((adjustedCurrentXP / newXPForNextLevel) * 100, 100)
        : 0;

      const currentAchievement = getAchievementByLevel(newLevel);

      // Met a jour les stats sans appel backend
      const updatedStats: Stats = {
        ...stats,
        level: newLevel,
        currentLevelXP: adjustedCurrentXP,
        xpForNextLevel: newXPForNextLevel,
        levelProgress: newProgress,
        totalXP: stats.totalXP + xpAmount,
        currentAchievement: currentAchievement || stats.currentAchievement,
        title: currentAchievement?.title || stats.title,
      };

      setStats(updatedStats);

      Logger.debug('StatsContext: Optimistic update complete', {
        newLevel,
        newCurrentLevelXP: adjustedCurrentXP,
        newProgress: `${newProgress.toFixed(1)}%`,
      });

      return {
        leveledUp: newLevel > stats.level,
        newLevel,
      };
    },
    [stats]
  );

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Charge les stats initiales quand l'utilisateur se connecte
   */
  useEffect(() => {
    if (user?.id) {
      Logger.debug('StatsContext: User detected, loading initial stats');
      refreshStats(true);
    } else {
      setStats(null);
      lastUpdatedRef.current = 0;
    }
  }, [user?.id, refreshStats]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <StatsContext.Provider
      value={{
        stats,
        loading,
        refreshStats,
        updateStatsOptimistically,
        lastUpdated: lastUpdatedRef.current,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte des statistiques
 *
 * @throws Error si utilise en dehors du StatsProvider
 * @returns Contexte des statistiques
 */
export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) {
    throw new Error('useStats must be used within StatsProvider');
  }
  return ctx;
};
