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
  useRef,
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
} from '@/types/quest.types';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';
import { useStats } from './StatsContext';
import { useQuestNotification } from './QuestNotificationContext';

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
  /** Rafraîchit les quêtes (silent = true pour refresh en arrière-plan sans loader) */
  refreshQuests: (silent?: boolean) => Promise<void>;
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
  const { updateStatsOptimistically } = useStats();
  const { showQuestCompletion } = useQuestNotification();
  const [quests, setQuests] = useState<QuestWithProgress[]>([]);
  const [pinnedQuests, setPinnedQuests] = useState<QuestWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuests: 0,
    completedQuests: 0,
    pinnedQuests: 0,
    completionPercentage: 0,
  });

  // Ref pour garder trace des quêtes précédentes et détecter les nouvelles complétions
  const previousQuestsRef = useRef<QuestWithProgress[]>([]);
  // Track if we have loaded data at least once (for cache behavior)
  const hasLoadedOnce = useRef(false);

  /**
   * Rafraîchit les quêtes et leurs progressions
   * @param silent - Si true, ne pas afficher le loader (refresh en arrière-plan)
   */
  const refreshQuests = useCallback(async (silent: boolean = false) => {
    if (!user) {
      setQuests([]);
      setPinnedQuests([]);
      setLoading(false);
      return;
    }

    try {
      // Only show loader on first load, not on subsequent refreshes (cache behavior)
      if (!silent && !hasLoadedOnce.current) {
        setLoading(true);
      }
      Logger.info('[QuestContext] Fetching quests for user:', user.id);

      // Récupérer toutes les quêtes avec progression
      const questsData = await QuestService.getUserQuestsWithProgress(user.id);

      // Détecter les quêtes nouvellement complétées
      const previousQuests = previousQuestsRef.current;
      if (previousQuests.length > 0) {
        questsData.forEach((quest) => {
          const previousQuest = previousQuests.find((q) => q.id === quest.id);
          const wasNotCompleted = !previousQuest?.user_progress?.completed_at;
          const isNowCompleted = !!quest.user_progress?.completed_at;

          if (wasNotCompleted && isNowCompleted) {
            Logger.info('[QuestContext] Quest newly completed:', quest.name_key);
            // Transformer le reward pour le toast
            const toastReward = quest.reward.kind === 'XP'
              ? { kind: 'XP' as const, amount: quest.reward.amount }
              : quest.reward.kind === 'BOOST'
                ? { kind: 'BOOST' as const, boost: { percent: quest.reward.boost.percent, durationHours: quest.reward.boost.durationHours } }
                : { kind: 'TITLE' as const, title: { key: quest.reward.title.key } };

            showQuestCompletion(quest.name_key, toastReward);

            // Mettre à jour les stats optimistiquement pour déclencher la détection de level up
            if (quest.reward.kind === 'XP') {
              Logger.info('[QuestContext] Updating stats optimistically with XP reward:', quest.reward.amount);
              updateStatsOptimistically(quest.reward.amount);
            }
          }
        });
      }

      // Mettre à jour la ref pour la prochaine comparaison
      previousQuestsRef.current = questsData;

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
      hasLoadedOnce.current = true;
    }
  }, [user, showQuestCompletion, updateStatsOptimistically]);

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
