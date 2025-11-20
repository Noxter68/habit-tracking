/**
 * Service de gestion des groupes
 *
 * Ce service gere toutes les operations liees aux groupes d'habitudes:
 * creation, adhesion, gestion des habitudes de groupe, completions,
 * reactions, statistiques et timeline.
 *
 * @module GroupService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '@/lib/supabase';

// =============================================================================
// IMPORTS - Types
// =============================================================================
import type {
  Group,
  GroupWithMembers,
  GroupHabit,
  GroupHabitWithCompletions,
  GroupHabitCompletion,
  GroupReaction,
  CreateGroupInput,
  CreateGroupHabitInput,
  JoinGroupInput,
  JoinGroupResponse,
  CompleteGroupHabitInput,
  AddReactionInput,
  CanJoinGroupResponse,
  CanAddHabitResponse,
  GroupStats,
  TimelineDay,
} from '@/types/group.types';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Reponse de creation de groupe
 */
interface CreateGroupResponse {
  success: boolean;
  group_id?: string;
  invite_code?: string;
  error?: string;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des groupes
 *
 * Gere les operations CRUD sur les groupes, habitudes, completions et reactions
 */
class GroupService {
  // ===========================================================================
  // SECTION: CRUD des groupes
  // ===========================================================================

  /**
   * Recuperer les groupes de l'utilisateur
   * Optimise avec RPC pour les performances
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Liste des groupes avec leurs membres
   */
  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;

    const groupIds = memberships?.map((m) => m.group_id) || [];

    if (groupIds.length === 0) return [];

    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return Promise.all(
      (groups || []).map(async (group) => {
        const { data: members } = await supabase.rpc('get_group_members', {
          group_uuid: group.id,
        });

        const isCreator = group.created_by === userId;

        return {
          ...group,
          members: members || [],
          members_count: members?.length || 0,
          current_streak: group.current_streak || 0,
          is_creator: isCreator,
        };
      })
    );
  }

  /**
   * Recuperer un groupe par son ID
   * Optimise avec RPC pour les performances
   *
   * @param groupId - L'identifiant du groupe
   * @param userId - L'identifiant de l'utilisateur
   * @returns Le groupe avec ses membres ou null
   */
  async getGroupById(groupId: string, userId: string): Promise<GroupWithMembers | null> {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error || !group) {
        console.error('Error fetching group:', error);
        return null;
      }

