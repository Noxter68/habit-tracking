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

// Version 1.1.5 - English
const updates_1_1_5_en: UpdateItem[] = [
  {
    title: 'Complete Tasks from Dashboard',
    description: 'You can now check off your habit tasks directly from the home screen! No need to open each habit individually anymore.',
  },
  {
    title: 'Refreshed Dashboard Design',
    description: 'The dashboard header and habit cards have been redesigned for a cleaner, more intuitive experience.',
  },
  {
    title: 'Celebration Queue System',
    description: 'Milestone and level up celebrations now display in order. No more missed celebrations when multiple achievements unlock at once!',
  },
];

// Version 1.1.5 - French
const updates_1_1_5_fr: UpdateItem[] = [
  {
    title: 'Validez vos tâches depuis le Dashboard',
    description: 'Vous pouvez maintenant cocher vos tâches directement depuis l\'écran d\'accueil ! Plus besoin d\'ouvrir chaque habitude individuellement.',
  },
  {
    title: 'Nouveau design du Dashboard',
    description: 'L\'en-tête et les cartes d\'habitudes ont été redessinés pour une expérience plus claire et intuitive.',
  },
  {
    title: 'File de célébrations',
    description: 'Les célébrations de milestones et de level up s\'affichent maintenant dans l\'ordre. Plus de célébrations manquées !',
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
    updates_1_1_5_en: updates_1_1_5_en,
    updates_1_1_5_fr: updates_1_1_5_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
