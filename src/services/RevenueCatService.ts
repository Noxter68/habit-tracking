/**
 * Service de gestion des abonnements RevenueCat
 *
 * Ce service gere toutes les operations liees aux abonnements et achats in-app:
 * initialisation du SDK, authentification, recuperation des offres,
 * traitement des achats et verification du statut d'abonnement.
 *
 * @module RevenueCatService
 */

// =============================================================================
// IMPORTS - Bibliotheques externes
// =============================================================================
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

// =============================================================================
// IMPORTS - Utilitaires internes
// =============================================================================
import Logger from '@/utils/logger';

// =============================================================================
// CONSTANTES
// =============================================================================

const REVENUECAT_API_KEY = process.env.REVENUECAT_API_KEY || '';

// =============================================================================
// TYPES ET INTERFACES
// =============================================================================

/**
 * Etat de l'abonnement
 */
interface SubscriptionState {
  isSubscribed: boolean;
  entitlementId: string | null;
  expirationDate: string | null;
}

/**
 * Package d'abonnement simplifie pour l'UI
 * Mappe la structure complexe de RevenueCat vers un format plus simple
 */
export interface SubscriptionPackage {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: number;
    priceString: string;
    currencyCode: string;
  };
  rcPackage: PurchasesPackage;
}

/**
 * Resultat d'une operation d'achat ou de restauration
 */
export interface PurchaseResult {
  success: boolean;
  error?: string;
  customerInfo?: CustomerInfo;
  hasPremium?: boolean;
}

// =============================================================================
// SERVICE PRINCIPAL
// =============================================================================

/**
 * Service de gestion des abonnements RevenueCat
 *
 * Gere l'initialisation du SDK, les achats et le statut d'abonnement
 */
export class RevenueCatService {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  // ===========================================================================
  // SECTION: Initialisation
  // ===========================================================================

