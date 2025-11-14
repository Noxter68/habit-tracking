// services/groupService.ts
// Service principal pour gérer les groupes d'habitudes

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

class GroupService {
  // ============================================
  // GROUPES - CRUD
  // ============================================

  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    const { data: groups, error } = await supabase
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
      .eq('group_members.user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Enrichir avec les infos calculées
    return Promise.all(
      (groups || []).map(async (group) => {
        const streak = await this.calculateGroupStreak(group.id);
        const isCreator = group.created_by === userId;

        return {
          ...group,
          members_count: group.members?.length || 0,
          current_streak: streak,
          is_creator: isCreator,
        };
      })
    );
  }

  async createGroup(userId: string, input: CreateGroupInput): Promise<Group> {
    // Générer le code d'invitation via la fonction SQL
    const { data: codeData, error: codeError } = await supabase.rpc('generate_unique_invite_code');

    if (codeError) throw codeError;

    const inviteCode = codeData as string;

    // Créer le groupe (le trigger va auto-ajouter le créateur comme membre)
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: input.name,
        emoji: input.emoji,
        invite_code: inviteCode,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return group;
  }

  async joinGroup(userId: string, input: JoinGroupInput): Promise<JoinGroupResponse> {
    const { data, error } = await supabase.rpc('join_group_with_code', {
      invite_code_param: input.invite_code.toUpperCase(),
      user_id_param: userId,
    });

    if (error) throw error;
    return data as JoinGroupResponse;
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
    // La RLS policy vérifie que l'user est soit le créateur de l'habit soit du groupe
    const { error } = await supabase.from('group_habits').delete().eq('id', habitId);

    if (error) throw error;
  }

  // ============================================
  // COMPLÉTIONS
  // ============================================

  async completeGroupHabit(userId: string, input: CompleteGroupHabitInput): Promise<GroupHabitCompletion> {
    const date = input.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('group_habit_completions')
      .insert({
        group_habit_id: input.group_habit_id,
        user_id: userId,
        date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async uncompleteGroupHabit(userId: string, habitId: string, date?: string): Promise<void> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('group_habit_completions').delete().eq('group_habit_id', habitId).eq('user_id', userId).eq('date', targetDate);

    if (error) throw error;
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
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ============================================
  // CALCULS & STATISTIQUES
  // ============================================

  async calculateGroupStreak(groupId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_group_streak', { group_uuid: groupId });

    if (error) throw error;
    return data as number;
  }

  async getGroupStats(groupId: string): Promise<GroupStats> {
    // Récupérer les membres avec leur profil
    const { data: members } = await supabase
      .from('group_members')
      .select(
        `
        user_id,
        profiles!inner(id, username, avatar_emoji, avatar_color)
      `
      )
      .eq('group_id', groupId);

    // Récupérer d'abord les IDs des habitudes du groupe
    const { data: groupHabits } = await supabase.from('group_habits').select('id').eq('group_id', groupId);

    const habitIds = groupHabits?.map((h) => h.id) || [];

    // Récupérer toutes les complétions pour ces habitudes
    const { data: completions } = await supabase.from('group_habit_completions').select('*').in('group_habit_id', habitIds);

    const currentStreak = await this.calculateGroupStreak(groupId);
    const totalCompletions = completions?.length || 0;

    // Calculer les streaks individuels et stats cette semaine
    const memberStreaks = await Promise.all(
      (members || []).map(async (member: any) => {
        const profile = member.profiles;
        const userCompletions = completions?.filter((c) => c.user_id === member.user_id) || [];

        // Calculer streak individuel (simplifié)
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const hasCompletion = userCompletions.some((c) => c.date === dateStr);
          if (!hasCompletion) break;
          streak++;
        }

        // Complétions cette semaine
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        const completionsThisWeek = userCompletions.filter((c) => c.date >= weekAgoStr).length;

        return {
          user_id: member.user_id,
          username: profile?.username || null,
          avatar_emoji: profile?.avatar_emoji || null,
          avatar_color: profile?.avatar_color || null,
          current_streak: streak,
          completions_this_week: completionsThisWeek,
        };
      })
    );

    return {
      group_id: groupId,
      current_streak: currentStreak,
      total_completions: totalCompletions,
      completion_rate: 0, // À calculer selon besoin
      member_streaks: memberStreaks,
    };
  }

  // ============================================
  // TIMELINE (7 jours)
  // ============================================

  async getHabitTimeline(habitId: string, days: number = 7): Promise<TimelineDay[]> {
    const completions = await this.getHabitCompletions(habitId, days);

    const { data: members } = await supabase
      .from('group_habits')
      .select(
        `
        group_id,
        group:groups!inner(
          members:group_members(
            user_id,
            profile:profiles(id, username, avatar_emoji, avatar_color)
          )
        )
      `
      )
      .eq('id', habitId)
      .single();

    const groupMembers = members?.group?.members || [];
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
    const { data, error } = await supabase.rpc('can_user_join_group', { user_uuid: userId });

    if (error) throw error;
    return data as CanJoinGroupResponse;
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
