/**
 * ============================================================================
 * QuestContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des quêtes de l'utilisateur.
 *
 * Ce contexte centralise les données de quêtes, la progression
 * et les actions liées aux quêtes (épinglage, rafraîchissement).
 *
 * Fonctionnalités principales:
 * - Chargement des quêtes avec progression
 * - Gestion des quêtes épinglées (max 5)
 * - Filtrage par catégorie
 * - Statistiques globales
 *
 * @module QuestContext
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
import { QuestService } from '@/services/QuestService';
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Types
// ============================================================================
import {
  QuestWithProgress,
  QuestCategory,
  QuestCompletionResult,
} from '@/types/quest.types';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Type du contexte des quêtes
 */
interface QuestContextType {
  /** Liste de toutes les quêtes avec progression */
  quests: QuestWithProgress[];
  /** Quêtes épinglées (max 5) */
  pinnedQuests: QuestWithProgress[];
  /** Indicateur de chargement */
  loading: boolean;
  /** Rafraîchit les quêtes */
  refreshQuests: () => Promise<void>;
  /** Épingle ou désépingle une quête */
  togglePin: (questId: string, isPinned: boolean) => Promise<boolean>;
  /** Récupère les quêtes par catégorie */
  getQuestsByCategory: (category: QuestCategory) => QuestWithProgress[];
  /** Statistiques globales */
  stats: {
    totalQuests: number;
    completedQuests: number;
    pinnedQuests: number;
    completionPercentage: number;
  };
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const QuestContext = createContext<QuestContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte des quêtes
 */
export const QuestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [pinnedQuests, setPinnedQuests] = useState<QuestWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuests: 0,
    completedQuests: 0,
    pinnedQuests: 0,
    completionPercentage: 0,
  });

  /**
   * Rafraîchit les quêtes et leurs progressions
   */
  const refreshQuests = useCallback(async () => {
    if (!user) {
      setQuests([]);
      setPinnedQuests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      Logger.info('[QuestContext] Fetching quests for user:', user.id);

      // Récupérer toutes les quêtes avec progression
      const questsData = await QuestService.getUserQuestsWithProgress(user.id);
      setQuests(questsData);

      // Récupérer les quêtes épinglées
      const pinned = questsData
        .filter((q) => q.user_progress?.is_pinned)
        .sort((a, b) => {
          const dateA = a.user_progress?.pinned_at
            ? new Date(a.user_progress.pinned_at).getTime()
            : 0;
          const dateB = b.user_progress?.pinned_at
            ? new Date(b.user_progress.pinned_at).getTime()
            : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
      setPinnedQuests(pinned);

      // Calculer les stats
      const questStats = await QuestService.getQuestStats(user.id);
      setStats(questStats);

      Logger.info('[QuestContext] Quests loaded:', {
        total: questsData.length,
        pinned: pinned.length,
        completed: questStats.completedQuests,
      });
    } catch (error) {
      Logger.error('[QuestContext] Error fetching quests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Épingle ou désépingle une quête
   */
  const togglePin = useCallback(
    async (questId: string, isPinned: boolean): Promise<boolean> => {
      if (!user) return false;

      try {
        Logger.info('[QuestContext] Toggling pin for quest:', questId, isPinned);

        const result = await QuestService.toggleQuestPin(user.id, questId, isPinned);

        if (result.success) {
          // Rafraîchir les quêtes après le changement
          await refreshQuests();
          return true;
        } else {
          Logger.error('[QuestContext] Failed to toggle pin:', result.error);
          return false;
        }
      } catch (error) {
        Logger.error('[QuestContext] Error toggling pin:', error);
        return false;
      }
    },
    [user, refreshQuests]
  );

  /**
   * Récupère les quêtes par catégorie
   */
  const getQuestsByCategory = useCallback(
    (category: QuestCategory): QuestWithProgress[] => {
      return quests.filter((q) => q.category === category);
    },
    [quests]
  );

  /**
   * Charge les quêtes au mount et quand l'utilisateur change
   */
  useEffect(() => {
    refreshQuests();
  }, [user?.id]);

  // ============================================================================
  // VALEUR DU CONTEXTE
  // ============================================================================

  const value: QuestContextType = {
    quests,
    pinnedQuests,
    loading,
    refreshQuests,
    togglePin,
    getQuestsByCategory,
    stats,
  };

  return <QuestContext.Provider value={value}>{children}</QuestContext.Provider>;
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook pour utiliser le contexte des quêtes
 * @throws {Error} Si utilisé en dehors d'un QuestProvider
 */
export const useQuests = (): QuestContextType => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuests must be used within a QuestProvider');
  }
  return context;
};
