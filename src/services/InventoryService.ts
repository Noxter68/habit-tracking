import { supabase } from '@/lib/supabase';
import { InventoryItem, ActiveBoost, BoostReward } from '@/types/quest.types';

export class InventoryService {
  /**
   * Récupère l'inventaire complet de l'utilisateur
   */
  static async getUserInventory(userId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[InventoryService] Error fetching user inventory:', error);
      throw error;
    }
  }

  /**
   * Récupère uniquement les items non consommés (disponibles)
   */
  static async getAvailableItems(userId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('is_consumed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[InventoryService] Error fetching available items:', error);
      throw error;
    }
  }

  /**
   * Récupère uniquement les boosts disponibles
   */
  static async getAvailableBoosts(userId: string): Promise<InventoryItem[]> {
    try {
      const items = await this.getAvailableItems(userId);
      return items.filter((item) => item.item_type === 'BOOST');
    } catch (error) {
      console.error('[InventoryService] Error fetching available boosts:', error);
      return [];
    }
  }

  /**
   * Récupère les titres débloqués
   */
  static async getUnlockedTitles(userId: string): Promise<InventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('item_type', 'TITLE')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('[InventoryService] Error fetching unlocked titles:', error);
      return [];
    }
  }

  /**
   * Récupère le boost actif de l'utilisateur (s'il existe)
   */
  static async getActiveBoost(userId: string): Promise<ActiveBoost | null> {
    try {
      const { data, error } = await supabase
        .from('active_boosts')
        .select(`
          *,
          inventory_item:user_inventory(*)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        // Pas d'erreur si aucun boost actif
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[InventoryService] Error fetching active boost:', error);
      return null;
    }
  }

  /**
   * Active un boost depuis l'inventaire
   * Retourne une erreur si un boost est déjà actif
   */
  static async activateBoost(
    userId: string,
    inventoryItemId: string
  ): Promise<{ success: boolean; error?: string; boost?: ActiveBoost }> {
    try {
      const { data, error } = await supabase.rpc('activate_boost', {
        p_user_id: userId,
        p_inventory_item_id: inventoryItemId,
      });

      if (error) throw error;

      if (data?.error) {
        return {
          success: false,
          error: data.error,
          boost: data.active_boost,
        };
      }

      return {
        success: true,
        boost: {
          user_id: userId,
          inventory_item_id: inventoryItemId,
          boost_type: 'HABIT_XP',
          boost_percent: data.boost_percent,
          activated_at: new Date(data.activated_at),
          expires_at: new Date(data.expires_at),
          created_at: new Date(),
        },
      };
    } catch (error) {
      console.error('[InventoryService] Error activating boost:', error);
      return { success: false, error: 'Failed to activate boost' };
    }
  }

  /**
   * Vérifie si un boost est actif et retourne le multiplicateur XP
   */
  static async getActiveBoostMultiplier(userId: string): Promise<number> {
    try {
      const activeBoost = await this.getActiveBoost(userId);

      if (!activeBoost) return 1.0;

      // Vérifier si le boost n'est pas expiré
      if (new Date(activeBoost.expires_at) < new Date()) {
        return 1.0;
      }

      // Retourner le multiplicateur (ex: 15% = 1.15)
      return 1 + activeBoost.boost_percent / 100;
    } catch (error) {
      console.error('[InventoryService] Error getting boost multiplier:', error);
      return 1.0;
    }
  }

  /**
   * Nettoie les boosts expirés (à appeler périodiquement ou au mount de l'app)
   */
  static async cleanupExpiredBoosts(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_boosts');

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error('[InventoryService] Error cleaning up expired boosts:', error);
      return 0;
    }
  }

  /**
   * Calcule le temps restant d'un boost actif (en minutes)
   */
  static getBoostTimeRemaining(expiresAt: Date | string): number {
    const now = new Date();
    const expires = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return 0;

    return Math.floor(diffMs / (1000 * 60)); // Minutes
  }

  /**
   * Formate le temps restant en texte lisible
   */
  static formatBoostTimeRemaining(expiresAt: Date | string): string {
    const minutes = this.getBoostTimeRemaining(expiresAt);

    if (minutes <= 0) return 'Expired';

    if (minutes < 60) {
      return `${minutes}m`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  }

  /**
   * Récupère les statistiques de l'inventaire
   */
  static async getInventoryStats(userId: string): Promise<{
    totalItems: number;
    availableBoosts: number;
    unlockedTitles: number;
    hasActiveBoost: boolean;
  }> {
    try {
      const [inventory, activeBoost] = await Promise.all([
        this.getUserInventory(userId),
        this.getActiveBoost(userId),
      ]);

      const availableBoosts = inventory.filter(
        (item) => item.item_type === 'BOOST' && !item.is_consumed
      ).length;

      const unlockedTitles = inventory.filter((item) => item.item_type === 'TITLE').length;

      return {
        totalItems: inventory.length,
        availableBoosts,
        unlockedTitles,
        hasActiveBoost: activeBoost !== null,
      };
    } catch (error) {
      console.error('[InventoryService] Error fetching inventory stats:', error);
      return {
        totalItems: 0,
        availableBoosts: 0,
        unlockedTitles: 0,
        hasActiveBoost: false,
      };
    }
  }

  /**
   * Convertit un boost en XP de fallback
   * Utilisé quand un boost est gagné mais qu'un autre est déjà actif
   */
  static getBoostFallbackXP(boostPercent: number): number {
    const fallbackMap: Record<number, number> = {
      10: 60,
      15: 90,
      20: 120,
      25: 150,
    };

    return fallbackMap[boostPercent] || 60;
  }

  /**
   * Vérifie si l'inventaire contient au moins un item disponible
   * Utilisé pour afficher/masquer le bouton inventaire dans QuestScreen
   */
  static async hasAvailableItems(userId: string): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from('user_inventory')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_consumed', false);

      if (error) throw error;

      return (count || 0) > 0;
    } catch (error) {
      console.error('[InventoryService] Error checking available items:', error);
      return false;
    }
  }
}
