// src/services/languageDetectionService.ts
import { getLocales } from 'expo-localization';
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';
import i18n from '@/i18n';

const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export class LanguageDetectionService {
  /**
   * Détecte la langue du téléphone et retourne une langue supportée
   * Fallback sur 'en' si la langue n'est pas supportée
   */
  static detectDeviceLanguage(): SupportedLanguage {
    try {
      const locales = getLocales();
      const deviceLanguage = locales[0]?.languageCode || 'en';

      Logger.debug(`📱 Device language detected: ${deviceLanguage}`);

      // Vérifie si la langue est supportée
      if (SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)) {
        return deviceLanguage as SupportedLanguage;
      }

      // Fallback sur 'en'
      Logger.debug(`⚠️ Language '${deviceLanguage}' not supported, defaulting to 'en'`);
      return 'en';
    } catch (error) {
      Logger.error('Error detecting device language:', error);
      return 'en';
    }
  }

  /**
   * Initialise la langue de l'utilisateur lors de la création du profil
   * Sauvegarde dans la DB et configure i18n
   */
  static async initializeUserLanguage(userId: string): Promise<void> {
    try {
      const detectedLanguage = this.detectDeviceLanguage();

      Logger.debug(`🌍 Initializing language for user: ${detectedLanguage}`);

      // Sauvegarde dans la DB
      const { error } = await supabase.from('profiles').update({ language: detectedLanguage }).eq('id', userId);

      if (error) {
        Logger.error('Failed to save language preference:', error);
        throw error;
      }

      // Configure i18n
      await i18n.changeLanguage(detectedLanguage);

      Logger.debug(`✅ User language initialized: ${detectedLanguage}`);
    } catch (error) {
      Logger.error('Error initializing user language:', error);
      // En cas d'erreur, configure quand même i18n en anglais
      await i18n.changeLanguage('en');
    }
  }

  /**
   * Charge la langue de l'utilisateur depuis la DB
   * Utilisé lors de la connexion
   */
  static async loadUserLanguage(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase.from('profiles').select('language').eq('id', userId).single();

      if (error) {
        Logger.error('Failed to load language preference:', error);
        return;
      }

      const userLanguage = (data?.language as SupportedLanguage) || 'en';

      // Configure i18n
      if (i18n.language !== userLanguage) {
        await i18n.changeLanguage(userLanguage);
        Logger.debug(`🌍 User language loaded: ${userLanguage}`);
      }
    } catch (error) {
      Logger.error('Error loading user language:', error);
    }
  }

  /**
   * Met à jour la langue de l'utilisateur
   * Sauvegarde dans la DB et met à jour i18n
   */
  static async updateUserLanguage(userId: string, language: SupportedLanguage): Promise<void> {
    try {
      // Sauvegarde dans la DB
      const { error } = await supabase.from('profiles').update({ language }).eq('id', userId);

      if (error) {
        Logger.error('Failed to update language preference:', error);
        throw error;
      }

      // Configure i18n
      await i18n.changeLanguage(language);

      Logger.debug(`✅ User language updated: ${language}`);
    } catch (error) {
      Logger.error('Error updating user language:', error);
      throw error;
    }
  }
}
