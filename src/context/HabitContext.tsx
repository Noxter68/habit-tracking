/**
 * ============================================================================
 * HabitContext.tsx
 * ============================================================================
 *
 * Contexte de gestion des habitudes de l'utilisateur.
 *
 * Ce contexte centralise toutes les opérations CRUD sur les habitudes,
 * la gestion des taches quotidiennes, le suivi des streaks et la
 * synchronisation avec le backend Supabase.
 *
 * Fonctionnalites principales:
 * - Chargement et rafraichissement des habitudes
 * - Creation, modification et suppression d'habitudes
 * - Toggle des taches individuelles avec calcul XP
 * - Gestion des notifications d'habitudes
 * - Synchronisation temps reel avec Supabase
 *
 * @module HabitContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

// ============================================================================
// IMPORTS - Bibliotheques externes
// ============================================================================
import { Alert } from 'react-native';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { HabitService } from '../services/habitService';
import { HabitProgressionService } from '@/services/habitProgressionService';
import { NotificationScheduleService } from '@/services/notificationScheduleService';
import { supabase } from '@/lib/supabase';

// ============================================================================
// IMPORTS - Utils
// ============================================================================
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Types et Contextes
// ============================================================================
import { Habit } from '../types';
import { useAuth } from './AuthContext';
import { useStats } from './StatsContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Resultat du toggle d'une tache
 */
interface ToggleTaskResult {
  success: boolean;
  xpEarned: number;
  allTasksComplete: boolean;
  milestoneReached?: string;
  streakUpdated?: number;
  alreadyEarnedXP?: boolean;
  completedTasks?: string[];
}

/**
 * Type du contexte des habitudes
 */
