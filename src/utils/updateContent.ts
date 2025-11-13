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

// Version 1.0.12 - English
const updates_1_0_12_en: UpdateItem[] = [
  {
    title: 'Performance Improvements',
    description: 'The app is now 30% faster with better memory management.',
  },
  {
    title: 'New Notification System',
    description: 'Receive personalized reminders for your important habits.',
  },
  {
    title: 'Redesigned Interface',
    description: 'Cleaner and more intuitive design for optimal user experience.',
  },
  {
    title: 'Bug Fixes',
    description: 'Resolution of several issues reported by the community.',
  },
];

// Version 1.0.12 - French
const updates_1_0_12_fr: UpdateItem[] = [
  {
    title: 'Amélioration des performances',
    description: "L'application est maintenant 30% plus rapide avec une meilleure gestion de la mémoire.",
  },
  {
    title: 'Nouveau système de notifications',
    description: 'Recevez des rappels personnalisés pour vos habitudes importantes.',
  },
  {
    title: 'Interface repensée',
    description: 'Design plus épuré et intuitif pour une expérience utilisateur optimale.',
  },
  {
    title: 'Corrections de bugs',
    description: 'Résolution de plusieurs problèmes signalés par la communauté.',
  },
];

// Version 1.1.0 - English
const updates_1_1_0_en: UpdateItem[] = [
  {
    title: 'Update Modal System',
    description: 'Implemented a version tracking system that automatically displays update notes when installing a new version.',
  },
  {
    title: 'Multilingual Support',
    description: 'Nuvoria is now available in English and French, automatically adapting to your device language.',
  },
  {
    title: 'Enhanced User Experience',
    description: 'Bug fixes and improved app stability.',
  },
];

// Version 1.1.0 - French
const updates_1_1_0_fr: UpdateItem[] = [
  {
    title: 'Système de modal de mise à jour',
    description: "Implémentation d'un système de suivi de version qui affiche automatiquement les notes de mise à jour lors de l'installation d'une nouvelle version.",
  },
  {
    title: 'Support multilingue',
    description: "Nuvoria est maintenant disponibles en anglais et en français, s'adaptant automatiquement à la langue de votre appareil.",
  },
  {
    title: 'Expérience utilisateur améliorée',
    description: "Amélioration de bugs et stabilité de l'application",
  },
  {
    title: 'Réglage a un nouveau look plus sobre !',
    description: 'Armonisation de la page Réglage',
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
    updates_1_0_12_en: updates_1_0_12_en,
    updates_1_0_12_fr: updates_1_0_12_fr,
    updates_1_1_0_en: updates_1_1_0_en,
    updates_1_1_0_fr: updates_1_1_0_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
