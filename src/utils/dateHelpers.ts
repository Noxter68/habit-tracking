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
  const startingDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];

  // Ajouter des emplacements vides pour les jours avant le premier jour du mois
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Ajouter tous les jours du mois
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
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
