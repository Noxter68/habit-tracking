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

// Version 1.1.1- English
const updates_1_1_1_en: UpdateItem[] = [
  {
    title: 'Username Creation',
    description: 'You can now create your username right after onboarding, making it easier to join groups and connect with friends from the start.',
  },
  {
    title: 'Milestone Fixes',
    description: 'Fixed period calculation for milestone unlocks - your achievements will now unlock at the right time.',
  },
  {
    title: 'Streak Saver Improvements',
    description: 'Streak Savers now work perfectly! They properly maintain both habit and global streaks when saving your progress.',
  },
  {
    title: 'Smart Notifications',
    description: "Notifications are now smarter - you won't receive reminders for tasks you've already completed.",
  },
  {
    title: 'Weekly Bonus System',
    description: 'Improved timezone handling for weekly resets and bonuses - everyone gets their rewards at the right time, no matter where they are.',
  },
];

// Version 1.1.1 - French
const updates_1_1_1_fr: UpdateItem[] = [
  {
    title: 'Création de pseudo',
    description: "Vous pouvez maintenant créer votre pseudo juste après l'onboarding, facilitant la création et l'adhésion à des groupes dès le début.",
  },
  {
    title: 'Corrections des jalons',
    description: 'Correction du calcul de période pour le déblocage des jalons - vos accomplissements se débloquent maintenant au bon moment.',
  },
  {
    title: 'Améliorations Sauvegarde de Série',
    description: 'Les Sauvegardes de Série fonctionnent parfaitement ! Elles maintiennent correctement vos séries individuelles et globales.',
  },
  {
    title: 'Notifications intelligentes',
    description: 'Les notifications sont plus intelligentes - vous ne recevrez plus de rappels pour les tâches déjà complétées.',
  },
  {
    title: 'Système de bonus hebdomadaire',
    description: 'Gestion améliorée des fuseaux horaires pour les réinitialisations et bonus hebdomadaires - tout le monde reçoit ses récompenses au bon moment.',
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
    updates_1_1_1_en: updates_1_1_1_en,
    updates_1_1_1_fr: updates_1_1_1_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
