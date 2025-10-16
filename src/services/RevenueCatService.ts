// src/services/RevenueCatService.ts
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface SubscriptionState {
  isSubscribed: boolean;
  entitlementId: string | null;
  expirationDate: string | null;
}

/**
 * Simplified subscription package for UI consumption
 * Maps RevenueCat's complex package structure to a simpler format
 */
export interface SubscriptionPackage {
  identifier: string; // e.g., '$rc_monthly'
  packageType: string; // 'MONTHLY' | 'ANNUAL'
  product: {
    identifier: string; // e.g., 'premium_monthly'
    title: string;
    description: string;
    price: number;
    priceString: string; // Formatted price with currency
    currencyCode: string;
  };
  rcPackage: PurchasesPackage; // Original package for purchase operations
}

/**
 * Result object returned after purchase or restore operations
 */
export interface PurchaseResult {
  success: boolean;
  error?: string;
  customerInfo?: CustomerInfo;
  hasPremium?: boolean;
}

// ============================================================================
// RevenueCat Service
// ============================================================================

/**
 * Service class for managing RevenueCat subscriptions and purchases
 *
 * This service handles:
 * - SDK initialization
 * - User authentication
 * - Product offerings retrieval
 * - Purchase processing
 * - Subscription status checking
 * - Purchase restoration
 */
export class RevenueCatService {
  private static initialized = false;
  private static initializationPromise: Promise<void> | null = null;

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize RevenueCat SDK
   * Should be called once on app startup
   *
   * @param userId - Optional user ID for identifying the user in RevenueCat
   * @returns Promise that resolves when initialization is complete
   */
  static initialize(userId?: string): Promise<void> {
    // Return existing promise if already initializing
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.initialized) {
      return Promise.resolve();
    }

    // Create and store initialization promise
    this.initializationPromise = this.performInitialization(userId);
    return this.initializationPromise;
  }

  /**
   * Internal initialization logic
   * Configures the SDK and verifies connection
   */
  private static async performInitialization(userId?: string): Promise<void> {
    try {
      // Validate API key
      if (!REVENUECAT_API_KEY) {
        throw new Error('RevenueCat API key is missing. Check your .env file.');
      }

      const expectedPrefix = Platform.OS === 'ios' ? 'appl_' : 'goog_';
      if (!REVENUECAT_API_KEY.startsWith(expectedPrefix)) {
        console.warn(`⚠️ [RevenueCat] API key doesn't match expected prefix for ${Platform.OS}`);
      }

      // Enable debug logging in development
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

      // Configure SDK
      Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId,
      });

      this.initialized = true;

      // Verify initialization by fetching customer info
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('✅ [RevenueCat] Initialized successfully');
      } catch (verifyError) {
        console.warn('⚠️ [RevenueCat] Initialized but verification failed');
      }

      // Listen for subscription changes
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    } catch (error) {
      console.error('❌ [RevenueCat] Initialization failed:', error);
      this.initialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Callback for customer info updates
   * Triggered when subscription status changes
   */
  private static handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    const activeEntitlements = Object.keys(customerInfo.entitlements.active);
    if (activeEntitlements.length > 0) {
      console.log('🔔 [RevenueCat] Subscription status updated:', activeEntitlements);
    }
  };

  /**
   * Check if SDK is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  // ==========================================================================
  // Offerings & Products
  // ==========================================================================

  /**
   * Fetch available subscription offerings
   * Returns a simplified array of packages ready for UI display
   *
   * @returns Array of subscription packages, empty array if none available
   */
  static async getOfferings(): Promise<SubscriptionPackage[]> {
    // Wait for initialization if in progress
    if (this.initializationPromise) {
      await this.initializationPromise;
    }

    try {
      const offeringsResponse = await Purchases.getOfferings();

      if (!offeringsResponse.current || !offeringsResponse.current.availablePackages) {
        console.warn('⚠️ [RevenueCat] No offerings available');
        return [];
      }

      // Map RevenueCat packages to simplified format
      const packages = offeringsResponse.current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        product: {
          identifier: pkg.product.identifier,
          title: pkg.product.title || (pkg.packageType === 'ANNUAL' ? 'Yearly Plan' : 'Monthly Plan'),
          description: pkg.product.description || '',
          price: pkg.product.price,
          priceString: pkg.product.priceString,
          currencyCode: pkg.product.currencyCode,
        },
        rcPackage: pkg, // Keep original for purchase
      }));

      console.log(`✅ [RevenueCat] Loaded ${packages.length} subscription packages`);
      return packages;
    } catch (error) {
      console.error('❌ [RevenueCat] Error fetching offerings:', error);
      return [];
    }
  }

  // ==========================================================================
  // Purchase Operations
  // ==========================================================================

  /**
   * Purchase a subscription package
   *
   * @param pkg - The subscription package to purchase
   * @returns Result object with success status and customer info
   */
  static async purchasePackage(pkg: SubscriptionPackage): Promise<PurchaseResult> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg.rcPackage);

      const hasPremium = !!customerInfo.entitlements.active['premium'];

      console.log('✅ [RevenueCat] Purchase successful');

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

      console.error('❌ [RevenueCat] Purchase failed:', error.message);
      return {
        success: false,
        error: error.message || 'Purchase failed',
      };
    }
  }

  /**
   * Restore previous purchases
   * Useful for users who reinstalled the app or switched devices
   *
   * @returns Result object with success status
   */
  static async restorePurchases(): Promise<PurchaseResult> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const hasPremium = !!customerInfo.entitlements.active['premium'];

      if (hasPremium) {
        console.log('✅ [RevenueCat] Purchases restored successfully');
      }

      return {
        success: hasPremium,
        customerInfo,
        error: hasPremium ? undefined : 'No purchases found',
      };
    } catch (error: any) {
      console.error('❌ [RevenueCat] Restore failed:', error.message);
      return {
        success: false,
        error: error.message || 'Restore failed',
      };
    }
  }

  // ==========================================================================
  // Subscription Status
  // ==========================================================================

  /**
   * Get current subscription status
   * Checks if user has active premium entitlement
   *
   * @returns Subscription state with entitlement details
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
      console.error('❌ [RevenueCat] Error fetching subscription status');
      return {
        isSubscribed: false,
        entitlementId: null,
        expirationDate: null,
      };
    }
  }

  /**
   * Check subscription status and return boolean
   * Convenience method for quick premium checks
   *
   * @param userId - User ID to check
   * @returns True if user has active premium subscription
   */
  static async checkAndSyncSubscription(userId: string): Promise<boolean> {
    try {
      const status = await this.getSubscriptionStatus();
      return status.isSubscribed;
    } catch (error) {
      return false;
    }
  }

  // ==========================================================================
  // User Management
  // ==========================================================================

  /**
   * Associate user ID with RevenueCat
   * Call this after user logs in
   *
   * @param userId - The user's unique identifier
   */
  static async setAppUserId(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
      console.log('✅ [RevenueCat] User authenticated');
    } catch (error) {
      console.error('❌ [RevenueCat] Error setting user ID');
      throw error;
    }
  }

  /**
   * Clear user ID from RevenueCat
   * Call this when user logs out
   */
  static async clearAppUserId(): Promise<void> {
    try {
      await Purchases.logOut();
      console.log('✅ [RevenueCat] User logged out');
    } catch (error) {
      console.error('❌ [RevenueCat] Error logging out');
    }
  }
}
