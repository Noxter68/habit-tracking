/**
 * @file colors.ts
 * @description Palette de couleurs de l'application basée sur un thème Stone & Sand.
 * Définit les couleurs principales, sémantiques et pour les composants UI.
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Nuances d'une couleur (clair, défaut, foncé).
 */
export interface ColorShade {
  /** Version claire de la couleur */
  light: string;
  /** Couleur par défaut */
  DEFAULT: string;
  /** Version foncée de la couleur */
  dark: string;
}

/**
 * Couleurs d'arrière-plan de l'application.
 */
export interface BackgroundColors {
  /** Arrière-plan clair (froid) */
  light: string;
  /** Arrière-plan par défaut (chaud) */
  DEFAULT: string;
  /** Arrière-plan accentué */
  accent: string;
}

/**
 * Couleurs de texte de l'application.
 */
export interface TextColors {
  /** Texte principal (fort contraste) */
  primary: string;
  /** Texte secondaire (lisible) */
  secondary: string;
  /** Texte subtil */
  light: string;
}

/**
 * Structure complète des couleurs de l'application.
 */
export interface AppColors {
  /** Couleurs primaires (stone) */
  primary: ColorShade;
  /** Couleurs secondaires (sand) */
  secondary: ColorShade;
  /** Couleurs d'arrière-plan */
  background: BackgroundColors;
  /** Couleurs de texte */
  text: TextColors;
}

// =============================================================================
// CONSTANTES - COULEURS PRINCIPALES
// =============================================================================

/**
 * Palette de couleurs principale de l'application.
 * Thème Stone & Sand pour une ambiance calme et apaisante.
 */
export const colors: AppColors = {
  primary: {
    light: '#9CA3AF', // stone-300
    DEFAULT: '#4B5563', // stone-500
    dark: '#374151', // stone-600
  },
  secondary: {
    light: '#D6CEC1', // sand-300
    DEFAULT: '#A89885', // sand-500
    dark: '#8A7A68', // sand-600
  },
  background: {
    light: '#F3F4F6', // stone-50 (froid, propre)
    DEFAULT: '#FAF9F7', // sand-50 (chaud, cozy)
    accent: '#EAEEE3', // sage-100 (vert subtil)
  },
  text: {
    primary: '#111827', // stone-800 (fort contraste)
    secondary: '#726454', // sand-700 (chaud lisible)
    light: '#9CA3AF', // stone-300 (subtil)
  },
};

// =============================================================================
// CONSTANTES - COULEURS SÉMANTIQUES
// =============================================================================

/**
 * Couleurs sémantiques pour les états et messages.
 */
export const semanticColors = {
  /** Succès */
  success: '#7A8B5F', // sage-500
  successLight: '#EAEEE3', // sage-100
  /** Avertissement */
  warning: '#B89875', // clay-400
  warningLight: '#F3EDE6', // clay-100
  /** Information */
  info: '#6B7280', // stone-400
  infoLight: '#E5E7EB', // stone-100
  /** État calme */
  calm: '#A89885', // sand-500
  calmLight: '#F5F2ED', // sand-100
};

// =============================================================================
// CONSTANTES - COULEURS DE STATUT DES HABITUDES
// =============================================================================

/**
 * Couleurs pour les différents statuts des habitudes.
 */
export const habitStatusColors = {
  /** Habitude complétée */
  complete: {
    gradient: ['#D5DCC7', '#B8C4A1', '#95A67A'], // Progression sage
    text: '#4D593D', // sage-700
    bg: '#EAEEE3', // sage-100
  },
  /** Habitude partiellement complétée */
  partial: {
    gradient: ['#E5D8C9', '#D1BCA3', '#B89875'], // Progression clay
    text: '#6B523A', // clay-700
    bg: '#F3EDE6', // clay-100
  },
  /** Habitude non complétée */
  incomplete: {
    gradient: ['#E8E3DB', '#D6CEC1', '#BFB3A3'], // Progression sand
    text: '#726454', // sand-700
    bg: '#F5F2ED', // sand-100
  },
  /** Jour futur */
  future: {
    gradient: ['#E5E7EB', '#D1D5DB', '#9CA3AF'], // Progression stone
    text: '#374151', // stone-600
    bg: '#F3F4F6', // stone-50
  },
};

// =============================================================================
// CONSTANTES - COULEURS DES TIERS
// =============================================================================

/**
 * Couleurs pour chaque tier de progression (thème stone/sand).
 */
export const tierColors = {
  novice: {
    gradient: ['#EAEEE3', '#D5DCC7', '#B8C4A1'], // Sage doux
    primary: '#7A8B5F', // sage-500
    light: '#F6F7F4', // sage-50
    text: '#4D593D', // sage-700
  },
  risingHero: {
    gradient: ['#E5D8C9', '#D1BCA3', '#B89875'], // Clay chaud
    primary: '#A07D55', // clay-500
    light: '#FAF7F4', // clay-50
    text: '#6B523A', // clay-700
  },
  masteryAwakens: {
    gradient: ['#D1D5DB', '#9CA3AF', '#6B7280'], // Stone profond
    primary: '#4B5563', // stone-500
    light: '#F3F4F6', // stone-50
    text: '#1F2937', // stone-700
  },
  legendaryAscent: {
    gradient: ['#E8E3DB', '#D6CEC1', '#BFB3A3'], // Sand profond
    primary: '#A89885', // sand-500
    light: '#FAF9F7', // sand-50
    text: '#5F5347', // sand-800
  },
  epicMastery: {
    gradient: ['#9CA3AF', '#6B7280', '#4B5563'], // Stone profond
    primary: '#374151', // stone-600
    light: '#E5E7EB', // stone-100
    text: '#030712', // stone-900
  },
  mythicGlory: {
    gradient: ['#6B7280', '#4B5563', '#374151'], // Stone le plus profond
    primary: '#1F2937', // stone-700
    light: '#D1D5DB', // stone-200
    text: '#030712', // stone-900
  },
};

// =============================================================================
// CONSTANTES - COULEURS DES COMPOSANTS UI
// =============================================================================

/**
 * Couleurs pour les composants d'interface utilisateur.
 */
export const componentColors = {
  /** Cartes */
  card: {
    background: '#FFFFFF',
    border: '#E8E3DB', // sand-200
    shadow: 'rgba(0, 0, 0, 0.04)',
  },
  /** Boutons */
  button: {
    primary: '#4B5563', // stone-500
    primaryHover: '#374151', // stone-600
    secondary: '#A89885', // sand-500
    secondaryHover: '#8A7A68', // sand-600
    disabled: '#D6CEC1', // sand-300
  },
  /** Champs de saisie */
  input: {
    background: '#FAF9F7', // sand-50
    border: '#E8E3DB', // sand-200
    borderFocus: '#9CA3AF', // stone-300
    text: '#111827', // stone-800
    placeholder: '#BFB3A3', // sand-400
  },
  /** Barres de progression */
  progress: {
    background: '#E8E3DB', // sand-200
    fill: ['#9CA3AF', '#6B7280'], // dégradé stone
    text: '#4B5563', // stone-500
  },
};
