// services/groupService.ts
import { supabase } from '@/lib/supabase';
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

interface CreateGroupResponse {
  success: boolean;
  group_id?: string;
  invite_code?: string;
  error?: string;
}

class GroupService {
  // ============================================
  // GROUPES - CRUD
  // ============================================

  /**
   * ✅ OPTIMISÉ: Charge uniquement les groupes de l'utilisateur
   */
  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    // Étape 1 : Récupérer les IDs des groupes de l'utilisateur
    const { data: memberships, error: memberError } = await supabase.from('group_members').select('group_id').eq('user_id', userId);

    if (memberError) throw memberError;

    const groupIds = memberships?.map((m) => m.group_id) || [];

    if (groupIds.length === 0) return [];

    // Étape 2 : Récupérer les groupes AVEC TOUS LES MEMBRES
    const { data: groups, error } = await supabase
      .from('groups')
      .select(
        `
        *,
        members:group_members(
          id,
          user_id,
          role,
          joined_at,
          profile:profiles(id, username, email, avatar_emoji, avatar_color, subscription_tier)
        )
      `
      )
      .in('id', groupIds)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    console.log('📦 getUserGroups RAW data:', groups);

    // Enrichir avec les infos calculées
    return Promise.all(
      (groups || []).map(async (group) => {
        console.log(`👥 Group "${group.name}" members:`, group.members);
        const isCreator = group.created_by === userId;

        // Mapper les membres correctement
        const mappedMembers = (group.members || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          role: m.role || (m.user_id === group.created_by ? 'creator' : 'member'),
          joined_at: m.joined_at,
          profile: m.profile,
        }));

        console.log(`✅ Mapped members for "${group.name}":`, mappedMembers);

        return {
          ...group,
          members: mappedMembers,
          members_count: mappedMembers.length,
          current_streak: group.current_streak || 0,
          is_creator: isCreator,
        };
      })
    );
  }

  /**
   * ✅ NOUVEAU: Charge UN SEUL groupe (pour le Dashboard)
   * Plus rapide et évite les race conditions
   */
  async getGroupById(groupId: string, userId: string): Promise<GroupWithMembers | null> {
    try {
      const { data: group, error } = await supabase
        .from('groups')
        .select(
          `
          *,
          members:group_members(
            *,
            profile:profiles(id, username, email, avatar_emoji, avatar_color, subscription_tier)
          )
        `
        )
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        return null;
      }

      if (!group) return null;

      // Vérifier que l'utilisateur est membre
      const isMember = group.members?.some((m: any) => m.user_id === userId);
      if (!isMember) {
        console.warn('User is not a member of this group');
        return null;
      }

      // Enrichir avec les infos calculées
      const streak = await this.calculateGroupStreak(group.id);
      const isCreator = group.created_by === userId;

      return {
        ...group,
        members_count: group.members?.length || 0,
        current_streak: streak,
        is_creator: isCreator,
      };
    } catch (error) {
      console.error('Error in getGroupById:', error);
      return null;
    }
  }

  async createGroup(userId: string, input: CreateGroupInput): Promise<Group> {
    // Utiliser la fonction SQL qui gère RLS et l'ajout du membre
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

    // Récupérer le groupe créé
    const { data: group, error: fetchError } = await supabase.from('groups').select('*').eq('id', result.group_id).single();

    if (fetchError) throw fetchError;

    return group;
  }

  /**
   * ✅ FIXED: Accepte string OU JoinGroupInput
   * Gère les erreurs de la DB proprement
   */
  async joinGroup(userId: string, inviteCodeOrInput: string | JoinGroupInput): Promise<JoinGroupResponse> {
    // Normaliser l'input
    const inviteCode = typeof inviteCodeOrInput === 'string' ? inviteCodeOrInput : inviteCodeOrInput.invite_code;

    // Validation
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
        console.error('❌ Supabase RPC error:', error);
        throw new Error(error.message || 'Failed to join group');
      }

      if (!data) {
        throw new Error('No data returned from join operation');
      }

      console.log('✅ Join group RPC response:', data);

      // ✅ Parser la réponse JSONB de PostgreSQL
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      console.log('✅ Parsed result:', result);
      console.log('✅ Result success:', result.success);

      // Vérifier si l'opération a réussi
      if (!result.success) {
        console.log('❌ Join failed with error:', result.error);
        throw new Error(result.error || 'Failed to join group');
      }

      // Vérifier que group_id existe
      if (!result.group_id) {
        throw new Error('Invalid response: missing group_id');
      }

      return {
        success: true,
        group_id: result.group_id,
        message: result.message || 'Successfully joined group',
      };
    } catch (error: any) {
      console.error('❌ Join group error:', error);

      // Re-throw avec message propre
      throw new Error(error.message || 'An unexpected error occurred while joining the group');
    }
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);

    if (error) throw error;
  }

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    // Vérifier que l'utilisateur est le créateur
    const { data: group } = await supabase.from('groups').select('created_by').eq('id', groupId).single();

    if (group?.created_by !== userId) {
      throw new Error('Only the group creator can delete the group');
    }

    const { error } = await supabase.from('groups').delete().eq('id', groupId);

    if (error) throw error;
  }

  async updateGroup(groupId: string, userId: string, updates: Partial<Pick<Group, 'name' | 'emoji'>>): Promise<Group> {
    const { data, error } = await supabase.from('groups').update(updates).eq('id', groupId).eq('created_by', userId).select().single();

    if (error) throw error;
    return data;
  }

  // ============================================
  // HABITUDES DE GROUPE - CRUD
  // ============================================

  async getGroupHabits(groupId: string): Promise<GroupHabitWithCompletions[]> {
    const { data: habits, error } = await supabase
      .from('group_habits')
      .select(
        `
        *,
        completions:group_habit_completions(
          *,
          profile:profiles(id, username, avatar_emoji, avatar_color)
        )
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Récupérer le nombre total de membres
    const { count: membersCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', groupId);

    const today = new Date().toISOString().split('T')[0];

    return (habits || []).map((habit) => {
      const todayCompletions = habit.completions?.filter((c: GroupHabitCompletion) => c.date === today) || [];

      return {
        ...habit,
        completions_today: todayCompletions.length,
        total_members: membersCount || 0,
      };
    });
  }

  async createGroupHabit(userId: string, input: CreateGroupHabitInput): Promise<GroupHabit> {
    const { data, error } = await supabase
      .from('group_habits')
      .insert({
        group_id: input.group_id,
        name: input.name,
        emoji: input.emoji,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteGroupHabit(habitId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('group_habits').delete().eq('id', habitId);

    if (error) throw error;
  }

  // ============================================
  // COMPLÉTIONS
  // ============================================

  async completeGroupHabit(userId: string, input: CompleteGroupHabitInput) {
    const date = input.date || new Date().toISOString().split('T')[0];

    // 1. Insérer la complétion
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

    // 2. Récupérer le group_id
    const { data: habit } = await supabase.from('group_habits').select('group_id').eq('id', input.group_habit_id).single();

    if (habit) {
      // 3. Ajouter +10 XP immédiatement
      await supabase.from('group_xp_transactions').insert({
        group_id: habit.group_id,
        amount: 10,
        reason: 'task_completion',
        date: date,
        metadata: { habit_id: input.group_habit_id, user_id: userId },
      });

      // 4. Mettre à jour le XP du groupe
      await supabase.rpc('update_group_xp_and_level', {
        group_uuid: habit.group_id,
      });
    }

    return completion;
  }

  async uncompleteGroupHabit(userId: string, habitId: string, date?: string): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // 1. Récupérer le group_id AVANT de supprimer
    const { data: habit } = await supabase.from('group_habits').select('group_id').eq('id', habitId).single();

    if (!habit) {
      throw new Error('Habit not found');
    }

    // 2. Supprimer la completion
    const { error, data: deletedCompletion } = await supabase.from('group_habit_completions').delete().eq('group_habit_id', habitId).eq('user_id', userId).eq('date', targetDate).select();

    if (error) throw error;

    // 3. ✅ FIX: Supprimer la transaction XP correspondante
    const { data: deletedXP, error: xpError } = await supabase
      .from('group_xp_transactions')
      .delete()
      .eq('group_id', habit.group_id)
      .eq('reason', 'task_completion')
      .eq('date', targetDate)
      .contains('metadata', { habit_id: habitId, user_id: userId })
      .select();

    if (xpError) console.error('❌ XP deletion error:', xpError);

    // 4. ✅ FIX: Recalculer l'XP du groupe
    const { data: updatedXP, error: updateError } = await supabase.rpc('update_group_xp_and_level', {
      group_uuid: habit.group_id,
    });

    if (updateError) console.error('❌ Update XP error:', updateError);
  }

  async getHabitCompletions(habitId: string, days: number = 7): Promise<GroupHabitCompletion[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('group_habit_completions')
      .select(
        `
        *,
        profile:profiles(id, username, avatar_emoji, avatar_color)
      `
      )
      .eq('group_habit_id', habitId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // RÉACTIONS
  // ============================================

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

  async removeReaction(userId: string, completionId: string): Promise<void> {
    const { error } = await supabase.from('group_reactions').delete().eq('completion_id', completionId).eq('user_id', userId);

    if (error) throw error;
  }

  async getCompletionReactions(completionId: string): Promise<GroupReaction[]> {
    const { data, error } = await supabase
      .from('group_reactions')
      .select(
        `
        *,
        profile:profiles(id, username, avatar_emoji, avatar_color)
      `
      )
      .eq('completion_id', completionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // STATISTIQUES & CALCULS
  // ============================================

  async calculateGroupStreak(groupId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_group_streak', {
      group_uuid: groupId,
    });

    if (error) throw error;
    return data as number;
  }

  async getGroupStats(groupId: string): Promise<GroupStats> {
    // Récupérer le streak du groupe
    const currentStreak = await this.calculateGroupStreak(groupId);

    // Récupérer les membres avec leurs streaks individuels
    const { data: members } = await supabase
      .from('group_members')
      .select(
        `
      user_id,
      profile:profiles(username, avatar_emoji, avatar_color)
    `
      )
      .eq('group_id', groupId);

    // TODO: Calculer les stats individuelles de chaque membre
    const memberStreaks = (members || []).map((m: any) => ({
      user_id: m.user_id,
      username: m.profile?.username || null,
      avatar_emoji: m.profile?.avatar_emoji || null,
      avatar_color: m.profile?.avatar_color || null,
      current_streak: 0, // À implémenter
      completions_this_week: 0, // À implémenter
    }));

    // ✨ NOUVEAU: Récupérer les streaks de chaque habit
    const { data: habits } = await supabase.from('group_habits').select('id, name, emoji, current_streak, longest_streak').eq('group_id', groupId).eq('is_active', true);

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
      total_completions: 0, // À implémenter
      completion_rate: 0, // À implémenter
      member_streaks: memberStreaks,
      habit_streaks: habitStreaks, // ✨ AJOUTÉ
    };
  }

  async getHabitTimeline(habitId: string, groupId: string, days: number = 7): Promise<TimelineDay[]> {
    const completions = await this.getHabitCompletions(habitId, days);

    const { data: members } = await supabase
      .from('group_members')
      .select(
        `
        user_id,
        profile:profiles(username, avatar_emoji, avatar_color)
      `
      )
      .eq('group_id', groupId);

    const groupMembers = members || [];
    const timeline: TimelineDay[] = [];
    const today = new Date();
    const dayNames = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];

      const dayCompletions = completions.filter((c) => c.date === dateStr);

      const timelineCompletions = groupMembers.map((member: any) => ({
        user_id: member.user_id,
        username: member.profile?.username || null,
        avatar_emoji: member.profile?.avatar_emoji || null,
        avatar_color: member.profile?.avatar_color || null,
        completed: dayCompletions.some((c) => c.user_id === member.user_id),
      }));

      timeline.push({
        date: dateStr,
        day_name: dayName,
        completions: timelineCompletions,
        all_completed: timelineCompletions.every((c) => c.completed),
        is_today: i === 0,
      });
    }

    return timeline;
  }

  // ============================================
  // VALIDATIONS & LIMITES
  // ============================================

  async canUserJoinGroup(userId: string): Promise<CanJoinGroupResponse> {
    // Compter les groupes de l'utilisateur
    const { count } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId);

    // Vérifier si premium
    const { data: profile } = await supabase.from('profiles').select('subscription_tier').eq('id', userId).single();

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
