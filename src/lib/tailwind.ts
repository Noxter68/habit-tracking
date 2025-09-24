// src/lib/tailwind.ts
import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        achievement: {
          // Base colors for achievements
          amber: {
            50: '#fef3c7',
            100: '#fde68a',
            200: '#fcd34d',
            300: '#fbbf24',
            400: '#fdba74',
            500: '#fb923c',
            600: '#f59e0b',
            700: '#d97706',
            800: '#b45309',
            900: '#92400e',
          },
          // Neutral colors for locked states
          neutral: {
            light: '#fafaf9',
            medium: '#f5f5f4',
            dark: '#e7e5e4',
            darker: '#d6d3d1',
            darkest: '#a8a29e',
            stone: '#78716c',
          },
        },
        // Calm, peaceful colors palette
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        calm: {
          sage: '#87a878',
          mist: '#e8f4f0',
          sand: '#f5f2ed',
          ocean: '#a3c4d2',
          lavender: '#e4e0f7',
          stone: '#f8f7f5',
          moss: '#a8c09a',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['System', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
});

// Export gradient configurations
export const achievementGradients = {
  // Tier-specific gradients
  tiers: {
    Novice: ['#fef3c7', '#fde68a'], // amber-50 → amber-100
    'Rising Hero': ['#fed7aa', '#fdba74'], // warm amber/orange
    'Mastery Awakens': ['#fde68a', '#fb923c'], // amber-100 → amber-500
    'Legendary Ascent': ['#fbbf24', '#f59e0b'], // amber-300 → amber-600
    'Epic Mastery': ['#f59e0b', '#d97706'], // amber-600 → amber-700
    'Mythic Glory': ['#d97706', '#92400e'], // amber-700 → amber-900
  },

  // State-based gradients
  unlocked: {
    border: ['#d97706', '#b45309', '#92400e'],
    header: ['#fef3c7', '#fde68a', '#fcd34d'],
    progress: ['#fed7aa', '#fdba74', '#fb923c'],
    button: ['#d97706', '#b45309', '#92400e'],
    progressBar: ['#fbbf24', '#d97706'], // brighter amber
  },

  locked: {
    border: ['#fef3c7', '#fde68a', '#fcd34d'],
    header: ['#fafaf9', '#f5f5f4', '#e7e5e4'],
    card: ['#fafaf9', '#f5f5f4'],
    progress: ['#fef3c7', '#fde68a', '#fcd34d'],
    button: ['#d6d3d1', '#a8a29e', '#78716c'],
  },

  // Common gradients
  hero: ['#fef3c7', '#fde68a'],
  levelProgress: ['#fbbf24', '#d97706'],
  overlay: ['rgba(254, 243, 199, 0.2)', 'rgba(255, 255, 255, 0)'],
};

export default tw;
