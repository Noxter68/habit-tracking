// src/hooks/useHabitHelpers.ts
import { useTranslation } from 'react-i18next';
import { HabitType } from '../types';
import { getQuotes, getTips, getHabitTypes, getGoodCategories, getBadCategories, getCategories, getCategoryName, getTasksForCategory } from '../utils/habitHelpers';

/**
 * Hook personnalisé pour obtenir les helpers d'habitudes traduits
 * Se met à jour automatiquement quand la langue change
 */
export const useHabitHelpers = () => {
  const { i18n } = useTranslation();

  // Force le recalcul quand la langue change
  const currentLanguage = i18n.language;

  return {
    quotes: getQuotes(),
    tips: getTips(),
    habitTypes: getHabitTypes(),
    goodCategories: getGoodCategories(),
    badCategories: getBadCategories(),
    getCategories,
    getCategoryName,
    getTasksForCategory,
    currentLanguage,
  };
};

/**
 * Hook simple pour une catégorie spécifique
 */
export const useCategory = (category: string, type: HabitType) => {
  const { i18n } = useTranslation();

  return {
    name: getCategoryName(category, type),
    tasks: getTasksForCategory(category, type),
  };
};

/**
 * Hook pour les quotes
 */
export const useQuotes = () => {
  const { i18n } = useTranslation();
  return getQuotes();
};

/**
 * Hook pour les tips
 */
export const useTips = () => {
  const { i18n } = useTranslation();
  return getTips();
};
