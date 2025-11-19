/**
 * Service de gestion du mode vacances (Holiday Mode)
 *
 * Ce service gere le systeme de gel des habitudes pendant les periodes de vacances.
 * Il permet de preserver les streaks des utilisateurs tout en leur permettant
 * de faire une pause. Supporte le controle granulaire par habitude ou par tache.
 *
 * @module HolidayModeService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '../lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';
import { getLocalDateString } from '@/utils/dateHelpers';

// =============================================================================
// IMPORTS - Types
// =============================================================================
import {
  CancelHolidayResult,
  CreateHolidayResult,
  HolidayPeriod,
  HolidayStats,
  ValidationResult,
} from '@/types/holiday.types';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Portee du gel (tout, habitudes specifiques, ou taches specifiques)
 */
export type HolidayScope = 'all' | 'habits' | 'tasks';

/**
 * Taches gelees pour une habitude
 */
export interface FrozenTask {
  habitId: string;
  taskIds: string[];
}

/**
 * Habitude avec ses taches pour l'UI de selection
 */
export interface HabitWithTasks {
  id: string;
  name: string;
  category: string;
  type: 'good' | 'bad';
  tasks: TaskInfo[];
  currentStreak: number;
}

/**
 * Information sur une tache
 */
export interface TaskInfo {
  id: string;
  name: string;
  description?: string;
}

/**
 * Requete de creation de periode de vacances
 */
export interface CreateHolidayRequest {
  userId: string;
  startDate: string;
  endDate: string;
  scope: HolidayScope;
  frozenHabits?: string[];
  frozenTasks?: FrozenTask[];
  reason?: string;
}

/**
 * Etat de selection pour l'UI
 */
export interface HolidaySelectionState {
  scope: HolidayScope;
  selectedHabits: Set<string>;
  selectedTasks: Map<string, Set<string>>;
}

// =============================================================================
// FONCTIONS UTILITAIRES POUR L'ETAT DE SELECTION
// =============================================================================

/**
 * Verifier si une habitude est partiellement selectionnee
 *
 * @param habitId - L'identifiant de l'habitude
 * @param habitTaskCount - Le nombre total de taches de l'habitude
 * @param selectedTasks - Les taches selectionnees
 * @returns Vrai si partiellement selectionne
 */
export const isHabitPartiallySelected = (
  habitId: string,
  habitTaskCount: number,
  selectedTasks: Map<string, Set<string>>
): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks || tasks.size === 0) return false;
  return tasks.size < habitTaskCount;
};

/**
 * Verifier si une habitude est entierement selectionnee
 *
 * @param habitId - L'identifiant de l'habitude
 * @param habitTaskCount - Le nombre total de taches de l'habitude
 * @param selectedTasks - Les taches selectionnees
 * @returns Vrai si entierement selectionne
 */
export const isHabitFullySelected = (
  habitId: string,
  habitTaskCount: number,
  selectedTasks: Map<string, Set<string>>
): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks) return false;
  return tasks.size === habitTaskCount;
};

/**
 * Convertir l'etat de selection en requete
 *
 * @param state - L'etat de selection
 * @returns Les parametres de la requete
 */
export const selectionStateToRequest = (
  state: HolidaySelectionState
): Pick<CreateHolidayRequest, 'scope' | 'frozenHabits' | 'frozenTasks'> => {
  if (state.scope === 'all') {
    return {
      scope: 'all',
      frozenHabits: undefined,
      frozenTasks: undefined,
    };
  }

  if (state.scope === 'habits') {
    return {
      scope: 'habits',
      frozenHabits: Array.from(state.selectedHabits),
      frozenTasks: undefined,
    };
  }

  const frozenTasks: FrozenTask[] = [];
  state.selectedTasks.forEach((taskIds, habitId) => {
    if (taskIds.size > 0) {
      frozenTasks.push({
        habitId,
        taskIds: Array.from(taskIds),
      });
    }
  });

  return {
    scope: 'tasks',
    frozenHabits: undefined,
    frozenTasks,
  };
};

/**
 * Obtenir un resume de la selection pour l'affichage
 *
 * @param state - L'etat de selection
 * @param habits - Liste des habitudes disponibles
 * @returns Le resume en texte
 */
export const getSelectionSummary = (
  state: HolidaySelectionState,
  habits: HabitWithTasks[]
): string => {
  if (state.scope === 'all') {
    return `All ${habits.length} habits`;
  }

  if (state.scope === 'habits') {
    const count = state.selectedHabits.size;
    return `${count} ${count === 1 ? 'habit' : 'habits'}`;
  }

  let totalTasks = 0;
  state.selectedTasks.forEach((tasks) => {
    totalTasks += tasks.size;
  });
  return `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} across ${state.selectedTasks.size} ${state.selectedTasks.size === 1 ? 'habit' : 'habits'}`;
};

