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
   * @returns Vrai si la mise a jour a reussi
   */
  static async completeOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', userId);

      if (error) {
        Logger.error('Error completing onboarding:', error);
        return false;
      }

      Logger.info('Onboarding completed for user:', userId);
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
}
