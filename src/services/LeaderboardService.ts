/**
 * Service de gestion du classement (leaderboard)
 *
 * Ce service gere les classements globaux et hebdomadaires des utilisateurs
 * bases sur leurs XP totaux et hebdomadaires. Il inclut les statistiques
 * detaillees comme les streaks, les jours parfaits et les XP de la semaine.
 *
 * @module LeaderboardService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import { supabase } from '@/lib/supabase';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';
import { getCountryFromTimezone } from '@/utils/timezoneToCountry';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Entree du classement
 */
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
  weeklyXP?: number;
  isCurrentUser?: boolean;
  timezone_offset?: number;
  localRank?: number; // Rang dans le classement local (même pays)
}

/**
 * Statistiques du classement
 */
export interface LeaderboardStats {
  totalUsers: number;
  averageXP: number;
  topXP: number;
}

/**
 * Statistiques globales et locales de l'utilisateur
 */
export interface UserRankStats {
  globalRank: number; // Rang mondial
  globalTotal: number; // Nombre total d'utilisateurs dans le monde
  localRank: number; // Rang dans le pays
  localTotal: number; // Nombre total d'utilisateurs dans le pays
  percentile: number; // Pourcentage (ex: "meilleur que 85% des utilisateurs")
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion du classement
 *
 * Gere les classements globaux et hebdomadaires
 */
export class LeaderboardService {
  // ===========================================================================
  // SECTION: Classement global
  // ===========================================================================

  /**
   * Recuperer le classement global par XP total
   * Affiche le top 20 + l'utilisateur courant s'il est en dehors du top 20
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param limit - Le nombre maximum d'entrees (par defaut 20)
   * @returns Le classement, le rang de l'utilisateur et les statistiques
   */
  static async getGlobalLeaderboard(
    userId: string,
    limit: number = 20
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
    stats: LeaderboardStats;
  }> {
    try {
      const { data: topUsers, error: topError } = await supabase
        .from('profiles')
        .select('id, username, email, total_xp, current_level, timezone_offset')
        .order('total_xp', { ascending: false })
        .limit(limit);

      if (topError) throw topError;

      const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', {
        p_user_id: userId,
      });

      if (rankError) Logger.error('Error getting user rank:', rankError);
      const currentUserRank = rankData || 0;

      const { data: streakData } = await supabase
        .from('habits')
        .select('current_streak, user_id')
        .in('user_id', topUsers?.map((u) => u.id) || []);