// =============================================================================
// FONCTIONS UTILITAIRES - CALCUL DES JOURS
// =============================================================================

/**
 * Calculer les jours restants entre aujourd'hui et la date de fin
 * Retourne 0 si la date de fin est aujourd'hui ou dans le passe
 *
 * @param endDate - Date de fin au format YYYY-MM-DD
 * @returns Nombre de jours restants
 */
const calculateDaysRemaining = (endDate: string): number => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse the date string as local time to avoid timezone issues
    const [year, month, day] = endDate.split('-').map(Number);
    const end = new Date(year, month - 1, day);
    end.setHours(0, 0, 0, 0);

    if (end <= today) {
      return 0;
    }

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  } catch (error) {
    Logger.error('Error calculating days remaining:', error);
    return 0;
  }
};

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion du mode vacances
 *
 * Gere la creation, l'annulation et la verification des periodes de vacances
 */
export class HolidayModeService {
  // ===========================================================================
  // SECTION: Controle granulaire
  // ===========================================================================

  /**
   * Recuperer les habitudes avec leurs taches pour l'UI de selection
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des habitudes avec leurs taches
   */
  static async getUserHabitsWithTasks(userId: string): Promise<HabitWithTasks[]> {
    try {
      const { data: habits, error } = await supabase
        .from('habits')
        .select('id, name, category, type, tasks, current_streak')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      return (habits || []).map((habit) => ({
        id: habit.id,
        name: habit.name,
        category: habit.category,
        type: habit.type as 'good' | 'bad',
        tasks: Array.isArray(habit.tasks)
          ? habit.tasks.map((task: any, index: number) => ({
              id: typeof task === 'string' ? task : task.id || `task-${index}`,
              name: typeof task === 'string' ? task : task.name || task,
              description: typeof task === 'object' ? task.description : undefined,
            }))
          : [],
        currentStreak: habit.current_streak || 0,
      }));
    } catch (error) {
      Logger.error('Error fetching habits with tasks:', error);
      return [];
    }
  }

