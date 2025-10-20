import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { RevenueCatService } from '@/services/RevenueCatService';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'yourapp',
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
      console.error('Google Sign-In Error:', error);
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

          // Update user profile with Apple data
          if (data.user && credential.fullName) {
            const fullName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();

            const { error: profileError } = await supabase.from('profiles').upsert({
              id: data.user.id,
              username: fullName || credential.email?.split('@')[0] || 'User',
              updated_at: new Date().toISOString(),
            });

            if (profileError) console.error('Profile update error:', profileError);
          }
        }
      } else {
        // For Android/Web, use OAuth flow
        const redirectUri = AuthSession.makeRedirectUri({
          scheme: 'yourapp',
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
            }
          }
        }
      }
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Apple Sign-In Error:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'yourapp://reset-password',
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
