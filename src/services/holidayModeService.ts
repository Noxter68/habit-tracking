// src/services/HolidayModeService.ts
// Complete service with Phase 1 helpers + Phase 2 granular control + Active Holiday Fix

import { supabase } from '../lib/supabase';

// ============================================================================
// Phase 1 Types (Base)
// ============================================================================

export interface HolidayPeriod {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  appliesToAll: boolean;

  // Phase 2: Granular control fields
  frozenHabits: string[] | null; // ✅ Array of habit IDs that are frozen
  frozenTasks: any | null;

  reason?: string;
  createdAt: string;
  isActive: boolean;
  daysRemaining?: number;
}

export interface HolidayStats {
  isPremium: boolean;
  holidaysThisYear: number;
  totalDaysThisYear: number;
  remainingAllowance: number; // -1 for unlimited (premium)
  maxDuration: number; // 14 for free, 30 for premium

  // Phase 2: Granular stats
  totalHabits: number;
  totalTasks: number;
}

export interface ValidationResult {
  canCreate: boolean;
  reason?: string;
  requiresPremium?: boolean;
}

export interface CreateHolidayResult {
  success: boolean;
  holidayId?: string;
  error?: string;
  requiresPremium?: boolean;
  message?: string;
}

export interface CancelHolidayResult {
  success: boolean;
  error?: string;
  message?: string;
}

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
      console.error('Error fetching habits with tasks:', error);
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
      console.error('Error checking holiday creation:', error);
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
        p_frozen_tasks: frozenTasks ? frozenTasks : null,
        p_reason: reason || null,
      });

      if (error) throw error;

      if (!data.success) {
        return {
          success: false,
          error: data.error,
          message: data.message,
          requiresPremium: data.requires_premium,
        };
      }

      return {
        success: true,
        holidayId: data.holiday_id,
        message: data.message,
      };
    } catch (error: any) {
      console.error('Error creating holiday period:', error);
      return {
        success: false,
        error: 'create_failed',
        message: error.message || 'Failed to create holiday period',
      };
    }
  }

  /**
   * ✅ NEW: Get the active holiday period for a user
   * This is the missing method that the Dashboard needs!
   */
  static async getActiveHoliday(userId: string): Promise<HolidayPeriod | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('holiday_periods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No active holiday is not an error
        if (error.code === 'PGRST116') {
          console.log('📅 No active holiday found');
          return null;
        }
        throw error;
      }

      if (!data) {
        console.log('📅 No active holiday found');
        return null;
      }

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
      };

      console.log('✅ Active holiday found:', {
        id: holiday.id,
        appliesToAll: holiday.appliesToAll,
        frozenHabits: holiday.frozenHabits,
        frozenTasks: holiday.frozenTasks,
        endDate: holiday.endDate,
      });

      return holiday;
    } catch (error) {
      console.error('Error fetching active holiday:', error);
      return null;
    }
  }

  /**
   * Check if a specific habit is currently frozen
   */
  static async isHabitFrozen(userId: string, habitId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) {
        return false;
      }

      // If applies_to_all is true, all habits are frozen
      if (activeHoliday.appliesToAll) {
        return true;
      }

      // Check if habit is in frozen_habits array
      if (activeHoliday.frozenHabits && Array.isArray(activeHoliday.frozenHabits)) {
        return activeHoliday.frozenHabits.includes(habitId);
      }

      return false;
    } catch (error) {
      console.error('Error checking if habit is frozen:', error);
      return false;
    }
  }

  /**
   * Check if a specific task is currently frozen
   */
  static async isTaskFrozen(userId: string, habitId: string, taskId: string): Promise<boolean> {
    try {
      const activeHoliday = await this.getActiveHoliday(userId);

      if (!activeHoliday) {
        return false;
      }

      // If habit is frozen entirely, task is frozen
      const habitFrozen = await this.isHabitFrozen(userId, habitId);
      if (habitFrozen) {
        return true;
      }

      // Check frozen_tasks JSONB
      if (activeHoliday.frozenTasks) {
        // frozenTasks structure: [{ habitId: "xxx", taskIds: ["task1", "task2"] }]
        const habitTasks = activeHoliday.frozenTasks.find((item: any) => item.habitId === habitId);
        if (habitTasks && habitTasks.taskIds && Array.isArray(habitTasks.taskIds)) {
          return habitTasks.taskIds.includes(taskId);
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking if task is frozen:', error);
      return false;
    }
  }

  // ==========================================================================
  // Phase 1: Core Methods (Updated for Phase 2 compatibility)
  // ==========================================================================

  /**
   * Get all holidays for a user (history)
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
      }));
    } catch (error) {
      console.error('Error fetching holiday history:', error);
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
      console.error('Error canceling holiday:', error);
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
      console.error('Error checking holiday status:', error);
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

      return {
        isPremium: data.is_premium || false,
        holidaysThisYear: data.holidays_this_year || 0,
        totalDaysThisYear: data.total_days_this_year || 0,
        remainingAllowance: data.remaining_allowance ?? -1,
        maxDuration: data.max_duration ?? -1,
        totalHabits,
        totalTasks,
      };
    } catch (error) {
      console.error('Error fetching holiday stats:', error);
      return {
        isPremium: false,
        holidaysThisYear: 0,
        totalDaysThisYear: 0,
        remainingAllowance: 14,
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
        console.error('Error ending holiday early:', error);
        return false;
      }

      console.log('✅ Holiday ended early:', holidayId);
      return true;
    } catch (error) {
      console.error('Error ending holiday early:', error);
      return false;
    }
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
}
