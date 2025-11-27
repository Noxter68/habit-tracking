/**
 * @file dateHelpers.ts
 * @description Utilitaires pour la manipulation et le formatage des dates.
 * Fournit des fonctions pour la comparaison de dates, le formatage d'affichage
 * et les calculs liés au calendrier.
 */

// =============================================================================
// FONCTIONS DE FORMATAGE
// =============================================================================

/**
 * Convertit une date en chaîne de caractères au format YYYY-MM-DD
 * en utilisant le fuseau horaire local.
 *
 * @param date - La date à convertir
 * @returns La date formatée au format YYYY-MM-DD
 *
 * @example
 * const dateStr = getLocalDateString(new Date('2024-01-15'));
 * // Retourne: "2024-01-15"
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD.
 *
 * @returns La date du jour formatée
 *
 * @example
 * const today = getTodayString();
 * // Retourne: "2024-01-15" (si aujourd'hui est le 15 janvier 2024)
 */
export const getTodayString = (): string => {
  return getLocalDateString(new Date());
};

/**
 * Formate une date pour un affichage long (jour de la semaine, mois, numéro).
 *
 * @param date - La date à formater
 * @returns La date formatée en anglais
 *
 * @example
 * const formatted = formatDateLong(new Date('2024-01-15'));
 * // Retourne: "Monday, January 15"
 */
export const formatDateLong = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formate une date en affichant uniquement le mois et l'année.
 *
 * @param date - La date à formater
 * @returns Le mois et l'année formatés
 *
 * @example
 * const monthYear = formatMonthYear(new Date('2024-01-15'));
 * // Retourne: "January 2024"
 */
export const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

// =============================================================================
// FONCTIONS DE COMPARAISON
// =============================================================================

/**
 * Vérifie si une date correspond à aujourd'hui.
 *
 * @param date - La date à vérifier
 * @returns true si la date est aujourd'hui, false sinon
 *
 * @example
 * const todayCheck = isToday(new Date());
 * // Retourne: true
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si deux dates correspondent au même jour.
 *
 * @param date1 - La première date
 * @param date2 - La deuxième date
 * @returns true si les deux dates sont le même jour, false sinon
 *
 * @example
 * const same = isSameDay(new Date('2024-01-15'), new Date('2024-01-15'));
 * // Retourne: true
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Vérifie si une date est dans le passé (excluant aujourd'hui).
 *
 * @param date - La date à vérifier
 * @returns true si la date est passée, false sinon
 *
 * @example
 * const past = isPastDate(new Date('2020-01-01'));
 * // Retourne: true
 */
export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

// =============================================================================
// FONCTIONS DE CALENDRIER
// =============================================================================

/**
 * Retourne tous les jours d'un mois avec des emplacements vides pour la grille du calendrier.
 * Les emplacements vides représentent les jours avant le premier jour du mois.
 * Les semaines commencent par lundi (0=Lundi, 6=Dimanche).
 *
 * @param date - Une date dans le mois souhaité
 * @returns Un tableau de dates (ou null pour les emplacements vides)
 *
 * @example
 * const days = getDaysInMonth(new Date('2024-01-01'));
 * // Retourne un tableau avec des nulls au début suivi des dates du mois
 */
export const getDaysInMonth = (date: Date): (Date | null)[] => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const days: (Date | null)[] = [];

  // Calculer le jour de la semaine du premier jour (0=Dimanche, 1=Lundi, etc.)
  // On veut que Lundi soit 0, donc on décale: (day + 6) % 7
  const firstDayOfWeek = firstDay.getDay();
  const mondayBasedFirstDay = (firstDayOfWeek + 6) % 7; // Lundi=0, Mardi=1, ..., Dimanche=6

  // Ajouter des emplacements vides au début pour aligner sur lundi
  for (let i = 0; i < mondayBasedFirstDay; i++) {
    days.push(null);
  }

  // Ajouter tous les jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Ajouter des emplacements vides à la fin pour compléter la dernière ligne
  const remainingSlots = days.length % 7;
  if (remainingSlots > 0) {
    for (let i = 0; i < 7 - remainingSlots; i++) {
      days.push(null);
    }
  }

  return days;
};

// =============================================================================
// FONCTIONS DE CALCUL TEMPOREL
// =============================================================================

/**
 * Calcule le nombre d'heures restantes jusqu'à minuit.
 * Utilisé pour le minuteur de réinitialisation des habitudes quotidiennes.
 *
 * @returns Le nombre d'heures jusqu'à minuit (arrondi au supérieur)
 *
 * @example
 * // À 10h00 -> retourne 14 (14 heures jusqu'à minuit)
 * // À 23h30 -> retourne 1 (30 minutes arrondies à 1 heure)
 * const hours = getHoursUntilMidnight();
 */
export const getHoursUntilMidnight = (): number => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  const diffMs = midnight.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  return diffHours;
};

// =============================================================================
// FONCTIONS POUR LES HABITUDES HEBDOMADAIRES
// =============================================================================

