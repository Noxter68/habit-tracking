// src/services/leaderboardService.ts
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  username: string;
  email: string;
  total_xp: number;
  current_level: number;
  rank: number;
  avatar?: string;
  currentStreak?: number;
  perfectDays?: number;
  weeklyXP?: number; // XP earned this week
  isCurrentUser?: boolean;
}

export interface LeaderboardStats {
  totalUsers: number;
  averageXP: number;
  topXP: number;
}

export class LeaderboardService {
  /**
   * Get global leaderboard ranked by total XP
   * Includes current user's position even if outside top N
   */
  static async getGlobalLeaderboard(
    userId: string,
    limit: number = 50
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
    stats: LeaderboardStats;
  }> {
    try {
      // Get top users by total_xp
      const { data: topUsers, error: topError } = await supabase.from('profiles').select('id, username, email, total_xp, current_level').order('total_xp', { ascending: false }).limit(limit);

      if (topError) throw topError;

      // Get current user's rank
      const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', { p_user_id: userId });

      if (rankError) console.error('Error getting user rank:', rankError);
      const currentUserRank = rankData || 0;

      // Get user streak data (from habits)
      const { data: streakData } = await supabase
        .from('habits')
        .select('current_streak, user_id')
        .in('user_id', topUsers?.map((u) => u.id) || []);

      // Calculate best streak per user
      const streakMap = new Map<string, number>();
      streakData?.forEach((h) => {
        const current = streakMap.get(h.user_id) || 0;
        streakMap.set(h.user_id, Math.max(current, h.current_streak || 0));
      });

      // Get perfect days from habit_progression
      const { data: progressionData } = await supabase
        .from('habit_progression')
        .select('user_id, performance_metrics')
        .in('user_id', topUsers?.map((u) => u.id) || []);

      const perfectDaysMap = new Map<string, number>();
      progressionData?.forEach((p) => {
        const metrics = p.performance_metrics as any;
        const current = perfectDaysMap.get(p.user_id) || 0;
        perfectDaysMap.set(p.user_id, current + (metrics?.perfectDays || 0));
      });

      // Get weekly XP (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklyXPData } = await supabase
        .from('xp_transactions')
        .select('user_id, amount')
        .in('user_id', topUsers?.map((u) => u.id) || [])
        .gte('created_at', weekAgo.toISOString());

      const weeklyXPMap = new Map<string, number>();
      weeklyXPData?.forEach((xp) => {
        const current = weeklyXPMap.get(xp.user_id) || 0;
        weeklyXPMap.set(xp.user_id, current + xp.amount);
      });

      // Build leaderboard entries
      const leaderboard: LeaderboardEntry[] = (topUsers || []).map((user, index) => ({
        id: user.id,
        username: user.username || user.email.split('@')[0],
        email: user.email,
        total_xp: user.total_xp || 0,
        current_level: user.current_level || 1,
        rank: index + 1,
        avatar: this.generateAvatar(user.username || user.email),
        currentStreak: streakMap.get(user.id) || 0,
        perfectDays: perfectDaysMap.get(user.id) || 0,
        weeklyXP: weeklyXPMap.get(user.id) || 0,
        isCurrentUser: user.id === userId,
      }));

      // Add current user if not in top N
      const userInTop = leaderboard.some((u) => u.id === userId);
      if (!userInTop && currentUserRank > 0) {
        const { data: currentUser } = await supabase.from('profiles').select('id, username, email, total_xp, current_level').eq('id', userId).single();

        if (currentUser) {
          leaderboard.push({
            id: currentUser.id,
            username: currentUser.username || currentUser.email.split('@')[0],
            email: currentUser.email,
            total_xp: currentUser.total_xp || 0,
            current_level: currentUser.current_level || 1,
            rank: currentUserRank,
            avatar: this.generateAvatar(currentUser.username || currentUser.email),
            currentStreak: streakMap.get(currentUser.id) || 0,
            perfectDays: perfectDaysMap.get(currentUser.id) || 0,
            weeklyXP: weeklyXPMap.get(currentUser.id) || 0,
            isCurrentUser: true,
          });
        }
      }

      // Calculate stats
      const stats: LeaderboardStats = {
        totalUsers: topUsers?.length || 0,
        averageXP: topUsers?.length ? Math.round(topUsers.reduce((sum, u) => sum + (u.total_xp || 0), 0) / topUsers.length) : 0,
        topXP: topUsers?.[0]?.total_xp || 0,
      };

      return { leaderboard, currentUserRank, stats };
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        leaderboard: [],
        currentUserRank: 0,
        stats: { totalUsers: 0, averageXP: 0, topXP: 0 },
      };
    }
  }

  /**
   * Get weekly leaderboard (most XP this week)
   */
  static async getWeeklyLeaderboard(userId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get XP earned this week by user
      const { data: weeklyXP, error } = await supabase.from('xp_transactions').select('user_id, amount').gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      // Aggregate by user
      const xpByUser = new Map<string, number>();
      weeklyXP?.forEach((xp) => {
        const current = xpByUser.get(xp.user_id) || 0;
        xpByUser.set(xp.user_id, current + xp.amount);
      });

      // Get user profiles
      const userIds = Array.from(xpByUser.keys());
      const { data: users } = await supabase.from('profiles').select('id, username, email, total_xp, current_level').in('id', userIds);

      // Build leaderboard
      const leaderboard: LeaderboardEntry[] = (users || [])
        .map((user) => ({
          id: user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          total_xp: user.total_xp || 0,
          current_level: user.current_level || 1,
          rank: 0, // Will be assigned after sorting
          weeklyXP: xpByUser.get(user.id) || 0,
          isCurrentUser: user.id === userId,
        }))
        .sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0))
        .slice(0, limit)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      return [];
    }
  }

  private static generateAvatar(name: string): string {
    const words = name.split(/[\s@._-]/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
