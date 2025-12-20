/**
 * ============================================================================
 * CelebrationRenderer.tsx
 * ============================================================================
 *
 * Composant global qui affiche les celebrations depuis la CelebrationQueue.
 *
 * Ce composant doit etre place une seule fois dans l'arbre de composants
 * (generalement dans App.tsx) et il affichera automatiquement les modales
 * de celebration l'une apres l'autre.
 *
 * Fonctionnalites principales:
 * - Affichage des level up celebrations
 * - Affichage des milestone celebrations (single et multiple)
 * - Gestion automatique de la fermeture et passage au suivant
 *
 * @module CelebrationRenderer
 */

import React from 'react';

// ============================================================================
// IMPORTS - Components
// ============================================================================
import { EpicLevelUpModal } from '@/components/dashboard/EpicLevelUpModal';
import { EpicMilestoneUnlockModal } from '@/components/habits/EpicMilestoneUnlockModal';
import { MilestoneRecapModal } from '@/components/habits/MilestoneRecapModal';

// ============================================================================
// IMPORTS - Context
// ============================================================================
import { useCelebrationQueue } from '@/context/CelebrationQueueContext';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Composant qui rend les celebrations depuis la queue
 *
 * Place ce composant une seule fois dans l'arbre de composants
 * pour afficher toutes les celebrations de maniere globale.
 */
export const CelebrationRenderer: React.FC = () => {
  const { currentCelebration, dismissCurrentCelebration } = useCelebrationQueue();

  // Pas de celebration en cours
  if (!currentCelebration) {
    return null;
  }

  // Affiche le modal en fonction du type de celebration
  switch (currentCelebration.type) {
    case 'level_up':
      return (
        <EpicLevelUpModal
          visible={true}
          levelUpData={{
            newLevel: currentCelebration.newLevel,
            previousLevel: currentCelebration.previousLevel,
            achievement: currentCelebration.achievement,
          }}
          onClose={dismissCurrentCelebration}
        />
      );

    case 'milestone_single':
      return (
        <EpicMilestoneUnlockModal
          visible={true}
          milestone={currentCelebration.milestone}
          milestoneIndex={currentCelebration.milestoneIndex}
          onClose={dismissCurrentCelebration}
        />
      );

    case 'milestone_multiple':
      return (
        <MilestoneRecapModal
          visible={true}
          milestones={currentCelebration.milestones}
          onClose={dismissCurrentCelebration}
        />
      );

    default:
      return null;
  }
};

export default CelebrationRenderer;