      const { data: members, error: membersError } = await supabase.rpc('get_group_members', {
        group_uuid: groupId,
      });

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return null;
      }

      const isMember = members?.some((m: any) => m.user_id === userId);
      if (!isMember) {
        console.warn('User is not a member of this group');
        return null;
      }

      const streak = await this.calculateGroupStreak(groupId);
      const isCreator = group.created_by === userId;

      return {
        ...group,
        members: members || [],
        members_count: members?.length || 0,
        current_streak: streak,
        is_creator: isCreator,
      };
    } catch (error) {
      console.error('Error in getGroupById:', error);
      return null;
    }
  }

  /**
   * Creer un nouveau groupe
   *
   * @param userId - L'identifiant de l'utilisateur createur
   * @param input - Les donnees du groupe a creer
   * @returns Le groupe cree
   */
  async createGroup(userId: string, input: CreateGroupInput): Promise<Group> {
    const { data, error } = await supabase.rpc('create_group', {
      user_uuid: userId,
      group_name: input.name,
      group_emoji: input.emoji,
    });

    if (error) throw error;

    const result = data as CreateGroupResponse;

    if (!result.success || !result.group_id) {
      throw new Error(result.error || 'Failed to create group');
    }

    const { data: group, error: fetchError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', result.group_id)
      .single();

    if (fetchError) throw fetchError;

    return group;
  }

  /**
   * Rejoindre un groupe avec un code d'invitation
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param inviteCodeOrInput - Le code d'invitation ou l'objet d'entree
   * @returns La reponse avec le resultat de l'operation
   */
  async joinGroup(
    userId: string,
    inviteCodeOrInput: string | JoinGroupInput
  ): Promise<JoinGroupResponse> {
    const inviteCode =
      typeof inviteCodeOrInput === 'string' ? inviteCodeOrInput : inviteCodeOrInput.invite_code;

    if (!inviteCode || typeof inviteCode !== 'string' || inviteCode.trim().length === 0) {
      throw new Error('Invalid invite code format');
    }

    const cleanCode = inviteCode.trim().toUpperCase();

    if (cleanCode.length !== 6) {
      throw new Error('Invite code must be 6 characters');
    }

    try {
      const { data, error } = await supabase.rpc('join_group_with_code', {
        invite_code_param: cleanCode,
        user_id_param: userId,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw new Error(error.message || 'Failed to join group');
      }

      if (!data) {
        throw new Error('No data returned from join operation');
      }

      const result = typeof data === 'string' ? JSON.parse(data) : data;

      if (!result.success) {
        throw new Error(result.error || 'Failed to join group');
      }

      if (!result.group_id) {
        throw new Error('Invalid response: missing group_id');
      }

      return {
        success: true,
        group_id: result.group_id,
        message: result.message || 'Successfully joined group',
      };
    } catch (error: any) {
      console.error('Join group error:', error);
      throw new Error(error.message || 'An unexpected error occurred while joining the group');
    }
  }

  /**
   * Quitter un groupe
   * Optimise avec RPC pour les performances
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param groupId - L'identifiant du groupe
   */
  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const { data, error } = await supabase.rpc('remove_group_member', {
      group_uuid: groupId,
      member_user_id: userId,
    });

    if (error) throw error;

    const result = typeof data === 'string' ? JSON.parse(data) : data;

    if (!result.success) {
      throw new Error(result.error || 'Failed to leave group');
    }
  }

  /**
   * Supprimer un groupe (createur uniquement)
   *
   * @param groupId - L'identifiant du groupe
   * @param userId - L'identifiant de l'utilisateur
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const { data: group } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (group?.created_by !== userId) {
      throw new Error('Only the group creator can delete the group');
    }

    const { error } = await supabase.from('groups').delete().eq('id', groupId);

    if (error) throw error;
  }

  /**
   * Mettre a jour un groupe
   *
   * @param groupId - L'identifiant du groupe
   * @param userId - L'identifiant de l'utilisateur
   * @param updates - Les mises a jour a appliquer
   * @returns Le groupe mis a jour
   */
  async updateGroup(
    groupId: string,
    userId: string,
    updates: Partial<Pick<Group, 'name' | 'emoji'>>
  ): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ===========================================================================
  // SECTION: Habitudes de groupe - CRUD
  // ===========================================================================

  /**
   * Recuperer les habitudes d'un groupe
   *
   * @param groupId - L'identifiant du groupe
   * @returns Liste des habitudes avec leurs completions
   */
  async getGroupHabits(groupId: string): Promise<GroupHabitWithCompletions[]> {
    const { data: habits, error } = await supabase
      .from('group_habits')
      .select(`
        *,
        completions:group_habit_completions(
          *,
          profile:profiles(id, username, avatar_emoji, avatar_color)
        )
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const { count: membersCount } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    const today = new Date().toISOString().split('T')[0];

    return (habits || []).map((habit) => {
      const todayCompletions =
        habit.completions?.filter((c: GroupHabitCompletion) => c.date === today) || [];

      return {
        ...habit,
        completions_today: todayCompletions.length,
        total_members: membersCount || 0,
      };
    });
  }

  /**
   * Creer une habitude de groupe
   *
   * @param userId - L'identifiant de l'utilisateur createur
   * @param input - Les donnees de l'habitude a creer
   * @returns L'habitude creee
   */
  async createGroupHabit(userId: string, input: CreateGroupHabitInput): Promise<GroupHabit> {
    const { data, error } = await supabase
      .from('group_habits')
      .insert({
        group_id: input.group_id,
        name: input.name,
        emoji: input.emoji,
        created_by: userId,
        frequency: input.frequency,
        duration: input.duration_minutes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une habitude de groupe
   *
   * @param habitId - L'identifiant de l'habitude
   * @param userId - L'identifiant de l'utilisateur
   */
  async deleteGroupHabit(habitId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('group_habits').delete().eq('id', habitId);

    if (error) throw error;
  }

  // ===========================================================================
  // SECTION: Completions
  // ===========================================================================

  /**
   * Completer une habitude de groupe
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param input - Les donnees de completion
   * @returns La completion creee
   */
  async completeGroupHabit(
    userId: string,
    input: CompleteGroupHabitInput
  ): Promise<GroupHabitCompletion> {
    const date = input.date || new Date().toISOString().split('T')[0];

    const { data: completion, error } = await supabase
      .from('group_habit_completions')
      .insert({
        group_habit_id: input.group_habit_id,
        user_id: userId,
        date,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: habit } = await supabase
      .from('group_habits')
      .select('group_id, frequency')
      .eq('id', input.group_habit_id)
      .single();

    if (habit) {
      await supabase.from('group_xp_transactions').insert({
        group_id: habit.group_id,
        amount: 10,
        reason: 'task_completion',
        date: date,
        metadata: { habit_id: input.group_habit_id, user_id: userId },
      });

      await supabase.rpc('update_group_xp_and_level', {
        group_uuid: habit.group_id,
      });

      // Mettre à jour last_weekly_completion_date pour les habitudes weekly
      if (habit.frequency === 'weekly') {
        await supabase
          .from('group_habits')
          .update({ last_weekly_completion_date: date })
          .eq('id', input.group_habit_id);
      }
    }

    return completion;
  }

  /**
   * Annuler une completion d'habitude de groupe
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param habitId - L'identifiant de l'habitude
   * @param date - La date de la completion
   */
  async uncompleteGroupHabit(userId: string, habitId: string, date?: string): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data: habit } = await supabase
      .from('group_habits')
      .select('group_id, frequency, last_weekly_completion_date')
      .eq('id', habitId)
      .single();

    if (!habit) {
      throw new Error('Habit not found');
    }

    const { error } = await supabase
      .from('group_habit_completions')
      .delete()
      .eq('group_habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', targetDate);

    if (error) throw error;

    const { error: xpError } = await supabase
      .from('group_xp_transactions')
      .delete()
      .eq('group_id', habit.group_id)
      .eq('reason', 'task_completion')
      .eq('date', targetDate)
      .contains('metadata', { habit_id: habitId, user_id: userId });

    if (xpError) console.error('XP deletion error:', xpError);

    const { error: updateError } = await supabase.rpc('update_group_xp_and_level', {
      group_uuid: habit.group_id,
    });

    if (updateError) console.error('Update XP error:', updateError);

    // Réinitialiser last_weekly_completion_date si c'était la dernière completion de cette semaine
    if (habit.frequency === 'weekly' && habit.last_weekly_completion_date === targetDate) {
      await supabase
        .from('group_habits')
        .update({ last_weekly_completion_date: null })
        .eq('id', habitId);
    }
  }

  /**
   * Recuperer les completions d'une habitude
   *
   * @param habitId - L'identifiant de l'habitude
   * @param days - Le nombre de jours a recuperer
   * @returns Liste des completions
   */
  async getHabitCompletions(habitId: string, days: number = 7): Promise<GroupHabitCompletion[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('group_habit_completions')
      .select(`
        *,
        profile:profiles(id, username, avatar_emoji, avatar_color)
      `)
      .eq('group_habit_id', habitId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // SECTION: Reactions
  // ===========================================================================

  /**
   * Ajouter une reaction a une completion
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param input - Les donnees de la reaction
   * @returns La reaction creee
   */
  async addReaction(userId: string, input: AddReactionInput): Promise<GroupReaction> {
    const { data, error } = await supabase
      .from('group_reactions')
      .insert({
        completion_id: input.completion_id,
        user_id: userId,
        emoji: input.emoji,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Supprimer une reaction
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param completionId - L'identifiant de la completion
   */
  async removeReaction(userId: string, completionId: string): Promise<void> {
    const { error } = await supabase
      .from('group_reactions')
      .delete()
      .eq('completion_id', completionId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Recuperer les reactions d'une completion
   *
   * @param completionId - L'identifiant de la completion
   * @returns Liste des reactions
   */
  async getCompletionReactions(completionId: string): Promise<GroupReaction[]> {
    const { data, error } = await supabase
      .from('group_reactions')
      .select(`
        *,
        profile:profiles(id, username, avatar_emoji, avatar_color)
      `)
      .eq('completion_id', completionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ===========================================================================
  // SECTION: Statistiques et calculs
  // ===========================================================================

  /**
   * Calculer le streak d'un groupe
   *
   * @param groupId - L'identifiant du groupe
   * @returns Le streak actuel
   */
  async calculateGroupStreak(groupId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_group_streak', {
      group_uuid: groupId,
    });

    if (error) throw error;
    return data as number;
  }

  /**
   * Recuperer les statistiques du groupe
   * Optimise avec RPC pour les performances
   *
   * @param groupId - L'identifiant du groupe
   * @returns Les statistiques du groupe
   */
  async getGroupStats(groupId: string): Promise<GroupStats> {
    const currentStreak = await this.calculateGroupStreak(groupId);

    const { data: members } = await supabase.rpc('get_group_members', {
      group_uuid: groupId,
    });

    const memberStreaks = (members || []).map((m: any) => ({
      user_id: m.user_id,
      username: m.username || null,
      avatar_emoji: m.avatar_emoji || null,
      avatar_color: m.avatar_color || null,
      current_streak: 0,
      completions_this_week: 0,
    }));

    const { data: habits } = await supabase
      .from('group_habits')
      .select('id, name, emoji, current_streak, longest_streak')
      .eq('group_id', groupId)
      .eq('is_active', true);

    const habitStreaks = (habits || []).map((h: any) => ({
      habit_id: h.id,
      habit_name: h.name,
      habit_emoji: h.emoji,
      current_streak: h.current_streak || 0,
      longest_streak: h.longest_streak || 0,
    }));

    return {
      group_id: groupId,
      current_streak: currentStreak,
      total_completions: 0,
      completion_rate: 0,
      member_streaks: memberStreaks,
      habit_streaks: habitStreaks,
    };
  }

  /**
   * Recuperer la timeline d'une habitude
   * Timeline fixe: Lundi a Dimanche de la semaine en cours
   *
   * @param habitId - L'identifiant de l'habitude
   * @param groupId - L'identifiant du groupe
   * @param days - Le nombre de jours (par defaut 7)
   * @returns La timeline avec les completions
   */
  async getHabitTimeline(
    habitId: string,
    groupId: string,
    days: number = 7
  ): Promise<TimelineDay[]> {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setUTCDate(today.getUTCDate() - daysFromMonday);
    monday.setUTCHours(0, 0, 0, 0);

    const completions = await this.getHabitCompletions(habitId, 7);

    const { data: members } = await supabase.rpc('get_group_members', {
      group_uuid: groupId,
    });

    const groupMembers = members || [];
    const timeline: TimelineDay[] = [];
    const dayNames = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
    const todayStr = today.toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setUTCDate(monday.getUTCDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[i];

      const dayCompletions = completions.filter((c) => c.date === dateStr);

      const timelineCompletions = groupMembers.map((member: any) => {
        const completed = dayCompletions.some((c) => c.user_id === member.user_id);

        return {
          user_id: member.user_id,
          username: member.username || null,
          avatar_emoji: member.avatar_emoji || null,
          avatar_color: member.avatar_color || null,
          completed: completed,
        };
      });

      timeline.push({
        date: dateStr,
        day_name: dayName,
        completions: timelineCompletions,
        all_completed: timelineCompletions.every((c) => c.completed),
        is_today: dateStr === todayStr,
      });
    }

    return timeline;
  }

  // ===========================================================================
  // SECTION: Validations et limites
  // ===========================================================================

  /**
   * Verifier si un utilisateur peut rejoindre un groupe
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns La reponse avec la possibilite et les limites
   */
  async canUserJoinGroup(userId: string): Promise<CanJoinGroupResponse> {
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const isPremium = profile?.subscription_tier === 'premium';
    const maxGroups = isPremium ? 5 : 1;
    const currentCount = count || 0;

    return {
      can_join: currentCount < maxGroups,
      reason: currentCount >= maxGroups ? 'Limite de groupes atteinte' : undefined,
      current_count: currentCount,
      max_allowed: maxGroups,
      requires_premium: !isPremium,
    };
  }

  /**
   * Verifier si un groupe peut ajouter une habitude
   *
   * @param groupId - L'identifiant du groupe
   * @param creatorId - L'identifiant du createur
   * @returns La reponse avec la possibilite et les limites
   */
  async canGroupAddHabit(groupId: string, creatorId: string): Promise<CanAddHabitResponse> {
    const { data, error } = await supabase.rpc('can_group_add_habit', {
      group_uuid: groupId,
      creator_uuid: creatorId,
    });

    if (error) throw error;
    return data as CanAddHabitResponse;
  }
}

export const groupService = new GroupService();
