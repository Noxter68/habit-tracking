/**
 * Service de gestion des avis App Store
 *
 * Ce service gère la logique pour demander un avis sur l'App Store
 * et attribuer des XP en récompense.
 *
 * @module RatingService
 */

import { Linking, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { XPService } from './xpService';
import Logger from '@/utils/logger';

// =============================================================================
// CONSTANTES
// =============================================================================

const APP_STORE_ID = '6754087018';
const XP_REWARD = 500;

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

export class RatingService {
  /**
   * Ouvre la page App Store de l'application pour laisser un avis
   */
  static async openAppStoreReview(): Promise<boolean> {
    try {
      const url = Platform.select({
        ios: `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`,
        android: `market://details?id=com.davidplanchon.nuvoria`,
        default: `https://apps.apple.com/app/id${APP_STORE_ID}`,
      });

      await Linking.openURL(url);
      return true;
    } catch (error) {
      Logger.error('Error opening App Store:', error);
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur a déjà noté l'application
   */
  static async hasUserRated(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_rated_app')
        .eq('id', userId)
        .single();

      if (error) {
        Logger.error('Error checking rating status:', error);
        return false;
      }

      return data?.has_rated_app ?? false;
    } catch (error) {
      Logger.error('Error in hasUserRated:', error);
      return false;
    }
  }

  /**
   * Marque l'utilisateur comme ayant noté l'application et attribue les XP
   */
  static async claimRatingReward(userId: string): Promise<{
    success: boolean;
    xpAwarded: number;
  }> {
    try {
      // 1. Vérifier si déjà réclamé
      const hasRated = await this.hasUserRated(userId);
      if (hasRated) {
        Logger.debug('User has already claimed rating reward');
        return { success: false, xpAwarded: 0 };
      }

      // 2. Marquer comme noté
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_rated_app: true })
        .eq('id', userId);

      if (updateError) {
        Logger.error('Error updating rating status:', updateError);
        return { success: false, xpAwarded: 0 };
      }

      // 3. Attribuer les XP
      const xpSuccess = await XPService.awardXP(userId, {
        amount: XP_REWARD,
        source_type: 'achievement_unlock',
        description: 'App Store review reward',
      });

      if (!xpSuccess) {
        Logger.error('Failed to award XP for rating');
        // On ne rollback pas le has_rated_app car l'utilisateur a bien noté
      }

      Logger.success('Rating reward claimed successfully');
      return { success: true, xpAwarded: XP_REWARD };
    } catch (error) {
      Logger.error('Error in claimRatingReward:', error);
      return { success: false, xpAwarded: 0 };
    }
  }

  /**
   * Retourne le montant d'XP de récompense
   */
  static getRewardAmount(): number {
    return XP_REWARD;
  }
}
