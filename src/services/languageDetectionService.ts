/**
 * Service de detection et gestion de la langue
 *
 * Ce service gere la detection automatique de la langue du telephone,
 * la synchronisation avec la base de donnees et la configuration d'i18n.
 * Supporte actuellement le francais et l'anglais.
 *
 * @module LanguageDetectionService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { getLocales } from 'expo-localization';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';
import i18n from '@/i18n';

// =============================================================================
// CONSTANTES
// =============================================================================

/**
 * Langues supportees par l'application
 */
const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de detection et gestion de la langue
 *
 * Gere la detection, la persistance et le changement de langue
 */
export class LanguageDetectionService {
  // ===========================================================================
  // SECTION: Detection de la langue
  // ===========================================================================

  /**
   * Detecter la langue du telephone et retourner une langue supportee
   * Fallback sur 'en' si la langue n'est pas supportee
   *
   * @returns La langue detectee ou 'en' par defaut
   */
  static detectDeviceLanguage(): SupportedLanguage {
    try {
      const locales = getLocales();
      const deviceLanguage = locales[0]?.languageCode || 'en';

      Logger.debug(`Device language detected: ${deviceLanguage}`);

      if (SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)) {
        return deviceLanguage as SupportedLanguage;
      }

      Logger.debug(`Language '${deviceLanguage}' not supported, defaulting to 'en'`);
      return 'en';
    } catch (error) {
      Logger.error('Error detecting device language:', error);
      return 'en';
    }
  }

  // ===========================================================================
  // SECTION: Initialisation
  // ===========================================================================

  /**
   * Initialiser i18n avec la langue du device (AVANT connexion)
   * A appeler au demarrage de l'application
   */
  static async initializeDefaultLanguage(): Promise<void> {
    try {
      const deviceLanguage = this.detectDeviceLanguage();

      Logger.debug(`Initializing i18n with device language: ${deviceLanguage}`);

      await i18n.changeLanguage(deviceLanguage);

      Logger.debug(`i18n initialized: ${deviceLanguage}`);
    } catch (error) {
      Logger.error('Error initializing default language:', error);
      await i18n.changeLanguage('en');
    }
  }

  /**
   * Initialiser la langue de l'utilisateur lors de la creation du profil
   * Sauvegarde dans la base de donnees et configure i18n
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  static async initializeUserLanguage(userId: string): Promise<void> {
    try {
      const detectedLanguage = this.detectDeviceLanguage();

      Logger.debug(`Initializing language for user: ${detectedLanguage}`);

      const { error } = await supabase
        .from('profiles')
        .update({ language: detectedLanguage })
        .eq('id', userId);

      if (error) {
        Logger.error('Failed to save language preference:', error);
        throw error;
      }

      await i18n.changeLanguage(detectedLanguage);

      Logger.debug(`User language initialized: ${detectedLanguage}`);
    } catch (error) {
      Logger.error('Error initializing user language:', error);
      await i18n.changeLanguage('en');
    }
  }

  // ===========================================================================
  // SECTION: Chargement et mise a jour
  // ===========================================================================

  /**
   * Charger la langue de l'utilisateur depuis la base de donnees
   * Utilise lors de la connexion
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  static async loadUserLanguage(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', userId)
        .single();

      if (error) {
        Logger.error('Failed to load language preference:', error);
        return;
      }

      const userLanguage = (data?.language as SupportedLanguage) || 'en';

      if (i18n.language !== userLanguage) {
        await i18n.changeLanguage(userLanguage);
        Logger.debug(`User language loaded: ${userLanguage}`);
      }
    } catch (error) {
      Logger.error('Error loading user language:', error);
    }
  }

  /**
   * Mettre a jour la langue de l'utilisateur
   * Sauvegarde dans la base de donnees et met a jour i18n
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param language - La nouvelle langue
   */
  static async updateUserLanguage(
    userId: string,
    language: SupportedLanguage
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', userId);

      if (error) {
        Logger.error('Failed to update language preference:', error);
        throw error;
      }

      await i18n.changeLanguage(language);

      Logger.debug(`User language updated: ${language}`);
    } catch (error) {
      Logger.error('Error updating user language:', error);
      throw error;
    }
  }
}
