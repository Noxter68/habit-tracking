/**
 * ============================================================================
 * LevelUpContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des celebrations de level up.
 *
 * Ce contexte surveille les changements de niveau et declenche
 * l'affichage des modales de celebration via la CelebrationQueue.
 *
 * Fonctionnalites principales:
 * - Detection automatique des level up
 * - Integration avec CelebrationQueue pour l'affichage
 * - Prevention des affichages multiples pour le meme niveau
 * - Trigger manuel pour tests
 *
 * @module LevelUpContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import { getAchievementByLevel } from '../utils/achievements';
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useStats } from './StatsContext';
import { useCelebrationQueue } from './CelebrationQueueContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Donnees d'un level up
 */
interface LevelUpData {
  /** Nouveau niveau atteint */
  newLevel: number;
  /** Niveau precedent */
  previousLevel: number;
  /** Achievement associe au niveau */
  achievement: any;
}

/**
 * Type du contexte de level up
 */
interface LevelUpContextType {
  /** Affichage de la modale (deprecated - use CelebrationQueue) */
  showLevelUpModal: boolean;
  /** Donnees du level up (deprecated - use CelebrationQueue) */
  levelUpData: LevelUpData | null;
  /** Declenche manuellement un level up */
  triggerLevelUp: (newLevel: number, previousLevel: number) => void;
  /** Ferme la modale (deprecated - use CelebrationQueue.dismissCurrentCelebration) */
  closeLevelUpModal: () => void;
  /** Verifie s'il y a un level up */
  checkForLevelUp: () => void;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const LevelUpContext = createContext<LevelUpContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte de level up
 *
 * Surveille les changements de niveau et envoie les celebrations
 * a la CelebrationQueue pour affichage.
 *
 * @param children - Composants enfants
 */
export const LevelUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  // Keep for backwards compatibility but these are now managed by CelebrationQueue
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const previousLevelRef = useRef<number | null>(null);
  const hasShownForLevel = useRef<Set<number>>(new Set());
  // Track if we've initialized the level (to avoid false positives on first load)
  const isInitialized = useRef(false);

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { stats } = useStats();
  const { queueLevelUp } = useCelebrationQueue();

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  /**
   * Verifie si un level up s'est produit
   */
  const checkForLevelUp = useCallback(() => {
    if (!stats?.level) return;

    // Initialise le niveau precedent au premier chargement
    // On attend que les stats soient stables avant de commencer a detecter
    if (previousLevelRef.current === null) {
      previousLevelRef.current = stats.level;
      Logger.debug('LevelUpContext: Initial level set:', stats.level);
      // Mark as initialized after a short delay to allow stats to stabilize
      setTimeout(() => {
        isInitialized.current = true;
        Logger.debug('LevelUpContext: Now initialized, will detect future level ups');
      }, 500);
      return;
    }

    // Only detect level ups after initialization
    if (!isInitialized.current) {
      previousLevelRef.current = stats.level;
      return;
    }

    // Verifie si le niveau a augmente et si on n'a pas deja affiche la modale
    if (stats.level > previousLevelRef.current && !hasShownForLevel.current.has(stats.level)) {
      Logger.debug(`LevelUpContext: LEVEL UP DETECTED! ${previousLevelRef.current} -> ${stats.level}`);

      const newAchievement = getAchievementByLevel(stats.level);

      hasShownForLevel.current.add(stats.level);

      // Queue the level up celebration
      queueLevelUp(stats.level, previousLevelRef.current, newAchievement);

      // Also update local state for backwards compatibility
      setLevelUpData({
        newLevel: stats.level,
        previousLevel: previousLevelRef.current,
        achievement: newAchievement,
      });
      setShowLevelUpModal(true);

      previousLevelRef.current = stats.level;
    } else if (stats.level !== previousLevelRef.current) {
      // Met a jour la reference si le niveau a change
      previousLevelRef.current = stats.level;
    }
  }, [stats?.level, queueLevelUp]);

  /**
   * Declenche manuellement un level up (pour tests)
   *
   * @param newLevel - Nouveau niveau
   * @param previousLevel - Niveau precedent
   */
  const triggerLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    const achievement = getAchievementByLevel(newLevel);

    // Queue the level up celebration
    queueLevelUp(newLevel, previousLevel, achievement);

    // Also update local state for backwards compatibility
    setLevelUpData({
      newLevel,
      previousLevel,
      achievement,
    });
    setShowLevelUpModal(true);
  }, [queueLevelUp]);

  /**
   * Ferme la modale de level up
   */
  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
    // Ne pas effacer levelUpData immediatement pour eviter le flicker
    setTimeout(() => {
      setLevelUpData(null);
    }, 300);
  }, []);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Surveille les changements de stats
   */
  useEffect(() => {
    checkForLevelUp();
  }, [stats?.level, checkForLevelUp]);

  /**
   * Reset les niveaux suivis quand l'utilisateur change
   */
  useEffect(() => {
    if (!stats) {
      previousLevelRef.current = null;
      hasShownForLevel.current.clear();
      isInitialized.current = false;
    }
  }, [stats]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <LevelUpContext.Provider
      value={{
        showLevelUpModal,
        levelUpData,
        triggerLevelUp,
        closeLevelUpModal,
        checkForLevelUp,
      }}
    >
      {children}
    </LevelUpContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte de level up
 *
 * @throws Error si utilise en dehors du LevelUpProvider
 * @returns Contexte de level up
 */
export const useLevelUp = () => {
  const context = useContext(LevelUpContext);
  if (!context) {
    throw new Error('useLevelUp must be used within LevelUpProvider');
  }
  return context;
};
