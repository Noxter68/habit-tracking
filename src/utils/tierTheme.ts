import { HabitTier } from '@/services/habitProgressionService';

export const tierThemes: Record<
  HabitTier,
  {
    gradient: string[];
    texture: any;
    accent: string; // fallback solid accent
  }
> = {
  Crystal: {
    gradient: ['#60a5fa', '#3b82f6', '#1d4ed8'], // blue tones
    texture: require('../../assets/interface/progressBar/crystal.png'),
    accent: '#3b82f6',
  },
  Ruby: {
    gradient: ['#ef4444', '#dc2626', '#991b1b'], // red tones
    texture: require('../../assets/interface/progressBar/ruby-texture.png'),
    accent: '#dc2626',
  },
  Amethyst: {
    gradient: ['#8b5cf6', '#7c3aed', '#4c1d95'], // purple tones
    texture: require('../../assets/interface/progressBar/amethyst-texture.png'),
    accent: '#7c3aed',
  },
};
