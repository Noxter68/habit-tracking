/**
 * ============================================================================
 * InventoryContext.tsx
 * ============================================================================
 *
 * Contexte de gestion de l'inventaire et des boosts.
 *
 * Ce contexte centralise les données d'inventaire (boosts, titres),
 * la gestion des boosts actifs et l'activation des items.
 *
 * Fonctionnalités principales:
 * - Chargement de l'inventaire
 * - Gestion du boost actif
 * - Activation de boosts
 * - Calcul du multiplicateur XP
 *
 * @module InventoryContext
 */

// ============================================================================
// IMPORTS - React
// ============================================================================
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

// ============================================================================
// IMPORTS - Services
// ============================================================================
import { InventoryService } from '@/services/InventoryService';
import Logger from '@/utils/logger';

// ============================================================================
// IMPORTS - Types
// ============================================================================
import { InventoryItem, ActiveBoost } from '@/types/quest.types';

// ============================================================================
// IMPORTS - Contextes
// ============================================================================
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Type du contexte de l'inventaire
 */
interface InventoryContextType {
  /** Liste complète de l'inventaire */
  inventory: InventoryItem[];
  /** Items disponibles (non consommés) */
  availableItems: InventoryItem[];
  /** Boosts disponibles */
  availableBoosts: InventoryItem[];
  /** Titres débloqués */
  unlockedTitles: InventoryItem[];
  /** Boost actif actuel */
  activeBoost: ActiveBoost | null;
  /** Multiplicateur XP actuel (1.0 si pas de boost) */
  xpMultiplier: number;
  /** Indicateur de chargement */
  loading: boolean;
  /** Rafraîchit l'inventaire */
  refreshInventory: () => Promise<void>;
  /** Active un boost */
  activateBoost: (inventoryItemId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  /** Vérifie si l'inventaire contient des items */
  hasItems: boolean;
  /** Statistiques de l'inventaire */
  stats: {
    totalItems: number;
    availableBoosts: number;
    unlockedTitles: number;
    hasActiveBoost: boolean;
  };
  /** DEBUG: Toggle mock active boost (dev only) */
  toggleDebugBoost: () => void;
}

// ============================================================================
// CREATION DU CONTEXTE
// ============================================================================

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

/**
 * Provider du contexte de l'inventaire
 */
export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [availableBoosts, setAvailableBoosts] = useState<InventoryItem[]>([]);
  const [unlockedTitles, setUnlockedTitles] = useState<InventoryItem[]>([]);
  const [activeBoost, setActiveBoost] = useState<ActiveBoost | null>(null);
  const [xpMultiplier, setXpMultiplier] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    availableBoosts: 0,
    unlockedTitles: 0,
    hasActiveBoost: false,
  });

  // Track if we have loaded data at least once (for cache behavior)
  const hasLoadedOnce = useRef(false);

  // DEBUG: Mock boost state for testing UI
  const [debugBoostEnabled, setDebugBoostEnabled] = useState(false);

  /**
   * Rafraîchit l'inventaire complet
   */
  const refreshInventory = useCallback(async () => {
    if (!user) {
      setInventory([]);
      setAvailableItems([]);
      setAvailableBoosts([]);
      setUnlockedTitles([]);
      setActiveBoost(null);
      setXpMultiplier(1.0);
      setLoading(false);
      return;
    }

    try {
      // Only show loader on first load, not on subsequent refreshes (cache behavior)
      if (!hasLoadedOnce.current) {
        setLoading(true);
      }
      Logger.info('[InventoryContext] Fetching inventory for user:', user.id);

      // Récupérer toutes les données en parallèle
      const [
        inventoryData,
        availableItemsData,
        availableBoostsData,
        unlockedTitlesData,
        activeBoostData,
        inventoryStats,
      ] = await Promise.all([
        InventoryService.getUserInventory(user.id),
        InventoryService.getAvailableItems(user.id),
        InventoryService.getAvailableBoosts(user.id),
        InventoryService.getUnlockedTitles(user.id),
        InventoryService.getActiveBoost(user.id),
        InventoryService.getInventoryStats(user.id),
      ]);

      setInventory(inventoryData);
      setAvailableItems(availableItemsData);
      setAvailableBoosts(availableBoostsData);
      setUnlockedTitles(unlockedTitlesData);
      setActiveBoost(activeBoostData);
      setStats(inventoryStats);

      // Calculer le multiplicateur XP
      if (activeBoostData && new Date(activeBoostData.expires_at) > new Date()) {
        const multiplier = 1 + activeBoostData.boost_percent / 100;
        setXpMultiplier(multiplier);
        Logger.info('[InventoryContext] Active boost:', {
          percent: activeBoostData.boost_percent,
          multiplier,
          expiresAt: activeBoostData.expires_at,
        });
      } else {
        setXpMultiplier(1.0);
      }

      Logger.info('[InventoryContext] Inventory loaded:', {
        total: inventoryData.length,
        available: availableItemsData.length,
        boosts: availableBoostsData.length,
        titles: unlockedTitlesData.length,
        activeBoost: activeBoostData !== null,
      });
    } catch (error) {
      Logger.error('[InventoryContext] Error fetching inventory:', error);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [user]);

  /**
   * Active un boost depuis l'inventaire
   */
  const activateBoost = useCallback(
    async (
      inventoryItemId: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) return { success: false, error: 'User not authenticated' };

      try {
        Logger.info('[InventoryContext] Activating boost:', inventoryItemId);

        const result = await InventoryService.activateBoost(user.id, inventoryItemId);

        if (result.success) {
          // Rafraîchir l'inventaire après activation
          await refreshInventory();
          Logger.info('[InventoryContext] Boost activated successfully');
          return { success: true };
        } else {
          Logger.error('[InventoryContext] Failed to activate boost:', result.error);
          return { success: false, error: result.error };
        }
      } catch (error) {
        Logger.error('[InventoryContext] Error activating boost:', error);
        return { success: false, error: 'Failed to activate boost' };
      }
    },
    [user, refreshInventory]
  );

  /**
   * Nettoie les boosts expirés au mount
   */
  useEffect(() => {
    if (user) {
      InventoryService.cleanupExpiredBoosts().then((count) => {
        if (count > 0) {
          Logger.info('[InventoryContext] Cleaned up expired boosts:', count);
        }
      });
    }
  }, [user?.id]);

  /**
   * Charge l'inventaire au mount et quand l'utilisateur change
   */
  useEffect(() => {
    refreshInventory();
  }, [user?.id]);

  /**
   * Vérifie périodiquement si le boost actif a expiré
   */
  useEffect(() => {
    if (!activeBoost) return;

    const checkExpiration = () => {
      if (new Date(activeBoost.expires_at) <= new Date()) {
        Logger.info('[InventoryContext] Boost expired, refreshing...');
        refreshInventory();
      }
    };

    // Vérifier toutes les minutes
    const interval = setInterval(checkExpiration, 60000);

    return () => clearInterval(interval);
  }, [activeBoost, refreshInventory]);

  /**
   * DEBUG: Toggle mock boost for UI testing
   */
  const toggleDebugBoost = useCallback(() => {
    setDebugBoostEnabled((prev) => !prev);
    Logger.info('[InventoryContext] Debug boost toggled:', !debugBoostEnabled);
  }, [debugBoostEnabled]);

  // DEBUG: Create mock active boost when debug mode is enabled
  const effectiveActiveBoost = debugBoostEnabled
    ? {
        user_id: user?.id || 'debug',
        inventory_item_id: 'debug-boost',
        boost_type: 'HABIT_XP' as const,
        boost_percent: 20 as const,
        activated_at: new Date(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
        created_at: new Date(),
      }
    : activeBoost;

  // ============================================================================
  // VALEUR DU CONTEXTE
  // ============================================================================

  const value: InventoryContextType = {
    inventory,
    availableItems,
    availableBoosts,
    unlockedTitles,
    activeBoost: effectiveActiveBoost,
    xpMultiplier: debugBoostEnabled ? 1.2 : xpMultiplier,
    loading,
    refreshInventory,
    activateBoost,
    hasItems: availableItems.length > 0,
    stats,
    toggleDebugBoost,
  };

  return (
    <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
  );
};

// ============================================================================
// CUSTOM HOOK
// ============================================================================

/**
 * Hook pour utiliser le contexte de l'inventaire
 * @throws {Error} Si utilisé en dehors d'un InventoryProvider
 */
export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
