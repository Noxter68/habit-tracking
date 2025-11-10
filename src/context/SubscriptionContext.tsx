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
  subscription: SubscriptionData | null;
  loading: boolean;
  isPremium: boolean;
  canCreateHabit: boolean;
  habitCount: number;
  maxHabits: number;
  streakSavers: number;
  totalStreakSaversUsed: number;
  refreshSubscription: () => Promise<void>;
  checkHabitLimit: () => Promise<boolean>;
  useStreakSaver: (habitId: string, date: string) => Promise<{ success: boolean; error?: string; remaining?: number }>;
  canSaveStreak: (habitId: string, date: string) => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'free',
    status: 'inactive',
    startDate: null,
    endDate: null,
    platform: null,
    transactionId: null,
  });

  const [loading, setLoading] = useState(false);
  const [habitCount, setHabitCount] = useState(0);
  const [streakSavers, setStreakSavers] = useState(0);
  const [totalStreakSaversUsed, setTotalStreakSaversUsed] = useState(0);

  // Computed values
  const isPremium = subscription.tier === 'premium' && subscription.status === 'active';
  const maxHabits = isPremium ? Infinity : 2;
  const canCreateHabit = isPremium || habitCount < 2;

  // ==========================================================================
  // Load Subscription (non-blocking)
  // ==========================================================================

  const loadSubscription = async () => {
    if (!user) {
      setSubscription({
        tier: 'free',
        status: 'inactive',
        startDate: null,
        endDate: null,
        platform: null,
        transactionId: null,
      });
      return;
    }

    try {
      // Load everything in parallel
      const [revenueCatStatus, profileResult, habitCountResult] = await Promise.allSettled([
        RevenueCatService.getSubscriptionStatus(),
        supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, platform, transaction_id, streak_savers, total_streak_savers_used')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      // Extract RevenueCat status
      const hasPremium = revenueCatStatus.status === 'fulfilled' && revenueCatStatus.value.isSubscribed;

      // Sync premium status to database (fire and forget)
      if (hasPremium && revenueCatStatus.status === 'fulfilled') {
        supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_end_date: revenueCatStatus.value.expirationDate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .then(() => Logger.debug('✅ [Subscription] Premium status synced'))
          .catch((error) => Logger.error('❌ [Subscription] Failed to sync:', error));
      }

      // Update subscription state
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        const profile = profileResult.value.data;
        setSubscription({
          tier: (profile.subscription_tier as SubscriptionTier) || 'free',
          status: (profile.subscription_status as SubscriptionStatus) || 'inactive',
          startDate: profile.subscription_start_date || null,
          endDate: profile.subscription_end_date || null,
          platform: profile.platform as 'ios' | 'android' | null,
          transactionId: profile.transaction_id || null,
        });

        setStreakSavers(profile.streak_savers || 0);
        setTotalStreakSaversUsed(profile.total_streak_savers_used || 0);
      }

      // Update habit count
      if (habitCountResult.status === 'fulfilled') {
        setHabitCount(habitCountResult.value.count || 0);
      }
    } catch (error) {
      Logger.error('❌ [Subscription] Error loading subscription:', error);
    }
  };

  // ==========================================================================
  // Initialize RevenueCat + Load Subscription
  // ==========================================================================

  useEffect(() => {
    if (!user?.id) {
      // Reset state when user logs out
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
      setHabitCount(0);
      return;
    }

    const initUserSubscription = async () => {
      try {
        // Initialize RevenueCat with user ID if not already initialized
        if (!RevenueCatService.isInitialized()) {
          Logger.debug('🚀 [Subscription] Initializing RevenueCat with user:', user.id);
          await RevenueCatService.initialize(user.id);
        } else {
          // If already initialized, just set the user ID
          Logger.debug('🔄 [Subscription] Setting user ID:', user.id);
          await RevenueCatService.setAppUserId(user.id);
        }

        // Load subscription data
        loadSubscription();
      } catch (error) {
        Logger.error('❌ [Subscription] Failed to initialize:', error);
      }
    };

    initUserSubscription();

    // Cleanup: logout RevenueCat when user session ends
    return () => {
      if (user?.id && RevenueCatService.isInitialized()) {
        Logger.debug('🚪 [Subscription] User session ending, logging out RevenueCat');
        RevenueCatService.clearAppUserId().catch(() => {});
      }
    };
  }, [user?.id]);

  // ==========================================================================
  // Realtime Subscription Updates
  // ==========================================================================

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
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
          Logger.debug('🔔 [Subscription] Profile updated, refreshing...');
          loadSubscription();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  const checkHabitLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { count } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setHabitCount(count || 0);
      return isPremium || (count || 0) < 2;
    } catch (error) {
      Logger.error('❌ [Subscription] Error checking habit limit:', error);
      return false;
    }
  };

  const useStreakSaver = async (habitId: string, date: string): Promise<{ success: boolean; error?: string; remaining?: number }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const { data, error } = await supabase.rpc('use_streak_saver', {
        p_user_id: user.id,
        p_habit_id: habitId,
        p_date: date,
      });

      if (error) throw error;

      if (data.success) {
        setStreakSavers(data.remaining_savers);
        setTotalStreakSaversUsed((prev) => prev + 1);
        return { success: true, remaining: data.remaining_savers };
      }

      return { success: false, error: data.error };
    } catch (error: any) {
      Logger.error('❌ [Subscription] Error using streak saver:', error);
      return { success: false, error: error.message };
    }
  };

  const canSaveStreak = async (habitId: string, date: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('check_streak_saver_eligibility', {
        p_user_id: user.id,
        p_habit_id: habitId,
        p_date: date,
      });

      if (error) throw error;
      return data?.can_use === true;
    } catch (error) {
      Logger.error('❌ [Subscription] Error checking streak saver eligibility:', error);
      return false;
    }
  };

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

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
