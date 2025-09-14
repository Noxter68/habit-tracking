// src/lib/supabase.ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Profile {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
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
