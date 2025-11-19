/**
 * ============================================================================
 * AchievementContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des achievements (badges) de l'utilisateur.
 *
 * Ce contexte centralise les donnees d'achievements, les statistiques
 * associees et la verification des deblocages.
 *
 * Fonctionnalites principales:
 * - Chargement des achievements utilisateur
 * - Calcul des statistiques (completions, XP, streaks)
 * - Verification et deblocage automatique des achievements
 * - Determination du titre actuel et suivant
 *
 * @module AchievementContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { XPService } from '../services/xpService';
import { HabitService } from '../services/habitService';
import { AchievementService } from '../services/AchievementService';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import { getAchievementByLevel } from '../utils/achievements';
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Types
// ============================================================================
import { Achievement } from '../types/achievement.types';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Type du contexte des achievements
 */
interface AchievementContextType {
  /** Liste des achievements de l'utilisateur */
  achievements: Achievement[];
  /** Nombre total de completions */
  totalCompletions: number;
  /** XP total */
  totalXP: number;
  /** Niveau actuel */
  currentLevel: number;
  /** Progression dans le niveau */
  levelProgress: number;
  /** Streak actuel */
  streak: number;
  /** Nombre de jours parfaits */
  perfectDays: number;
  /** Nombre total d'habitudes */
  totalHabits: number;
  /** Indicateur de chargement */
  loading: boolean;
  /** Titre actuel */
  currentTitle: Achievement | undefined;
  /** Prochain titre */
  nextTitle: Achievement | undefined;
  /** Rafraichit les achievements */
  refreshAchievements: () => Promise<void>;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte des achievements
 *
 * Gere l'etat global des achievements et fournit les methodes
 * de rafraichissement.
 *
 * @param children - Composants enfants
 */
export const AchievementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [streak, setStreak] = useState(0);
  const [perfectDays, setPerfectDays] = useState(0);
  const [totalHabits, setTotalHabits] = useState(0);
  const [loading, setLoading] = useState(false);

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { user } = useAuth();

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  /**
   * Rafraichit tous les achievements et statistiques
   */
  const refreshAchievements = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch tout en parallele
      const [xpStats, habitStats, userAchievements, habits] = await Promise.all([
        XPService.getUserXPStats(user.id),
        HabitService.getAggregatedStats(user.id),
        AchievementService.getUserAchievements(user.id),
        HabitService.fetchHabits(user.id),
      ]);

      const perfectDayCount = habitStats?.streakData?.filter((d: any) => d.value === 100).length || 0;

      setTotalCompletions(habitStats?.totalCompletions || 0);
      setTotalXP(xpStats?.total_xp || 0);
      setCurrentLevel(xpStats?.current_level || 1);
      setLevelProgress(xpStats?.level_progress || 0);
      setStreak(habitStats?.totalDaysTracked || 0);
      setPerfectDays(perfectDayCount);
      setTotalHabits(habits?.length || 0);
      setAchievements(userAchievements || []);

      // Verifie si de nouveaux achievements doivent etre debloques
      const newAchievements = await AchievementService.checkAndUnlockAchievements(user.id, {
        streak: habitStats?.totalDaysTracked || 0,
        totalCompletions: habitStats?.totalCompletions || 0,
        perfectDays: perfectDayCount,
        totalHabits: habits?.length || 0,
      });

      if (newAchievements?.length > 0) {
        const updatedAchievements = await AchievementService.getUserAchievements(user.id);
        setAchievements(updatedAchievements || []);
      }
    } catch (err) {
      Logger.error('Error refreshing achievements:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Charge les achievements quand l'utilisateur se connecte
   */
  useEffect(() => {
    if (user?.id) {
      refreshAchievements();
    } else {
      setAchievements([]);
    }
  }, [user?.id, refreshAchievements]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const currentTitle = getAchievementByLevel(currentLevel);
  const nextTitle = getAchievementByLevel(currentLevel + 1);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: AchievementContextType = {
    achievements,
    totalCompletions,
    totalXP,
    currentLevel,
    levelProgress,
    streak,
    perfectDays,
    totalHabits,
    loading,
    currentTitle,
    nextTitle,
    refreshAchievements,
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte des achievements
 *
 * @throws Error si utilise en dehors du AchievementProvider
 * @returns Contexte des achievements
 */
export const useAchievements = () => {
  const ctx = useContext(AchievementContext);
  if (!ctx) {
    throw new Error('useAchievements must be used inside AchievementProvider');
  }
  return ctx;
};
