// src/lib/supabase.ts - Configuration optimisée pour gérer les sessions expirées
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// ============================================================================
// 🔧 Configuration optimisée pour sessions
// ============================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true, // ✅ Active le refresh automatique
    persistSession: true, // ✅ Persiste la session
    detectSessionInUrl: false,

    // 🔧 NOUVEAU : Configuration du refresh
    storageKey: 'supabase.auth.token', // Clé de stockage explicite

    // 🔧 Délai avant expiration pour déclencher le refresh (5 min avant)
    // Supabase refresh automatiquement le token 60s avant expiration par défaut
  },

  // 🔧 Options globales pour les requêtes
  global: {
    headers: {
      'x-application-name': 'nuvoria-mobile',
    },
  },

  // 🔧 Timeout global pour toutes les requêtes (10 secondes)
  // realtime: {
  //   timeout: 10000,
  // },
});

// ============================================================================
// Helper pour nettoyer une session corrompue
// ============================================================================

export async function clearCorruptedSession(): Promise<void> {
  try {
    console.log('🧹 [Supabase] Clearing corrupted session...');

    // Supprime les clés Supabase d'AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter((key) => key.startsWith('supabase.auth'));

    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log('✅ [Supabase] Cleared keys:', supabaseKeys);
    }

    // Force sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ [Supabase] Error clearing session:', error);
  }
}

// ============================================================================
// Helper pour vérifier la validité de la session
// ============================================================================

export async function isSessionValid(): Promise<boolean> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return false;
    }

    // Vérifie l'expiration
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;

      // Session valide si expire dans plus de 60 secondes
      return timeUntilExpiry > 60;
    }

    return true;
  } catch {
    return false;
  }
}

// Database types
export interface Profile {
  id: string;
  email?: string;
  username?: string;
  created_at: string;
  updated_at: string;
  has_completed_onboarding?: boolean;
}

export interface HabitDB {
  id: string;
  user_id: string;
  name: string;
  type: 'good' | 'bad';
  category: string;
  tasks: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  custom_days?: string[];
  notifications: boolean;
  notification_time?: string;
  has_end_goal: boolean;
  end_goal_days?: number;
  total_days: number;
  current_streak: number;
  best_streak: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed_tasks: string[];
  all_completed: boolean;
  created_at: string;
}