      const streakMap = new Map<string, number>();
      streakData?.forEach((h) => {
        const current = streakMap.get(h.user_id) || 0;
        streakMap.set(h.user_id, Math.max(current, h.current_streak || 0));
      });

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
        timezone_offset: (user as any).timezone_offset,
      }));

      const userInTop = leaderboard.some((u) => u.id === userId);
      if (!userInTop && currentUserRank > 0) {
        const { data: currentUser } = await supabase
          .from('profiles')
          .select('id, username, email, total_xp, current_level, timezone_offset')
          .eq('id', userId)
          .single();

        if (currentUser) {
          const { data: userStreakData } = await supabase
            .from('habits')
            .select('current_streak')
            .eq('user_id', userId);

          const maxStreak = Math.max(...(userStreakData?.map((h) => h.current_streak || 0) || [0]));

          const { data: userProgressionData } = await supabase
            .from('habit_progression')
            .select('performance_metrics')
            .eq('user_id', userId);

          const totalPerfectDays =
            userProgressionData?.reduce((sum, p) => {
              const metrics = p.performance_metrics as any;
              return sum + (metrics?.perfectDays || 0);
            }, 0) || 0;

          const { data: userWeeklyXPData } = await supabase
            .from('xp_transactions')
            .select('amount')
            .eq('user_id', userId)
            .gte('created_at', weekAgo.toISOString());

          const userWeeklyXP = userWeeklyXPData?.reduce((sum, xp) => sum + xp.amount, 0) || 0;

          leaderboard.push({
            id: currentUser.id,
            username: currentUser.username || currentUser.email.split('@')[0],
            email: currentUser.email,
            total_xp: currentUser.total_xp || 0,
            current_level: currentUser.current_level || 1,
            rank: currentUserRank,
            avatar: this.generateAvatar(currentUser.username || currentUser.email),
            currentStreak: maxStreak,
            perfectDays: totalPerfectDays,
            weeklyXP: userWeeklyXP,
            isCurrentUser: true,
            timezone_offset: (currentUser as any).timezone_offset,
          });
        }
      }

      const stats: LeaderboardStats = {
        totalUsers: topUsers?.length || 0,
        averageXP: topUsers?.length
          ? Math.round(topUsers.reduce((sum, u) => sum + (u.total_xp || 0), 0) / topUsers.length)
          : 0,
        topXP: topUsers?.[0]?.total_xp || 0,
      };

      return { leaderboard, currentUserRank, stats };
    } catch (error) {
      Logger.error('Error fetching leaderboard:', error);
      return {
        leaderboard: [],
        currentUserRank: 0,
        stats: { totalUsers: 0, averageXP: 0, topXP: 0 },
      };
    }
  }

  // ===========================================================================
  // SECTION: Classement hebdomadaire
  // ===========================================================================

  /**
   * Recuperer le classement hebdomadaire
   * UNIQUEMENT les utilisateurs ayant gagne des XP dans les 7 derniers jours
   * Affiche le top 20 + l'utilisateur courant s'il est en dehors du top 20
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param limit - Le nombre maximum d'entrees (par defaut 20)
   * @returns Le classement et le rang de l'utilisateur
   */
  static async getWeeklyLeaderboard(
    userId: string,
    limit: number = 20
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
  }> {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weeklyXP, error } = await supabase
        .from('xp_transactions')
        .select('user_id, amount')
        .gte('created_at', weekAgo.toISOString());

      if (error) throw error;

      if (!weeklyXP || weeklyXP.length === 0) {
        return { leaderboard: [], currentUserRank: 0 };
      }

      const xpByUser = new Map<string, number>();
      weeklyXP.forEach((xp) => {
        const current = xpByUser.get(xp.user_id) || 0;
        xpByUser.set(xp.user_id, current + xp.amount);
      });

      const sortedEntries = Array.from(xpByUser.entries()).sort((a, b) => b[1] - a[1]);
      const sortedUserIds = sortedEntries.map(([id]) => id);

      const currentUserRank = sortedUserIds.indexOf(userId) + 1;
      const topUserIds = sortedUserIds.slice(0, limit);

      const userInTop = topUserIds.includes(userId);
      if (!userInTop && currentUserRank > 0) {
        topUserIds.push(userId);
      }

      const { data: users, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, email, total_xp, current_level, timezone_offset')
        .in('id', topUserIds);

      if (profilesError) throw profilesError;
      if (!users) {
        return { leaderboard: [], currentUserRank: 0 };
      }

      const leaderboard: LeaderboardEntry[] = users
        .map((user) => ({
          id: user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          total_xp: user.total_xp || 0,
          current_level: user.current_level || 1,
          rank: sortedUserIds.indexOf(user.id) + 1,
          weeklyXP: xpByUser.get(user.id) || 0,
          isCurrentUser: user.id === userId,
          avatar: this.generateAvatar(user.username || user.email),
          timezone_offset: (user as any).timezone_offset,
        }))
        .sort((a, b) => (b.weeklyXP || 0) - (a.weeklyXP || 0));

      return { leaderboard, currentUserRank };
    } catch (error) {
      Logger.error('Error fetching weekly leaderboard:', error);
      return { leaderboard: [], currentUserRank: 0 };
    }
  }

  // ===========================================================================
  // SECTION: Utilitaires prives
  // ===========================================================================

  /**
   * Generer les initiales pour l'avatar a partir du nom
   *
   * @param name - Le nom ou email de l'utilisateur
   * @returns Les initiales en majuscules
   */
  private static generateAvatar(name: string): string {
    const words = name.split(/[\s@._-]/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  // ===========================================================================
  // SECTION: Statistiques utilisateur (Global + Local)
  // ===========================================================================

  /**
   * Récupère les statistiques globales et locales de l'utilisateur
   * Inclut le rang global, le rang local (par pays), et le percentile
   *
   * @param userId - L'identifiant de l'utilisateur
   * @returns Les statistiques de l'utilisateur
   */
  static async getUserRankStats(userId: string): Promise<UserRankStats | null> {
    try {
      // 1. Récupérer le profil de l'utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, total_xp, timezone_offset')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        Logger.error('Error fetching user profile:', profileError);
        return null;
      }

      // 2. Calculer le rang global
      const { data: rankData, error: rankError } = await supabase.rpc('get_user_rank', {
        p_user_id: userId,
      });

      if (rankError) {
        Logger.error('Error getting user rank:', rankError);
        return null;
      }

      const globalRank = rankData || 0;

      // 3. Compter le nombre total d'utilisateurs
      const { count: globalTotal, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        Logger.error('Error counting users:', countError);
        return null;
      }

      // 4. Calculer le rang local (par pays basé sur timezone)
      const userCountry = getCountryFromTimezone(userProfile.timezone_offset);

      // Récupérer tous les utilisateurs du même pays
      const { data: localUsers, error: localError } = await supabase
        .from('profiles')
        .select('id, total_xp, timezone_offset')
        .order('total_xp', { ascending: false });

      if (localError || !localUsers) {
        Logger.error('Error fetching local users:', localError);
        return null;
      }

      // Filtrer par pays et calculer le rang local
      const sameCountryUsers = localUsers.filter((user) => {
        const country = getCountryFromTimezone((user as any).timezone_offset);
        return country.code === userCountry.code;
      });

      const localRank = sameCountryUsers.findIndex((user) => user.id === userId) + 1;
      const localTotal = sameCountryUsers.length;

      // 5. Calculer le percentile (meilleur que X% des utilisateurs)
      const percentile = globalTotal && globalTotal > 0
        ? Math.round(((globalTotal - globalRank) / globalTotal) * 100)
        : 0;

      return {
        globalRank,
        globalTotal: globalTotal || 0,
        localRank,
        localTotal,
        percentile,
      };
    } catch (error) {
      Logger.error('Error fetching user rank stats:', error);
      return null;
    }
  }

  /**
   * Récupère le classement local (par pays) pour l'utilisateur
   *
   * @param userId - L'identifiant de l'utilisateur
   * @param limit - Nombre maximum d'entrées
   * @returns Le classement local et le rang de l'utilisateur
   */
  static async getLocalLeaderboard(
    userId: string,
    limit: number = 20
  ): Promise<{
    leaderboard: LeaderboardEntry[];
    currentUserRank: number;
  }> {
    try {
      // 1. Récupérer le timezone de l'utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('timezone_offset')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile) {
        Logger.error('Error fetching user profile:', profileError);
        return { leaderboard: [], currentUserRank: 0 };
      }

      const userCountry = getCountryFromTimezone((userProfile as any).timezone_offset);

      // 2. Récupérer tous les utilisateurs
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, email, total_xp, current_level, timezone_offset')
        .order('total_xp', { ascending: false });

      if (usersError || !allUsers) {
        Logger.error('Error fetching users:', usersError);
        return { leaderboard: [], currentUserRank: 0 };
      }

      // 3. Filtrer par pays
      const sameCountryUsers = allUsers.filter((user) => {
        const country = getCountryFromTimezone((user as any).timezone_offset);
        return country.code === userCountry.code;
      });

      // 4. Calculer le rang de l'utilisateur
      const currentUserRank = sameCountryUsers.findIndex((user) => user.id === userId) + 1;

      // 5. Prendre le top N
      const topUsers = sameCountryUsers.slice(0, limit);

      // 6. Ajouter l'utilisateur s'il n'est pas dans le top
      const userInTop = topUsers.some((u) => u.id === userId);
      if (!userInTop && currentUserRank > 0) {
        const currentUser = sameCountryUsers.find((u) => u.id === userId);
        if (currentUser) {
          topUsers.push(currentUser);
        }
      }

      // 7. Mapper vers LeaderboardEntry
      const leaderboard: LeaderboardEntry[] = topUsers.map((user, index) => {
        const rank = sameCountryUsers.findIndex((u) => u.id === user.id) + 1;
        return {
          id: user.id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          total_xp: user.total_xp || 0,
          current_level: user.current_level || 1,
          rank,
          avatar: this.generateAvatar(user.username || user.email),
          isCurrentUser: user.id === userId,
          timezone_offset: (user as any).timezone_offset,
        };
      });

      return { leaderboard, currentUserRank };
    } catch (error) {
      Logger.error('Error fetching local leaderboard:', error);
      return { leaderboard: [], currentUserRank: 0 };
    }
  }
}
