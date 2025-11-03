// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { RevenueCatService } from '@/services/RevenueCatService';
import { PushTokenService } from '@/services/pushTokenService';
import Logger from '@/utils/logger';
import { OnboardingService } from '@/services/onboardingService';

WebBrowser.maybeCompleteAuthSession();

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
  // FETCH USERNAME & ONBOARDING STATUS
  // ============================================================================
  const fetchUserProfile = async (userId: string, retries = 3) => {
    try {
      const { data, error } = await supabase.from('profiles').select('username, has_completed_onboarding').eq('id', userId).maybeSingle();

      if (error) {
        Logger.error('Error fetching profile:', error);
        setUsername(null);
        setHasCompletedOnboarding(false);
        return;
      }

      if (!data) {
        Logger.warn('⚠️ No profile found for user:', userId);

        // ✅ Retry si pas de profil et qu'il reste des tentatives
        if (retries > 0) {
          Logger.debug(`🔄 Retrying fetchUserProfile in 500ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          return fetchUserProfile(userId, retries - 1);
        }

        setUsername(null);
        setHasCompletedOnboarding(false);
        return;
      }

      setUsername(data.username || null);
      setHasCompletedOnboarding(data.has_completed_onboarding === true);

      Logger.debug('✅ Profile loaded:', {
        username: data.username,
        onboardingCompleted: data.has_completed_onboarding,
      });
    } catch (error) {
      Logger.error('Fetch profile error:', error);
      setUsername(null);
      setHasCompletedOnboarding(false);
    }
  };

  // ============================================================================
  // ONBOARDING FUNCTIONS
  // ============================================================================

  const checkOnboardingStatus = async () => {
    if (!user) {
      setHasCompletedOnboarding(false);
      return;
    }

    try {
      const completed = await OnboardingService.hasCompletedOnboarding(user.id);
      setHasCompletedOnboarding(completed);
      Logger.info('Onboarding status checked:', completed);
    } catch (error) {
      Logger.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      Logger.warn('Cannot complete onboarding: no user');
      return;
    }

    try {
      const success = await OnboardingService.completeOnboarding(user.id);
      if (success) {
        // ✅ Update direct du state - pas besoin de refetch
        setHasCompletedOnboarding(true);
        Logger.info('✅ Onboarding completed successfully');
      } else {
        Logger.error('Failed to complete onboarding');
      }
    } catch (error) {
      Logger.error('Error completing onboarding:', error);
    }
  };

  // ============================================================================
  // PUSH NOTIFICATIONS REGISTRATION
  // ============================================================================

  useEffect(() => {
    if (user?.id) {
      PushTokenService.registerDevice(user.id)
        .then((success) => {
          if (success) {
            Logger.debug('✅ Device registered for push notifications');
          } else {
            Logger.debug('⚠️ Push notification registration failed (permissions may be denied)');
          }
        })
        .catch((error) => {
          Logger.error('❌ Error registering device for push:', error);
        });
    }
  }, [user?.id]);

  // ============================================================================
  // AUTH STATE INITIALIZATION & LISTENER
  // ============================================================================

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // ✅ Async function pour pouvoir await
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchUserProfile(session.user.id); // ✅ Attend que le profil soit chargé
      } else {
        setUsername(null);
        setHasCompletedOnboarding(false);
      }

      setLoading(false); // ✅ Maintenant on est sûr que tout est chargé
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // ✅ Async callback
      Logger.debug('🔄 Auth state changed:', _event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await fetchUserProfile(session.user.id); // ✅ Attend ici aussi
      } else {
        setUsername(null);
        setHasCompletedOnboarding(false);
      }
    });

    return () => {
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
          data: {
            username: username || email.split('@')[0],
          },
        },
      });

      if (error) throw error;

      Logger.debug('✅ User created, profile will be created by trigger');

      Alert.alert('Success', 'Account created! Please check your email to verify your account.');
    } catch (error: any) {
      Logger.error('❌ SignUp error:', error);
      Alert.alert('Error', error.message);
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

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Logger.debug('✅ Sign in successful');
    } catch (error: any) {
      Logger.error('❌ SignIn error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // GOOGLE SIGN IN
  // ============================================================================

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'nuvoria',
        path: 'auth',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success' && result.url) {
          const params = new URLSearchParams(result.url.split('#')[1]);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            Logger.debug('✅ Google sign in successful');
          }
        }
      }
    } catch (error: any) {
      Logger.error('❌ Google Sign-In Error:', error);
      Alert.alert('Sign-In Failed', error.message || 'Unable to sign in with Google');
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

      if (Platform.OS === 'ios') {
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
            // ✅ Check if profile already exists
            const { data: existingProfile } = await supabase.from('profiles').select('id, username').eq('id', data.user.id).maybeSingle();

            if (!existingProfile) {
              // First time sign in - create profile
              const fullName = credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : null;

              const username = fullName || data.user.email?.split('@')[0] || `User${data.user.id.slice(0, 8)}`;

              const profileData: any = {
                id: data.user.id,
                username: username,
                updated_at: new Date().toISOString(),
              };

              if (data.user.email) {
                profileData.email = data.user.email;
              }

              const { error: profileError } = await supabase.from('profiles').insert(profileData); // ✅ INSERT au lieu d'UPSERT

              if (profileError) {
                Logger.error('Profile creation error:', profileError);
              } else {
                Logger.debug('✅ Apple sign in - Profile created successfully');
              }
            } else {
              // Profile exists - don't touch username, just update timestamp
              await supabase.from('profiles').update({ updated_at: new Date().toISOString() }).eq('id', data.user.id);

              Logger.debug('✅ Apple sign in - Existing profile found, username preserved');
            }
          }
        }
      } else {
        // OAuth flow for Android/Web
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'nuvoria',
          path: 'auth',
        });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo: redirectUri,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

          if (result.type === 'success' && result.url) {
            const params = new URLSearchParams(result.url.split('#')[1]);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });

              Logger.debug('✅ Apple sign in successful (OAuth)');
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Logger.error('❌ Apple Sign-In Error:', error);
        Alert.alert('Sign-In Failed', 'Unable to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // SIGN OUT
  // ============================================================================

  const signOut = async () => {
    try {
      setLoading(true);

      // Unregister push token with timeout
      if (user?.id) {
        await Promise.race([PushTokenService.unregisterDevice(user.id), new Promise((_, reject) => setTimeout(() => reject(new Error('Push token unregister timeout')), 3000))]).catch((error) => {
          Logger.error('⚠️ Push token unregister failed (continuing anyway):', error.message);
        });
      }

      // Reset onboarding state
      setHasCompletedOnboarding(false);

      // Sign out from Supabase
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
