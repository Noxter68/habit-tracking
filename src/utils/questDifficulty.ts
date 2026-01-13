/**
 * @file questDifficulty.ts
 * @description Système de difficulté pour les quêtes avec couleurs du tierTheme
 */

import { achievementTierThemes } from './tierTheme';

export type QuestDifficulty = 'common' | 'easy' | 'hard' | 'epic';

interface QuestDifficultyTheme {
  borderColor: string;
  borderColorLight: string;
  backgroundGradient: [string, string, string];
  progressBarBg: string;
  progressBarFill: string;
  textColor: string;
  gemName: string;
  gemImage: any;
  texture: any;
}

/**
 * Thèmes visuels par difficulté basés sur les tiers
 */
export const questDifficultyThemes: Record<QuestDifficulty, QuestDifficultyTheme> = {
  // Commun = Topaz (orange/brun) - par défaut
  common: {
    borderColor: '#f59e0b',
    borderColorLight: '#fbbf24',
    backgroundGradient: ['#fffbeb', '#fef3c7', '#fde68a'],
    progressBarBg: '#fef3c7',
    progressBarFill: '#f59e0b',
    textColor: '#92400e',
    gemName: 'Topaz',
    gemImage: require('../../assets/interface/quest-topaz.png'),
    texture: require('../../assets/interface/progressBar/topaz-texture.png'),
  },
  // Facile = Jade (vert)
  easy: {
    borderColor: '#10b981',
    borderColorLight: '#34d399',
    backgroundGradient: ['#f0fdf4', '#dcfce7', '#bbf7d0'],
    progressBarBg: '#dcfce7',
    progressBarFill: '#10b981',
    textColor: '#065f46',
    gemName: 'Jade',
    gemImage: require('../../assets/interface/quest-jade.png'),
    texture: require('../../assets/interface/progressBar/jade-texture.png'),
  },
  // Difficile = Obsidian (violet foncé)
  hard: {
    borderColor: '#4338ca',
    borderColorLight: '#6366f1',
    backgroundGradient: ['#0f0a1a', '#1a1625', '#2d1b3d'],
    progressBarBg: '#312e81',
    progressBarFill: '#6366f1',
    textColor: '#c7d2fe',
    gemName: 'Obsidian',
    gemImage: require('../../assets/interface/quest-obsidian.png'),
    texture: require('../../assets/interface/progressBar/obsidian-texture.png'),
  },
  // Épique = Celeste (bleu clair)
  epic: {
    borderColor: '#3f7eea',
    borderColorLight: '#8ec5ff',
    backgroundGradient: ['#e0f2ff', '#bae6fd', '#7dd3fc'],
    progressBarBg: '#bae6fd',
    progressBarFill: '#3f7eea',
    textColor: '#0c4a6e',
    gemName: 'Celeste',
    gemImage: require('../../assets/interface/gems/celeste-gem.png'),
    texture: require('../../assets/interface/progressBar/celeste-texture.png'),
  },
};

/**
 * Mapping des quest_id vers leur difficulté
 * Basé sur la complexité et la durée nécessaire
 */
export const questDifficultyMap: Record<string, QuestDifficulty> = {
  // EASY (Quêtes courtes et simples)
  seven_sparks: 'easy',
  habit_anchor: 'easy',
  the_50_mark: 'easy',
  task_rookie: 'easy',
  weekly_habit_bloom: 'easy',
  weekly_task_bloom: 'easy',
  habit_diversity: 'easy',
  balanced_trio: 'easy',
  ten_day_wave: 'easy',
  gentle_pace: 'easy',
  variety_5: 'easy',
  new_habit_touch: 'easy',
  smooth_return: 'easy',

  // COMMON (Quêtes communes - difficulté moyenne)
  two_weeks_gentle: 'common',
  thirty_days_drift: 'common',
  habit_ritual: 'common',
  weekly_presence: 'common',
  the_200_mark: 'common',
  task_veteran: 'common',
  task_master: 'common',
  habit_collector: 'common',
  twenty_one_day_current: 'common',
  focus_champion: 'common',
  dedication_master: 'common',
  busy_week: 'common',
  super_day: 'common',
  steady_climber: 'common',
  balanced_path: 'common',
  balanced_endurance: 'common',
  balanced_week: 'common',
  calm_builder: 'common',
  rest_friendly: 'common',
  variety_10: 'common',
  comeback_i: 'common',
  forgotten_habit: 'common',
  rare_path: 'common',

  // HARD (Quêtes difficiles et longues)
  the_500_mark: 'hard',
  long_road: 'hard',
  habit_universe: 'hard',
  marathon_flow: 'hard',
  century_current: 'hard',
  ritual_keeper: 'hard',
  ultra_day: 'hard',
  monthly_foundation: 'hard',
  no_perfection_needed: 'hard',
  small_steps: 'hard',
  comeback_ii: 'hard',
  patchwork: 'hard',
  back_on_track: 'hard',
  second_wind: 'hard',
  recovery_loop: 'hard',
  variety_scaler: 'hard',

  // EPIC (Quêtes légendaires)
  task_legend: 'epic',
  consistent_explorer: 'epic',
};

/**
 * Récupère la difficulté d'une quête par son ID
 */
export const getQuestDifficulty = (questId: string): QuestDifficulty => {
  return questDifficultyMap[questId] || 'common';
};

/**
 * Récupère le thème visuel d'une quête
 */
export const getQuestTheme = (questId: string): QuestDifficultyTheme => {
  const difficulty = getQuestDifficulty(questId);
  return questDifficultyThemes[difficulty];
};
