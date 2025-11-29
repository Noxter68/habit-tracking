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

// Version 1.1.2 - English
const updates_1_1_2_en: UpdateItem[] = [
  {
    title: 'Account Deletion',
    description: 'You can now permanently delete your account and all associated data directly from the settings menu.',
  },
  {
    title: 'Improved Animations in Habit Details',
    description: 'Task checking is now instant and satisfying! New optimistic UI with smooth 3D button effects and beautiful Lottie animations - zero waiting time.',
  },
  {
    title: 'Enhanced User Interface',
    description: 'Improved visual feedback with 3D depth effects on buttons, smoother transitions, and more polished animations throughout the app.',
  },
  {
    title: 'Daily/Weekly Task Logic Fix',
    description: 'Fixed logic issues between daily and weekly task completion tracking - your progress is now accurately recorded for both frequency types.',
  },
];

// Version 1.1.2 - French
const updates_1_1_2_fr: UpdateItem[] = [
  {
    title: 'Suppression de compte',
    description: 'Vous pouvez maintenant supprimer définitivement votre compte et toutes les données associées directement depuis les paramètres.',
  },
  {
    title: 'Animations Améliorés dans vos habitudes',
    description: 'Cocher une tâche est maintenant instantané et plus satisfaisant !',
  },
  {
    title: 'Interface utilisateur améliorée',
    description: "Retour visuel amélioré avec effets de profondeur 3D sur les boutons, transitions plus fluides et animations plus soignées dans toute l'application.",
  },
  {
    title: 'Correction logique tâches quotidiennes/hebdomadaires',
    description: 'Correction des problèmes de logique entre le suivi des tâches quotidiennes et hebdomadaires - votre progression est maintenant enregistrée avec précision pour les deux types.',
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
    updates_1_1_2_en: updates_1_1_2_en,
    updates_1_1_2_fr: updates_1_1_2_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
