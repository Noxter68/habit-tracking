import { Platform } from 'react-native';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import { Habit } from '../types';
import { getTodayString } from './dateHelpers';

// ============================================================================
// CONFIGURATION
// ============================================================================

const APP_GROUP_ID = 'group.com.davidplanchon.nuvoria';
const WIDGET_DATA_KEY = 'widgetData';

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetHabit {
  id: string;
  title: string;
  completed: boolean;
  streak: number;
}

export interface WidgetData {
  /** Habitudes du jour avec leur statut */
  habits: WidgetHabit[];
  /** Nombre d'habitudes complétées aujourd'hui */
  completedToday: number;
  /** Nombre total d'habitudes du jour */
  totalToday: number;
  /** Streak global (meilleur streak parmi toutes les habitudes) */
  globalStreak: number;
  /** XP total de l'utilisateur */
  totalXP: number;
  /** Nom de l'utilisateur */
  userName: string;
  /** Timestamp de la dernière mise à jour */
  lastUpdated: string;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Vérifie si une habitude doit être affichée aujourd'hui
 * en fonction de sa fréquence
 */
const isHabitScheduledForToday = (habit: Habit): boolean => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[dayOfWeek];

  switch (habit.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      // Pour weekly, on suppose que c'est le premier jour de la semaine (Lundi)
      return dayOfWeek === 1;
    case 'custom':
      // Vérifie si aujourd'hui est dans les jours personnalisés
      return habit.customDays?.includes(todayName) ?? false;
    default:
      return true;
  }
};

/**
 * Prépare les données du widget à partir de l'état actuel
 */
export const prepareWidgetData = (
  habits: Habit[],
  totalXP: number,
  userName: string,
  globalStreak?: number
): WidgetData => {
  const today = getTodayString();

  // Filtre les habitudes prévues pour aujourd'hui
  const todayHabits = habits.filter(isHabitScheduledForToday);

  // Transforme les habitudes pour le widget
  const widgetHabits: WidgetHabit[] = todayHabits.map((habit) => {
    const isCompleted = habit.completedDays.includes(today);

    return {
      id: habit.id,
      title: habit.name,
      completed: isCompleted,
      streak: habit.currentStreak,
    };
  });

  // Calcule les stats du jour
  const completedToday = widgetHabits.filter((h) => h.completed).length;
  const totalToday = widgetHabits.length;

  // Calcule le streak global si non fourni
  const calculatedGlobalStreak =
    globalStreak ?? Math.max(0, ...habits.map((h) => h.currentStreak));

  return {
    habits: widgetHabits,
    completedToday,
    totalToday,
    globalStreak: calculatedGlobalStreak,
    totalXP,
    userName,
    lastUpdated: new Date().toISOString(),
  };
};

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Met à jour les données du widget iOS via UserDefaults partagé
 */
export const updateWidgetData = async (data: WidgetData): Promise<void> => {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    await SharedGroupPreferences.setItem(
      WIDGET_DATA_KEY,
      JSON.stringify(data),
      APP_GROUP_ID
    );
    console.log('[WidgetHelper] Widget data updated successfully');
  } catch (error) {
    console.error('[WidgetHelper] Erreur mise à jour widget:', error);
  }
};

/**
 * Fonction combinée pour préparer et envoyer les données au widget
 */
export const syncWidgetData = async (
  habits: Habit[],
  totalXP: number,
  userName: string,
  globalStreak?: number
): Promise<void> => {
  const widgetData = prepareWidgetData(habits, totalXP, userName, globalStreak);
  await updateWidgetData(widgetData);
};

/**
 * Efface les données du widget (utile lors de la déconnexion)
 */
export const clearWidgetData = async (): Promise<void> => {
  if (Platform.OS !== 'ios') {
    return;
  }

  try {
    const emptyData: WidgetData = {
      habits: [],
      completedToday: 0,
      totalToday: 0,
      globalStreak: 0,
      totalXP: 0,
      userName: '',
      lastUpdated: new Date().toISOString(),
    };
    await SharedGroupPreferences.setItem(
      WIDGET_DATA_KEY,
      JSON.stringify(emptyData),
      APP_GROUP_ID
    );
    console.log('[WidgetHelper] Widget data cleared');
  } catch (error) {
    console.error('[WidgetHelper] Erreur suppression données widget:', error);
  }
};
