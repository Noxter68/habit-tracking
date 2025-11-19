/**
 * @file categoryIcons.ts
 * @description Mapping des icônes et couleurs pour chaque catégorie d'habitude.
 * Fournit les données visuelles pour l'affichage des catégories dans l'interface.
 */

import {
  Dumbbell,
  Heart,
  Apple,
  BookOpen,
  Zap,
  Brain,
  Moon,
  Droplets,
  Ban,
  Cigarette,
  ShoppingBag,
  Smartphone,
  Clock,
  ThumbsDown,
  Beer,
  Bed,
  Target,
} from 'lucide-react-native';
import { HabitType } from '../types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Données visuelles d'une icône de catégorie.
 */
export interface CategoryIconData {
  /** Composant icône Lucide */
  icon: any;
  /** Couleur principale de l'icône */
  color: string;
  /** Couleur de fond */
  bgColor: string;
  /** Couleur claire pour les accents */
  lightColor: string;
}

// =============================================================================
// CONSTANTES - MAPPING DES ICÔNES PAR CATÉGORIE
// =============================================================================

/**
 * Configuration des icônes et couleurs pour chaque catégorie.
 */
const categoryIconsMap: Record<string, CategoryIconData> = {
  // Bonnes habitudes
  fitness: {
    icon: Dumbbell,
    color: '#dc2626',
    bgColor: '#fef2f2',
    lightColor: '#fca5a5',
  },
  health: {
    icon: Heart,
    color: '#db2777',
    bgColor: '#fdf2f8',
    lightColor: '#f9a8d4',
  },
  nutrition: {
    icon: Apple,
    color: '#65a30d',
    bgColor: '#f7fee7',
    lightColor: '#bef264',
  },
  learning: {
    icon: BookOpen,
    color: '#2563eb',
    bgColor: '#eff6ff',
    lightColor: '#93c5fd',
  },
  productivity: {
    icon: Zap,
    color: '#d97706',
    bgColor: '#fef3c7',
    lightColor: '#fcd34d',
  },
  mindfulness: {
    icon: Brain,
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    lightColor: '#c4b5fd',
  },
  sleep: {
    icon: Moon,
    color: '#4f46e5',
    bgColor: '#eef2ff',
    lightColor: '#a5b4fc',
  },
  hydration: {
    icon: Droplets,
    color: '#0891b2',
    bgColor: '#ecfeff',
    lightColor: '#67e8f9',
  },

  // Mauvaises habitudes
  smoking: {
    icon: Cigarette,
    color: '#b91c1c',
    bgColor: '#fef2f2',
    lightColor: '#fca5a5',
  },
  'junk-food': {
    icon: Ban,
    color: '#ea580c',
    bgColor: '#fff7ed',
    lightColor: '#fdba74',
  },
  shopping: {
    icon: ShoppingBag,
    color: '#db2777',
    bgColor: '#fdf2f8',
    lightColor: '#f9a8d4',
  },
  'screen-time': {
    icon: Smartphone,
    color: '#4b5563',
    bgColor: '#f9fafb',
    lightColor: '#d1d5db',
  },
  procrastination: {
    icon: Clock,
    color: '#d97706',
    bgColor: '#fef3c7',
    lightColor: '#fcd34d',
  },
  'negative-thinking': {
    icon: ThumbsDown,
    color: '#6d28d9',
    bgColor: '#f3e8ff',
    lightColor: '#c4b5fd',
  },
  alcohol: {
    icon: Beer,
    color: '#92400e',
    bgColor: '#fef9c3',
    lightColor: '#fde047',
  },
  oversleeping: {
    icon: Bed,
    color: '#475569',
    bgColor: '#f8fafc',
    lightColor: '#cbd5e1',
  },
};

/**
 * Icône par défaut pour les catégories inconnues.
 */
const defaultCategoryIcon: CategoryIconData = {
  icon: Target,
  color: '#6b7280',
  bgColor: '#f9fafb',
  lightColor: '#d1d5db',
};

// =============================================================================
// FONCTIONS
// =============================================================================

/**
 * Récupère les données d'icône pour une catégorie donnée.
 *
 * @param category - Identifiant de la catégorie
 * @param _type - Type d'habitude (non utilisé actuellement, réservé pour usage futur)
 * @returns Les données visuelles de la catégorie
 *
 * @example
 * const iconData = getCategoryIcon('fitness');
 * // Retourne: { icon: Dumbbell, color: '#dc2626', bgColor: '#fef2f2', lightColor: '#fca5a5' }
 *
 * @example
 * const iconData = getCategoryIcon('unknown-category');
 * // Retourne l'icône par défaut (Target)
 */
export const getCategoryIcon = (category: string, _type?: HabitType): CategoryIconData => {
  return categoryIconsMap[category] || defaultCategoryIcon;
};
