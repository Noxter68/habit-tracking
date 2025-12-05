/**
 * useHabitMilestones.ts
 *
 * Hook pour charger les milestones debloques d'une habitude
 * Calcule basé sur l'âge de l'habitude (jours depuis création)
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';

// Jours requis pour chaque milestone (doit correspondre à habit_milestones)
const MILESTONE_DAYS = [3, 7, 14, 21, 30, 45, 60, 75, 90, 100, 150, 200, 250, 300, 365];

/**
 * Calcule le nombre de milestones débloqués basé sur l'âge de l'habitude
 * @param createdAt - Date de création de l'habitude
 * @returns Le nombre de milestones débloqués
 */
function calculateMilestonesFromAge(createdAt: Date | undefined): number {
  if (!createdAt) return 0;

  const created = new Date(createdAt);
  const today = new Date();
  created.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const habitAge = Math.floor((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Compter combien de milestones sont débloqués basé sur l'âge
  return MILESTONE_DAYS.filter(days => days <= habitAge).length;
}

/**
 * Hook pour obtenir le nombre de milestones debloques pour une habitude
 * @param habitId - L'identifiant de l'habitude
 * @returns Le nombre de milestones debloques
 */
export function useHabitMilestonesCount(habitId: string): number {
  const { habits } = useHabits();

  const count = useMemo(() => {
    const habit = habits.find((h) => h.id === habitId);
    return calculateMilestonesFromAge(habit?.createdAt);
  }, [habits, habitId]);

  return count;
}

/**
 * Hook pour charger les milestones debloques pour plusieurs habitudes
 * Calcule basé sur l'âge de l'habitude (jours depuis création)
 * @param habitIds - Liste des identifiants d'habitudes
 * @returns Map de habitId vers le nombre de milestones debloques
 */
export function useMultipleHabitMilestonesCount(habitIds: string[]): Record<string, number> {
  const { habits } = useHabits();

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    habitIds.forEach((id) => {
      const habit = habits.find((h) => h.id === id);
      result[id] = calculateMilestonesFromAge(habit?.createdAt);
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
