// src/utils/taskHelpers.ts
import { getTasksForCategory } from './habitHelpers';

export interface Task {
  id: string;
  name: string;
  duration?: string;
  category?: string;
}

/**
 * Get task details from task ID
 * Habits store task IDs, we need to fetch the actual task details
 */
export const getTaskDetails = (taskIds: string[] | Task[], category: string, habitType: 'good' | 'bad'): Task[] => {
  // If tasks are already objects with details, return them
  if (taskIds.length > 0 && typeof taskIds[0] === 'object') {
    return taskIds as Task[];
  }

  // Get available tasks for this category
  const availableTasks = getTasksForCategory(category, habitType);

  // Map task IDs to their details
  return (taskIds as string[]).map((taskId) => {
    const taskDetail = availableTasks.find((t) => t.id === taskId);

    // If we found the task in available tasks, return it
    if (taskDetail) {
      return taskDetail;
    }

    // Otherwise create a basic task object
    return {
      id: taskId,
      name: `Task ${taskId}`,
      duration: undefined,
    };
  });
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

  // If already normalized
  if (!isTaskIdArray(tasks)) {
    return tasks;
  }

  // If we have category info, try to get task details
  if (category && habitType) {
    return getTaskDetails(tasks, category, habitType);
  }

  // Otherwise return basic task objects
  return tasks.map((taskId) => ({
    id: taskId,
    name: `Task ${taskId}`,
    duration: undefined,
  }));
};
