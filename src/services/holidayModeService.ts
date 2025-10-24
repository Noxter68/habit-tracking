// src/services/HolidayModeService.ts
import { supabase } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface HolidayPeriod {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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
  maxDuration: number; // -1 for unlimited (premium), 14 for free
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
// Holiday Mode Service
// ============================================================================

export class HolidayModeService {
  /**
   * Check if user can create a holiday with given parameters
   */
  static async canCreateHoliday(userId: string, startDate: string, endDate: string): Promise<ValidationResult> {
    try {
      const { data, error } = await supabase.rpc('can_create_holiday', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;

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
   * Create a new holiday period
   */
  static async createHolidayPeriod(userId: string, startDate: string, endDate: string, reason?: string): Promise<CreateHolidayResult> {
    try {
      const { data, error } = await supabase.rpc('create_holiday_period', {
        p_user_id: userId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_reason: reason || null,
      });

      if (error) throw error;

      return {
        success: data.success || false,
        holidayId: data.holiday_id,
        error: data.error,
        requiresPremium: data.requires_premium || false,
        message: data.message,
      };
    } catch (error: any) {
      console.error('Error creating holiday:', error);
      return {
        success: false,
        error: error.message || 'Failed to create holiday',
      };
    }
  }

  /**
   * Get the currently active holiday for a user
   */
  static async getActiveHoliday(userId: string): Promise<HolidayPeriod | null> {
    try {
      const { data, error } = await supabase.rpc('get_active_holiday', {
        p_user_id: userId,
      });

      if (error) throw error;
      if (!data) return null;

      // Handle both camelCase and snake_case from database
      const startDate = data.startDate || data.start_date;
      const endDate = data.endDate || data.end_date;
      const createdAt = data.createdAt || data.created_at;

      // Calculate days remaining (client-side for reliability)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

      return {
        id: data.id,
        userId: userId,
        startDate: startDate,
        endDate: endDate,
        reason: data.reason,
        createdAt: createdAt,
        isActive: true,
        daysRemaining: daysRemaining,
      };
    } catch (error) {
      console.error('Error fetching active holiday:', error);
      return null;
    }
  }

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
  static async cancelHoliday(userId: string, holidayId: string): Promise<CancelHolidayResult> {
    try {
      const { data, error } = await supabase.rpc('cancel_holiday', {
        p_user_id: userId,
        p_holiday_id: holidayId,
      });

      if (error) throw error;

      return {
        success: data.success || false,
        error: data.error,
        message: data.message,
      };
    } catch (error: any) {
      console.error('Error cancelling holiday:', error);
      return {
        success: false,
        error: error.message || 'Failed to cancel holiday',
      };
    }
  }

  /**
   * Check if user is currently on holiday
   */
  static async isOnHoliday(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_on_holiday', {
        p_user_id: userId,
        p_check_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking holiday status:', error);
      return false;
    }
  }

  /**
   * Get holiday statistics for the user
   */
  static async getHolidayStats(userId: string): Promise<HolidayStats> {
    try {
      const { data, error } = await supabase.rpc('get_holiday_stats', {
        p_user_id: userId,
      });

      if (error) throw error;

      return {
        isPremium: data.isPremium || false,
        holidaysThisYear: data.holidaysThisYear || 0,
        totalDaysThisYear: data.totalDaysThisYear || 0,
        remainingAllowance: data.remainingAllowance || 0,
        maxDuration: data.maxDuration || 14,
      };
    } catch (error) {
      console.error('Error fetching holiday stats:', error);
      return {
        isPremium: false,
        holidaysThisYear: 0,
        totalDaysThisYear: 0,
        remainingAllowance: 0,
        maxDuration: 14,
      };
    }
  }

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
