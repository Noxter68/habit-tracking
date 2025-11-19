/**
 * ============================================================================
 * SubscriptionContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des abonnements et fonctionnalites premium.
 *
 * Ce contexte gere l'etat d'abonnement de l'utilisateur, les limites
 * freemium et les fonctionnalites premium comme les streak savers.
 *
 * Fonctionnalites principales:
 * - Synchronisation avec RevenueCat
 * - Gestion des limites d'habitudes (free vs premium)
 * - Fonctionnalite streak saver
 * - Mise a jour temps reel via Supabase
 *
 * @module SubscriptionContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { supabase } from '@/lib/supabase';
import { RevenueCatService } from '@/services/RevenueCatService';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Niveau d'abonnement
 */
export type SubscriptionTier = 'free' | 'premium';

/**
 * Statut de l'abonnement
 */
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired' | 'trialing';

/**
 * Donnees d'abonnement
 */
interface SubscriptionData {
  /** Niveau d'abonnement */
  tier: SubscriptionTier;
  /** Statut actuel */
  status: SubscriptionStatus;
  /** Date de debut */
  startDate: string | null;
  /** Date de fin */
  endDate: string | null;
  /** Plateforme d'achat */
  platform: 'ios' | 'android' | null;
  /** ID de transaction */
  transactionId: string | null;
}

/**
 * Type du contexte d'abonnement
 */
interface SubscriptionContextType {
  /** Donnees d'abonnement */
  subscription: SubscriptionData | null;
  /** Indicateur de chargement */
  loading: boolean;
  /** Est premium actif */
  isPremium: boolean;
  /** Peut creer une habitude */
  canCreateHabit: boolean;
  /** Nombre d'habitudes actuelles */
  habitCount: number;
  /** Nombre maximum d'habitudes */
  maxHabits: number;
  /** Streak savers disponibles */
  streakSavers: number;
  /** Total des streak savers utilises */
  totalStreakSaversUsed: number;
  /** Rafraichit l'abonnement */
  refreshSubscription: () => Promise<void>;
  /** Verifie la limite d'habitudes */
  checkHabitLimit: () => Promise<boolean>;
  /** Utilise un streak saver */
  useStreakSaver: (habitId: string, date: string) => Promise<{ success: boolean; error?: string; remaining?: number }>;
  /** Peut sauver un streak */
  canSaveStreak: (habitId: string, date: string) => Promise<boolean>;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte d'abonnement
 *
 * Gere l'etat global des abonnements et fournit les methodes
 * pour interagir avec les fonctionnalites premium.
 *
 * @param children - Composants enfants
 */
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

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

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { user } = useAuth();

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const isPremium = subscription.tier === 'premium' && subscription.status === 'active';
  const maxHabits = isPremium ? Infinity : 2;
  const canCreateHabit = isPremium || habitCount < 2;

  // ==========================================================================
  // FONCTIONS INTERNES
  // ==========================================================================

  /**
   * Charge les donnees d'abonnement (non-bloquant)
   */
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
      // Charge tout en parallele
      const [revenueCatStatus, profileResult, habitCountResult] = await Promise.allSettled([
        RevenueCatService.getSubscriptionStatus(),
        supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, subscription_start_date, subscription_end_date, platform, transaction_id, streak_savers, total_streak_savers_used')
          .eq('id', user.id)
          .maybeSingle(),
        supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      // Extrait le statut RevenueCat
      const hasPremium = revenueCatStatus.status === 'fulfilled' && revenueCatStatus.value.isSubscribed;

      // Synchronise le statut premium avec la base (fire and forget)
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
          .then(() => Logger.debug('[Subscription] Premium status synced'))
          .catch((error) => Logger.error('[Subscription] Failed to sync:', error));
      }

      // Met a jour l'etat de l'abonnement
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

      // Met a jour le compteur d'habitudes
      if (habitCountResult.status === 'fulfilled') {
        setHabitCount(habitCountResult.value.count || 0);
      }
    } catch (error) {
      Logger.error('[Subscription] Error loading subscription:', error);
    }
  };

  // ==========================================================================
  // EFFECTS - Initialisation RevenueCat
  // ==========================================================================

  /**
   * Initialise RevenueCat et charge l'abonnement
   */
  useEffect(() => {
    if (!user?.id) {
      // Reset l'etat quand l'utilisateur se deconnecte
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
        // Initialise RevenueCat avec l'ID utilisateur
        if (!RevenueCatService.isInitialized()) {
          Logger.debug('[Subscription] Initializing RevenueCat with user:', user.id);
          await RevenueCatService.initialize(user.id);
        } else {
          Logger.debug('[Subscription] Setting user ID:', user.id);
          await RevenueCatService.setAppUserId(user.id);
        }

        // Charge les donnees d'abonnement
        loadSubscription();
      } catch (error) {
        Logger.error('[Subscription] Failed to initialize:', error);
      }
    };

    initUserSubscription();

    // Cleanup: logout RevenueCat quand la session se termine
    return () => {
      if (user?.id && RevenueCatService.isInitialized()) {
        Logger.debug('[Subscription] User session ending, logging out RevenueCat');
        RevenueCatService.clearAppUserId().catch(() => {});
      }
    };
  }, [user?.id]);

  // ==========================================================================
  // EFFECTS - Mises a jour temps reel
  // ==========================================================================

  /**
   * Souscrit aux mises a jour du profil
   */
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
          Logger.debug('[Subscription] Profile updated, refreshing...');
          loadSubscription();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // ==========================================================================
  // CALLBACKS - Methodes publiques
  // ==========================================================================

  /**
   * Rafraichit l'abonnement
   */
  const refreshSubscription = async () => {
    await loadSubscription();
  };

  /**
   * Verifie si l'utilisateur peut creer une nouvelle habitude
   *
   * @returns true si la creation est autorisee
   */
  const checkHabitLimit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { count } = await supabase
        .from('habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setHabitCount(count || 0);
      return isPremium || (count || 0) < 2;
    } catch (error) {
      Logger.error('[Subscription] Error checking habit limit:', error);
      return false;
    }
  };

  /**
   * Utilise un streak saver pour proteger un streak
   *
   * @param habitId - ID de l'habitude
   * @param date - Date a proteger
   * @returns Resultat de l'operation
   */
  const useStreakSaver = async (
    habitId: string,
    date: string
  ): Promise<{ success: boolean; error?: string; remaining?: number }> => {
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
      Logger.error('[Subscription] Error using streak saver:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Verifie si un streak peut etre sauve
   *
   * @param habitId - ID de l'habitude
   * @param date - Date a verifier
   * @returns true si le streak peut etre sauve
   */
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
      Logger.error('[Subscription] Error checking streak saver eligibility:', error);
      return false;
    }
  };

  // ==========================================================================
  // RENDER
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
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte d'abonnement
 *
 * @throws Error si utilise en dehors du SubscriptionProvider
 * @returns Contexte d'abonnement
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};
