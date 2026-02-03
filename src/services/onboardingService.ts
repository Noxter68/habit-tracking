/**
 * Service de gestion de l'onboarding
 *
 * Ce service gere le statut d'onboarding des utilisateurs,
 * permettant de verifier, completer et reinitialiser l'onboarding.
 *
 * @module OnboardingService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '../utils/logger';

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion de l'onboarding
 *
 * Gere le processus d'introduction des nouveaux utilisateurs
 */
export class OnboardingService {
  // ===========================================================================
  // SECTION: Verification du statut
  // ===========================================================================

  /**
   * Verifier si l'utilisateur a complete l'onboarding
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si l'onboarding est complete
   */
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', userId)
        .single();

      if (error) {
        Logger.error('Error checking onboarding status:', error);
        return false;
      }

      return data?.has_completed_onboarding || false;
    } catch (error) {
      Logger.error('Exception checking onboarding:', error);
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Gestion de l'onboarding
  // ===========================================================================

  /**
   * Marquer l'onboarding comme complete
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param username - Le pseudo optionnel de l'utilisateur
   * @param status - Le statut de l'onboarding ('started' ou 'skipped')
   * @returns Vrai si la mise a jour a reussi
   */
  static async completeOnboarding(userId: string, username?: string, status: 'started' | 'skipped' = 'started'): Promise<boolean> {
    try {
      const updateData: any = {
        has_completed_onboarding: true,
        onboarding_status: status,
      };

      // Si un pseudo est fourni, l'ajouter aux donnees a mettre a jour
      if (username && username.trim()) {
        updateData.username = username.trim();
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        Logger.error('Error completing onboarding:', error);
        return false;
      }

      Logger.info('Onboarding completed for user:', userId, `status: ${status}`, username ? `with username: ${username}` : '');
      return true;
    } catch (error) {
      Logger.error('Exception completing onboarding:', error);
      return false;
    }
  }

  /**
   * Reinitialiser l'onboarding (pour tests ou demande utilisateur)
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si la reinitialisation a reussi
   */
  static async resetOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: false })
        .eq('id', userId);

      if (error) {
        Logger.error('Error resetting onboarding:', error);
        return false;
      }

      Logger.info('Onboarding reset for user:', userId);
      return true;
    } catch (error) {
      Logger.error('Exception resetting onboarding:', error);
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Gestion du username
  // ===========================================================================

  /**
   * Verifier si un pseudo est disponible dans la base de donnees
   *
   * @param username - Le pseudo a verifier
   * @param excludeUserId - ID utilisateur a exclure de la recherche (utile pour les mises a jour)
   * @returns Vrai si le pseudo est disponible, faux s'il est deja pris ou en cas d'erreur
   */
  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    try {
      const trimmedUsername = username.trim();

      // Un pseudo vide n'est pas valide
      if (!trimmedUsername) {
        return false;
      }

      // Construire la requete pour chercher le pseudo dans la table profiles
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername);

      // Si un ID utilisateur est fourni, l'exclure de la recherche
      // (utile quand un utilisateur modifie son propre pseudo)
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        Logger.error('Error checking username availability:', error);
        return false;
      }

      // Si data est null, aucun utilisateur n'utilise ce pseudo : il est disponible
      return data === null;
    } catch (error) {
      Logger.error('Exception checking username availability:', error);
      return false;
    }
  }

  /**
   * Valider le format d'un pseudo selon les regles strictes
   *
   * Regles de validation :
   * - Longueur : 3 a 20 caracteres
   * - Caracteres autorises : Lettres uniquement (incluant les caracteres accentues comme ø, é, à, etc.)
   * - Caracteres interdits : Chiffres, points, tirets, underscores, et tous autres symboles
   *
   * @param username - Le pseudo a valider
   * @returns Objet contenant isValid (boolean) et un message d'erreur optionnel
   */
  static validateUsernameFormat(username: string): { isValid: boolean; error?: string } {
    const trimmedUsername = username.trim();

    // Verifier que le pseudo contient au moins 3 caracteres
    if (trimmedUsername.length < 3) {
      return {
        isValid: false,
        error: 'Username must be at least 3 characters long'
      };
    }

    // Verifier que le pseudo ne depasse pas 20 caracteres
    if (trimmedUsername.length > 20) {
      return {
        isValid: false,
        error: 'Username cannot exceed 20 characters'
      };
    }

    // Verifier que le pseudo ne contient QUE des lettres (pas de chiffres ni symboles)
    // \p{L} = n'importe quelle lettre dans n'importe quel alphabet Unicode
    // Cela inclut les lettres accentuees (é, è, à, ø, etc.)
    const lettersOnlyRegex = /^[\p{L}]+$/u;
    if (!lettersOnlyRegex.test(trimmedUsername)) {
      return {
        isValid: false,
        error: 'Only letters are allowed (no numbers, dots, dashes or underscores)'
      };
    }

    return { isValid: true };
  }
}
