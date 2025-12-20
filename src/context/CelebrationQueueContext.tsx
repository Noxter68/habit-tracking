/**
 * ============================================================================
 * CelebrationQueueContext.tsx
 * ============================================================================
 *
 * Contexte de gestion de la file d'attente des celebrations.
 *
 * Ce contexte centralise l'affichage des modales de celebration
 * (level up, milestones, etc.) pour s'assurer qu'elles sont toujours
 * affichees l'une apres l'autre et jamais perdues.
 *
 * Fonctionnalites principales:
 * - File d'attente FIFO pour les celebrations
 * - Prevention des doublons
 * - Gestion de l'ordre d'affichage
 * - Support de plusieurs types de celebrations
 *
 * @module CelebrationQueueContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Types
// ============================================================================
import { HabitMilestone } from '@/services/habitProgressionService';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Types de celebrations supportees
 */
type CelebrationType = 'level_up' | 'milestone_single' | 'milestone_multiple';

/**
 * Donnees d'un level up
 */
interface LevelUpCelebration {
  type: 'level_up';
  id: string;
  newLevel: number;
  previousLevel: number;
  achievement: any;
}

/**
 * Donnees d'un milestone unique
 */
interface MilestoneSingleCelebration {
  type: 'milestone_single';
  id: string;
  milestone: HabitMilestone;
  milestoneIndex: number;
}

/**
 * Donnees de plusieurs milestones
 */
interface MilestoneMultipleCelebration {
  type: 'milestone_multiple';
  id: string;
  milestones: Array<{ milestone: HabitMilestone; index: number }>;
}

/**
 * Union de tous les types de celebrations
 */
type Celebration =
  | LevelUpCelebration
  | MilestoneSingleCelebration
  | MilestoneMultipleCelebration;

/**
 * Type du contexte de celebration queue
 */
interface CelebrationQueueContextType {
  /** Celebration actuellement affichee */
  currentCelebration: Celebration | null;
  /** Ajoute un level up a la queue */
  queueLevelUp: (newLevel: number, previousLevel: number, achievement: any) => void;
  /** Ajoute un milestone unique a la queue */
  queueMilestoneSingle: (milestone: HabitMilestone, milestoneIndex: number) => void;
  /** Ajoute plusieurs milestones a la queue */
  queueMilestoneMultiple: (milestones: Array<{ milestone: HabitMilestone; index: number }>) => void;
  /** Ferme la celebration actuelle et passe a la suivante */
  dismissCurrentCelebration: () => void;
  /** Verifie si une celebration de type specifique est en attente */
  hasPendingCelebration: (type: CelebrationType) => boolean;
  /** Nombre de celebrations en attente */
  queueLength: number;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const CelebrationQueueContext = createContext<CelebrationQueueContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte de celebration queue
 *
 * Gere une file d'attente pour afficher les celebrations
 * l'une apres l'autre sans en perdre.
 *
 * @param children - Composants enfants
 */
export const CelebrationQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [queue, setQueue] = useState<Celebration[]>([]);
  const [currentCelebration, setCurrentCelebration] = useState<Celebration | null>(null);
  // Track if we're transitioning between celebrations
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ==========================================================================
  // REFS
  // ==========================================================================

  // Pour eviter les doublons de level up
  const shownLevelUps = useRef<Set<number>>(new Set());
  // Pour eviter les doublons de milestones (par titre)
  const shownMilestones = useRef<Set<string>>(new Set());

  // ==========================================================================
  // CALLBACKS - Gestion de la queue
  // ==========================================================================

