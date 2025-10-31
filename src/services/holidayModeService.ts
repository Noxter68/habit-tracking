// src/services/holidayModeService.ts
// Complete service with Phase 1 helpers + Phase 2 granular control + Fixed Early Cancellation

import Logger from '@/utils/logger';
import { supabase } from '../lib/supabase';
import { CancelHolidayResult, CreateHolidayResult, HolidayPeriod, HolidayStats, ValidationResult } from '@/types/holiday.types';

// ============================================================================
// Phase 2 Types (Granular Control)
// ============================================================================

export type HolidayScope = 'all' | 'habits' | 'tasks';

export interface FrozenTask {
  habitId: string;
  taskIds: string[];
}

export interface HabitWithTasks {
  id: string;
  name: string;
  category: string;
  type: 'good' | 'bad';
  tasks: TaskInfo[];
  currentStreak: number;
}

export interface TaskInfo {
  id: string;
  name: string;
  description?: string;
}

export interface CreateHolidayRequest {
  userId: string;
  startDate: string;
  endDate: string;
  scope: HolidayScope;
  frozenHabits?: string[];
  frozenTasks?: FrozenTask[];
  reason?: string;
}

export interface HolidaySelectionState {
  scope: HolidayScope;
  selectedHabits: Set<string>;
  selectedTasks: Map<string, Set<string>>; // habitId -> Set of taskIds
}

// ============================================================================
// Helper Functions for Selection State
// ============================================================================

export const isHabitPartiallySelected = (habitId: string, habitTaskCount: number, selectedTasks: Map<string, Set<string>>): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks || tasks.size === 0) return false;
  return tasks.size < habitTaskCount;
};

export const isHabitFullySelected = (habitId: string, habitTaskCount: number, selectedTasks: Map<string, Set<string>>): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks) return false;
  return tasks.size === habitTaskCount;
};