  /**
   * Verifier si l'utilisateur peut creer une periode de vacances
   * Inclut la validation du controle granulaire
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param startDate - Date de debut
   * @param endDate - Date de fin
   * @param scope - Portee du gel
   * @param frozenHabits - Habitudes a geler
   * @param frozenTasks - Taches a geler
   * @returns Le resultat de la validation
   */
  static async canCreateHoliday(
    userId: string,
    startDate: string,
    endDate: string,
    scope: HolidayScope = 'all',
    frozenHabits?: string[],
    frozenTasks?: FrozenTask[]
  ): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.rpc('can_create_holiday', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      if (scope !== 'all') {
        if (!frozenHabits && !frozenTasks) {
          return {
            canCreate: false,
            reason: 'You must select at least one habit or task to freeze.',
          };
        }

        if (scope === 'habits' && (!frozenHabits || frozenHabits.length === 0)) {
          return {
            canCreate: false,
            reason: 'You must select at least one habit to freeze.',
          };
        }

        if (scope === 'tasks' && (!frozenTasks || frozenTasks.length === 0)) {
          return {
            canCreate: false,
            reason: 'You must select at least one task to freeze.',
          };
        }
      }

      return {
        canCreate: data.can_create || false,
        reason: data.reason,
        requiresPremium: data.requires_premium || false,
      };
    } catch (error) {
      Logger.error('Error checking holiday creation:', error);
      return {
        canCreate: false,
        reason: 'Failed to validate holiday creation',
      };
    }
  }

  /**
   * Creer une nouvelle periode de vacances avec controle granulaire
   *
   * @param request - Les parametres de la requete
   * @returns Le resultat de la creation
   */
  static async createHolidayPeriod(request: CreateHolidayRequest): Promise<CreateHolidayResult> {
    try {
      const { userId, startDate, endDate, scope, frozenHabits, frozenTasks, reason } = request;
      const appliesToAll = scope === 'all';

      const { data, error } = await supabase.rpc('create_holiday_period', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_applies_to_all: appliesToAll,
        p_frozen_habits: frozenHabits || null,
        p_frozen_tasks: frozenTasks || null,
        p_reason: reason || null,
      });

      if (error) throw error;

      return {
        success: data.success || false,
        holidayId: data.holiday_id,
        message: data.message,
        error: data.error,
        requiresPremium: data.requires_premium || false,
      };
    } catch (error: any) {
      Logger.error('Error creating holiday period:', error);
      return {
        success: false,
        error: 'create_failed',
        message: error.message || 'Failed to create holiday period',
      };
    }
  }

  // ===========================================================================
  // SECTION: Recuperation des periodes
  // ===========================================================================

  /**
   * Recuperer la periode de vacances active
   * Inclut le calcul des jours restants
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns La periode active ou null
   */
  static async getActiveHoliday(userId: string): Promise<HolidayPeriod | null> {
    try {
      const { data, error } = await supabase
        .from('holiday_periods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const daysRemaining = calculateDaysRemaining(data.end_date);

      const holiday: HolidayPeriod = {
        id: data.id,
        userId: data.user_id,
        startDate: data.start_date,
        endDate: data.end_date,
        appliesToAll: data.applies_to_all,
        frozenHabits: data.frozen_habits,
        frozenTasks: data.frozen_tasks,
        reason: data.reason,
        createdAt: data.created_at,
        isActive: data.is_active,
        deactivatedAt: data.deactivated_at,
        daysRemaining,
      };

      Logger.debug('Active holiday found:', {
        id: holiday.id,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        daysRemaining: holiday.daysRemaining,
      });

      return holiday;
    } catch (error) {
      Logger.error('Error fetching active holiday:', error);
      return null;
    }
  }

  /**
   * Recuperer l'historique des periodes de vacances
   * Inclut le calcul des jours restants pour chaque periode
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des periodes
   */
  static async getHolidayHistory(userId: string): Promise<HolidayPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('holiday_periods')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        startDate: item.start_date,
        endDate: item.end_date,
        appliesToAll: item.applies_to_all,
        frozenHabits: item.frozen_habits,
        frozenTasks: item.frozen_tasks,
        reason: item.reason,
        createdAt: item.created_at,
        isActive: item.is_active,
        deactivatedAt: item.deactivated_at,
        daysRemaining: calculateDaysRemaining(item.end_date),
      }));
    } catch (error) {
      Logger.error('Error fetching holiday history:', error);
      return [];
    }
  }

  /**
   * Recuperer toutes les periodes de vacances (actives et inactives)
   * Pour l'affichage historique sur le calendrier
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste de toutes les periodes
   */
  static async getAllHolidays(userId: string): Promise<HolidayPeriod[]> {
    try {
      const { data, error } = await supabase
        .from('holiday_periods')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      const holidays = (data || []).map((record: any) => ({
        id: record.id,
        userId: record.user_id,
        startDate: record.start_date,
        endDate: record.end_date,
        appliesToAll: record.applies_to_all,
        frozenHabits: record.frozen_habits,
        frozenTasks: record.frozen_tasks,
        reason: record.reason,
        createdAt: record.created_at,
        isActive: record.is_active,
        deactivatedAt: record.deactivated_at,
        daysRemaining: calculateDaysRemaining(record.end_date),
      }));

      Logger.debug('All holidays fetched:', {
        count: holidays.length,
      });

      return holidays;
    } catch (error) {
      Logger.error('Error fetching all holidays:', error);
      return [];
    }
  }

  // ===========================================================================
  // SECTION: Verification du gel
  // ===========================================================================

  /**
   * Verifier si une habitude est actuellement gelee
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @returns Vrai si l'habitude est gelee
   */
  static async isHabitFrozen(userId: string, habitId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) return false;
      if (activeHoliday.appliesToAll) return true;

      if (activeHoliday.frozenHabits && Array.isArray(activeHoliday.frozenHabits)) {
        return activeHoliday.frozenHabits.includes(habitId);
      }

      return false;
    } catch (error) {
      Logger.error('Error checking if habit is frozen:', error);
      return false;
    }
  }

  /**
   * Verifier si une tache specifique est gelee
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @param taskId - L'identifiant de la tache
   * @returns Vrai si la tache est gelee
   */
  static async isTaskFrozen(userId: string, habitId: string, taskId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) return false;

      const habitFrozen = await this.isHabitFrozen(userId, habitId);
      if (habitFrozen) return true;

      if (activeHoliday.frozenTasks) {
        const habitTasks = activeHoliday.frozenTasks.find(
          (item: any) => item.habitId === habitId
        );
        if (habitTasks && habitTasks.taskIds && Array.isArray(habitTasks.taskIds)) {
          return habitTasks.taskIds.includes(taskId);
        }
      }

      return false;
    } catch (error) {
      Logger.error('Error checking if task is frozen:', error);
      return false;
    }
  }

  /**
   * Verifier si l'utilisateur est en vacances
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Vrai si en vacances
   */
  static async isOnHoliday(userId: string): Promise<boolean> {
    try {
      const holiday = await this.getActiveHoliday(userId);
      return holiday !== null;
    } catch (error) {
      Logger.error('Error checking holiday status:', error);
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Annulation et fin anticipee
  // ===========================================================================

  /**
   * Annuler une periode de vacances active
   *
   * @param holidayId - L'identifiant de la periode
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le resultat de l'annulation
   */
  static async cancelHoliday(holidayId: string, userId: string): Promise<CancelHolidayResult> {
    try {
      const { data, error } = await supabase.rpc('cancel_holiday_period', {
        p_holiday_id: holidayId,
        p_user_id: userId,
      });

      if (error) throw error;

      return {
        success: data.success || false,
        message: data.message,
        error: data.error,
      };
    } catch (error: any) {
      Logger.error('Error canceling holiday:', error);
      return {
        success: false,
        error: 'cancel_failed',
        message: error.message || 'Failed to cancel holiday',
      };
    }
  }

  /**
   * Terminer une periode de vacances plus tot
   *
   * @param holidayId - L'identifiant de la periode
   * @returns Vrai si l'operation a reussi
   */
  static async endHolidayEarly(holidayId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('holiday_periods')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', holidayId);

      if (error) {
        Logger.error('Error ending holiday early:', error);
        return false;
      }

      Logger.debug('Holiday ended early:', holidayId);
      return true;
    } catch (error) {
      Logger.error('Error ending holiday early:', error);
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Statistiques
  // ===========================================================================

  /**
   * Recuperer les statistiques de vacances de l'utilisateur
   * Inclut les compteurs d'habitudes et taches
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques de vacances
   */
  static async getHolidayStats(userId: string): Promise<HolidayStats> {
    try {
      const { data, error } = await supabase.rpc('get_holiday_stats', {
        p_user_id: userId,
      });

      if (error) throw error;

      const { data: habits } = await supabase
        .from('habits')
        .select('id, tasks')
        .eq('user_id', userId)
        .eq('is_active', true);

      const totalHabits = habits?.length || 0;
      const totalTasks =
        habits?.reduce((sum, habit) => {
          return sum + (Array.isArray(habit.tasks) ? habit.tasks.length : 0);
        }, 0) || 0;

      const isPremium = data?.is_premium || false;

      let remainingAllowance: number;
      let maxDuration: number;

      if (isPremium) {
        remainingAllowance = -1;
        maxDuration = -1;
      } else {
        remainingAllowance = data?.remainingAllowance ?? 1;
        maxDuration = data?.maxDuration ?? 14;

        if (remainingAllowance < 0) remainingAllowance = 1;
        if (maxDuration < 0) maxDuration = 14;
      }

      return {
        isPremium,
        holidaysThisYear: data?.holidaysThisYear || 0,
        totalDaysThisYear: data?.totalDaysThisYear || 0,
        remainingAllowance,
        maxDuration,
        totalHabits,
        totalTasks,
      };
    } catch (error) {
      Logger.error('Error fetching holiday stats:', error);
      return {
        isPremium: false,
        holidaysThisYear: 0,
        totalDaysThisYear: 0,
        remainingAllowance: 1,
        maxDuration: 14,
        totalHabits: 0,
        totalTasks: 0,
      };
    }
  }

  // ===========================================================================
  // SECTION: Utilitaires de date
  // ===========================================================================

  /**
   * Formater une date pour l'affichage (ex: "Jan 15, 2025")
   *
   * @param dateString - La date en format ISO
   * @returns La date formatee
   */
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Calculer la duree en jours entre deux dates
   *
   * @param startDate - Date de debut
   * @param endDate - Date de fin
   * @returns La duree en jours
   */
  static calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Valider une plage de dates
   *
   * @param startDate - Date de debut
   * @param endDate - Date de fin
   * @returns Le resultat de la validation
   */
  static validateDateRange(
    startDate: string,
    endDate: string
  ): {
    isValid: boolean;
    error?: string;
  } {
    const today = new Date().toISOString().split('T')[0];

    if (startDate < today) {
      return {
        isValid: false,
        error: 'Start date cannot be in the past',
      };
    }

    if (endDate < startDate) {
      return {
        isValid: false,
        error: 'End date must be after start date',
      };
    }

    return { isValid: true };
  }

  /**
   * Obtenir les jours restants pour une periode
   *
   * @param endDate - Date de fin
   * @returns Les jours restants
   */
  static getDaysRemaining(endDate: string): number {
    return calculateDaysRemaining(endDate);
  }

  // ===========================================================================
  // SECTION: Verification historique des dates
  // ===========================================================================

  /**
   * Verifier si une date etait dans une periode de vacances (historique)
   * Prend en compte l'annulation anticipee via deactivatedAt
   *
   * @param date - La date a verifier
   * @param allHolidays - Toutes les periodes de vacances
   * @param habitId - L'identifiant de l'habitude
   * @param taskIds - Les identifiants des taches (optionnel)
   * @returns Vrai si la date etait en vacances
   */
  static isDateInAnyHoliday(
    date: Date,
    allHolidays: HolidayPeriod[],
    habitId: string,
    taskIds?: string[]
  ): boolean {
    if (!allHolidays || allHolidays.length === 0) return false;

    const dateStr = getLocalDateString(date);

    for (const holiday of allHolidays) {
      let actualEndDate = holiday.endDate;

      if (!holiday.isActive && holiday.deactivatedAt) {
        const deactivatedDate = new Date(holiday.deactivatedAt);
        const lastHolidayDay = new Date(deactivatedDate);
        lastHolidayDay.setDate(lastHolidayDay.getDate() - 1);
        actualEndDate = getLocalDateString(lastHolidayDay);
      }

      const isInPeriod = dateStr >= holiday.startDate && dateStr <= actualEndDate;

      if (!isInPeriod) continue;

      if (holiday.appliesToAll) {
        return true;
      }

      if (holiday.frozenHabits?.includes(habitId)) {
        return true;
      }

      if (taskIds && holiday.frozenTasks) {
        const habitFrozenTasks = holiday.frozenTasks.find(
          (ft: any) => ft.habitId === habitId
        );
        if (habitFrozenTasks) {
          const allTasksFrozen = taskIds.every((taskId) =>
            habitFrozenTasks.taskIds.includes(taskId)
          );
          if (allTasksFrozen) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Verifier si une date est dans la periode de vacances active
   *
   * @param date - La date a verifier
   * @param activeHoliday - La periode de vacances active
   * @param habitId - L'identifiant de l'habitude (optionnel)
   * @param taskIds - Les identifiants des taches (optionnel)
   * @returns Vrai si la date est en vacances
   */
  static isDateInHoliday(
    date: Date,
    activeHoliday: HolidayPeriod | null,
    habitId?: string,
    taskIds?: string[]
  ): boolean {
    if (!activeHoliday) return false;

    const dateStr = getLocalDateString(date);
    const isInPeriod = dateStr >= activeHoliday.startDate && dateStr <= activeHoliday.endDate;

    if (!isInPeriod) return false;

    if (activeHoliday.appliesToAll) return true;

    if (habitId && activeHoliday.frozenHabits?.includes(habitId)) return true;

    if (habitId && taskIds && activeHoliday.frozenTasks) {
      const habitFrozenTasks = activeHoliday.frozenTasks.find(
        (ft: any) => ft.habitId === habitId
      );

      if (habitFrozenTasks) {
        const allTasksFrozen = taskIds.every((taskId) =>
          habitFrozenTasks.taskIds.includes(taskId)
        );
        return allTasksFrozen;
      }
    }

    return false;
  }

  /**
   * Obtenir les informations de vacances pour une date specifique
   *
   * @param date - La date a verifier
   * @param activeHoliday - La periode de vacances active
   * @param habitId - L'identifiant de l'habitude (optionnel)
   * @returns Les informations de vacances
   */
  static getHolidayInfoForDate(
    date: Date,
    activeHoliday: HolidayPeriod | null,
    habitId?: string
  ): {
    isHoliday: boolean;
    holidayType: 'all' | 'habit' | 'tasks' | null;
    message: string | null;
  } {
    if (!this.isDateInHoliday(date, activeHoliday, habitId)) {
      return { isHoliday: false, holidayType: null, message: null };
    }

    if (activeHoliday?.appliesToAll) {
      return {
        isHoliday: true,
        holidayType: 'all',
        message: 'All habits paused - Streaks preserved',
      };
    }

    if (habitId && activeHoliday?.frozenHabits?.includes(habitId)) {
      return {
        isHoliday: true,
        holidayType: 'habit',
        message: 'This habit is paused - Streak preserved',
      };
    }

    return {
      isHoliday: true,
      holidayType: 'tasks',
      message: 'Some tasks paused - Partial tracking active',
    };
  }
}
