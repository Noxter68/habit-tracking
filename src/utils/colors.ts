// src/theme/colors.ts

export interface ColorShade {
  light: string;
  DEFAULT: string;
  dark: string;
}

export interface BackgroundColors {
  light: string;
  DEFAULT: string;
  accent: string;
}

export interface TextColors {
  primary: string;
  secondary: string;
  light: string;
}

export interface AppColors {
  primary: ColorShade;
  secondary: ColorShade;
  background: BackgroundColors;
  text: TextColors;
}

// Stone & Sand calming color scheme
export const colors: AppColors = {
  primary: {
    light: '#9CA3AF', // stone-300
    DEFAULT: '#4B5563', // stone-500 (main stone)
    dark: '#374151', // stone-600
  },
  secondary: {
    light: '#D6CEC1', // sand-300
    DEFAULT: '#A89885', // sand-500 (main sand)
    dark: '#8A7A68', // sand-600
  },
  background: {
    light: '#F3F4F6', // stone-50 (cool, clean)
    DEFAULT: '#FAF9F7', // sand-50 (warm, cozy)
    accent: '#EAEEE3', // sage-100 (subtle green)
  },
  text: {
    primary: '#111827', // stone-800 (strong contrast)
    secondary: '#726454', // sand-700 (warm readable)
    light: '#9CA3AF', // stone-300 (subtle)
  },
};

// Semantic colors for specific use cases
export const semanticColors = {
  success: '#7A8B5F', // sage-500
  successLight: '#EAEEE3', // sage-100
  warning: '#B89875', // clay-400
  warningLight: '#F3EDE6', // clay-100
  info: '#6B7280', // stone-400
  infoLight: '#E5E7EB', // stone-100
  calm: '#A89885', // sand-500
  calmLight: '#F5F2ED', // sand-100
};

// Status colors for habits (with stone/sand theme)
export const habitStatusColors = {
  complete: {
    gradient: ['#D5DCC7', '#B8C4A1', '#95A67A'], // Sage progression
    text: '#4D593D', // sage-700
    bg: '#EAEEE3', // sage-100
  },
  partial: {
    gradient: ['#E5D8C9', '#D1BCA3', '#B89875'], // Clay progression
    text: '#6B523A', // clay-700
    bg: '#F3EDE6', // clay-100
  },
  incomplete: {
    gradient: ['#E8E3DB', '#D6CEC1', '#BFB3A3'], // Sand progression
    text: '#726454', // sand-700
    bg: '#F5F2ED', // sand-100
  },
  future: {
    gradient: ['#E5E7EB', '#D1D5DB', '#9CA3AF'], // Stone progression
    text: '#374151', // stone-600
    bg: '#F3F4F6', // stone-50
  },
};

// Tier colors for progression (stone/sand themed)
export const tierColors = {
  novice: {
    gradient: ['#EAEEE3', '#D5DCC7', '#B8C4A1'], // Soft sage
    primary: '#7A8B5F', // sage-500
    light: '#F6F7F4', // sage-50
    text: '#4D593D', // sage-700
  },
  risingHero: {
    gradient: ['#E5D8C9', '#D1BCA3', '#B89875'], // Warm clay
    primary: '#A07D55', // clay-500
    light: '#FAF7F4', // clay-50
    text: '#6B523A', // clay-700
  },
  masteryAwakens: {
    gradient: ['#D1D5DB', '#9CA3AF', '#6B7280'], // Stone depth
    primary: '#4B5563', // stone-500
    light: '#F3F4F6', // stone-50
    text: '#1F2937', // stone-700
  },
  legendaryAscent: {
    gradient: ['#E8E3DB', '#D6CEC1', '#BFB3A3'], // Sand depth
    primary: '#A89885', // sand-500
    light: '#FAF9F7', // sand-50
    text: '#5F5347', // sand-800
  },
  epicMastery: {
    gradient: ['#9CA3AF', '#6B7280', '#4B5563'], // Deep stone
    primary: '#374151', // stone-600
    light: '#E5E7EB', // stone-100
    text: '#030712', // stone-900
  },
  mythicGlory: {
    gradient: ['#6B7280', '#4B5563', '#374151'], // Darkest stone
    primary: '#1F2937', // stone-700
    light: '#D1D5DB', // stone-200
    text: '#030712', // stone-900
  },
};

// UI Component colors
export const componentColors = {
  card: {
    background: '#FFFFFF',
    border: '#E8E3DB', // sand-200
    shadow: 'rgba(0, 0, 0, 0.04)',
  },
  button: {
    primary: '#4B5563', // stone-500
    primaryHover: '#374151', // stone-600
    secondary: '#A89885', // sand-500
    secondaryHover: '#8A7A68', // sand-600
    disabled: '#D6CEC1', // sand-300
  },
  input: {
    background: '#FAF9F7', // sand-50
    border: '#E8E3DB', // sand-200
    borderFocus: '#9CA3AF', // stone-300
    text: '#111827', // stone-800
    placeholder: '#BFB3A3', // sand-400
  },
  progress: {
    background: '#E8E3DB', // sand-200
    fill: ['#9CA3AF', '#6B7280'], // stone gradient
    text: '#4B5563', // stone-500
  },
};
