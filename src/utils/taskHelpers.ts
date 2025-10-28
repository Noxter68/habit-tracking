// src/utils/taskHelpers.ts
import { getTasksForCategory } from './habitHelpers';

export interface Task {
  id: string;
  name: string;
  description?: string;
  duration?: string;
  category?: string;
}

/**
 * Check if a value is a valid task object
 */
const isValidTaskObject = (task: any): task is Task => {
  return task && typeof task === 'object' && typeof task.id === 'string' && typeof task.name === 'string';
};

/**
 * Check if tasks array contains IDs or full objects
 */
export const isTaskIdArray = (tasks: any[]): tasks is string[] => {
  return tasks.length > 0 && typeof tasks[0] === 'string';
};

/**
 * Normalize task array to ensure we always have task objects
 */
export const normalizeTasks = (tasks: string[] | Task[], category?: string, habitType?: 'good' | 'bad'): Task[] => {
  if (!tasks || tasks.length === 0) return [];

  // Already valid task objects - return as is
  if (tasks.length > 0 && isValidTaskObject(tasks[0])) {
    return tasks as Task[];
  }

  // Array of task IDs - need to resolve them
  if (isTaskIdArray(tasks)) {
    // If we have category info, try to get task details from predefined tasks
    if (category && habitType) {
      return getTaskDetails(tasks, category, habitType);
    }

    // Otherwise return basic task objects
    return tasks.map((taskId) => ({
      id: taskId,
      name: `Task ${taskId}`,
      duration: undefined,
    }));
  }

  // Fallback: filter out any invalid entries and return valid task objects
  return tasks.filter(isValidTaskObject);
};

/**
 * Get task details from task ID
 * Used when habits store task IDs and we need the full task details
 */
export const getTaskDetails = (taskIds: string[], category: string, habitType: 'good' | 'bad'): Task[] => {
  const availableTasks = getTasksForCategory(category, habitType);

  return taskIds.map((taskId) => {
    const taskDetail = availableTasks.find((t) => t.id === taskId);

    if (taskDetail) {
      return taskDetail;
    }

    // Fallback for unknown task IDs
    return {
      id: taskId,
      name: taskId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      duration: undefined,
    };
  });
};
