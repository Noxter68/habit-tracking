// types/groups.types.ts
// Types TypeScript pour la feature groupes - AVEC STREAKS

export type GroupRole = 'creator' | 'member';

export type ReactionEmoji = '💪' | '🔥' | '👍' | '⭐';

// ============================================
// ✨ AJOUT: Propriétés streak dans Group
// ============================================
export interface Group {
  id: string;
  name: string;
  emoji: string;
  invite_code: string;
  level: number;
  xp: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // ✨ NOUVEAU: Streaks au niveau groupe
  current_streak: number;
  longest_streak: number;
  last_streak_break_date: string | null;
  failed_days_count: number;
  saving_team_once: number; // Streak saver collectif (premium)
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: UserProfile;
}

// ============================================
// ✨ AJOUT: Propriétés streak dans GroupHabit
// ============================================
export interface GroupHabit {
  id: string;
  group_id: string;
  name: string;
  emoji: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  frequency: 'daily' | 'weekly';
  duration: number | null;
  is_active: boolean;
  xp_per_completion: number;
  current_streak: number;
  longest_streak: number;
  last_streak_break_date: string | null;
  last_weekly_completion_date: string | null;
}

export interface GroupHabitCompletion {
  id: string;
  group_habit_id: string;
  user_id: string;
  date: string;
  completed_at: string;
  profile?: {
    id: string;
    username: string | null;
    avatar_emoji: string | null;
    avatar_color: string | null;
  };
}

export interface GroupReaction {
  id: string;
  completion_id: string;
  user_id: string;
  emoji: ReactionEmoji;
  created_at: string;
  profile?: UserProfile; // Populated via join
}

export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  subscription_tier: 'free' | 'premium';
}

// ============================================
// Types pour les réponses enrichies
// ============================================

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  members_count: number;
  // current_streak déjà dans Group (pas besoin de redéfinir)
  is_creator: boolean;
}

export interface GroupHabitWithCompletions extends GroupHabit {
  completions_today: number;
  total_members: number;
}

export interface CompletionWithReactions extends GroupHabitCompletion {
  reactions: GroupReaction[];
  reactions_count: number;
}

// ============================================
// ✨ NOUVEAU: Type pour les daily summaries
// ============================================
export interface GroupDailySummary {
  id: string;
  group_id: string;
  group_habit_id: string;
  date: string; // YYYY-MM-DD
  total_members: number;
  members_completed: number;
  completion_rate: number; // 0.0 - 1.0
  bonus_type: 'full' | 'reduced' | 'none';
  xp_earned: number;
  day_validated: boolean;
  partial_tolerance_used: boolean;
  is_streak_saved: boolean;
  created_at: string;
}

// ============================================
// ✨ NOUVEAU: Type pour les weekly summaries
// ============================================
export interface GroupWeeklySummary {
  id: string;
  group_id: string;
  week_start_date: string;
  week_end_date: string;
  days_validated: number; // 0-7
  all_week_validated: boolean;
  bonus_xp_earned: number;
  created_at: string;
}

// ============================================
// Types pour les requêtes/mutations
// ============================================

export interface CreateGroupInput {
  name: string;
  emoji: string;
}

export interface CreateGroupHabitInput {
  group_id: string;
  name: string;
  emoji: string;
  frequency: 'daily' | 'weekly';
  duration_minutes: number | null;
}

export interface JoinGroupInput {
  invite_code: string;
}

export interface CompleteGroupHabitInput {
  group_habit_id: string;
  date?: string; // Optional, defaults to today
}

export interface AddReactionInput {
  completion_id: string;
  emoji: ReactionEmoji;
}

// ============================================
// Types pour les réponses API
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JoinGroupResponse {
  success: boolean;
  group_id?: string;
  error?: string;
  message?: string;
  requires_premium?: boolean;
  current_count?: number;
  max_allowed?: number;
}

export interface CanJoinGroupResponse {
  can_join: boolean;
  reason?: string;
  current_count: number;
  max_allowed: number;
  requires_premium?: boolean;
}

export interface CanAddHabitResponse {
  can_add: boolean;
  reason?: string;
  current_count?: number;
  max_allowed?: number;
  unlimited?: boolean;
  requires_premium?: boolean;
}

// ============================================
// Types pour les statistiques
// ============================================

export interface GroupStats {
  group_id: string;
  current_streak: number;
  total_completions: number;
  completion_rate: number; // 0-100
  member_streaks: MemberStreak[];
  // ✨ NOUVEAU: Streaks par habit
  habit_streaks: HabitStreak[];
}

export interface MemberStreak {
  user_id: string;
  username: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  current_streak: number;
  completions_this_week: number;
}

// ✨ NOUVEAU: Streak par habit
export interface HabitStreak {
  habit_id: string;
  habit_name: string;
  habit_emoji: string;
  current_streak: number;
  longest_streak: number;
}

// ============================================
// Types pour le feed d'activité
// ============================================

export interface ActivityFeedItem {
  id: string;
  type: 'completion' | 'reaction' | 'milestone' | 'member_joined';
  group_id: string;
  user_id: string;
  username: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  created_at: string;
  data: CompletionActivity | ReactionActivity | MilestoneActivity | MemberJoinedActivity;
}

export interface CompletionActivity {
  habit_name: string;
  habit_emoji: string;
  is_all_complete: boolean; // True si tous les membres ont complété
}

export interface ReactionActivity {
  habit_name: string;
  emoji: ReactionEmoji;
  completion_user_id: string;
  completion_username: string | null;
}

export interface MilestoneActivity {
  milestone_type: 'streak' | 'level' | 'xp';
  value: number;
}

export interface MemberJoinedActivity {
  // Pas de données supplémentaires nécessaires
}

// ============================================
// Types pour les timelines (7 jours)
// ============================================

export interface TimelineDay {
  date: string;
  day_name: string;
  completions: TimelineCompletion[];
  all_completed: boolean;
  is_today: boolean;
  week_completed?: boolean; // Pour les habitudes weekly
}

export interface TimelineCompletion {
  user_id: string;
  username: string | null;
  avatar_emoji: string | null;
  avatar_color: string | null;
  completed: boolean;
}

// ============================================
// Types pour les limites premium
// ============================================

export interface GroupLimits {
  max_groups: number;
  current_groups: number;
  can_create_more: boolean;
  max_members_per_group: number;
  max_habits_per_group: number | 'unlimited';
  is_premium: boolean;
}

// ============================================
// ✨ NOUVEAU: Types pour les streak savers
// ============================================
export interface StreakSaveEligibility {
  can_save: boolean;
  has_personal_savers: boolean;
  has_team_saver: boolean;
  last_break_date: string | null;
  reason?: string;
}

export interface UseStreakSaverInput {
  group_id: string;
  saver_type: 'personal' | 'team';
}
