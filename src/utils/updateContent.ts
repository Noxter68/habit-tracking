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
    title: 'Group Habits',
    description: 'Team up with friends! Create shared habits, track collective streaks, and earn XP together. This is version 1.0 of Group Habits and may have some bugs - your feedback is welcome!',
  },
  {
    title: 'Edit Habit Tasks',
    description: 'You can now add or remove tasks from your existing habits. Adjust your habits as your routine evolves.',
  },
  {
    title: 'Multilingual Support',
    description: 'Nuvoria now speaks your language! Available in English and French, automatically matching your device settings.',
  },
  {
    title: 'Settings Redesign',
    description: 'The Settings screen got a fresh, cleaner look that matches the zen aesthetic of the app.',
  },
  {
    title: 'Bug Fixes & Improvements',
    description: 'Streak Savers are now working properly, along with various other fixes to make your experience smoother and more reliable.',
  },
];

// Version 1.1.0 - French
const updates_1_1_0_fr: UpdateItem[] = [
  {
    title: 'Habitudes de groupe',
    description:
      "Formez une équipe avec vos amis ! Créez des habitudes partagées, suivez vos streaks collectifs et gagnez de l'XP ensemble. C'est la version 1.0 des Habitudes de groupe, quelques bugs peuvent survenir - vos retours sont les bienvenus !",
  },
  {
    title: 'Modification des tâches',
    description: 'Vous pouvez maintenant ajouter ou supprimer des tâches dans vos habitudes existantes. Adaptez vos habitudes au fil de votre routine.',
  },
  {
    title: 'Support multilingue',
    description: "Nuvoria parle maintenant votre langue ! Disponible en anglais et français, l'app s'adapte automatiquement à votre appareil.",
  },
  {
    title: 'Réglages repensés',
    description: "La page Réglages a un nouveau look plus épuré et cohérent avec l'esthétique zen de l'app.",
  },
  {
    title: 'Corrections et améliorations',
    description: 'Les Streak Savers fonctionnent maintenant correctement, ainsi que diverses autres corrections pour une expérience plus fluide et fiable.',
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
