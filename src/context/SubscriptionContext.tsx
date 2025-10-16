// src/context/SubscriptionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { RevenueCatService } from '@/services/RevenueCatService';

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
  refreshSubscription: () => Promise<void>;
  checkHabitLimit: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [habitCount, setHabitCount] = useState(0);

  // Load subscription data
  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check RevenueCat first (source of truth)
      const hasPremium = await RevenueCatService.checkAndSyncSubscription(user.id);

      // Then fetch from Supabase (which was just synced)
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, platform, transaction_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setSubscription({
        tier: (profile?.subscription_tier as SubscriptionTier) || 'free',
        status: (profile?.subscription_status as SubscriptionStatus) || 'inactive',
        startDate: profile?.subscription_start_date || null,
        endDate: profile?.subscription_end_date || null,
        platform: profile?.platform as 'ios' | 'android' | null,
        transactionId: profile?.transaction_id || null,
      });

      // Get habit count
      const { count } = await supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

      setHabitCount(count || 0);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({
        tier: 'free',
        status: 'inactive',
        startDate: null,
        endDate: null,
        platform: null,
        transactionId: null,
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if user can create a new habit
  const checkHabitLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('can_create_habit', {
        p_user_id: user.id,
      });

      if (error) throw error;

      return data as boolean;
    } catch (error) {
      console.error('Error checking habit limit:', error);
      // Fallback to local check
      return isPremium || habitCount < 2;
    }
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    if (user) {
      RevenueCatService.initialize(user.id).catch((error) => {
        console.error('Failed to initialize RevenueCat:', error);
      });
    }

    return () => {
      if (user) {
        RevenueCatService.logout();
      }
    };
  }, [user]);

  // Load subscription data when user changes
  useEffect(() => {
    loadSubscription();
  }, [user]);

  // Listen for subscription changes
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

  const isPremium = subscription?.tier === 'premium' && subscription?.status === 'active';
  const maxHabits = isPremium ? Infinity : 2;
  const canCreateHabit = isPremium || habitCount < 2;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        isPremium,
        canCreateHabit,
        habitCount,
        maxHabits,
        refreshSubscription,
        checkHabitLimit,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