  /**
   * Initialiser le SDK RevenueCat
   * A appeler une fois au demarrage de l'application
   *
   * @param userId - ID utilisateur optionnel pour l'identification
   * @returns Promise resolue quand l'initialisation est complete
   */
  static initialize(userId?: string): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.initialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this.performInitialization(userId);
    return this.initializationPromise;
  }

  /**
   * Logique d'initialisation interne
   * Configure le SDK et verifie la connexion
   */
  private static async performInitialization(userId?: string): Promise<void> {
    try {
      if (!REVENUECAT_API_KEY) {
        throw new Error('RevenueCat API key is missing');
      }

      const expectedPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';
      if (!REVENUECAT_API_KEY.startsWith(expectedPrefix)) {
        Logger.warn('[RevenueCat] API key doesnt match expected prefix');
      }

      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });

      this.initialized = true;
      Logger.debug('[RevenueCat] SDK configured (verification in background)');

      Purchases.getCustomerInfo()
        .then(() => Logger.debug('[RevenueCat] Verification successful'))
        .catch((error) => Logger.warn('[RevenueCat] Verification failed:', error));

      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    } catch (error) {
      Logger.error('[RevenueCat] Initialization failed:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Callback pour les mises a jour des informations client
   * Declenche quand le statut d'abonnement change
   */
  private static handleCustomerInfoUpdate = (customerInfo: CustomerInfo): void => {
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    if (activeEntitlements.length > 0) {
      Logger.debug('[RevenueCat] Subscription status updated:', activeEntitlements);
    }
  };

  /**
   * Verifier si le SDK est initialise
   *
   * @returns Vrai si initialise
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  // ===========================================================================
  // SECTION: Offres et produits
  // ===========================================================================

  /**
   * Recuperer les offres d'abonnement disponibles
   * Retourne un tableau simplifie de packages prets pour l'UI
   *
   * @returns Les abonnements et consommables disponibles
   */
  static async getAllOfferings(): Promise<{
    subscriptions: SubscriptionPackage[];
    consumables: SubscriptionPackage[];
  }> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    try {
      const offeringsResponse = await Purchases.getOfferings();

      const subscriptions: SubscriptionPackage[] = [];
      const consumables: SubscriptionPackage[] = [];

      Object.values(offeringsResponse.all).forEach((offering) => {
        offering.availablePackages?.forEach((pkg) => {
          const mapped: SubscriptionPackage = {
            identifier: pkg.identifier,
            packageType: pkg.packageType,
            product: {
              identifier: pkg.product.identifier,
              title: pkg.product.title || this.getDefaultTitle(pkg),
              description: pkg.product.description || '',
              price: pkg.product.price,
              priceString: pkg.product.priceString,
              currencyCode: pkg.product.currencyCode,
            },
            rcPackage: pkg,
          };

          if (pkg.product.identifier.includes('streak_saver')) {
            consumables.push(mapped);
          } else {
            subscriptions.push(mapped);
          }
        });
      });

      return { subscriptions, consumables };
    } catch (error) {
      Logger.error('[RevenueCat] Error fetching offerings:', error);
      return { subscriptions: [], consumables: [] };
    }
  }

  /**
   * Obtenir un titre par defaut pour un package
   */
  private static getDefaultTitle(pkg: PurchasesPackage): string {
    if (pkg.packageType === 'ANNUAL') return 'Yearly Plan';
    if (pkg.packageType === 'MONTHLY') return 'Monthly Plan';
    if (pkg.product.identifier.includes('streak_saver_3')) return '3 Streak Savers';
    if (pkg.product.identifier.includes('streak_saver_10')) return '10 Streak Savers';
    if (pkg.product.identifier.includes('streak_saver_25')) return '25 Streak Savers';
    return pkg.product.identifier;
  }

  // ===========================================================================
  // SECTION: Operations d'achat
  // ===========================================================================

  /**
   * Acheter un package d'abonnement
   *
   * @param pkg - Le package a acheter
   * @param userId - L'ID utilisateur pour s'assurer qu'il est bien connecte
   * @returns Resultat de l'operation avec le statut et les infos client
   */
  static async purchasePackage(pkg: SubscriptionPackage, userId?: string): Promise<PurchaseResult> {
    try {
      // S'assurer que l'utilisateur est bien connecte avant l'achat
      if (userId) {
        await this.ensureUserConnected(userId);
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg.rcPackage);

      const hasPremium = !!customerInfo.entitlements.active['premium'];

      Logger.debug('[RevenueCat] Purchase successful');

      return {
        success: true,
        customerInfo,
        hasPremium,
      };
    } catch (error: any) {
      if (error.userCancelled) {
        return {
          success: false,
          error: 'cancelled',
        };
      }

      Logger.error('[RevenueCat] Purchase failed:', error.message);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restaurer les achats precedents
   * Utile pour les utilisateurs qui ont reinstalle l'app ou change d'appareil
   *
   * @returns Resultat de l'operation
   */
  static async restorePurchases(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPremium = !!customerInfo.entitlements.active['premium'];

      if (hasPremium) {
        Logger.debug('[RevenueCat] Purchases restored successfully');
      }

      return {
        success: hasPremium,
        customerInfo,
        error: hasPremium ? undefined : 'No purchases found',
      };
    } catch (error: any) {
      Logger.error('[RevenueCat] Restore failed:', error.message);
      return {
        success: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  // ===========================================================================
  // SECTION: Statut d'abonnement
  // ===========================================================================

  /**
   * Obtenir le statut d'abonnement actuel
   * Verifie si l'utilisateur a l'entitlement premium actif
   *
   * @returns L'etat de l'abonnement avec les details
   */
  static async getSubscriptionStatus(): Promise<SubscriptionState> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const premiumEntitlement = customerInfo.entitlements.active['premium'];

      return {
        isSubscribed: !!premiumEntitlement,
        entitlementId: premiumEntitlement?.identifier || null,
        expirationDate: premiumEntitlement?.expirationDate || null,
      };
    } catch (error) {
      Logger.error('[RevenueCat] Error fetching subscription status');
      return {
        isSubscribed: false,
        entitlementId: null,
        expirationDate: null,
      };
    }
  }

  /**
   * Verifier le statut d'abonnement et retourner un booleen
   * Methode pratique pour les verifications rapides
   *
   * @param userId - L'ID utilisateur a verifier
   * @returns Vrai si l'utilisateur a un abonnement premium actif
   */
  static async checkAndSyncSubscription(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.isSubscribed;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // SECTION: Gestion des utilisateurs
  // ===========================================================================

  /**
   * Associer un ID utilisateur avec RevenueCat
   * A appeler apres la connexion de l'utilisateur
   *
   * @param userId - L'identifiant unique de l'utilisateur
   */
  static async setAppUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      Logger.debug('[RevenueCat] User authenticated');
    } catch (error) {
      Logger.error('[RevenueCat] Error setting user ID');
      throw error;
    }
  }

  /**
   * Dissocier l'ID utilisateur de RevenueCat
   * A appeler lors de la deconnexion de l'utilisateur
   */
  static async clearAppUserId(): Promise<void> {
    try {
      await Purchases.logOut();
      Logger.debug('[RevenueCat] User logged out');
    } catch (error) {
      Logger.error('[RevenueCat] Error logging out');
    }
  }

  /**
   * S'assurer que l'utilisateur est bien connecte avant un achat
   * Re-authentifie si necessaire
   *
   * @param userId - L'identifiant unique de l'utilisateur
   */
  static async ensureUserConnected(userId: string): Promise<void> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      if (customerInfo.originalAppUserId !== userId) {
        Logger.debug('[RevenueCat] Re-authenticating user');
        await Purchases.logIn(userId);
      }
    } catch {
      await Purchases.logIn(userId);
    }
  }
}
