// src/types/holiday.types.ts
// Phase 2: Granular Holiday Control Types

/**
 * Holiday scope type - determines what gets frozen
 */
export type HolidayScope = 'all' | 'habits' | 'tasks';

/**
 * Frozen task structure for task-level freezing
 */
export interface FrozenTask {
  habitId: string;
  taskIds: string[];
}

/**
 * Holiday period with granular control
 */
export interface HolidayPeriod {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  appliesToAll: boolean;

  // Phase 2: Granular control fields
  frozenHabits?: string[] | null;
  frozenTasks?: FrozenTask[] | null;

  reason?: string | null;
  createdAt: string;
  isActive: boolean;
  daysRemaining?: number;
}

/**
 * Habit with tasks for selection UI
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
 * Task info for selection
 */
export interface TaskInfo {
  id: string;
  name: string;
  description?: string;
}

/**
 * Holiday creation request
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
 * Holiday stats with granular info
 */
export interface HolidayStats {
  isPremium: boolean;
  holidaysThisYear: number;
  totalDaysThisYear: number;
  remainingAllowance: number; // -1 for unlimited (premium)
  maxDuration: number; // -1 for unlimited (premium), 14 for free

  // Phase 2: Granular stats
  totalHabits: number;
  totalTasks: number;
}

/**
 * Validation result for holiday creation
 */
export interface ValidationResult {
  canCreate: boolean;
  reason?: string;
  requiresPremium?: boolean;
}

/**
 * Create holiday result
 */
export interface CreateHolidayResult {
  success: boolean;
  holidayId?: string;
  error?: string;
  requiresPremium?: boolean;
  message?: string;
}

/**
 * Cancel holiday result
 */
export interface CancelHolidayResult {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Selection state for UI
 */
export interface HolidaySelectionState {
  scope: HolidayScope;
  selectedHabits: Set<string>;
  selectedTasks: Map<string, Set<string>>; // habitId -> Set of taskIds
}

/**
 * Helper to check if habit is partially selected (some tasks selected)
 */
export const isHabitPartiallySelected = (habitId: string, habitTaskCount: number, selectedTasks: Map<string, Set<string>>): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks || tasks.size === 0) return false;
  return tasks.size < habitTaskCount;
};

/**
 * Helper to check if habit is fully selected (all tasks selected)
 */
export const isHabitFullySelected = (habitId: string, habitTaskCount: number, selectedTasks: Map<string, Set<string>>): boolean => {
  const tasks = selectedTasks.get(habitId);
  if (!tasks) return false;
  return tasks.size === habitTaskCount;
};

/**
 * Helper to convert selection state to API format
 */
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

/**
 * Helper to get selection summary for display
 */
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
