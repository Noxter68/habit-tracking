// src/context/AuthContext.tsx - Fix session expirée
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { RevenueCatService } from '@/services/RevenueCatService';
import { PushTokenService } from '@/services/pushTokenService';
import Logger from '@/utils/logger';
import { OnboardingService } from '@/services/onboardingService';
import { LanguageDetectionService } from '@/services/languageDetectionService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  username: string | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // ============================================================================
  // FETCH PROFILE - Optimisé avec timeout
  // ============================================================================

  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      Logger.debug('🔄 [Auth] Fetching profile for:', userId);

      const profilePromise = supabase.from('profiles').select('username, has_completed_onboarding').eq('id', userId).maybeSingle();

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 2000));

      const { data, error } = (await Promise.race([profilePromise, timeoutPromise])) as any;

      if (error) {
        Logger.error('❌ [Auth] Error fetching profile:', error);
        return;
      }

      if (!data) {
        Logger.warn('⚠️ [Auth] No profile found for user:', userId);
        return;
      }

      setUsername(data.username || null);
      setHasCompletedOnboarding(data.has_completed_onboarding === true);

      await LanguageDetectionService.loadUserLanguage(userId);

      Logger.debug('✅ [Auth] Profile loaded:', {
        username: data.username,
        onboardingCompleted: data.has_completed_onboarding,
      });
    } catch (error: any) {
      Logger.error('❌ [Auth] Fetch profile error:', error.message);
      setUsername(null);
      setHasCompletedOnboarding(false);
    }
  };

  // ============================================================================
  // 🔧 FIX : Gestion session expirée avec refresh forcé
  // ============================================================================

  const refreshSessionSafe = async (): Promise<Session | null> => {
    try {
      Logger.debug('🔄 [Auth] Attempting session refresh...');

      const refreshPromise = supabase.auth.refreshSession();
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Refresh timeout')), 3000));

      const { data, error } = await Promise.race([refreshPromise, timeoutPromise]);

      if (error) {
        Logger.error('❌ [Auth] Session refresh failed:', error);
        // Si le refresh échoue, on force le sign out
        await supabase.auth.signOut();
        return null;
      }

      Logger.debug('✅ [Auth] Session refreshed successfully');
      return data.session;
    } catch (error) {
      Logger.error('❌ [Auth] Session refresh timeout or error:', error);
      // Timeout ou erreur : on force le sign out propre
      await supabase.auth.signOut();
      return null;
    }
  };

  const getSessionSafe = async (): Promise<Session | null> => {
    try {
      Logger.debug('🔄 [Auth] Getting session...');

      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Session timeout')), 3000));

      const { data, error } = await Promise.race([sessionPromise, timeoutPromise]);

      if (error) {
        Logger.error('❌ [Auth] Get session error:', error);
        return null;
      }

      const session = data.session;

      if (!session) {
        Logger.debug('ℹ️ [Auth] No active session');
        return null;
      }

      // 🔧 Vérifier si la session est expirée ou sur le point d'expirer
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        Logger.debug(`⏱️ [Auth] Session expires in ${timeUntilExpiry}s`);

        // Si expire dans moins de 5 minutes (300s), on refresh
        if (timeUntilExpiry < 300) {
          Logger.warn('⚠️ [Auth] Session about to expire, refreshing...');
          return await refreshSessionSafe();
        }
      }

      Logger.debug('✅ [Auth] Session valid');
      return session;
    } catch (error) {
      Logger.error('❌ [Auth] Get session timeout or error:', error);
      // En cas de timeout, on considère qu'il n'y a pas de session
      return null;
    }
  };

  // ============================================================================
  // ONBOARDING
  // ============================================================================

  const checkOnboardingStatus = async () => {
    if (!user) {
      setHasCompletedOnboarding(false);
      return;
    }

    try {
      Logger.debug('🔄 [Auth] Checking onboarding status...');
      const completed = await OnboardingService.hasCompletedOnboarding(user.id);
      setHasCompletedOnboarding(completed);
      Logger.debug(`✅ [Auth] Onboarding status: ${completed}`);
    } catch (error) {
      Logger.error('❌ [Auth] Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      Logger.debug('🔄 [Auth] Completing onboarding...');
      const success = await OnboardingService.completeOnboarding(user.id);
      if (success) {
        setHasCompletedOnboarding(true);
        Logger.info('✅ [Auth] Onboarding completed');
      }
    } catch (error) {
      Logger.error('❌ [Auth] Error completing onboarding:', error);
    }
  };

  // ============================================================================
  // PUSH NOTIFICATIONS - En arrière-plan (non-bloquant)
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      Logger.debug('🔄 [Auth] Registering push token...');
      PushTokenService.registerDevice(user.id).catch((error) => Logger.error('❌ [Auth] Push token registration failed:', error));
    }
  }, [user?.id]);

  // ============================================================================
  // AUTH INITIALIZATION - AVEC FIX SESSION EXPIRÉE
  // ============================================================================

  useEffect(() => {
    let isMounted = true;
    const initStartTime = Date.now();

    const initializeAuth = async () => {
      try {
        Logger.debug('🔄 [Auth] Initializing...');

        // 🔧 Utilise getSessionSafe qui gère le refresh automatique
        const session = await getSessionSafe();

        if (!isMounted) {
          Logger.debug('⚠️ [Auth] Component unmounted, aborting');
          return;
        }

        Logger.debug(`📊 [Auth] Session loaded in ${Date.now() - initStartTime}ms`);

        setSession(session);
        setUser(session?.user ?? null);

        // Si user connecté, charge son profil
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        } else {
          setUsername(null);
          setHasCompletedOnboarding(false);
        }

        const duration = Date.now() - initStartTime;
        Logger.debug(`✅ [Auth] Initialized in ${duration}ms`);
      } catch (error) {
        Logger.error('❌ [Auth] Initialization error:', error);
        if (isMounted) {
          // En cas d'erreur, on nettoie tout
          setSession(null);
          setUser(null);
          setUsername(null);
          setHasCompletedOnboarding(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      Logger.debug('🔄 [Auth] State changed:', _event);

      // 🔧 Si TOKEN_REFRESHED, c'est que Supabase a géré le refresh
      if (_event === 'TOKEN_REFRESHED') {
        Logger.debug('✅ [Auth] Token refreshed automatically');
      }

      // 🔧 Si SIGNED_OUT, on nettoie tout
      if (_event === 'SIGNED_OUT') {
        Logger.debug('🚪 [Auth] User signed out');
        setSession(null);
        setUser(null);
        setUsername(null);
        setHasCompletedOnboarding(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchUserProfile(session.user.id);
      } else {
        setUsername(null);
        setHasCompletedOnboarding(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================================================
  // 🔧 FIX : Refresh session quand l'app revient au premier plan
  // ============================================================================

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && user) {
        Logger.debug('🔄 [Auth] App became active, checking session...');

        // Vérifie et refresh si nécessaire
        const session = await getSessionSafe();

        if (!session) {
          Logger.warn('⚠️ [Auth] Session lost, signing out...');
          setSession(null);
          setUser(null);
          setUsername(null);
          setHasCompletedOnboarding(false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);

  // ============================================================================
  // SIGN UP
  // ============================================================================

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Signing up...');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split('@')[0] },
        },
      });

      if (error) throw error;

      if (data.user) {
        // 2. Créer le profil (fait automatiquement par le trigger DB)
        // Attendre un peu pour que le trigger se termine
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 3. 🌍 INITIALISER LA LANGUE AUTOMATIQUEMENT
        await LanguageDetectionService.initializeUserLanguage(data.user.id);
        Logger.info('✅ User signed up with auto-detected language');

        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('✅ [Auth] Sign up successful');
      }
    } catch (error: any) {
      Logger.error('❌ [Auth] Sign up error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // SIGN IN
  // ============================================================================

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Signing in...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('✅ [Auth] Sign in successful');
      }
    } catch (error: any) {
      Logger.error('❌ [Auth] Sign in error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // APPLE SIGN IN
  // ============================================================================

  const signInWithApple = async () => {
    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Apple Sign In...');

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;

        if (data.user) {
          RevenueCatService.setAppUserId(data.user.id).catch(() => {});
          Logger.debug('✅ [Auth] Apple sign in successful');
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        Logger.debug('ℹ️ [Auth] Apple sign in cancelled');
      } else {
        Logger.error('❌ [Auth] Apple sign in error:', error);
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // GOOGLE SIGN IN (placeholder)
  // ============================================================================

  const signInWithGoogle = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  const signOut = async () => {
    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Signing out...');

      if (user?.id) {
        await Promise.race([PushTokenService.unregisterDevice(user.id), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))]).catch(() => {
          Logger.warn('⚠️ [Auth] Push token unregister timeout');
        });
      }

      setHasCompletedOnboarding(false);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.debug('✅ [Auth] Sign out successful');
    } catch (error: any) {
      Logger.error('❌ [Auth] Sign out error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      Logger.debug('🔄 [Auth] Resetting password...');

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nuvoria://reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
      Logger.debug('✅ [Auth] Password reset email sent');
    } catch (error: any) {
      Logger.error('❌ [Auth] Reset password error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // PROVIDER
  // ============================================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        username,
        session,
        loading,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