/**
 * Retourne le lundi de la semaine contenant la date donnée.
 * Utilise les semaines calendaires standard (lundi à dimanche).
 *
 * @param date - Date de référence
 * @returns Date du lundi à 00:00:00
 *
 * @example
 * const monday = getWeekStartMonday(new Date('2024-01-17')); // mercredi
 * // Retourne: Date du lundi 15 janvier 2024 à 00:00:00
 */
export const getWeekStartMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Convertit dimanche (0) en 7 pour un calcul basé sur lundi
  const dayFromMonday = day === 0 ? 7 : day;
  d.setDate(d.getDate() - (dayFromMonday - 1));
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calcule la date du prochain lundi à 00:01.
 * Utilisé pour le reset des habitudes hebdomadaires.
 *
 * @returns Date du prochain lundi à 00:01
 *
 * @example
 * const nextMonday = getNextMondayReset();
 */
export const getNextMondayReset = (): Date => {
  const today = new Date();
  const currentWeekStart = getWeekStartMonday(today);

  // Prochain lundi = lundi actuel + 7 jours
  const nextMonday = new Date(currentWeekStart);
  nextMonday.setDate(currentWeekStart.getDate() + 7);
  nextMonday.setHours(0, 1, 0, 0); // 00:01 du lundi

  return nextMonday;
};

/**
 * Vérifie si une habitude hebdomadaire est complétée pour la semaine calendaire actuelle.
 * Une semaine est considérée complète si au moins un jour a toutes les tâches complétées.
 *
 * @param dailyTasks - Les données de tâches quotidiennes de l'habitude
 * @param createdAt - Date de création de l'habitude
 * @returns true si la semaine est complétée, false sinon
 *
 * @example
 * const isComplete = isWeeklyHabitCompletedThisWeek(habit.dailyTasks, habit.createdAt);
 */
export const isWeeklyHabitCompletedThisWeek = (
  dailyTasks: Record<string, { completedTasks?: string[]; allCompleted?: boolean }> | undefined,
  createdAt: Date
): boolean => {
  const today = new Date();
  const weekStart = getWeekStartMonday(today);
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);

  // Vérifie chaque jour de la semaine calendaire (lundi à dimanche)
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);

    // Ignore les jours avant la création de l'habitude
    if (checkDate.getTime() < created.getTime()) {
      continue;
    }

    // Ignore les jours futurs
    if (checkDate.getTime() > today.getTime()) {
      continue;
    }

    const dateStr = getLocalDateString(checkDate);
    const dayData = dailyTasks?.[dateStr];

    if (dayData?.allCompleted) {
      return true;
    }
  }

  return false;
};

/**
 * Compte les tâches complétées cette semaine calendaire pour une habitude hebdomadaire.
 * Agrège toutes les tâches uniques complétées du lundi au dimanche.
 *
 * @param dailyTasks - Les données de tâches quotidiennes de l'habitude
 * @param createdAt - Date de création de l'habitude
 * @returns Le nombre de tâches uniques complétées cette semaine
 *
 * @example
 * const count = getWeeklyCompletedTasksCount(habit.dailyTasks, habit.createdAt);
 */
export const getWeeklyCompletedTasksCount = (
  dailyTasks: Record<string, { completedTasks?: string[]; allCompleted?: boolean }> | undefined,
  createdAt: Date
): number => {
  const today = new Date();
  const weekStart = getWeekStartMonday(today);
  const created = new Date(createdAt);
  created.setHours(0, 0, 0, 0);

  const weekTasksCompleted = new Set<string>();

  // Parcourt la semaine calendaire (lundi à dimanche)
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(weekStart);
    checkDate.setDate(weekStart.getDate() + i);

    // Ignore les jours avant la création de l'habitude
    if (checkDate.getTime() < created.getTime()) {
      continue;
    }

    // Ignore les jours futurs
    if (checkDate.getTime() > today.getTime()) {
      continue;
    }

    const dateStr = getLocalDateString(checkDate);
    const dayData = dailyTasks?.[dateStr];

    if (dayData?.completedTasks) {
      dayData.completedTasks.forEach((taskId: string) => weekTasksCompleted.add(taskId));
    }
  }

  return weekTasksCompleted.size;
};

/**
 * Formate une date selon la locale (langue) actuelle.
 * FR: DD/MM/YYYY, EN: MM/DD/YYYY
 *
 * @param date - La date à formater
 * @param locale - La locale ('fr' ou 'en')
 * @returns La date formatée selon la locale
 *
 * @example
 * const formatted = formatDateByLocale(new Date('2024-01-15'), 'en');
 * // Retourne: "01/15/2024"
 *
 * const formattedFr = formatDateByLocale(new Date('2024-01-15'), 'fr');
 * // Retourne: "15/01/2024"
 */
export const formatDateByLocale = (date: Date, locale: string): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  if (locale === 'fr') {
    return `${day}/${month}/${year}`;
  }

  // Default to English format (MM/DD/YYYY)
  return `${month}/${day}/${year}`;
};