  /**
   * Traite le prochain element de la queue
   */
  const processNext = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        Logger.debug('CelebrationQueue: Queue empty, nothing to show');
        return [];
      }

      const [next, ...rest] = prevQueue;
      Logger.debug('CelebrationQueue: Processing next celebration:', next.type, next.id);
      // Use setTimeout to ensure state updates are batched correctly
      setTimeout(() => setCurrentCelebration(next), 0);
      return rest;
    });
  }, []);

  /**
   * Ajoute une celebration a la queue
   */
  const addToQueue = useCallback((celebration: Celebration) => {
    Logger.debug('CelebrationQueue: Adding to queue:', celebration.type, celebration.id);

    setQueue((prevQueue) => {
      // Si aucune celebration n'est en cours, afficher directement
      if (!currentCelebration && prevQueue.length === 0) {
        Logger.debug('CelebrationQueue: No current celebration, showing immediately');
        setCurrentCelebration(celebration);
        return [];
      }

      // Sinon ajouter a la queue
      return [...prevQueue, celebration];
    });
  }, [currentCelebration]);

  /**
   * Ajoute un level up a la queue
   */
  const queueLevelUp = useCallback((newLevel: number, previousLevel: number, achievement: any) => {
    // Eviter les doublons
    if (shownLevelUps.current.has(newLevel)) {
      Logger.debug('CelebrationQueue: Level up already shown for level:', newLevel);
      return;
    }

    shownLevelUps.current.add(newLevel);

    const celebration: LevelUpCelebration = {
      type: 'level_up',
      id: `level_up_${newLevel}_${Date.now()}`,
      newLevel,
      previousLevel,
      achievement,
    };

    addToQueue(celebration);
  }, [addToQueue]);

  /**
   * Ajoute un milestone unique a la queue
   */
  const queueMilestoneSingle = useCallback((milestone: HabitMilestone, milestoneIndex: number) => {
    // Eviter les doublons
    if (shownMilestones.current.has(milestone.title)) {
      Logger.debug('CelebrationQueue: Milestone already shown:', milestone.title);
      return;
    }

    shownMilestones.current.add(milestone.title);

    const celebration: MilestoneSingleCelebration = {
      type: 'milestone_single',
      id: `milestone_${milestone.title}_${Date.now()}`,
      milestone,
      milestoneIndex,
    };

    addToQueue(celebration);
  }, [addToQueue]);

  /**
   * Ajoute plusieurs milestones a la queue
   */
  const queueMilestoneMultiple = useCallback((milestones: Array<{ milestone: HabitMilestone; index: number }>) => {
    // Filtrer les doublons
    const newMilestones = milestones.filter((m) => !shownMilestones.current.has(m.milestone.title));

    if (newMilestones.length === 0) {
      Logger.debug('CelebrationQueue: All milestones already shown');
      return;
    }

    // Marquer comme montres
    newMilestones.forEach((m) => shownMilestones.current.add(m.milestone.title));

    const celebration: MilestoneMultipleCelebration = {
      type: 'milestone_multiple',
      id: `milestones_multiple_${Date.now()}`,
      milestones: newMilestones,
    };

    addToQueue(celebration);
  }, [addToQueue]);

  /**
   * Ferme la celebration actuelle et passe a la suivante
   */
  const dismissCurrentCelebration = useCallback(() => {
    Logger.debug('CelebrationQueue: Dismissing current celebration');

    // Clear current immediately to avoid blocking the UI
    setCurrentCelebration(null);
    setIsTransitioning(true);

    // Small delay before showing next to allow smooth transition
    setTimeout(() => {
      setIsTransitioning(false);
      processNext();
    }, 100);
  }, [processNext]);

  /**
   * Verifie si une celebration de type specifique est en attente
   */
  const hasPendingCelebration = useCallback((type: CelebrationType) => {
    if (currentCelebration?.type === type) return true;
    return queue.some((c) => c.type === type);
  }, [currentCelebration, queue]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <CelebrationQueueContext.Provider
      value={{
        currentCelebration,
        queueLevelUp,
        queueMilestoneSingle,
        queueMilestoneMultiple,
        dismissCurrentCelebration,
        hasPendingCelebration,
        queueLength: queue.length + (currentCelebration ? 1 : 0),
      }}
    >
      {children}
    </CelebrationQueueContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte de celebration queue
 *
 * @throws Error si utilise en dehors du CelebrationQueueProvider
 * @returns Contexte de celebration queue
 */
export const useCelebrationQueue = () => {
  const context = useContext(CelebrationQueueContext);
  if (!context) {
    throw new Error('useCelebrationQueue must be used within CelebrationQueueProvider');
  }
  return context;
};

// ============================================================================
// EXPORTS - Types
// ============================================================================

export type {
  Celebration,
  LevelUpCelebration,
  MilestoneSingleCelebration,
  MilestoneMultipleCelebration,
  CelebrationType,
};
