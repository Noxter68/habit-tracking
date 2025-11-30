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
      title: 'Getting Started',
      description: '3 days of habit building',
    },
    'Week Warrior': {
      title: 'Week Warrior',
      description: 'One week of habit building',
    },

    // ========== NOVICE TIER ==========
    'Fortnight Fighter': {
      title: 'Fortnight Fighter',
      description: 'Two weeks strong',
    },
    'Habit Former': {
      title: 'Habit Former',
      description: '21 days to form a habit',
    },
    'Monthly Master': {
      title: 'Monthly Master',
      description: 'One month achieved',
    },

    // ========== ADEPT TIER ==========
    'Persistent Path': {
      title: 'Persistent Path',
      description: '45 days of dedication',
    },
    Committed: {
      title: 'Committed',
      description: 'Two months of dedication',
    },

    // ========== EXPERT TIER ==========
    'Steadfast Soul': {
      title: 'Steadfast Soul',
      description: '75 days unwavering',
    },
    'Quarter Champion': {
      title: 'Quarter Champion',
      description: 'Three months strong',
    },
    Century: {
      title: 'Century',
      description: '100 days milestone',
    },

    // ========== MASTER TIER ==========
    'Resilient Spirit': {
      title: 'Resilient Spirit',
      description: '150 days of growth',
    },
    'Unstoppable Force': {
      title: 'Unstoppable Force',
      description: '200 days mastered',
    },
    'Elite Achiever': {
      title: 'Elite Achiever',
      description: '250 days of excellence',
    },

    // ========== LEGENDARY TIER ==========
    'Legendary Warrior': {
      title: 'Legendary Warrior',
      description: '300 days conquered',
    },
    'Year Legend': {
      title: 'Year Legend',
      description: 'One full year completed',
    },
  },

  fr: {
    // ========== PALIER DÉBUTANT ==========
    'Getting Started': {
      title: 'Premiers Pas',
      description: "3 jours de création d'habitude",
    },
    'Week Warrior': {
      title: 'Guerrier de la Semaine',
      description: "Une semaine de création d'habitude",
    },

    // ========== PALIER NOVICE ==========
    'Fortnight Fighter': {
      title: 'Combattant des Deux Semaines',
      description: 'Deux semaines solides',
    },
    'Habit Former': {
      title: "Formateur d'Habitude",
      description: '21 jours pour former une habitude',
    },
    'Monthly Master': {
      title: 'Maître Mensuel',
      description: 'Un mois accompli',
    },

    // ========== PALIER ADEPTE ==========
    'Persistent Path': {
      title: 'Chemin Persistant',
      description: '45 jours de dévouement',
    },
    Committed: {
      title: 'Engagé',
      description: 'Deux mois de dévouement',
    },

    // ========== PALIER EXPERT ==========
    'Steadfast Soul': {
      title: 'Âme Inébranlable',
      description: '75 jours sans faille',
    },
    'Quarter Champion': {
      title: 'Champion du Trimestre',
      description: 'Trois mois solides',
    },
    Century: {
      title: 'Centenaire',
      description: 'Jalon de 100 jours',
    },

    // ========== PALIER MAÎTRE ==========
    'Resilient Spirit': {
      title: 'Esprit Résilient',
      description: '150 jours de croissance',
    },
    'Unstoppable Force': {
      title: 'Force Imparable',
      description: '200 jours maîtrisés',
    },
    'Elite Achiever': {
      title: "Réalisateur d'Élite",
      description: "250 jours d'excellence",
    },

    // ========== PALIER LÉGENDAIRE ==========
    'Legendary Warrior': {
      title: 'Guerrier Légendaire',
      description: '300 jours conquis',
    },
    'Year Legend': {
      title: "Légende de l'Année",
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
