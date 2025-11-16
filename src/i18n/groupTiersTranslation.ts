// src/i18n/groupTiersTranslations.ts
// Traductions des tiers de groupes

export interface GroupTierTranslation {
  name: string;
  description: string;
}

type GroupTierName = 'Crystal' | 'Ruby' | 'Amethyst' | 'Jade' | 'Topaz' | 'Obsidian';

export const groupTiersTranslations: Record<'en' | 'fr', Record<GroupTierName, GroupTierTranslation>> = {
  en: {
    Crystal: {
      name: 'Crystal',
      description: 'Crystalline foundation',
    },
    Ruby: {
      name: 'Ruby',
      description: 'Collective red passion',
    },
    Amethyst: {
      name: 'Amethyst',
      description: 'Mystical purple synergy',
    },
    Jade: {
      name: 'Jade',
      description: 'Shared green harmony',
    },
    Topaz: {
      name: 'Topaz',
      description: 'Golden group excellence',
    },
    Obsidian: {
      name: 'Obsidian',
      description: 'Ultimate collective mastery',
    },
  },
  fr: {
    Crystal: {
      name: 'Crystal',
      description: 'Fondation cristalline',
    },
    Ruby: {
      name: 'Ruby',
      description: 'Passion rouge collective',
    },
    Amethyst: {
      name: 'Amethyst',
      description: 'Synergie violette mystique',
    },
    Jade: {
      name: 'Jade',
      description: 'Harmonie verte partagée',
    },
    Topaz: {
      name: 'Topaz',
      description: 'Excellence dorée en groupe',
    },
    Obsidian: {
      name: 'Obsidian',
      description: 'Maîtrise ultime collective',
    },
  },
};

/**
 * Get translated group tier
 * @param tierName - The tier name (Crystal, Ruby, etc.)
 * @param language - Current language ('en' or 'fr')
 * @returns Translated tier
 */
export const getTranslatedGroupTier = (tierName: GroupTierName, language: 'en' | 'fr' = 'en'): GroupTierTranslation => {
  const translation = groupTiersTranslations[language]?.[tierName];

  if (translation) {
    return translation;
  }

  // Fallback to English if French translation not found
  const englishTranslation = groupTiersTranslations.en[tierName];
  if (englishTranslation && language === 'fr') {
    return englishTranslation;
  }

  // Ultimate fallback to original name
  return {
    name: tierName,
    description: '',
  };
};

/**
 * Hook for easy usage in components
 * Usage:
 *
 * import { useTranslatedGroupTier } from '@/i18n/groupTiersTranslations';
 * import { useTranslation } from 'react-i18next';
 *
 * const { i18n } = useTranslation();
 * const translatedTier = useTranslatedGroupTier('Crystal', i18n.language as 'en' | 'fr');
 */
export const useTranslatedGroupTier = (tierName: GroupTierName, language: 'en' | 'fr'): GroupTierTranslation => {
  return getTranslatedGroupTier(tierName, language);
};
