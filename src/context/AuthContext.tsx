// src/context/AuthContext.tsx - OPTIMIZED VERSION
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

  // 🔧 Refs pour éviter race conditions
  const profileFetchInProgress = useRef(false);
  const sessionRefreshInProgress = useRef(false);
  const lastProfileFetch = useRef<number>(0);
  const initInProgress = useRef(false);

  // ============================================================================
  // FETCH PROFILE - Ultra optimisé
  // ============================================================================

  const fetchUserProfile = async (userId: string): Promise<void> => {
    const now = Date.now();

    // Évite les double-fetch rapprochés
    if (profileFetchInProgress.current || now - lastProfileFetch.current < 2000) {
      Logger.debug('⏭️ [Auth] Skipping profile fetch (debounced)');
      return;
    }

    profileFetchInProgress.current = true;
    lastProfileFetch.current = now;

    try {
      Logger.debug('🔄 [Auth] Fetching profile...');

      const { data, error } = await supabase.from('profiles').select('username, has_completed_onboarding').eq('id', userId).maybeSingle();

      if (error) {
        Logger.error('❌ [Auth] Profile fetch error:', error);
        return;
      }

      if (!data) {
        Logger.warn('⚠️ [Auth] No profile found');
        return;
      }

      setUsername(data.username || null);
      setHasCompletedOnboarding(data.has_completed_onboarding === true);

      // Langue en arrière-plan
      LanguageDetectionService.loadUserLanguage(userId).catch(() => {});

      Logger.debug('✅ [Auth] Profile loaded');
    } catch (error: any) {
      Logger.error('❌ [Auth] Fetch profile error:', error.message);
    } finally {
      profileFetchInProgress.current = false;
    }
  };

  // ============================================================================
  // SESSION MANAGEMENT - Single source of truth
  // ============================================================================

  const getValidSession = async (): Promise<Session | null> => {
    // 🔧 Un seul refresh à la fois
    if (sessionRefreshInProgress.current) {
      Logger.debug('⏭️ [Auth] Session refresh already in progress');
      await new Promise((resolve) => setTimeout(resolve, 500));
      return session;
    }

    try {
      sessionRefreshInProgress.current = true;
      Logger.debug('🔄 [Auth] Checking session...');

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        Logger.error('❌ [Auth] Session error:', error);
        return null;
      }

      if (!currentSession) {
        Logger.debug('ℹ️ [Auth] No session');
        return null;
      }

      // Vérifie expiration
      const expiresAt = currentSession.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        Logger.debug(`⏱️ [Auth] Session expires in ${timeUntilExpiry}s`);

        // Si expiré ou expire dans < 60s, refresh
        if (timeUntilExpiry < 60) {
          Logger.debug('🔄 [Auth] Refreshing session...');

          const {
            data: { session: newSession },
            error: refreshError,
          } = await supabase.auth.refreshSession();

          if (refreshError || !newSession) {
            Logger.error('❌ [Auth] Refresh failed:', refreshError);
            await supabase.auth.signOut();
            return null;
          }

          Logger.debug('✅ [Auth] Session refreshed');
          return newSession;
        }
      }

      return currentSession;
    } catch (error) {
      Logger.error('❌ [Auth] Session check failed:', error);
      return null;
    } finally {
      sessionRefreshInProgress.current = false;
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
      const completed = await OnboardingService.hasCompletedOnboarding(user.id);
      setHasCompletedOnboarding(completed);
    } catch (error) {
      Logger.error('❌ [Auth] Onboarding check error:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const success = await OnboardingService.completeOnboarding(user.id);
      if (success) {
        setHasCompletedOnboarding(true);
      }
    } catch (error) {
      Logger.error('❌ [Auth] Complete onboarding error:', error);
    }
  };

  // ============================================================================
  // PUSH NOTIFICATIONS
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      PushTokenService.registerDevice(user.id).catch(() => {});
    }
  }, [user?.id]);

  // ============================================================================
  // INITIALIZATION - Ultra simplifié
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (initInProgress.current) {
        Logger.debug('⏭️ [Auth] Init already in progress');
        return;
      }

      initInProgress.current = true;

      try {
        Logger.debug('🔄 [Auth] Initializing...');

        // Simple get session (pas de refresh ici)
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user?.id) {
          await fetchUserProfile(currentSession.user.id);
        }

        Logger.debug('✅ [Auth] Initialized');
      } catch (error) {
        Logger.error('❌ [Auth] Init error:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          initInProgress.current = false;
        }
      }
    };

    initializeAuth();

    // Listener simplifié
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      Logger.debug('🔄 [Auth] State changed:', event);

      // Update immédiat
      setSession(newSession);
      setUser(newSession?.user ?? null);

      // Fetch profile seulement si SIGNED_IN
      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        await fetchUserProfile(newSession.user.id);
      }

      // Clear si SIGNED_OUT
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

  // ============================================================================
  // APP STATE - Smart refresh
  // ============================================================================

  useEffect(() => {
    let lastCheck = 0;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState !== 'active' || !user) return;

      const now = Date.now();
      // Vérifie max 1 fois par 30s
      if (now - lastCheck < 30000) {
        Logger.debug('⏭️ [Auth] Skipping session check (too soon)');
        return;
      }

      lastCheck = now;
      Logger.debug('🔄 [Auth] App active, checking session...');

      const validSession = await getValidSession();

      if (!validSession) {
        Logger.warn('⚠️ [Auth] Invalid session, signing out...');
        setSession(null);
        setUser(null);
        setUsername(null);
        setHasCompletedOnboarding(false);
      } else if (validSession !== session) {
        // Update si changement
        setSession(validSession);
        setUser(validSession.user);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, session]);

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

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
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.info('✅ Sign up successful');
      }
    } catch (error: any) {
      Logger.error('❌ Sign up error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('✅ Sign in successful');
      }
    } catch (error: any) {
      Logger.error('❌ Sign in error:', error);
      Alert.alert('Error', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
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
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('✅ Apple Sign In successful');
      }
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Logger.error('❌ Apple Sign In error:', error);
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  const signOut = async () => {
    try {
      setLoading(true);

      if (user?.id) {
        PushTokenService.unregisterDevice(user.id).catch(() => {});
      }

      setHasCompletedOnboarding(false);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      Logger.debug('✅ Sign out successful');
    } catch (error: any) {
      Logger.error('❌ Sign out error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nuvoria://reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset email sent!');
      Logger.debug('✅ Password reset email sent');
    } catch (error: any) {
      Logger.error('❌ Reset password error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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