export const selectionStateToRequest = (state: HolidaySelectionState): Pick<CreateHolidayRequest, 'scope' | 'frozenHabits' | 'frozenTasks'> => {
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

  // scope === 'tasks'
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

export const getSelectionSummary = (state: HolidaySelectionState, habits: HabitWithTasks[]): string => {
  if (state.scope === 'all') {
    return `All ${habits.length} habits`;
  }

  if (state.scope === 'habits') {
    const count = state.selectedHabits.size;
    return `${count} ${count === 1 ? 'habit' : 'habits'}`;
  }

  // scope === 'tasks'
  let totalTasks = 0;
  state.selectedTasks.forEach((tasks) => {
    totalTasks += tasks.size;
  });
  return `${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'} across ${state.selectedTasks.size} ${state.selectedTasks.size === 1 ? 'habit' : 'habits'}`;
};

// ============================================================================
// Date Utilities - Calculate Days Remaining
// ============================================================================

/**
 * Calculate days remaining between today and end date
 * Returns 0 if end date is today or in the past
 *
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Number of days remaining
 */
const calculateDaysRemaining = (endDate: string): number => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
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

// ============================================================================
// Holiday Mode Service
// ============================================================================

export class HolidayModeService {
  // ==========================================================================
  // Phase 2: Granular Control Methods
  // ==========================================================================

  /**
   * Get user's habits with their tasks for selection UI
   */
  static async getUserHabitsWithTasks(userId: string): Promise<HabitWithTasks[]> {
    try {
      const { data: habits, error } = await supabase.from('habits').select('id, name, category, type, tasks, current_streak').eq('user_id', userId).eq('is_active', true).order('name');

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
   * Check if user can create a holiday with given parameters
   * Phase 2: Includes granular selection validation
   */
  static async canCreateHoliday(userId: string, startDate: string, endDate: string, scope: HolidayScope = 'all', frozenHabits?: string[], frozenTasks?: FrozenTask[]): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.rpc('can_create_holiday', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

      // Additional client-side validation for granular selections
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
   * Create a new holiday period with granular control
   * Phase 2: Supports habit and task-level freezing
   */
  static async createHolidayPeriod(request: CreateHolidayRequest): Promise<CreateHolidayResult> {
    try {
      const { userId, startDate, endDate, scope, frozenHabits, frozenTasks, reason } = request;

      // Determine applies_to_all based on scope
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

  /**
   * Get currently active holiday for user
   * ✅ Now includes calculated daysRemaining
   */
  static async getActiveHoliday(userId: string): Promise<HolidayPeriod | null> {
    try {
      const { data, error } = await supabase.from('holiday_periods').select('*').eq('user_id', userId).eq('is_active', true).maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // ✅ Calculate days remaining on the client side
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

      Logger.debug('✅ Active holiday found:', {
        id: holiday.id,
        startDate: holiday.startDate,
        endDate: holiday.endDate,
        deactivatedAt: holiday.deactivatedAt,
        daysRemaining: holiday.daysRemaining,
      });

      return holiday;
    } catch (error) {
      Logger.error('Error fetching active holiday:', error);
      return null;
    }
  }

  /**
   * Check if a specific habit is currently frozen
   */
  static async isHabitFrozen(userId: string, habitId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) return false;

      // If applies_to_all is true, all habits are frozen
      if (activeHoliday.appliesToAll) return true;

      // Check if habit is in frozen_habits array
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
   * Check if a specific task is currently frozen
   */
  static async isTaskFrozen(userId: string, habitId: string, taskId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) return false;

      // If habit is frozen entirely, task is frozen
      const habitFrozen = await this.isHabitFrozen(userId, habitId);
      if (habitFrozen) return true;

      // Check frozen_tasks JSONB
      if (activeHoliday.frozenTasks) {
        const habitTasks = activeHoliday.frozenTasks.find((item: any) => item.habitId === habitId);
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

  // ==========================================================================
  // Phase 1: Core Methods (Updated for Phase 2 compatibility)
  // ==========================================================================

  /**
   * Get all holidays for a user (history)
   * ✅ Now includes calculated daysRemaining for each period
   */
  static async getHolidayHistory(userId: string): Promise<HolidayPeriod[]> {
    try {
      const { data, error } = await supabase.from('holiday_periods').select('*').eq('user_id', userId).order('created_at', { ascending: false });

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
   * Cancel an active holiday early
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
   * Check if user is currently on holiday
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

  /**
   * Get holiday statistics for the user
   * Phase 2: Includes habit/task counts
   */
  static async getHolidayStats(userId: string): Promise<HolidayStats> {
    try {
      const { data, error } = await supabase.rpc('get_holiday_stats', {
        p_user_id: userId,
      });

      if (error) throw error;

      // Get total habits and tasks count
      const { data: habits } = await supabase.from('habits').select('id, tasks').eq('user_id', userId).eq('is_active', true);

      const totalHabits = habits?.length || 0;
      const totalTasks =
        habits?.reduce((sum, habit) => {
          return sum + (Array.isArray(habit.tasks) ? habit.tasks.length : 0);
        }, 0) || 0;

      const isPremium = data?.is_premium || false;

      // Handle proper defaults based on subscription tier
      let remainingAllowance: number;
      let maxDuration: number;

      if (isPremium) {
        // Premium users get unlimited
        remainingAllowance = -1;
        maxDuration = -1;
      } else {
        // Free users: 1 period left, max 14 days
        remainingAllowance = data?.remainingAllowance ?? 1;
        maxDuration = data?.maxDuration ?? 14;

        // Ensure they're valid positive numbers for free users
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
      // Fallback to safe defaults for free users
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

  /**
   * End a holiday period early
   */
  static async endHolidayEarly(holidayId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('holiday_periods')
        .update({
          is_active: false,
          end_date: new Date().toISOString().split('T')[0], // Set end date to today
        })
        .eq('id', holidayId);

      if (error) {
        Logger.error('Error ending holiday early:', error);
        return false;
      }

      Logger.debug('✅ Holiday ended early:', holidayId);
      return true;
    } catch (error) {
      Logger.error('Error ending holiday early:', error);
      return false;
    }
  }

  /**
   * ✅ NEW: Get ALL holidays (active and inactive) for historical checking
   * This allows us to display past holiday periods on the calendar
   */
  static async getAllHolidays(userId: string): Promise<HolidayPeriod[]> {
    try {
      const { data, error } = await supabase.from('holiday_periods').select('*').eq('user_id', userId).order('start_date', { ascending: false });

      if (error) throw error;

      const holidays = (data || []).map((record: any) => {
        const daysRemaining = calculateDaysRemaining(record.end_date);

        return {
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
          daysRemaining,
        };
      });

      Logger.debug('📅 All holidays fetched:', {
        count: holidays.length,
        holidays: holidays.map((h) => ({
          id: h.id,
          startDate: h.startDate,
          endDate: h.endDate,
          isActive: h.isActive,
          deactivatedAt: h.deactivatedAt,
        })),
      });

      return holidays;
    } catch (error) {
      Logger.error('Error fetching all holidays:', error);
      return [];
    }
  }

  /**
   * ✅ FIXED: Check if a date was in ANY holiday period (historical check)
   * Now properly considers early cancellation via deactivatedAt
   */
  static isDateInAnyHoliday(date: Date, allHolidays: HolidayPeriod[], habitId: string, taskIds?: string[]): boolean {
    if (!allHolidays || allHolidays.length === 0) return false;

    const dateStr = date.toISOString().split('T')[0];

    for (const holiday of allHolidays) {
      // ✅ CRITICAL FIX: Calculate actual end date based on deactivation
      let actualEndDate = holiday.endDate;

      if (!holiday.isActive && holiday.deactivatedAt) {
        // Holiday was cancelled early - only count days up to deactivation
        const deactivatedDate = new Date(holiday.deactivatedAt);
        const lastHolidayDay = new Date(deactivatedDate);
        lastHolidayDay.setDate(lastHolidayDay.getDate() - 1); // Day before deactivation
        actualEndDate = lastHolidayDay.toISOString().split('T')[0];

        Logger.debug('🏖️ Early cancellation detected:', {
          holidayId: holiday.id,
          originalEnd: holiday.endDate,
          actualEnd: actualEndDate,
          deactivatedAt: holiday.deactivatedAt,
        });
      }

      // Check if date is within the ACTUAL period (not planned period)
      const isInPeriod = dateStr >= holiday.startDate && dateStr <= actualEndDate;

      if (!isInPeriod) continue;

      // CASE 1: All habits frozen
      if (holiday.appliesToAll) {
        Logger.debug('✅ Date is holiday (all habits frozen):', dateStr);
        return true;
      }

      // CASE 2: Specific habit frozen
      if (holiday.frozenHabits?.includes(habitId)) {
        Logger.debug('✅ Date is holiday (habit frozen):', { dateStr, habitId });
        return true;
      }

      // CASE 3: Specific tasks frozen
      if (taskIds && holiday.frozenTasks) {
        const habitFrozenTasks = holiday.frozenTasks.find((ft: any) => ft.habitId === habitId);
        if (habitFrozenTasks) {
          const allTasksFrozen = taskIds.every((taskId) => habitFrozenTasks.taskIds.includes(taskId));
          if (allTasksFrozen) {
            Logger.debug('✅ Date is holiday (tasks frozen):', { dateStr, habitId, taskIds });
            return true;
          }
        }
      }
    }

    return false;
  }

  // ==========================================================================
  // Helper Functions (Phase 1)
  // ==========================================================================

  /**
   * Format date for display (e.g., "Jan 15, 2025")
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
   * Calculate duration in days between two dates
   */
  static calculateDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
  }

  /**
   * Validate date range
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
   * ✅ Get days remaining for a holiday period
   * Public method to calculate days remaining for any date
   */
  static getDaysRemaining(endDate: string): number {
    return calculateDaysRemaining(endDate);
  }

  /**
   * Check if a specific date is within a holiday period
   * Returns the holiday period if date is frozen, null otherwise
   */
  static isDateInHoliday(date: Date, activeHoliday: HolidayPeriod | null, habitId?: string, taskIds?: string[]): boolean {
    if (!activeHoliday) return false;

    const dateStr = date.toISOString().split('T')[0];
    const isInPeriod = dateStr >= activeHoliday.startDate && dateStr <= activeHoliday.endDate;

    if (!isInPeriod) return false;

    // CASE 1: All habits frozen
    if (activeHoliday.appliesToAll) return true;

    // CASE 2: Specific habits frozen
    if (habitId && activeHoliday.frozenHabits?.includes(habitId)) return true;

    // CASE 3: Specific tasks frozen
    if (habitId && taskIds && activeHoliday.frozenTasks) {
      const habitFrozenTasks = activeHoliday.frozenTasks.find((ft: any) => ft.habitId === habitId);

      if (habitFrozenTasks) {
        const allTasksFrozen = taskIds.every((taskId) => habitFrozenTasks.taskIds.includes(taskId));
        return allTasksFrozen;
      }
    }

    return false;
  }

  /**
   * Get holiday info for a specific date
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
