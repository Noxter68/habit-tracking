// src/i18n/milestonesTranslations.ts

/**
 * Milestone translations mapping
 * Maps milestone titles from the database to localized versions
 * Based on actual database milestones
 */

export interface MilestoneTranslation {
  title: string;
  description: string;
}

export const milestonesTranslations: Record<string, Record<string, MilestoneTranslation>> = {
  en: {
    // ========== BEGINNER TIER ==========
    'Getting Started': {
      title: 'Getting started',
      description: '3 days of habit building',
    },
    'Week Warrior': {
      title: 'Week warrior',
      description: 'One week of habit building',
    },

    // ========== NOVICE TIER ==========
    'Fortnight Fighter': {
      title: 'Fortnight fighter',
      description: 'Two weeks strong',
    },
    'Habit Former': {
      title: 'Habit former',
      description: '21 days to form a habit',
    },
    'Monthly Master': {
      title: 'Monthly master',
      description: 'One month achieved',
    },

    // ========== ADEPT TIER ==========
    'Persistent Path': {
      title: 'Persistent path',
      description: '45 days of dedication',
    },
    Committed: {
      title: 'Committed',
      description: 'Two months of dedication',
    },

    // ========== EXPERT TIER ==========
    'Steadfast Soul': {
      title: 'Steadfast soul',
      description: '75 days unwavering',
    },
    'Quarter Champion': {
      title: 'Quarter champion',
      description: 'Three months strong',
    },
    Century: {
      title: 'Century',
      description: '100 days milestone',
    },

    // ========== MASTER TIER ==========
    'Resilient spirit': {
      title: 'Resilient Spirit',
      description: '150 days of growth',
    },
    'Unstoppable force': {
      title: 'Unstoppable Force',
      description: '200 days mastered',
    },
    'Elite Achiever': {
      title: 'Elite achiever',
      description: '250 days of excellence',
    },

    // ========== LEGENDARY TIER ==========
    'Legendary Warrior': {
      title: 'Legendary warrior',
      description: '300 days conquered',
    },
    'Year Legend': {
      title: 'Year legend',
      description: 'One full year completed',
    },
  },

  fr: {
    // ========== PALIER DÉBUTANT ==========
    'Getting Started': {
      title: 'Premiers pas',
      description: "3 jours de création d'habitude",
    },
    'Week Warrior': {
      title: 'Guerrier de la semaine',
      description: "Une semaine de création d'habitude",
    },

    // ========== PALIER NOVICE ==========
    'Fortnight Fighter': {
      title: 'Combattant des deux semaines',
      description: 'Deux semaines solides',
    },
    'Habit Former': {
      title: "Formateur d'habitude",
      description: '21 jours pour former une habitude',
    },
    'Monthly Master': {
      title: 'Maître mensuel',
      description: 'Un mois accompli',
    },

    // ========== PALIER ADEPTE ==========
    'Persistent Path': {
      title: 'Chemin persistant',
      description: '45 jours de dévouement',
    },
    Committed: {
      title: 'Engagé',
      description: 'Deux mois de dévouement',
    },

    // ========== PALIER EXPERT ==========
    'Steadfast Soul': {
      title: 'Âme inébranlable',
      description: '75 jours sans faille',
    },
    'Quarter Champion': {
      title: 'Champion du trimestre',
      description: 'Trois mois solides',
    },
    Century: {
      title: 'Centenaire',
      description: 'Jalon de 100 jours',
    },

    // ========== PALIER MAÎTRE ==========
    'Resilient Spirit': {
      title: 'Esprit résilient',
      description: '150 jours de croissance',
    },
    'Unstoppable Force': {
      title: 'Force imparable',
      description: '200 jours maîtrisés',
    },
    'Elite Achiever': {
      title: "Réalisateur d'élite",
      description: "250 jours d'excellence",
    },

    // ========== PALIER LÉGENDAIRE ==========
    'Legendary Warrior': {
      title: 'Guerrier légendaire',
      description: '300 jours conquis',
    },
    'Year Legend': {
      title: "Légende de l'année",
      description: 'Une année complète accomplie',
    },
  },
};

/**
 * Get translated milestone
 * @param milestoneTitle - The original milestone title from database
 * @param language - Current language ('en' or 'fr')
 * @returns Translated milestone or original if translation not found
 */
export const getTranslatedMilestone = (milestoneTitle: string, language: 'en' | 'fr' = 'en'): MilestoneTranslation => {
  const translation = milestonesTranslations[language]?.[milestoneTitle];

  if (translation) {
    return translation;
  }

  // Fallback to English if French translation not found
  const englishTranslation = milestonesTranslations.en[milestoneTitle];
  if (englishTranslation && language === 'fr') {
    return englishTranslation;
  }

  // Ultimate fallback to original title
  return {
    title: milestoneTitle,
    description: '',
  };
};

/**
 * Hook for easy usage in components
 * Usage:
 *
 * import { useTranslatedMilestone } from '@/i18n/milestonesTranslations';
 * import { useTranslation } from 'react-i18next';
 *
 * const { i18n } = useTranslation();
 * const translatedMilestone = useTranslatedMilestone(milestone.title, i18n.language as 'en' | 'fr');
 */
export const useTranslatedMilestone = (milestoneTitle: string, language: 'en' | 'fr'): MilestoneTranslation => {
  return getTranslatedMilestone(milestoneTitle, language);
};
