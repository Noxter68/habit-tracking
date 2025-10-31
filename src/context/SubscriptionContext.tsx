// src/context/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { RevenueCatService } from '@/services/RevenueCatService';
import Logger from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

export type SubscriptionTier = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing';

interface SubscriptionData {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  platform: 'ios' | 'android' | null;
  transactionId: string | null;
}

interface SubscriptionContextType {
  // Subscription data
  subscription: SubscriptionData | null;
  loading: boolean;
  isPremium: boolean;

  // Habit limits
  canCreateHabit: boolean;
  habitCount: number;
  maxHabits: number;

  // Streak savers (premium feature)
  streakSavers: number;
  totalStreakSaversUsed: number;

  // Actions
  refreshSubscription: () => Promise<void>;
  checkHabitLimit: () => Promise<boolean>;
  useStreakSaver: (habitId: string, date: string) => Promise<{ success: boolean; error?: string; remaining?: number }>;
  canSaveStreak: (habitId: string, date: string) => Promise<boolean>;
}

// ============================================================================
// Context
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

/**
 * Subscription Provider
 *
 * Manages user subscription state and premium features:
 * - Syncs subscription status between RevenueCat and Supabase
 * - Tracks habit creation limits (2 for free, unlimited for premium)
 * - Manages streak savers (premium users get 3 per month)
 * - Provides methods for checking and using premium features
 */
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // State
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [habitCount, setHabitCount] = useState(0);
  const [streakSavers, setStreakSavers] = useState(0);
  const [totalStreakSaversUsed, setTotalStreakSaversUsed] = useState(0);

  // ==========================================================================
  // Subscription Loading
  // ==========================================================================

  /**
   * Load subscription data from RevenueCat and Supabase
   *
   * Flow:
   * 1. Check RevenueCat for subscription status (source of truth)
   * 2. If premium, sync to Supabase database
   * 3. Fetch full profile data from Supabase
   * 4. Update local state
   */
  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check RevenueCat (source of truth for subscription status)
      const revenueCatStatus = await RevenueCatService.getSubscriptionStatus();
      const hasPremium = revenueCatStatus.isSubscribed;

      // Sync premium status to database
      if (hasPremium) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_end_date: revenueCatStatus.expirationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          Logger.error('❌ [Subscription] Failed to sync to database:', updateError.message);
        } else {
          Logger.debug('✅ [Subscription] Premium status synced to database');
        }
      }

      // Fetch full profile data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, platform, transaction_id, streak_savers, total_streak_savers_used')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      // Update state
      setSubscription({
        tier: (profile?.subscription_tier as SubscriptionTier) || 'free',
        status: (profile?.subscription_status as SubscriptionStatus) || 'inactive',
        startDate: profile?.subscription_start_date || null,
        endDate: profile?.subscription_end_date || null,
        platform: profile?.platform as 'ios' | 'android' | null,
        transactionId: profile?.transaction_id || null,
      });

      setStreakSavers(profile?.streak_savers || 0);
      setTotalStreakSaversUsed(profile?.total_streak_savers_used || 0);

      // Get habit count for limit checking
      const { count } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setHabitCount(count || 0);
    } catch (error) {
      Logger.error('❌ [Subscription] Error loading subscription:', error);

      // Reset to free tier on error
      setSubscription({
        tier: 'free',
        status: 'inactive',
        startDate: null,
        endDate: null,
        platform: null,
        transactionId: null,
      });
      setStreakSavers(0);
      setTotalStreakSaversUsed(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Public method to refresh subscription data
   * Call this after purchases or when returning to app
   */
  const refreshSubscription = async () => {
    await loadSubscription();
  };

  // ==========================================================================
  // Habit Limits
  // ==========================================================================

  /**
   * Check if user can create a new habit
   * Free: 2 habits max
   * Premium: Unlimited
   *
   * @returns True if user can create another habit
   */
  const checkHabitLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_create_habit', {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      Logger.error('❌ [Subscription] Error checking habit limit');
      // Fallback to local check
      return isPremium || habitCount < 2;
    }
  };

  // ==========================================================================
  // Streak Savers (Premium Feature)
  // ==========================================================================

  /**
   * Use a streak saver to save a missed day
   * Premium users get 3 streak savers per month
   *
   * @param habitId - The habit to save
   * @param date - The date to save (YYYY-MM-DD)
   * @returns Success status and remaining savers
   */
  const useStreakSaver = async (habitId: string, date: string): Promise<{ success: boolean; error?: string; remaining?: number }> => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('use_streak_saver', {
        p_user_id: user.id,
        p_habit_id: habitId,
        p_date: date,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; remaining_savers?: number };

      // Update local state on success
      if (result.success) {
        setStreakSavers(result.remaining_savers || 0);
        setTotalStreakSaversUsed((prev) => prev + 1);
      }

      return {
        success: result.success,
        error: result.error,
        remaining: result.remaining_savers,
      };
    } catch (error: any) {
      Logger.error('❌ [Subscription] Error using streak saver');
      return { success: false, error: error.message };
    }
  };

  /**
   * Check if a specific date can be saved with a streak saver
   *
   * @param habitId - The habit to check
   * @param date - The date to check
   * @returns True if date can be saved
   */
  const canSaveStreak = async (habitId: string, date: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_save_streak', {
        p_user_id: user.id,
        p_habit_id: habitId,
        p_date: date,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      Logger.error('❌ [Subscription] Error checking streak saver eligibility');
      return false;
    }
  };

  // ==========================================================================
  // Effects
  // ==========================================================================

  /**
   * Set user ID in RevenueCat when user logs in
   * Clear user ID when user logs out
   */
  useEffect(() => {
    if (user) {
      RevenueCatService.setAppUserId(user.id).catch((error) => {
        Logger.error('❌ [Subscription] Failed to set RevenueCat user ID');
      });
    }

    return () => {
      if (user) {
        RevenueCatService.clearAppUserId();
      }
    };
  }, [user?.id]);

  /**
   * Load subscription data when user changes
   */
  useEffect(() => {
    if (user) {
      // Small delay to ensure RevenueCat is initialized
      const timer = setTimeout(() => {
        loadSubscription();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  /**
   * Listen for real-time subscription changes in database
   */
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          loadSubscription();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ==========================================================================
  // Computed Values
  // ==========================================================================

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';
  const maxHabits = isPremium ? Infinity : 2;
  const canCreateHabit = isPremium || habitCount < 2;

  // ==========================================================================
  // Provider Value
  // ==========================================================================

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPremium,
        canCreateHabit,
        habitCount,
        maxHabits,
        streakSavers,
        totalStreakSaversUsed,
        refreshSubscription,
        checkHabitLimit,
        useStreakSaver,
        canSaveStreak,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access subscription context
 * Must be used within SubscriptionProvider
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
