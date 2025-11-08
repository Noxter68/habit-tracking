// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { RevenueCatService } from '@/services/RevenueCatService';
import { PushTokenService } from '@/services/pushTokenService';
import Logger from '@/utils/logger';
import { OnboardingService } from '@/services/onboardingService';

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
  // FETCH PROFILE - Rapide et critique
  // ============================================================================

  const fetchUserProfile = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await supabase.from('profiles').select('username, has_completed_onboarding').eq('id', userId).maybeSingle();

      if (error) {
        Logger.error('Error fetching profile:', error);
        return;
      }

      if (!data) {
        Logger.warn('⚠️ No profile found for user:', userId);
        return;
      }

      setUsername(data.username || null);
      setHasCompletedOnboarding(data.has_completed_onboarding === true);

      Logger.debug('✅ Profile loaded:', {
        username: data.username,
        onboardingCompleted: data.has_completed_onboarding,
      });
    } catch (error: any) {
      Logger.error('Fetch profile error:', error.message);
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
      Logger.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      const success = await OnboardingService.completeOnboarding(user.id);
      if (success) {
        setHasCompletedOnboarding(true);
        Logger.info('✅ Onboarding completed');
      }
    } catch (error) {
      Logger.error('Error completing onboarding:', error);
    }
  };

  // ============================================================================
  // PUSH NOTIFICATIONS - En arrière-plan
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      PushTokenService.registerDevice(user.id).catch((error) => Logger.error('Push token registration failed:', error));
    }
  }, [user?.id]);

  // ============================================================================
  // AUTH INITIALIZATION - OPTIMISÉ POUR RAPIDITÉ
  // ============================================================================

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        Logger.debug('🔄 Initializing auth...');

        // Charge session + profil en SÉRIE (mais rapide)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // Si user connecté, charge son profil (critique pour l'UI)
        if (session?.user?.id) {
          await fetchUserProfile(session.user.id);
        } else {
          setUsername(null);
          setHasCompletedOnboarding(false);
        }

        Logger.debug('✅ Auth initialized');
      } catch (error) {
        Logger.error('❌ Auth initialization error:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setUsername(null);
          setHasCompletedOnboarding(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false); // ✅ Débloque après avoir chargé le profil
        }
      }
    };

    initializeAuth();

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      Logger.debug('🔄 Auth state changed:', _event);

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
  // SIGN UP
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
        RevenueCatService.setAppUserId(data.user.id).catch(() => {});
        Logger.debug('✅ Sign up successful');
      }
    } catch (error: any) {
      Logger.error('❌ Sign up error:', error);
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

  // ============================================================================
  // APPLE SIGN IN
  // ============================================================================

  const signInWithApple = async () => {
    try {
      setLoading(true);

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
          Logger.debug('✅ Apple sign in successful');
        }
      }
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        Logger.debug('Apple sign in cancelled');
      } else {
        Logger.error('❌ Apple sign in error:', error);
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

      if (user?.id) {
        await Promise.race([PushTokenService.unregisterDevice(user.id), new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))]).catch(() => {});
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

  // ============================================================================
  // RESET PASSWORD
  // ============================================================================

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'nuvoria://reset-password',
      });

      if (error) throw error;

      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
      Logger.debug('✅ Password reset email sent');
    } catch (error: any) {
      Logger.error('❌ Reset password error:', error);
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
