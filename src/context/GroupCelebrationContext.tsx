/**
 * ============================================================================
 * GroupCelebrationContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des celebrations de groupe.
 *
 * Ce contexte gere les celebrations pour les level up et tier up
 * dans le contexte des groupes d'habitudes partagees.
 *
 * Fonctionnalites principales:
 * - Detection des changements de niveau et de tier
 * - Gestion des modales de celebration
 * - Persistence du dernier niveau connu (AsyncStorage)
 * - Verification des celebrations en attente
 *
 * @module GroupCelebrationContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';

// ============================================================================
// IMPORTS - Bibliotheques externes
// ============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import { calculateGroupTierFromLevel, getGroupTierConfig } from '@/utils/groups/groupConstants';
import Logger from '@/utils/logger';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Donnees d'un tier up
 */
interface TierUpData {
  /** Nouveau tier atteint */
  newTier: number;
  /** Tier precedent */
  previousTier: number;
  /** Nouveau niveau */
  newLevel: number;
  /** Configuration du tier */
  tierConfig: any;
}

/**
 * Donnees d'un level up
 */
interface LevelUpData {
  /** Nouveau niveau atteint */
  newLevel: number;
  /** Niveau precedent */
  previousLevel: number;
  /** Tier actuel */
  currentTier: number;
}

/**
 * Type du contexte de celebration de groupe
 */
interface GroupCelebrationContextType {
  /** Affichage de la modale tier up */
  showTierUpModal: boolean;
  /** Donnees du tier up */
  tierUpData: TierUpData | null;
  /** Ferme la modale tier up */
  closeTierUpModal: () => void;
  /** Affichage de la modale level up */
  showLevelUpModal: boolean;
  /** Donnees du level up */
  levelUpData: LevelUpData | null;
  /** Ferme la modale level up */
  closeLevelUpModal: () => void;
  /** Declenche manuellement un tier up (test) */
  triggerTierUp: (newLevel: number, previousLevel: number) => void;
  /** Declenche manuellement un level up (test) */
  triggerLevelUp: (newLevel: number, previousLevel: number) => void;
  /** Celebre un changement de niveau */
  celebrateLevelChange: (oldLevel: number, newLevel: number) => void;
  /** Verifie les celebrations en attente */
  checkPendingCelebrations: (groupId: string, currentLevel: number) => Promise<void>;
  /** Sauvegarde le dernier niveau connu */
  saveLastKnownLevel: (groupId: string, level: number) => Promise<void>;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const GroupCelebrationContext = createContext<GroupCelebrationContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte de celebration de groupe
 *
 * Gere les celebrations tier up et level up pour les groupes.
 *
 * @param children - Composants enfants
 */
export const GroupCelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [showTierUpModal, setShowTierUpModal] = useState(false);
  const [tierUpData, setTierUpData] = useState<TierUpData | null>(null);

  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<LevelUpData | null>(null);

  // ==========================================================================
  // REFS
  // ==========================================================================

  const hasShownTierForLevel = useRef<Set<number>>(new Set());
  const hasShownLevelForLevel = useRef<Set<number>>(new Set());

  // ==========================================================================
  // FONCTIONS INTERNES - AsyncStorage
  // ==========================================================================

  /**
   * Recupere le dernier niveau connu depuis AsyncStorage
   *
   * @param groupId - ID du groupe
   * @returns Dernier niveau connu ou null
   */
  const getLastKnownLevel = async (groupId: string): Promise<number | null> => {
    try {
      const saved = await AsyncStorage.getItem(`group_last_level_${groupId}`);
      return saved ? parseInt(saved, 10) : null;
    } catch (error) {
      Logger.error('[GroupCelebration] Failed to get last known level:', error);
      return null;
    }
  };

  // ==========================================================================
  // CALLBACKS - Persistence
  // ==========================================================================

  /**
   * Sauvegarde le dernier niveau connu (sans declencher de celebration)
   *
   * @param groupId - ID du groupe
   * @param level - Niveau a sauvegarder
   */
  const saveLastKnownLevel = useCallback(async (groupId: string, level: number) => {
    try {
      await AsyncStorage.setItem(`group_last_level_${groupId}`, String(level));
      Logger.debug(`[GroupCelebration] Saved last known level for ${groupId}: ${level}`);
    } catch (error) {
      Logger.error('[GroupCelebration] Failed to save last known level:', error);
    }
  }, []);

  /**
   * Verifie si le niveau a change pendant l'absence de l'utilisateur
   *
   * @param groupId - ID du groupe
   * @param currentLevel - Niveau actuel
   */
  const checkPendingCelebrations = useCallback(async (groupId: string, currentLevel: number) => {
    const lastKnownLevel = await getLastKnownLevel(groupId);

    if (!lastKnownLevel || lastKnownLevel === currentLevel) {
      await saveLastKnownLevel(groupId, currentLevel);
      return;
    }

    if (currentLevel > lastKnownLevel) {
      Logger.info(`[GroupCelebration] Level changed while user was away: ${lastKnownLevel} -> ${currentLevel}`);
      celebrateLevelChange(lastKnownLevel, currentLevel);
    }

    await saveLastKnownLevel(groupId, currentLevel);
  }, [saveLastKnownLevel]);

