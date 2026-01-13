// Quest System Types

export type QuestCategory = 'constance' | 'equilibre' | 'resilience' | 'exploration' | 'philosophie';

export type QuestMetricType =
  | 'days_with_habit' // Jours avec au moins 1 habitude complétée
  | 'total_completions' // Nombre total de complétions d'habitudes
  | 'total_task_completions' // Nombre total de tâches complétées
  | 'same_habit_days' // Jours consécutifs sur une même habitude (streak)
  | 'min_habits_over_days' // X habitudes sur Y jours
  | 'distinct_habits' // Nombre d'habitudes distinctes complétées
  | 'perfect_days' // Jours avec toutes les tâches complétées (daily challenge)
  | 'comeback_after_pause' // Reprendre après une pause
  | 'best_streak' // Meilleur streak atteint
  | 'weekly_completions' // Complétions sur 7 jours glissants
  | 'app_rated'; // A noté l'application

export type RewardKind = 'XP' | 'BOOST' | 'TITLE';

export interface BoostReward {
  type: 'HABIT_XP'; // Pour l'instant uniquement ce type
  percent: 10 | 15 | 20 | 25;
  durationHours: 12 | 24 | 48 | 72;
}

export interface TitleReward {
  key: string; // i18n key pour le titre
}

export type QuestReward =
  | { kind: 'XP'; amount: number }
  | { kind: 'BOOST'; boost: BoostReward }
  | { kind: 'TITLE'; title: TitleReward };

export interface QuestParams {
  daysWindow?: number; // Fenêtre de jours à considérer (ex: 7, 30)
  daysRequired?: number; // Nombre de jours requis (pour min_habits_over_days)
  minHabitsPerDay?: number | 'dynamic'; // Nombre d'habitudes minimum par jour
  habitId?: string; // ID d'une habitude spécifique (optionnel)
  minDaysBetween?: number; // Jours minimum entre deux événements
  [key: string]: any; // Flexibilité pour futurs paramètres
}

export interface Quest {
  id: string;
  category: QuestCategory;
  name_key: string; // i18n key
  description_short_key: string; // i18n key
  description_long_key: string; // i18n key
  metric_type: QuestMetricType;
  target_value: number; // Valeur cible par défaut
  is_dynamic: boolean; // Si true, target est ajusté selon le nombre d'habitudes
  dynamic_percentage?: number; // Pourcentage pour l'ajustement dynamique (ex: 0.6 = 60%)
  params?: QuestParams; // Paramètres additionnels
  reward: QuestReward;
  is_active: boolean;
  is_hidden: boolean; // Quêtes secrètes
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserQuestProgress {
  user_id: string;
  achievement_quest_id: string;
  progress_value: number; // Valeur actuelle de progression
  progress_value2?: number; // Deuxième métrique si nécessaire (ex: jours validés)
  is_completed: boolean;
  completed_at?: Date;
  is_pinned: boolean; // Épinglé (max 5)
  pinned_at?: Date;
  last_updated_at: Date;

  // Relation (populated via join)
  quest?: Quest;
}

// Inventory Types
export type InventoryItemType = 'BOOST' | 'TITLE';

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: InventoryItemType;
  item_data: BoostReward | TitleReward; // JSON data
  source: 'quest_reward' | 'purchase' | 'event';
  source_id?: string; // Quest ID qui a donné la récompense
  is_consumed: boolean;
  consumed_at?: Date;
  activated_at?: Date; // Pour les boosts actifs
  expires_at?: Date; // Fin du boost
  created_at: Date;
}

export interface ActiveBoost {
  user_id: string;
  inventory_item_id: string;
  boost_type: 'HABIT_XP';
  boost_percent: 10 | 15 | 20 | 25;
  activated_at: Date;
  expires_at: Date;
  created_at: Date;

  // Relation (populated via join)
  inventory_item?: InventoryItem;
}

// Frontend Display Types
export interface QuestWithProgress extends Quest {
  user_progress?: UserQuestProgress;
  adjusted_target?: number; // Target ajusté dynamiquement
  progress_percentage?: number; // Calculé côté frontend
}

export interface QuestCompletionResult {
  quest_id: string;
  completed: boolean;
  reward?: QuestReward;
  message?: string;
}
