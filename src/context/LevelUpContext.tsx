/**
 * ============================================================================
 * LevelUpContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des celebrations de level up.
 *
 * Ce contexte surveille les changements de niveau et declenche
 * l'affichage des modales de celebration.
 *
 * Fonctionnalites principales:
 * - Detection automatique des level up
 * - Gestion de l'etat de la modale
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
  /** Affichage de la modale */
  showLevelUpModal: boolean;
  /** Donnees du level up */
  levelUpData: LevelUpData | null;
  /** Declenche manuellement un level up */
  triggerLevelUp: (newLevel: number, previousLevel: number) => void;
  /** Ferme la modale */
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
 * Surveille les changements de niveau et gere l'affichage
 * des celebrations.
 *
 * @param children - Composants enfants
 */
export const LevelUpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const previousLevelRef = useRef<number | null>(null);
  const hasShownForLevel = useRef<Set<number>>(new Set());

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { stats } = useStats();

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  /**
   * Verifie si un level up s'est produit
   */
  const checkForLevelUp = useCallback(() => {
    if (!stats?.level) return;

    // Initialise le niveau precedent au premier chargement
    if (previousLevelRef.current === null) {
      previousLevelRef.current = stats.level;
      Logger.debug('LevelUpContext: Initial level set:', stats.level);
      return;
    }

    // Verifie si le niveau a augmente et si on n'a pas deja affiche la modale
    if (stats.level > previousLevelRef.current && !hasShownForLevel.current.has(stats.level)) {
      Logger.debug(`LevelUpContext: LEVEL UP DETECTED! ${previousLevelRef.current} -> ${stats.level}`);

      const newAchievement = getAchievementByLevel(stats.level);

      setLevelUpData({
        newLevel: stats.level,
        previousLevel: previousLevelRef.current,
        achievement: newAchievement,
      });

      setShowLevelUpModal(true);
      hasShownForLevel.current.add(stats.level);
      previousLevelRef.current = stats.level;
    } else if (stats.level !== previousLevelRef.current) {
      // Met a jour la reference si le niveau a change
      previousLevelRef.current = stats.level;
    }
  }, [stats?.level]);

  /**
   * Declenche manuellement un level up (pour tests)
   *
   * @param newLevel - Nouveau niveau
   * @param previousLevel - Niveau precedent
   */
  const triggerLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    const achievement = getAchievementByLevel(newLevel);

    setLevelUpData({
      newLevel,
      previousLevel,
      achievement,
    });

    setShowLevelUpModal(true);
  }, []);

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
