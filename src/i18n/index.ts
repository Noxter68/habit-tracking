// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import fr from './locales/fr.json';

const STORAGE_KEY = 'user-language';

// Plugin custom pour persister la langue
// src/i18n/index.ts
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }

      // Premier lancement : récupère et sauvegarde la langue du device
      const deviceLanguage = getLocales()[0]?.languageCode || 'en';
      const supportedLanguage = ['en', 'fr'].includes(deviceLanguage) ? deviceLanguage : 'en';

      await AsyncStorage.setItem(STORAGE_KEY, supportedLanguage);
      callback(supportedLanguage);
    } catch (error) {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Important pour React Native
    },
  });

export default i18n;
