/**
 * Service de gestion des tokens push
 *
 * Ce service gere l'enregistrement et la desinscription des appareils
 * pour les notifications push. Il stocke les tokens Expo dans la base
 * de donnees pour permettre au backend d'envoyer des notifications.
 *
 * @module PushTokenService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import { supabase } from '../lib/supabase';
import Logger from '@/utils/logger';

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des tokens push
 *
 * Gere l'enregistrement des appareils pour les notifications push
 */
export class PushTokenService {
  // ===========================================================================
  // SECTION: Enregistrement des appareils
  // ===========================================================================

  /**
   * Enregistrer l'appareil pour les notifications push et stocker le token
   * A appeler apres la connexion de l'utilisateur
   * NE DEMANDE PAS les permissions - enregistre seulement si deja accordees
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si l'enregistrement a reussi
   */
  static async registerDevice(userId: string): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        Logger.debug('Push notification permissions not granted yet');
        return false;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        Logger.error('Project ID not found in app.json');
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const token = tokenData.data;
      const platform = Platform.OS;

      Logger.debug('Device token:', token);

      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,token',
        }
      );

      if (error) {
        Logger.error('Error storing push token:', error);
        return false;
      }

      Logger.debug('Device registered for push notifications');
      return true;
    } catch (error) {
      Logger.error('Error registering device:', error);
      return false;
    }
  }

  /**
   * Supprimer le token de l'appareil (a appeler lors de la deconnexion)
   *
   * @param userId - L'identifiant de l'utilisateur
   */
  static async unregisterDevice(userId: string): Promise<void> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', tokenData.data);

      Logger.debug('Device unregistered');
    } catch (error) {
      Logger.error('Error unregistering device:', error);
    }
  }

  /**
   * Verifier si l'appareil est enregistre
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si l'appareil est enregistre
   */
  static async isDeviceRegistered(userId: string): Promise<boolean> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) return false;

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      const { data, error } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('user_id', userId)
        .eq('token', tokenData.data)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }
}
