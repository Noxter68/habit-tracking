export interface UpdateItem {
  title: string;
  description: string;
}

export interface UpdateModalTexts {
  title: string;
  whatsNew: string;
  getStarted: string;
}

// Textes de la modal - English
const modalTexts_en: UpdateModalTexts = {
  title: 'New Update Available',
  whatsNew: "What's New?",
  getStarted: 'Get Started',
};

// Textes de la modal - French
const modalTexts_fr: UpdateModalTexts = {
  title: 'Nouvelle mise à jour',
  whatsNew: 'Quoi de neuf ?',
  getStarted: 'Commencer',
};

// Version 1.2.0 - English
const updates_1_2_0_en: UpdateItem[] = [
  {
    title: 'Achievements System',
    description: 'Unlock achievements by completing challenges! Earn XP, exclusive titles, and XP boosts as rewards. Track your progress and collect them all.',
  },
  {
    title: 'Inventory & Rewards',
    description: 'Access your inventory to view unlocked titles and activate XP boosts. Boosts multiply your XP earnings for a limited time!',
  },
  {
    title: 'XP Boost Mode',
    description: 'When a boost is active, enjoy a special visual experience with a purple progress bar and boosted XP notifications.',
  },
  {
    title: 'Bug Fixes & Improvements',
    description: 'Fixed minor bugs and improved various UI elements for a smoother experience.',
  },
];

// Version 1.2.0 - French
const updates_1_2_0_fr: UpdateItem[] = [
  {
    title: 'Système d\'Accomplissements',
    description: 'Débloquez des accomplissements en relevant des défis ! Gagnez de l\'XP, des titres exclusifs et des boosts d\'XP en récompense. Suivez votre progression et collectionnez-les tous.',
  },
  {
    title: 'Inventaire & Récompenses',
    description: 'Accédez à votre inventaire pour voir vos titres débloqués et activer vos boosts d\'XP. Les boosts multiplient vos gains d\'XP pendant une durée limitée !',
  },
  {
    title: 'Mode Boost XP',
    description: 'Lorsqu\'un boost est actif, profitez d\'une expérience visuelle spéciale avec une barre de progression violette et des notifications d\'XP boostées.',
  },
  {
    title: 'Corrections & Améliorations',
    description: 'Correction de bugs mineurs et amélioration de certains éléments de design pour une expérience plus fluide.',
  },
];

export const getModalTexts = (locale: string = 'en'): UpdateModalTexts => {
  const textsMap: Record<string, UpdateModalTexts> = {
    en: modalTexts_en,
    fr: modalTexts_fr,
  };

  return textsMap[locale] || modalTexts_en;
};

export const getUpdatesForVersion = (version: string, locale: string = 'en'): UpdateItem[] => {
  const key = `updates_${version.replace(/\./g, '_')}_${locale}`;

  // Map des versions disponibles
  const updatesMap: Record<string, UpdateItem[]> = {
    updates_1_2_0_en: updates_1_2_0_en,
    updates_1_2_0_fr: updates_1_2_0_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
