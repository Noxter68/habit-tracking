// src/services/onboardingService.ts
import { supabase } from '../lib/supabase';
import Logger from '../utils/logger';

export class OnboardingService {
  /**
   * Check if user has completed onboarding
   */
  static async hasCompletedOnboarding(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('profiles').select('has_completed_onboarding').eq('id', userId).single();

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

  /**
   * Mark onboarding as completed
   */
  static async completeOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').update({ has_completed_onboarding: true }).eq('id', userId);

      if (error) {
        Logger.error('Error completing onboarding:', error);
        return false;
      }

      Logger.info('✅ Onboarding completed for user:', userId);
      return true;
    } catch (error) {
      Logger.error('Exception completing onboarding:', error);
      return false;
    }
  }

  /**
   * Reset onboarding (for testing or user request)
   */
  static async resetOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('profiles').update({ has_completed_onboarding: false }).eq('id', userId);

      if (error) {
        Logger.error('Error resetting onboarding:', error);
        return false;
      }

      Logger.info('🔄 Onboarding reset for user:', userId);
      return true;
    } catch (error) {
      Logger.error('Exception resetting onboarding:', error);
      return false;
    }
  }
}
