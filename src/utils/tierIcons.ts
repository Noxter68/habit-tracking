/**
 * tierIcons.ts
 *
 * Utilitaire pour obtenir les icones de palier basees sur les milestones debloques.
 * Les 15 niveaux sont repartis sur 3 tiers visuels.
 */

// Import all tier icons explicitly
export const tierIcons: Record<number, any> = {
  0: require('../../assets/tiers/tier-1/level-1.png'),
  1: require('../../assets/tiers/tier-1/level-2.png'),
  2: require('../../assets/tiers/tier-1/level-3.png'),
  3: require('../../assets/tiers/tier-1/level-4.png'),
  4: require('../../assets/tiers/tier-1/level-5.png'),
  5: require('../../assets/tiers/tier-2/level-6.png'),
  6: require('../../assets/tiers/tier-2/level-7.png'),
  7: require('../../assets/tiers/tier-2/level-8.png'),
  8: require('../../assets/tiers/tier-2/level-9.png'),
  9: require('../../assets/tiers/tier-2/level-10.png'),
  10: require('../../assets/tiers/tier-3/level-11.png'),
  11: require('../../assets/tiers/tier-3/level-12.png'),
  12: require('../../assets/tiers/tier-3/level-13.png'),
  13: require('../../assets/tiers/tier-3/level-14.png'),
  14: require('../../assets/tiers/tier-3/level-15.png'),
};

/**
 * Retourne l'icone de palier selon le nombre de milestones debloques
 * @param unlockedCount - Nombre de milestones debloques
 * @returns Source de l'image du palier
 */
export const getTierIcon = (unlockedCount: number): any => {
  // Si aucun milestone debloque, retourne le niveau 1 (index 0)
  if (unlockedCount <= 0) {
    return tierIcons[0];
  }
  // Le palier affiche est le dernier debloque (unlockedCount - 1)
  // Limite a l'index maximum (14)
  const index = Math.min(unlockedCount - 1, 14);
  return tierIcons[index];
};

/**
 * Retourne l'icone de palier pour affichage dans les cartes
 * Avec fallback sur la gemme si aucun palier n'est debloque
 * @param unlockedCount - Nombre de milestones debloques
 * @returns Source de l'image ou null si fallback sur gemme
 */
export const getTierIconOrGem = (unlockedCount: number): any | null => {
  if (unlockedCount <= 0) {
    return null; // Utiliser la gemme par defaut
  }
  return getTierIcon(unlockedCount);
};