interface HabitContextType {
  /** Liste des habitudes de l'utilisateur */
  habits: Habit[];
  /** Indicateur de chargement */
  loading: boolean;
  /** Ajoute une nouvelle habitude */
  addHabit: (habit: Partial<Habit>) => Promise<void>;
  /** Met a jour une habitude existante */
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  /** Supprime une habitude */
  deleteHabit: (habitId: string) => Promise<void>;
  /** Toggle une tache specifique d'une habitude */
  toggleTask: (habitId: string, date: string, taskId: string) => Promise<ToggleTaskResult | undefined>;
  /** Toggle toutes les taches d'une habitude pour un jour */
  toggleHabitDay: (habitId: string, date: string) => Promise<void>;
  /** Rafraichit la liste des habitudes */
  refreshHabits: () => Promise<void>;
  /** Met a jour les parametres de notification d'une habitude */
  updateHabitNotification: (habitId: string, enabled: boolean, time?: string) => Promise<void>;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const HabitContext = createContext<HabitContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte des habitudes
 *
 * Gere l'etat global des habitudes et fournit les methodes
 * pour interagir avec les donnees.
 *
 * @param children - Composants enfants
 */
export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ==========================================================================
  // STATE HOOKS
  // ==========================================================================

  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);

  // ==========================================================================
  // CONTEXT HOOKS
  // ==========================================================================

  const { user } = useAuth();
  const { refreshStats } = useStats();

  // ==========================================================================
  // FONCTIONS INTERNES
  // ==========================================================================

  /**
   * Charge les habitudes depuis le backend
   */
  const loadHabits = async () => {
    if (!user) return;

    try {
      const fetchedHabits = await HabitService.fetchHabits(user.id);
      setHabits(fetchedHabits);
    } catch (error: any) {
      Logger.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Charge les habitudes quand l'utilisateur se connecte
   */
  useEffect(() => {
    if (user) {
      loadHabits();
    } else {
      setHabits([]);
    }
  }, [user]);

  /**
   * Souscrit aux mises a jour XP en temps reel
   */
  useEffect(() => {
    const subscription = supabase
      .channel('xp_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        () => {
          refreshStats(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  // ==========================================================================
  // CALLBACKS - OPERATIONS CRUD
  // ==========================================================================

  /**
   * Rafraichit la liste des habitudes
   */
  const refreshHabits = useCallback(async () => {
    await loadHabits();
  }, [user]);

  /**
   * Ajoute une nouvelle habitude
   *
   * @param habitData - Donnees de l'habitude a creer
   */
  const addHabit = useCallback(
    async (habitData: Habit | Partial<Habit>) => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create habits');
        return;
      }

      try {
        setLoading(true);

        const newHabit: Habit = {
          id: habitData.id || Date.now().toString(),
          name: habitData.name || 'New Habit',
          type: habitData.type || 'good',
          category: habitData.category || 'health',
          tasks: habitData.tasks || [],
          dailyTasks: habitData.dailyTasks || {},
          frequency: habitData.frequency || 'daily',
          customDays: habitData.customDays || [],
          notifications: habitData.notifications !== undefined ? habitData.notifications : false,
          notificationTime: habitData.notificationTime || '09:00',
          hasEndGoal: habitData.hasEndGoal || false,
          endGoalDays: habitData.endGoalDays || 30,
          totalDays: habitData.totalDays || 61,
          currentStreak: habitData.currentStreak || 0,
          bestStreak: habitData.bestStreak || 0,
          completedDays: habitData.completedDays || [],
          createdAt: habitData.createdAt || new Date(),
        };

        // Cree dans la base de donnees pour obtenir le vrai UUID
        const createdHabit = await HabitService.createHabit(newHabit, user.id);

        // Planifie les notifications avec le vrai UUID
        if (createdHabit.notifications && createdHabit.notificationTime) {
          const timeWithSeconds = createdHabit.notificationTime.includes(':00:')
            ? createdHabit.notificationTime
            : `${createdHabit.notificationTime}:00`;

          await NotificationScheduleService.scheduleHabitNotification(
            createdHabit.id,
            user.id,
            timeWithSeconds,
            true
          );
        }

        // Ajoute a l'etat local
        setHabits([createdHabit, ...habits]);
      } catch (error: any) {
        Logger.error('Error adding habit:', error);

        if (error.code === '42501') {
          Alert.alert('Permission Error', 'Unable to create habit. Please ensure you are logged in.');
        } else if (error.message?.includes('user_id')) {
          Alert.alert('Authentication Error', 'Please log out and log back in.');
        } else {
          Alert.alert('Error', error.message || 'Failed to create habit. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [user, habits]
  );

  /**
   * Met a jour les parametres de notification d'une habitude
   *
   * @param habitId - ID de l'habitude
   * @param enabled - Notifications activees ou non
   * @param time - Heure de notification optionnelle
   */
  const updateHabitNotification = useCallback(
    async (habitId: string, enabled: boolean, time?: string) => {
      if (!user) return;

      try {
        await HabitService.updateHabitNotification(habitId, user.id, enabled, time);

        setHabits((prevHabits) =>
          prevHabits.map((habit) =>
            habit.id === habitId
              ? {
                  ...habit,
                  notifications: enabled,
                  notificationTime: time,
                }
              : habit
          )
        );
      } catch (error) {
        Logger.error('Error updating habit notification:', error);
        Alert.alert('Error', 'Failed to update notification settings');
      }
    },
    [user]
  );

  /**
   * Met a jour une habitude existante
   *
   * @param habitId - ID de l'habitude
   * @param updates - Mises a jour a appliquer
   */
  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<Habit>) => {
      if (!user) return;

      try {
        await HabitService.updateHabit(habitId, user.id, updates);
        setHabits(habits.map((habit) => (habit.id === habitId ? { ...habit, ...updates } : habit)));
      } catch (error: any) {
        Logger.error('Error updating habit:', error);
        Alert.alert('Error', 'Failed to update habit');
        await loadHabits();
      }
    },
    [user, habits]
  );

  /**
   * Supprime une habitude
   *
   * @param habitId - ID de l'habitude a supprimer
   */
  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!user) return;

      try {
        setLoading(true);
        await HabitService.deleteHabit(habitId, user.id);
        setHabits(habits.filter((h) => h.id !== habitId));
      } catch (error: any) {
        Logger.error('Error deleting habit:', error);
        Alert.alert('Error', 'Failed to delete habit');
        await loadHabits();
      } finally {
        setLoading(false);
      }
    },
    [user, habits]
  );

  // ==========================================================================
  // CALLBACKS - OPERATIONS SUR LES TACHES
  // ==========================================================================

  /**
   * Toggle une tache specifique d'une habitude
   *
   * Gere la logique complete: mise a jour backend, calcul XP,
   * mise a jour des streaks et progression.
   *
   * @param habitId - ID de l'habitude
   * @param date - Date au format string
   * @param taskId - ID de la tache
   * @returns Resultat du toggle avec XP gagne et etat de completion
   */
  const toggleTask = useCallback(
    async (habitId: string, date: string, taskId: string): Promise<ToggleTaskResult | undefined> => {
      if (!user) return;

      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      try {
        // Appelle le backend qui gere toute la logique
        const result = await HabitService.toggleTask(habitId, user.id, date, taskId);

        if (!result.success) {
          throw new Error('Failed to update task');
        }

        // Met a jour la progression si le streak a change
        if (result.streakUpdated !== undefined) {
          await HabitProgressionService.updateProgression(habitId, user.id, {
            overrideStreak: result.streakUpdated,
            allTasksCompleted: result.allTasksComplete,
          });

          // Verifie les milestones debloques
          const milestoneRes = await HabitProgressionService.checkMilestoneUnlock(habitId, user.id, {
            overrideStreak: result.streakUpdated,
          });

          if (milestoneRes.unlocked) {
            Alert.alert('Milestone Reached!', `You've unlocked: ${milestoneRes.unlocked.title}`);
          }
        }

        // Met a jour l'etat local avec les donnees du backend
        const actualCompletedTasks = Array.isArray(result.completedTasks) ? result.completedTasks : [];
        const actualAllCompleted = result.allTasksComplete;

        const updatedCompletedDays = actualAllCompleted
          ? [...habit.completedDays, date].filter((v, i, a) => a.indexOf(v) === i).sort()
          : habit.completedDays.filter((d) => d !== date);

        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: {
                    ...h.dailyTasks,
                    [date]: {
                      completedTasks: actualCompletedTasks,
                      allCompleted: actualAllCompleted,
                    },
                  },
                  completedDays: updatedCompletedDays,
                  ...(result.streakUpdated !== undefined && result.streakUpdated !== null
                    ? {
                        currentStreak: result.streakUpdated,
                        bestStreak: Math.max(h.bestStreak, result.streakUpdated),
                      }
                    : {}),
                }
              : h
          )
        );

        // Rafraichit les stats globales
        await refreshStats(true);

        return result;
      } catch (error) {
        Logger.error('Error toggling task:', error);
        Alert.alert('Error', 'Failed to update task');
        await loadHabits();
      }
    },
    [user, habits, refreshStats]
  );

  /**
   * Toggle toutes les taches d'une habitude pour un jour
   *
   * @param habitId - ID de l'habitude
   * @param date - Date au format string
   */
  const toggleHabitDay = useCallback(
    async (habitId: string, date: string) => {
      if (!user) return;

      try {
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return;

        const isCurrentlyCompleted = habit.completedDays.includes(date);
        const completedTasks = isCurrentlyCompleted ? [] : habit.tasks;
        const allCompleted = !isCurrentlyCompleted && habit.tasks.length > 0;

        const updatedDailyTasks = {
          ...habit.dailyTasks,
          [date]: {
            completedTasks,
            allCompleted,
          },
        };

        const completedDays = isCurrentlyCompleted
          ? habit.completedDays.filter((d) => d !== date)
          : [...habit.completedDays, date].sort();

        const { currentStreak, bestStreak } = await HabitService.calculateStreaks(
          habitId,
          user.id,
          date,
          allCompleted
        );

        setHabits(
          habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  dailyTasks: updatedDailyTasks,
                  completedDays,
                  currentStreak,
                  bestStreak,
                }
              : h
          )
        );

        await HabitService.updateTaskCompletion(habitId, user.id, date, completedTasks, habit.tasks.length);
      } catch (error: any) {
        Logger.error('Error toggling habit day:', error);
        Alert.alert('Error', 'Failed to update habit');
        await loadHabits();
      }
    },
    [user, habits]
  );

  // ==========================================================================
  // MEMOIZATION DE LA VALEUR DU CONTEXTE
  // ==========================================================================

  const value = useMemo(
    () => ({
      habits,
      loading,
      addHabit,
      updateHabit,
      deleteHabit,
      toggleTask,
      toggleHabitDay,
      refreshHabits,
      updateHabitNotification,
    }),
    [habits, loading, addHabit, updateHabit, deleteHabit, toggleTask, toggleHabitDay, refreshHabits, updateHabitNotification]
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};

// ============================================================================
// HOOK D'UTILISATION
// ============================================================================

/**
 * Hook pour acceder au contexte des habitudes
 *
 * @throws Error si utilise en dehors du HabitProvider
 * @returns Contexte des habitudes
 */
export const useHabits = () => {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
