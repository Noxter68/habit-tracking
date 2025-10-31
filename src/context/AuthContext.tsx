// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { RevenueCatService } from '@/services/RevenueCatService';
import { PushTokenService } from '@/services/pushTokenService'; // ✅ Add this import
import Logger from '@/utils/logger';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Register device for push notifications when user logs in
  useEffect(() => {
    if (user?.id) {
      // Register device for push notifications
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
  }, [user?.id]); // Trigger when user ID changes (login/logout)

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchUsername(session.user.id);
      } else {
        setUsername(null);
      }
      setLoading(false);
    });

    // ✅ UN SEUL listener onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      Logger.debug('🔄 Auth state changed:', _event);

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        fetchUsername(session.user.id);
      } else {
        setUsername(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUsername = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('username').eq('id', userId).maybeSingle();

      if (error) {
        Logger.error('Error fetching username:', error);
        setUsername(null);
        return;
      }

      setUsername(data?.username || null);
    } catch (error) {
      Logger.error('Fetch username error:', error);
      setUsername(null);
    }
  };

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
          }
        }
      }
    } catch (error: any) {
      Logger.error('Google Sign-In Error:', error);
      Alert.alert('Sign-In Failed', error.message || 'Unable to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

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
            const fullName = credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : null;

            const username = fullName || data.user.email?.split('@')[0] || `User${data.user.id.slice(0, 8)}`;

            // ✅ Prépare les données du profil
            const profileData: any = {
              id: data.user.id,
              username: username,
              updated_at: new Date().toISOString(),
            };

            // ✅ Ajoute l'email seulement s'il existe
            if (data.user.email) {
              profileData.email = data.user.email;
            }

            const { error: profileError } = await supabase.from('profiles').upsert(profileData);

            if (profileError) {
              Logger.error('Profile update error:', profileError);
            } else {
              Logger.debug('✅ Profile created successfully');
            }
          }
        }
      } else {
        // OAuth flow pour Android/Web (garde ton code existant)
        // ...
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Logger.error('Apple Sign-In Error:', error);
        Alert.alert('Sign-In Failed', 'Unable to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setLoading(true);

      if (username) {
        const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', username).single();

        if (existingUser) {
          throw new Error('Username already taken');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      if (data.user && username) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          created_at: new Date().toISOString(),
        });

        if (profileError) throw profileError;
      }

      Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      Logger.debug('🚪 Starting sign out...');

      // Unregister push notifications
      if (user?.id) {
        await PushTokenService.unregisterDevice(user.id).catch((error) => {
          Logger.error('Error unregistering device:', error);
        });
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      Logger.debug('✅ Sign out successful');
    } catch (error: any) {
      Logger.error('❌ SignOut error:', error);
      Alert.alert('Error', error.message);
    } finally {
      // ✅ TOUJOURS reset loading
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

      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
    } catch (error: any) {
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
