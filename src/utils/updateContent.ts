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

// Version 1.1.3 - English
const updates_1_1_3_en: UpdateItem[] = [
  {
    title: 'Subscription Modal Improvements',
    description: 'Fixed subscription modal display issues and added Terms of Use and Privacy Policy links to comply with App Store requirements.',
  },
  {
    title: 'Subscription Access in Settings',
    description: 'You can now access subscription plans and manage your Premium subscription directly from the settings screen.',
  },
  {
    title: 'Customizable Motivation Modal',
    description: 'Choose how often you want to see the daily motivation modal: once per day or every time you open the app. Configure it in settings to match your preferences.',
  },
  {
    title: 'iPad Support Removed',
    description: 'The app is now iPhone-only for a better optimized experience.',
  },
];

// Version 1.1.3 - French
const updates_1_1_3_fr: UpdateItem[] = [
  {
    title: "Améliorations de la Modal d'Abonnement",
    description:
      "Correction des problèmes d'affichage de la modal d'abonnement et ajout des liens Conditions d'Utilisation et Politique de Confidentialité pour respecter les exigences de l'App Store.",
  },
  {
    title: 'Accès Abonnement dans les Paramètres',
    description: "Vous pouvez maintenant accéder aux plans d'abonnement et gérer votre abonnement Premium directement depuis l'écran des paramètres.",
  },
  {
    title: 'Modal de Motivation Personnalisable',
    description:
      "Choisissez la fréquence d'affichage de la modal de motivation quotidienne : une fois par jour ou à chaque ouverture de l'application. Configurez-la dans les paramètres selon vos préférences.",
  },
  {
    title: 'Support iPad Retiré',
    description: "L'application est maintenant uniquement disponible sur iPhone pour une expérience mieux optimisée.",
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
    updates_1_1_3_en: updates_1_1_3_en,
    updates_1_1_3_fr: updates_1_1_3_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
