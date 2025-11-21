/**
 * @file taskHelpers.ts
 * @description Utilitaires pour la gestion et la normalisation des tâches d'habitudes.
 * Gère la conversion entre les IDs de tâches et les objets tâches complets.
 */

import { getTasksForCategory } from './habitHelpers';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Représente une tâche associée à une habitude.
 */
export interface Task {
  /** Identifiant unique de la tâche */
  id: string;
  /** Nom affiché de la tâche */
  name: string;
  /** Description optionnelle de la tâche */
  description?: string;
  /** Durée estimée de la tâche */
  duration?: string;
  /** Catégorie de la tâche */
  category?: string;
}

// =============================================================================
// FONCTIONS DE VALIDATION
// =============================================================================

/**
 * Vérifie si une valeur est un objet tâche valide.
 *
 * @param task - La valeur à vérifier
 * @returns true si la valeur est un objet Task valide
 */
const isValidTaskObject = (task: any): task is Task => {
  return (
    task &&
    typeof task === 'object' &&
    typeof task.id === 'string' &&
    typeof task.name === 'string'
  );
};

/**
 * Vérifie si un tableau de tâches contient des IDs (strings) ou des objets complets.
 *
 * @param tasks - Le tableau à vérifier
 * @returns true si le tableau contient des strings (IDs)
 *
 * @example
 * isTaskIdArray(['task1', 'task2']); // true
 * isTaskIdArray([{ id: 'task1', name: 'Task 1' }]); // false
 */
export const isTaskIdArray = (tasks: any[]): tasks is string[] => {
  return tasks.length > 0 && typeof tasks[0] === 'string';
};

// =============================================================================
// FONCTIONS DE NORMALISATION
// =============================================================================

/**
 * Normalise un tableau de tâches pour garantir des objets Task complets.
 * Convertit les IDs de tâches en objets Task en utilisant les données prédéfinies.
 *
 * @param tasks - Tableau d'IDs ou d'objets Task
 * @param category - Catégorie de l'habitude (optionnel)
 * @param habitType - Type d'habitude 'good' ou 'bad' (optionnel)
 * @returns Tableau d'objets Task normalisés
 *
 * @example
 * // Avec des IDs de tâches
 * const tasks = normalizeTasks(['task1', 'task2'], 'fitness', 'good');
 *
 * // Avec des objets Task déjà complets
 * const tasks = normalizeTasks([{ id: 'task1', name: 'Task 1' }]);
 */
export const normalizeTasks = (
  tasks: string[] | Task[],
  category?: string,
  habitType?: 'good' | 'bad'
): Task[] => {
  if (!tasks || tasks.length === 0) return [];

  // Déjà des objets Task valides - retourner tel quel
  if (tasks.length > 0 && isValidTaskObject(tasks[0])) {
    return tasks as Task[];
  }

  // Tableau d'IDs de tâches - besoin de les résoudre
  if (isTaskIdArray(tasks)) {
    // Si on a les infos de catégorie, récupérer les détails des tâches prédéfinies
    if (category && habitType) {
      return getTaskDetails(tasks, category, habitType);
    }

    // Sinon retourner des objets Task basiques
    return tasks.map((taskId) => ({
      id: taskId,
      name: `Task ${taskId}`,
      duration: undefined,
    }));
  }

  // Fallback: filtrer les entrées invalides et retourner les objets Task valides
  return tasks.filter(isValidTaskObject);
};

/**
 * Récupère les détails complets des tâches à partir de leurs IDs ou objets.
 * Gère les deux formats:
 * - Ancien format: tableau de strings ["gym-workout", "push-ups"]
 * - Nouveau format: tableau d'objets [{ id: "...", name: "..." }]
 *
 * @param tasks - Tableau d'identifiants de tâches ou d'objets tâches
 * @param category - Catégorie de l'habitude
 * @param habitType - Type d'habitude ('good' ou 'bad')
 * @returns Tableau d'objets Task avec tous les détails
 *
 * @example
 * const tasks = getTaskDetails(['morning-run', 'stretching'], 'fitness', 'good');
 * // Retourne les tâches avec noms, descriptions et durées
 */
export const getTaskDetails = (
  tasks: (string | Task)[],
  category: string,
  habitType: 'good' | 'bad'
): Task[] => {
  if (!tasks || !Array.isArray(tasks)) return [];

  const availableTasks = getTasksForCategory(category, habitType);

  return tasks.map((task, index) => {
    // Si c'est déjà un objet Task valide, le retourner
    if (typeof task === 'object' && task !== null) {
      // Si l'objet a déjà id et name, c'est bon
      if (task.id && task.name) {
        return task as Task;
      }
      // Si l'objet a un id mais pas de name, chercher dans les tâches prédéfinies
      if (task.id) {
        const taskDetail = availableTasks.find((t) => t.id === task.id);
        if (taskDetail) {
          return { ...taskDetail, ...task };
        }
        // Fallback: générer un nom à partir de l'id
        return {
          id: task.id,
          name: String(task.id)
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase()),
          description: task.description,
          duration: task.duration,
        };
      }
      // Objet sans id valide
      return {
        id: `unknown-task-${index}`,
        name: (task as any).name || (task as any).text || `Task ${index + 1}`,
        description: (task as any).description,
        duration: (task as any).duration,
      };
    }

    // C'est une string (ancien format)
    const taskId = String(task);
    const taskDetail = availableTasks.find((t) => t.id === taskId);

    if (taskDetail) {
      return taskDetail;
    }

    // Fallback pour les IDs de tâches inconnus
    return {
      id: taskId,
      name: taskId
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      duration: undefined,
    };
  });
};
