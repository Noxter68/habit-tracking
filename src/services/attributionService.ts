/**
 * Service d'attribution marketing
 *
 * Gère le tracking des installations via les campagnes influenceurs.
 * Utilise Apple AdServices pour récupérer le token d'attribution,
 * le décode via une Edge Function Supabase, et stocke le résultat
 * en base + RevenueCat.
 *
 * Flow:
 * 1. Au premier lancement après install, on récupère le token AdServices
 * 2. On l'envoie à l'Edge Function qui le décode via l'API Apple
 * 3. On stocke le campaign_token (ex: 'leo') en DB + RevenueCat
 *
 * @module AttributionService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { SUPABASE_URL } from '@env';
import Logger from '@/utils/logger';

// =============================================================================
// CONSTANTS
// =============================================================================

const ATTRIBUTION_PROCESSED_KEY = 'attribution_processed';
const SUPABASE_FUNCTIONS_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';

// =============================================================================
// TYPES
// =============================================================================

interface AttributionResult {
  success: boolean;
  campaignToken: string | null;
  organic: boolean;
  error?: string;
}

// =============================================================================
// SERVICE
// =============================================================================

export class AttributionService {
  /**
   * Process attribution for a new user.
   * Should be called once after signup/first signin.
   * Idempotent — skips if already processed.
   *
   * @param userId - The authenticated user's ID
   */
  static async processAttribution(userId: string): Promise<AttributionResult> {
    try {
      // Only process once per device
      const alreadyProcessed = await AsyncStorage.getItem(ATTRIBUTION_PROCESSED_KEY);
      if (alreadyProcessed) {
        Logger.debug('[Attribution] Already processed, skipping');
        return { success: true, campaignToken: null, organic: true };
      }

      // Only iOS supports AdServices
      if (Platform.OS !== 'ios') {
        Logger.debug('[Attribution] Not iOS, skipping AdServices');
        await AsyncStorage.setItem(ATTRIBUTION_PROCESSED_KEY, 'true');
        return { success: true, campaignToken: null, organic: true };
      }

      // Step 1: Get the AdServices attribution token
      const token = await this.getAdServicesToken();
      if (!token) {
        Logger.debug('[Attribution] No AdServices token available (organic install)');
        await AsyncStorage.setItem(ATTRIBUTION_PROCESSED_KEY, 'true');
        return { success: true, campaignToken: null, organic: true };
      }

      Logger.debug('[Attribution] Got AdServices token, decoding...');

      // Step 2: Decode token via Edge Function
      const result = await this.decodeToken(token, userId);

      // Step 3: If we got a campaign token, send it to RevenueCat
      if (result.campaignToken) {
        await this.setCampaignInRevenueCat(result.campaignToken);
        Logger.info(`[Attribution] User attributed to campaign: ${result.campaignToken}`);
      } else {
        Logger.debug('[Attribution] Organic install (no campaign token)');
      }

      // Mark as processed
      await AsyncStorage.setItem(ATTRIBUTION_PROCESSED_KEY, 'true');

      return result;
    } catch (error: any) {
      Logger.error('[Attribution] Error processing attribution:', error);
      // Don't block the user flow — mark as processed to avoid retrying
      await AsyncStorage.setItem(ATTRIBUTION_PROCESSED_KEY, 'true');
      return { success: false, campaignToken: null, organic: true, error: error.message };
    }
  }

  /**
   * Get the Apple AdServices attribution token.
   * Requires the AdServices framework (native module).
   *
   * Returns null if:
   * - Not on iOS 14.3+
   * - User opted out of tracking
   * - Token not available (organic install without campaign)
   */
  private static async getAdServicesToken(): Promise<string | null> {
    try {
      // Dynamic import to avoid crash if module not installed
      const { getAdServicesAttributionToken } = require('@brigad/react-native-adservices');
      const token = await getAdServicesAttributionToken();
      return token || null;
    } catch (error: any) {
      // Module not installed or AdServices not available
      Logger.debug('[Attribution] AdServices not available:', error.message);
      return null;
    }
  }

  /**
   * Decode the AdServices token via Supabase Edge Function.
   * The Edge Function calls Apple's Attribution API server-to-server.
   */
  private static async decodeToken(token: string, userId: string): Promise<AttributionResult> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        Logger.error('[Attribution] No auth session for Edge Function call');
        return { success: false, campaignToken: null, organic: true, error: 'No session' };
      }

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/decode-attribution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token, user_id: userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error(`[Attribution] Edge Function error: ${response.status} ${errorText}`);
        return { success: false, campaignToken: null, organic: true, error: errorText };
      }

      const data = await response.json();

      return {
        success: data.success ?? false,
        campaignToken: data.campaign_token ?? null,
        organic: data.organic ?? true,
      };
    } catch (error: any) {
      Logger.error('[Attribution] Decode error:', error);
      return { success: false, campaignToken: null, organic: true, error: error.message };
    }
  }

  /**
   * Set the campaign attribute in RevenueCat.
   * This links the user's future purchases to the influencer campaign.
   */
  private static async setCampaignInRevenueCat(campaignToken: string): Promise<void> {
    try {
      await Purchases.setAttributes({
        campaign: campaignToken,
      });
      await Purchases.setCampaign(campaignToken);
      Logger.debug(`[Attribution] RevenueCat campaign set: ${campaignToken}`);
    } catch (error: any) {
      Logger.error('[Attribution] RevenueCat setCampaign error:', error);
    }
  }

  /**
   * Check if attribution has already been processed on this device.
   */
  static async isAttributionProcessed(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ATTRIBUTION_PROCESSED_KEY);
    return value !== null;
  }

  /**
   * Reset attribution state (for testing purposes only).
   */
  static async resetAttribution(): Promise<void> {
    await AsyncStorage.removeItem(ATTRIBUTION_PROCESSED_KEY);
    Logger.debug('[Attribution] Attribution state reset');
  }
}
