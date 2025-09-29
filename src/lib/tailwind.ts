// src/lib/tailwind.ts
import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        // Quartz/Stone color palette
        quartz: {
          50: '#F3F4F6', // off-white shine
          100: '#E5E7EB', // neutral light gray (base)
          200: '#D1D5DB', // lighter mid-tone
          300: '#9CA3AF', // soft silver/stone (mid-tone)
          400: '#6B7280', // depth/shadow
          500: '#4B5563', // darker shadow
          600: '#374151', // deep gray
          700: '#1F2937', // very deep gray
          800: '#111827', // near black
          900: '#030712', // black
        },
        achievement: {
          // Updated achievement colors to match quartz theme
          stone: {
            50: '#F3F4F6',
            100: '#E5E7EB',
            200: '#D1D5DB',
            300: '#9CA3AF',
            400: '#6B7280',
            500: '#4B5563',
            600: '#374151',
            700: '#1F2937',
            800: '#111827',
            900: '#030712',
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
          50: '#F0F4FF',
          100: '#E0E9FF',
          200: '#C7D7FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
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

// Export gradient configurations with Quartz theme
export const quartzGradients = {
  // Tier-specific gradients with stone/silver theme
  tiers: {
    Novice: ['#F3F4F6', '#E5E7EB'], // quartz-50 → quartz-100
    'Rising Hero': ['#E5E7EB', '#D1D5DB'], // quartz-100 → quartz-200
    'Mastery Awakens': ['#D1D5DB', '#9CA3AF'], // quartz-200 → quartz-300
    'Legendary Ascent': ['#9CA3AF', '#6B7280'], // quartz-300 → quartz-400
    'Epic Mastery': ['#6B7280', '#4B5563'], // quartz-400 → quartz-500
    'Mythic Glory': ['#4B5563', '#374151'], // quartz-500 → quartz-600
  },

  // State-based gradients
  unlocked: {
    border: ['#6B7280', '#4B5563', '#374151'],
    header: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
    progress: ['#E5E7EB', '#D1D5DB', '#9CA3AF'],
    button: ['#6B7280', '#4B5563', '#374151'],
    progressBar: ['#9CA3AF', '#6B7280'], // silver to depth
  },

  locked: {
    border: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
    header: ['#fafaf9', '#f5f5f4', '#e7e5e4'],
    card: ['#fafaf9', '#f5f5f4'],
    progress: ['#F3F4F6', '#E5E7EB', '#D1D5DB'],
    button: ['#d6d3d1', '#a8a29e', '#78716c'],
  },

  // Common gradients
  hero: ['#F3F4F6', '#E5E7EB'],
  levelProgress: ['#9CA3AF', '#6B7280'],
  overlay: ['rgba(229, 231, 235, 0.2)', 'rgba(255, 255, 255, 0)'],

  // Main gradients for components
  primary: ['#9CA3AF', '#6B7280', '#4B5563'],
  secondary: ['#E5E7EB', '#D1D5DB', '#9CA3AF'],
  light: ['#F3F4F6', '#E5E7EB'],
  card: ['#ffffff', '#F3F4F6'],
};

export default tw;
