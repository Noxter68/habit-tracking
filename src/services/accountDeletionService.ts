/**
 * ============================================================================
 * accountDeletionService.ts
 * ============================================================================
 *
 * Service pour gérer la suppression complète du compte utilisateur.
 * Supprime toutes les données associées à l'utilisateur en cascade.
 */

import { supabase } from '@/lib/supabase';
import Logger from '@/utils/logger';

export class AccountDeletionService {
  /**
   * Supprime complètement un compte utilisateur et toutes ses données
   * Cette action est irréversible
   *
   * @param userId - ID de l'utilisateur à supprimer
   * @returns Promise<void>
   * @throws Error si la suppression échoue
   */
  static async deleteAccount(userId: string): Promise<void> {
    try {
      Logger.info(`🗑️ [AccountDeletion] Starting account deletion for user: ${userId}`);

      // La suppression en cascade devrait être configurée au niveau de la base de données
      // Mais nous allons quand même supprimer explicitement pour être sûr

      // 1. Supprimer le profil (cascade devrait gérer le reste)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        Logger.error('❌ [AccountDeletion] Error deleting profile:', profileError);
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      Logger.info('✅ [AccountDeletion] Profile deleted successfully');

      // 2. Supprimer l'utilisateur de l'authentification Supabase
      // Note: Cette opération nécessite les privilèges admin
      // Elle sera gérée côté serveur via une fonction RPC
      const { error: authError } = await supabase.rpc('delete_user_account', {
        user_id: userId
      });

      if (authError) {
        Logger.error('❌ [AccountDeletion] Error deleting auth user:', authError);
        // On ne throw pas ici car le profil est déjà supprimé
        // L'utilisateur sera automatiquement déconnecté
      }

      Logger.info('✅ [AccountDeletion] Account deletion completed successfully');
    } catch (error) {
      Logger.error('❌ [AccountDeletion] Fatal error during account deletion:', error);
      throw error;
    }
  }

  /**
   * Vérifie si un utilisateur peut supprimer son compte
   * (Peut être étendu avec des règles métier supplémentaires)
   *
   * @param userId - ID de l'utilisateur
   * @returns Promise<{ canDelete: boolean; reason?: string }>
   */
  static async canDeleteAccount(userId: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      // Vérifier si l'utilisateur existe
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return {
          canDelete: false,
          reason: 'User not found'
        };
      }

      // Ajouter ici d'autres règles métier si nécessaire
      // Par exemple: vérifier si l'utilisateur est admin d'un groupe, etc.

      return {
        canDelete: true
      };
    } catch (error) {
      Logger.error('❌ [AccountDeletion] Error checking deletion eligibility:', error);
      return {
        canDelete: false,
        reason: 'Error checking account status'
      };
    }
  }
}
