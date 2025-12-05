/**
 * ============================================================================
 * AuthContext.tsx
 * ============================================================================
 *
 * Contexte d'authentification de l'application.
 *
 * Ce contexte gere l'etat d'authentification de l'utilisateur, les sessions
 * Supabase, et fournit les methodes de connexion/deconnexion.
 *
 * Fonctionnalites principales:
 * - Gestion des sessions Supabase avec refresh automatique
 * - Connexion par email/mot de passe
 * - Connexion Apple Sign In
 * - Mise a jour du timezone utilisateur
 * - Gestion de l'onboarding
 * - Integration RevenueCat et Push Notifications
 *
 * @module AuthContext
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
  useRef,
} from 'react';

// ============================================================================
// IMPORTS - Bibliotheques externes
// ============================================================================
import { Session, User } from '@supabase/supabase-js';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { supabase, isNetworkError, isAuthError } from '../lib/supabase';
import { RevenueCatService } from '@/services/RevenueCatService';
import { PushTokenService } from '@/services/pushTokenService';
import { OnboardingService } from '@/services/onboardingService';
import { LanguageDetectionService } from '@/services/languageDetectionService';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import Logger from '@/utils/logger';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Type du contexte d'authentification
 */
interface AuthContextType {
  /** Utilisateur connecte */
  user: User | null;
  /** Session Supabase active */
  session: Session | null;
  /** Nom d'utilisateur */
  username: string | null;
  /** Indicateur de chargement */
  loading: boolean;
  /** true si erreur de connexion reseau/serveur */
  hasConnectionError: boolean;
  /** Inscription par email */
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  /** Connexion par email */
  signIn: (email: string, password: string) => Promise<void>;
  /** Connexion Google (a venir) */
  signInWithGoogle: () => Promise<void>;
  /** Connexion Apple */
  signInWithApple: () => Promise<void>;
  /** Deconnexion */
  signOut: () => Promise<void>;
  /** Reinitialisation du mot de passe */
  resetPassword: (email: string) => Promise<void>;
  /** Onboarding complete */
  hasCompletedOnboarding: boolean;
  /** Marque l'onboarding comme complete */
  completeOnboarding: () => Promise<void>;
  /** Verifie le statut de l'onboarding */
  checkOnboardingStatus: () => Promise<void>;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte d'authentification
 *
 * Gere l'etat global d'authentification et fournit les methodes
 * de connexion/deconnexion.
 *
 * @param children - Composants enfants
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasConnectionError, setHasConnectionError] = useState(false);

  // ==========================================================================
  // REFS - Prevention des race conditions
  // ==========================================================================

  const profileFetchInProgress = useRef(false);
  const sessionRefreshInProgress = useRef(false);
  const lastProfileFetch = useRef<number>(0);
  const initInProgress = useRef(false);

  // ==========================================================================
  // FONCTIONS INTERNES - Timezone
  // ==========================================================================

  /**
   * Met a jour le timezone de l'utilisateur dans la base de donnees
   *
   * @param userId - ID de l'utilisateur
   */
  const updateUserTimezone = async (userId: string): Promise<void> => {
    try {
      const timezoneOffset = -new Date().getTimezoneOffset() / 60;

      Logger.debug(`[Auth] Updating timezone: UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`);

      const { error } = await supabase
        .from('profiles')
        .update({
          timezone_offset: Math.round(timezoneOffset),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        Logger.error('[Auth] Timezone update error:', error);
        return;
      }

      Logger.debug('[Auth] Timezone updated successfully');
    } catch (error: any) {
      Logger.error('[Auth] Timezone update failed:', error);
    }
  };

  // ==========================================================================
  // FONCTIONS INTERNES - Profile
  // ==========================================================================

  /**
   * Recupere le profil utilisateur depuis la base de donnees
   * Optimise pour eviter les double-fetch
   *
   * @param userId - ID de l'utilisateur
   */
  const fetchUserProfile = async (userId: string): Promise<void> => {
    const now = Date.now();

    // Evite les double-fetch rapproches
    if (profileFetchInProgress.current || now - lastProfileFetch.current < 2000) {
      Logger.debug('[Auth] Skipping profile fetch (debounced)');
      return;
    }

    profileFetchInProgress.current = true;
    lastProfileFetch.current = now;

    try {
      Logger.debug('[Auth] Fetching profile...');

      const { data, error } = await supabase
        .from('profiles')
        .select('username, has_completed_onboarding')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        Logger.error('[Auth] Profile fetch error:', error);
        return;
      }

      if (!data) {
        Logger.warn('[Auth] No profile found');
        return;
      }

      setUsername(data.username || null);
      setHasCompletedOnboarding(data.has_completed_onboarding === true);

      // Met a jour le timezone en arriere-plan
      updateUserTimezone(userId).catch(() => {});

      // Charge la langue en arriere-plan
      LanguageDetectionService.loadUserLanguage(userId).catch(() => {});

      Logger.debug('[Auth] Profile loaded');
    } catch (error: any) {
      Logger.error('[Auth] Fetch profile error:', error.message);
    } finally {
      profileFetchInProgress.current = false;
    }
  };

  // ==========================================================================
  // FONCTIONS INTERNES - Session
  // ==========================================================================

  /**
   * Recupere et valide la session courante
   * Rafraichit automatiquement si proche de l'expiration
   * IMPORTANT: Ne deconnecte pas l'utilisateur en cas d'erreur reseau
   *
   * @returns Session valide, session actuelle (si erreur reseau), ou null
   */
  const getValidSession = async (): Promise<Session | null> => {
    if (sessionRefreshInProgress.current) {
      Logger.debug('[Auth] Session refresh already in progress');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return session;
    }

    try {
      sessionRefreshInProgress.current = true;
      Logger.debug('[Auth] Checking session...');

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        // Si erreur reseau, on garde la session actuelle et on signale l'erreur
        if (isNetworkError(error)) {
          Logger.warn('[Auth] Network error during session check, keeping current session');
          setHasConnectionError(true);
          return session; // Retourne la session actuelle, pas null
        }
        Logger.error('[Auth] Session error:', error);
        setHasConnectionError(false);
        return null;
      }

      // Connexion OK, on efface l'erreur
      setHasConnectionError(false);

      if (!currentSession) {
        Logger.debug('[Auth] No session');
        return null;
      }

      // Verifie l'expiration
      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        Logger.debug(`[Auth] Session expires in ${timeUntilExpiry}s`);

        // Si expire dans < 60s, refresh
        if (timeUntilExpiry < 60) {
          Logger.debug('[Auth] Refreshing session...');

          const {
            data: { session: newSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError) {
            // Si erreur reseau pendant le refresh, on garde la session actuelle
            if (isNetworkError(refreshError)) {
              Logger.warn('[Auth] Network error during refresh, keeping current session');
              setHasConnectionError(true);
              return currentSession;
            }
            // Si erreur d'auth (token invalide), on deconnecte
            if (isAuthError(refreshError)) {
              Logger.error('[Auth] Auth error during refresh, signing out');
              await supabase.auth.signOut();
              return null;
            }
            Logger.error('[Auth] Refresh failed:', refreshError);
            return currentSession; // Garde la session en attendant
          }

          if (!newSession) {
            Logger.error('[Auth] Refresh returned no session');
            return currentSession;
          }

          Logger.debug('[Auth] Session refreshed');
          return newSession;
        }
      }

      return currentSession;
    } catch (error: any) {
      // Erreur inattendue - verifier si c'est reseau
      if (isNetworkError(error)) {
        Logger.warn('[Auth] Network error (catch), keeping current session');
        setHasConnectionError(true);
        return session;
      }
      Logger.error('[Auth] Session check failed:', error);
      return null;
    } finally {
      sessionRefreshInProgress.current = false;
    }
  };

  // ==========================================================================
  // CALLBACKS - Onboarding
  // ==========================================================================

  /**
   * Verifie si l'utilisateur a complete l'onboarding
   */
  const checkOnboardingStatus = async () => {
    if (!user) {
      setHasCompletedOnboarding(false);
      return;
    }

    try {
      const completed = await OnboardingService.hasCompletedOnboarding(user.id);
      setHasCompletedOnboarding(completed);
    } catch (error) {
      Logger.error('[Auth] Onboarding check error:', error);
      setHasCompletedOnboarding(false);
    }
  };

  /**
   * Marque l'onboarding comme complete
   */
  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const success = await OnboardingService.completeOnboarding(user.id);
      if (success) {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      Logger.error('[Auth] Complete onboarding error:', error);
    }
  };

  // ==========================================================================
  // EFFECTS - Push Notifications
  // ==========================================================================

  /**
   * Enregistre le device pour les push notifications
   */
  useEffect(() => {
    if (user?.id) {
      PushTokenService.registerDevice(user.id).catch(() => {});
    }
  }, [user?.id]);

  // ==========================================================================
  // EFFECTS - Initialisation
  // ==========================================================================

  /**
   * Initialise l'authentification au montage
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (initInProgress.current) {
        Logger.debug('[Auth] Init already in progress');
        return;
      }

      initInProgress.current = true;

      try {
        Logger.debug('[Auth] Initializing...');

        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        // Si erreur reseau, on garde l'etat actuel et on signale l'erreur
        if (error && isNetworkError(error)) {
          Logger.warn('[Auth] Network error during init, keeping current state');
          setHasConnectionError(true);
          // Ne pas modifier user/session, garder l'etat precedent
        } else if (error) {
          Logger.error('[Auth] Init error:', error);
          setSession(null);
          setUser(null);
          setHasConnectionError(false);
        } else {
          setHasConnectionError(false);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user?.id) {
            await fetchUserProfile(currentSession.user.id);
          }
        }

        Logger.debug('[Auth] Initialized');
      } catch (error: any) {
        Logger.error('[Auth] Init error:', error);
        if (isMounted) {
          // Si erreur reseau, on ne deconnecte pas
          if (isNetworkError(error)) {
            Logger.warn('[Auth] Network error (catch) during init');
            setHasConnectionError(true);
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          initInProgress.current = false;
        }
      }
    };

    initializeAuth();

    // Listener pour les changements d'etat d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      Logger.debug('[Auth] State changed:', event);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        await fetchUserProfile(newSession.user.id);
      }

      if (event === 'SIGNED_OUT') {
        setUsername(null);
        setHasCompletedOnboarding(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================================================
  // EFFECTS - App State
  // ==========================================================================

  /**
   * Verifie la session quand l'app revient au premier plan
   * Ne deconnecte pas l'utilisateur en cas d'erreur reseau
   */
  useEffect(() => {
    let lastCheck = 0;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active' || !user) return;

      const now = Date.now();
      // Verifie max 1 fois par 30s
      if (now - lastCheck < 30000) {
        Logger.debug('[Auth] Skipping session check (too soon)');
        return;
      }

      lastCheck = now;
      Logger.debug('[Auth] App active, checking session...');

      const validSession = await getValidSession();

      // Si validSession est null ET qu'on n'a pas d'erreur de connexion, c'est une vraie deconnexion
      // Si on a une erreur de connexion, getValidSession() a deja retourne la session actuelle
      if (!validSession && !hasConnectionError) {
        Logger.warn('[Auth] Invalid session, signing out...');
        setSession(null);
        setUser(null);
        setUsername(null);
        setHasCompletedOnboarding(false);
      } else if (validSession && validSession !== session) {
        setSession(validSession);
        setUser(validSession.user);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, session, hasConnectionError]);

  // ==========================================================================
  // CALLBACKS - Methodes d'authentification
  // ==========================================================================

  /**
   * Inscription par email/mot de passe
   *
   * @param email - Adresse email
   * @param password - Mot de passe
   * @param username - Nom d'utilisateur optionnel
   */
  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split('@')[0] },
        },
      });

      if (error) throw error;

      if (data.user) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await LanguageDetectionService.initializeUserLanguage(data.user.id);

        updateUserTimezone(data.user.id).catch(() => {});
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});

        Logger.info('Sign up successful');
      }
    } catch (error: any) {
      Logger.error('Sign up error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion par email/mot de passe
   *
   * @param email - Adresse email
   * @param password - Mot de passe
   */
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        updateUserTimezone(data.user.id).catch(() => {});
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('Sign in successful');
      }
    } catch (error: any) {
      Logger.error('Sign in error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec Apple Sign In
   */
  const signInWithApple = async () => {
    try {
      setLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identity token');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      if (data.user) {
        updateUserTimezone(data.user.id).catch(() => {});
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('Apple Sign In successful');
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Logger.error('Apple Sign In error:', error);
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Connexion avec Google (a venir)
   */
  const signInWithGoogle = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  /**
   * Deconnexion
   */
  const signOut = async () => {
    try {
      setLoading(true);

      if (user?.id) {
        PushTokenService.unregisterDevice(user.id).catch(() => {});
      }

      setHasCompletedOnboarding(false);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.debug('Sign out successful');
    } catch (error: any) {
      Logger.error('Sign out error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reinitialisation du mot de passe
   *
   * @param email - Adresse email
   */
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nuvoria://reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset email sent!');
      Logger.debug('Password reset email sent');
    } catch (error: any) {
      Logger.error('Reset password error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        session,
        loading,
        hasConnectionError,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        resetPassword,
        hasCompletedOnboarding,
        completeOnboarding,
        checkOnboardingStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte d'authentification
 *
 * @throws Error si utilise en dehors du AuthProvider
 * @returns Contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
