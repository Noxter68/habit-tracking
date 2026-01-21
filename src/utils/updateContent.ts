export interface UpdateItem {
  title: string;
  description: string;
  image?: any; // require() image source
  link?: {
    screen: string; // Navigation screen name
    label: string; // Text to display for the link
  };
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

// Version 1.2.1 - English
const updates_1_2_1_en: UpdateItem[] = [
  {
    title: 'Redesigned Login Screen',
    description: 'A cleaner, more minimalist login experience with improved visual design.',
    image: require('../../assets/update/1.2.1/new-login-screen.png'),
  },
  {
    title: 'New Achievements Page',
    description: 'Completely redesigned achievements screen with better organization and visuals.',
    image: require('../../assets/update/1.2.1/achievements-redesign.png'),
  },
  {
    title: 'Stats Bar in Dashboard',
    description: 'New compact stats bar at the top of your dashboard showing level, streak, and streak savers - saving valuable screen space.',
    image: require('../../assets/update/1.2.1/compact-dashboard.png'),
  },
  {
    title: 'Compact View Modes',
    description: 'New layout options for your dashboard. Customize your view in **Settings** to toggle between compact and expanded modes.',
    image: require('../../assets/update/1.2.1/settings-toggle-compact.jpg'),
    link: {
      screen: 'Settings',
      label: 'Open Settings',
    },
  },
];

// Version 1.2.1 - French
const updates_1_2_1_fr: UpdateItem[] = [
  {
    title: 'Écran de connexion redessiné',
    description: 'Une expérience de connexion plus épurée et minimaliste avec un design visuel amélioré.',
    image: require('../../assets/update/1.2.1/new-login-screen.png'),
  },
  {
    title: 'Nouvelle page Accomplissements',
    description: 'Écran des accomplissements entièrement redessiné avec une meilleure organisation et de nouveaux visuels.',
    image: require('../../assets/update/1.2.1/achievements-redesign.png'),
  },
  {
    title: 'Barre de stats dans le Dashboard',
    description: 'Nouvelle barre de stats compacte en haut de votre tableau de bord affichant niveau, série et streak savers - pour optimiser l\'espace.',
    image: require('../../assets/update/1.2.1/compact-dashboard.png'),
  },
  {
    title: 'Modes d\'affichage compact',
    description: 'Nouvelles options de mise en page pour votre dashboard. Personnalisez votre affichage dans **Réglages** pour basculer entre vue compacte et étendue.',
    image: require('../../assets/update/1.2.1/settings-toggle-compact.jpg'),
    link: {
      screen: 'Settings',
      label: 'Ouvrir Réglages',
    },
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
    updates_1_2_1_en: updates_1_2_1_en,
    updates_1_2_1_fr: updates_1_2_1_fr,
  };

  return updatesMap[key] || updatesMap[`updates_${version.replace(/\./g, '_')}_en`] || [];
};