  // ==========================================================================
  // CALLBACKS - Celebration
  // ==========================================================================

  /**
   * Logique principale de celebration: detecte les tier changes et level ups
   *
   * @param oldLevel - Ancien niveau
   * @param newLevel - Nouveau niveau
   */
  const celebrateLevelChange = useCallback((oldLevel: number, newLevel: number) => {
    // Validation
    if (!newLevel || newLevel < 1 || !oldLevel || oldLevel < 1) {
      Logger.debug('[GroupCelebration] Invalid levels', { oldLevel, newLevel });
      return;
    }

    if (newLevel === oldLevel) {
      return;
    }

    if (newLevel < oldLevel) {
      Logger.warn('[GroupCelebration] Level decreased, ignoring', { oldLevel, newLevel });
      return;
    }

    const previousTier = calculateGroupTierFromLevel(oldLevel);
    const currentTier = calculateGroupTierFromLevel(newLevel);

    Logger.info(`[GroupCelebration] Level change: ${oldLevel} -> ${newLevel} (Tier ${previousTier} -> ${currentTier})`);

    // Tier change = affiche la modale Tier Up (prioritaire)
    if (currentTier > previousTier && !hasShownTierForLevel.current.has(newLevel)) {
      Logger.info('[GroupCelebration] Tier up detected, showing modal');

      const newTierConfig = getGroupTierConfig(currentTier);

      setTierUpData({
        newTier: currentTier,
        previousTier,
        newLevel: newLevel,
        tierConfig: newTierConfig,
      });

      setShowTierUpModal(true);
      hasShownTierForLevel.current.add(newLevel);
      hasShownLevelForLevel.current.add(newLevel); // Skip la modale level
    }
    // Meme tier, juste level up = affiche la modale Level Up
    else if (!hasShownLevelForLevel.current.has(newLevel)) {
      Logger.info('[GroupCelebration] Level up detected, showing modal');

      setLevelUpData({
        newLevel,
        previousLevel: oldLevel,
        currentTier,
      });

      setShowLevelUpModal(true);
      hasShownLevelForLevel.current.add(newLevel);
    } else {
      Logger.debug('[GroupCelebration] Celebration already shown for this level');
    }
  }, []);

  // ==========================================================================
  // CALLBACKS - Triggers manuels (pour tests)
  // ==========================================================================

  /**
   * Declenche manuellement un tier up
   *
   * @param newLevel - Nouveau niveau
   * @param previousLevel - Niveau precedent
   */
  const triggerTierUp = useCallback((newLevel: number, previousLevel: number) => {
    const newTier = calculateGroupTierFromLevel(newLevel);
    const previousTier = calculateGroupTierFromLevel(previousLevel);
    const tierConfig = getGroupTierConfig(newTier);

    setTierUpData({
      newTier,
      previousTier,
      newLevel,
      tierConfig,
    });

    setShowTierUpModal(true);
  }, []);

  /**
   * Declenche manuellement un level up
   *
   * @param newLevel - Nouveau niveau
   * @param previousLevel - Niveau precedent
   */
  const triggerLevelUp = useCallback((newLevel: number, previousLevel: number) => {
    const currentTier = calculateGroupTierFromLevel(newLevel);

    setLevelUpData({
      newLevel,
      previousLevel,
      currentTier,
    });

    setShowLevelUpModal(true);
  }, []);

  // ==========================================================================
  // CALLBACKS - Fermeture des modales
  // ==========================================================================

  /**
   * Ferme la modale tier up
   */
  const closeTierUpModal = useCallback(() => {
    setShowTierUpModal(false);
    setTimeout(() => setTierUpData(null), 300);
  }, []);

  /**
   * Ferme la modale level up
   */
  const closeLevelUpModal = useCallback(() => {
    setShowLevelUpModal(false);
    setTimeout(() => setLevelUpData(null), 300);
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <GroupCelebrationContext.Provider
      value={{
        showTierUpModal,
        tierUpData,
        closeTierUpModal,
        showLevelUpModal,
        levelUpData,
        closeLevelUpModal,
        triggerTierUp,
        triggerLevelUp,
        celebrateLevelChange,
        checkPendingCelebrations,
        saveLastKnownLevel,
      }}
    >
      {children}
    </GroupCelebrationContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte de celebration de groupe
 *
 * @throws Error si utilise en dehors du GroupCelebrationProvider
 * @returns Contexte de celebration de groupe
 */
export const useGroupCelebration = () => {
  const context = useContext(GroupCelebrationContext);
  if (!context) {
    throw new Error('useGroupCelebration must be used within GroupCelebrationProvider');
  }
  return context;
};
