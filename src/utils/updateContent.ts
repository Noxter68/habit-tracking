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

// Version 1.1.4 - English
const updates_1_1_4_en: UpdateItem[] = [
  {
    title: 'Better Connection Handling',
    description: 'The app now handles connection issues gracefully. If Supabase is temporarily unavailable, you stay logged in and see a connection toast instead of being redirected to login.',
  },
  {
    title: 'Improved Dashboard Layout',
    description: 'Refined the status bar and safe area spacing for a cleaner look on all iPhone models.',
  },
];

// Version 1.1.4 - French
const updates_1_1_4_fr: UpdateItem[] = [
  {
    title: 'Meilleure Gestion de la Connexion',
    description:
      "L'application gère maintenant les problèmes de connexion de manière élégante. Si Supabase est temporairement indisponible, vous restez connecté et voyez un toast de connexion au lieu d'être redirigé vers la page de connexion.",
  },
  {
    title: 'Amélioration du Dashboard',
    description: "Ajustement de la barre de statut et de l'espacement de la zone de sécurité pour un affichage plus propre sur tous les modèles d'iPhone.",
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
    updates_1_1_4_en: updates_1_1_4_en,
    updates_1_1_4_fr: updates_1_1_4_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
