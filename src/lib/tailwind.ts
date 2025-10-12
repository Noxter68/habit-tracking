// src/lib/tailwind.ts
import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        // Stone (Quartz) - Cool, neutral, grounding
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

        // Sand - Warm, organic, peaceful
        sand: {
          50: '#FAF9F7',
          100: '#F5F2ED',
          200: '#E8E3DB',
          300: '#D6CEC1',
          400: '#BFB3A3',
          500: '#A89885',
          600: '#8A7A68',
          700: '#726454',
          800: '#5F5347',
          900: '#51453D',
        },

        // Soft Sage - Subtle green, calming accent
        sage: {
          50: '#F6F7F4',
          100: '#EAEEE3',
          200: '#D5DCC7',
          300: '#B8C4A1',
          400: '#95A67A',
          500: '#7A8B5F',
          600: '#5F6F4A',
          700: '#4D593D',
          800: '#3D4633',
          900: '#2F3828',
        },

        // Warm Clay - Earthy warmth, gentle accent
        clay: {
          50: '#FAF7F4',
          100: '#F3EDE6',
          200: '#E5D8C9',
          300: '#D1BCA3',
          400: '#B89875',
          500: '#A07D55',
          600: '#856545',
          700: '#6B523A',
          800: '#574235',
          900: '#463530',
        },

        // Achievement colors with Stone & Sand theme
        achievement: {
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
          neutral: {
            light: '#FAF9F7',
            medium: '#F5F2ED',
            dark: '#E8E3DB',
            darker: '#D6CEC1',
            darkest: '#A89885',
            stone: '#726454',
          },
        },

        // Semantic calm colors
        calm: {
          stone: '#4B5563', // stone-500
          sand: '#F5F2ED', // sand-100
          sage: '#7A8B5F', // sage-500
          clay: '#A07D55', // clay-500
          mist: '#F3F4F6', // stone-50
          earth: '#726454', // sand-700
        },

        // Primary (using stone tones for structure)
        primary: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#4B5563',
          600: '#374151',
          700: '#1F2937',
        },

        // Teal replaced with sage for success
        teal: {
          50: '#F6F7F4',
          100: '#EAEEE3',
          200: '#D5DCC7',
          300: '#B8C4A1',
          400: '#95A67A',
          500: '#7A8B5F',
          600: '#5F6F4A',
          700: '#4D593D',
        },

        // Slate replaced with sand for warm neutrals
        slate: {
          50: '#FAF9F7',
          100: '#F5F2ED',
          200: '#E8E3DB',
          300: '#D6CEC1',
          400: '#BFB3A3',
          500: '#A89885',
          600: '#8A7A68',
          700: '#726454',
          800: '#5F5347',
          900: '#51453D',
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

// Stone & Sand Gradient Configurations
export const quartzGradients = {
  // Tier-specific gradients (NO GREEN - using sand, sky, stone, lavender)
  tiers: {
    Novice: ['#e8dcc8', '#d4c4ad', '#bfad93'], // Warm sand - welcoming
    'Rising Hero': ['#d4e3f0', '#b8d1e5', '#9cb9d3'], // Soft sky - calm progress
    'Mastery Awakens': ['#D1D5DB', '#9CA3AF', '#6B7280'], // Stone gray - focused
    'Legendary Ascent': ['#dfd9ed', '#c7bcdb', '#aa98c4'], // Soft lavender - prestigious
    'Epic Mastery': ['#9CA3AF', '#6B7280', '#4B5563'], // Deep stone - powerful
    'Mythic Glory': ['#6B7280', '#4B5563', '#374151'], // Darkest stone - ultimate
  },

  // State-based gradients
  unlocked: {
    border: ['#6B7280', '#4B5563', '#374151'], // Stone depth
    header: ['#F3F4F6', '#E5E7EB', '#D1D5DB'], // Light stone
    progress: ['#D1D5DB', '#9CA3AF', '#6B7280'], // Stone progression
    button: ['#4B5563', '#374151', '#1F2937'], // Strong stone
    progressBar: ['#9CA3AF', '#6B7280'], // Stone gradient
  },

  locked: {
    border: ['#FAF9F7', '#F5F2ED', '#E8E3DB'], // Sand neutrals
    header: ['#FAF9F7', '#F5F2ED', '#E8E3DB'], // Light sand
    card: ['#FAF9F7', '#F5F2ED'], // Soft sand
    progress: ['#F3F4F6', '#E5E7EB', '#D1D5DB'], // Stone light
    button: ['#D6CEC1', '#BFB3A3', '#A89885'], // Muted sand
  },

  // Common gradients
  hero: ['#F3F4F6', '#E5E7EB', '#FAF9F7'], // Stone to sand blend
  levelProgress: ['#9CA3AF', '#6B7280'], // Stone progression
  overlay: ['rgba(229, 231, 235, 0.2)', 'rgba(255, 255, 255, 0)'], // Stone overlay

  // Main gradients for components
  primary: ['#9CA3AF', '#6B7280', '#4B5563'], // Stone range
  secondary: ['#E8E3DB', '#D6CEC1', '#BFB3A3'], // Sand range
  light: ['#F3F4F6', '#E5E7EB'], // Light stone
  card: ['#FFFFFF', '#FAF9F7'], // Pure to sand

  // Mood-based gradients
  calmMorning: ['#F3F4F6', '#E5E7EB', '#FAF9F7'], // Stone to sand
  stoneSand: ['#D1D5DB', '#E8E3DB', '#D6CEC1'], // Balanced blend
  warmEarth: ['#F5F2ED', '#E8E3DB', '#D6CEC1'], // Warm sand
  coolStone: ['#E5E7EB', '#D1D5DB', '#9CA3AF'], // Cool stone

  // Success/Completion (using soft sky blue instead of green)
  success: ['#d4e3f0', '#b8d1e5', '#9cb9d3'], // Soft sky blue
  successStrong: ['#b8d1e5', '#9cb9d3', '#7fa3c4'], // Sky medium to strong

  // Warmth/Accent (sand tones)
  warmAccent: ['#e8dcc8', '#d4c4ad', '#bfad93'], // Sand light to medium
  warmStrong: ['#d4c4ad', '#bfad93', '#a89885'], // Sand medium to strong
};

// Helper function to get tier gradient
export const getTierGradient = (tierName: string): string[] => {
  return quartzGradients.tiers[tierName] || quartzGradients.primary;
};

export default tw;
