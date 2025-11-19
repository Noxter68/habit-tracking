/**
 * @file iconMapper.ts
 * @description Mapping des noms d'icônes vers les composants Lucide.
 * Permet de sélectionner dynamiquement des icônes par leur nom string.
 */

import {
  Dumbbell,
  Footprints,
  Bike,
  Target,
  Book,
  Pen,
  Palette,
  Music,
  Gamepad2,
  Laptop,
  Microscope,
  Coffee,
  Salad,
  Apple,
  Droplet,
  Moon,
  Sun,
  Sprout,
  Flame,
  Star,
  Gem,
  Rocket,
  PartyPopper,
  Sparkles,
  Zap,
  Heart,
  Award,
  Trophy,
  Crown,
  Users,
  Smile,
  LucideIcon,
} from 'lucide-react-native';

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Mapping des noms d'icônes vers les composants Lucide.
 * Utilisé pour la sélection dynamique d'icônes dans l'interface.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  // Sport & Activités
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  target: Target,

  // Créativité & Apprentissage
  book: Book,
  pen: Pen,
  palette: Palette,
  music: Music,
  gamepad: Gamepad2,
  laptop: Laptop,
  microscope: Microscope,

  // Alimentation & Santé
  coffee: Coffee,
  salad: Salad,
  apple: Apple,
  droplet: Droplet,

  // Temps & Nature
  moon: Moon,
  sun: Sun,
  sprout: Sprout,
  flame: Flame,

  // Récompenses & Accomplissements
  star: Star,
  gem: Gem,
  rocket: Rocket,
  party: PartyPopper,
  sparkles: Sparkles,
  zap: Zap,
  heart: Heart,
  award: Award,
  trophy: Trophy,
  crown: Crown,

  // Social
  users: Users,
  smile: Smile,
};

// =============================================================================
// FONCTIONS
// =============================================================================

/**
 * Récupère le composant icône correspondant à un nom.
 *
 * @param iconName - Nom de l'icône à récupérer
 * @returns Le composant Lucide correspondant ou Target par défaut
 *
 * @example
 * const DumbbellIcon = getIconComponent('dumbbell');
 * // Utilisation: <DumbbellIcon size={24} color="#000" />
 *
 * @example
 * const UnknownIcon = getIconComponent('unknown');
 * // Retourne Target par défaut
 */
export function getIconComponent(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Target;
}
