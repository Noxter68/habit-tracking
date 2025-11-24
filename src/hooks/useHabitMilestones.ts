/**
 * useHabitMilestones.ts
 *
 * Hook pour charger les milestones debloques d'une habitude
 * Utilise current_tier_level stocké directement dans habits
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { Habit } from '@/types';

/**
 * Hook pour obtenir le nombre de milestones debloques pour une habitude
 * @param habitId - L'identifiant de l'habitude
 * @returns Le nombre de milestones debloques (current_tier_level)
 */
export function useHabitMilestonesCount(habitId: string): number {
  const { habits } = useHabits();

  const count = useMemo(() => {
    const habit = habits.find((h) => h.id === habitId);
    return habit?.currentTierLevel ?? 0;
  }, [habits, habitId]);

  return count;
}

/**
 * Hook pour charger les milestones debloques pour plusieurs habitudes
 * Utilise les habits déjà chargés dans le context
 * @param habitIds - Liste des identifiants d'habitudes
 * @returns Map de habitId vers le nombre de milestones debloques
 */
export function useMultipleHabitMilestonesCount(habitIds: string[]): Record<string, number> {
  const { habits } = useHabits();

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    habitIds.forEach((id) => {
      const habit = habits.find((h) => h.id === id);
      result[id] = habit?.currentTierLevel ?? 0;
    });
    return result;
  }, [habits, habitIds.join(',')]);

  return counts;
}

/**
 * Hook legacy pour récupérer depuis habit_progression (fallback)
 * Utile si current_tier_level n'est pas encore renseigné
 */
export function useLegacyHabitMilestonesCount(habitId: string): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!habitId || !user?.id) return;

    const fetchMilestones = async () => {
      try {
        const { data, error } = await supabase
          .from('habit_progression')
          .select('milestones_unlocked')
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .single();

        if (!error && data?.milestones_unlocked) {
          setCount(data.milestones_unlocked.length);
        }
      } catch (e) {
        // Silently fail, will show default gem
      }
    };

    fetchMilestones();
  }, [habitId, user?.id]);

  return count;
}
