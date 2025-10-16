// src/services/RevenueCatService.ts
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { REVENUECAT_IOS_API_KEY } from '@env';

// Get RevenueCat API Keys from environment
const REVENUECAT_API_KEY = Platform.select({
  ios: REVENUECAT_IOS_API_KEY,
  default: '',
}) as string;

export interface SubscriptionOffering {
  identifier: string;
  package: PurchasesPackage;
  priceString: string;
  price: number;
  product: {
    title: string;
    description: string;
  };
}

export class RevenueCatService {
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  /**
   * Debug: Check if API key is valid
   */
  static debugAPIKey(): void {
    console.log('=== RevenueCat API Key Debug ===');
    console.log('Platform:', Platform.OS);
    console.log('API Key exists:', !!REVENUECAT_API_KEY);
    console.log('API Key length:', REVENUECAT_API_KEY?.length || 0);
    console.log('API Key preview:', REVENUECAT_API_KEY?.substring(0, 10) + '...');
    console.log('Starts with appl_:', REVENUECAT_API_KEY?.startsWith('appl_'));
    console.log('ENV import successful:', typeof REVENUECAT_IOS_API_KEY !== 'undefined');
    console.log('================================');
  }

  /**
   * Initialize RevenueCat - call once on app start
   */
  static async initialize(userId: string): Promise<void> {
    console.log('🔵 [RevenueCat] Initialize called for user:', userId);

    // Debug API key first
    this.debugAPIKey();

    // Return existing initialization promise if already in progress
    if (this.initPromise) {
      console.log('⚠️ [RevenueCat] Already initializing, returning existing promise');
      return this.initPromise;
    }

    if (this.initialized) {
      console.log('✅ [RevenueCat] Already initialized');
      return Promise.resolve();
    }

    this.initPromise = (async () => {
      try {
        // Validate API key
        if (!REVENUECAT_API_KEY) {
          throw new Error('❌ RevenueCat API key is empty or undefined. Check your .env file has REVENUECAT_IOS_API_KEY.');
        }

        if (!REVENUECAT_API_KEY.startsWith('appl_')) {
          throw new Error('❌ Invalid iOS API key format. Should start with "appl_"');
        }

        console.log('🔵 [RevenueCat] Setting log level to DEBUG');
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

        console.log('🔵 [RevenueCat] Calling Purchases.configure()...');
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: userId,
        });

        this.initialized = true;
        console.log('✅ [RevenueCat] Initialized successfully');
        console.log('✅ [RevenueCat] User ID set to:', userId);

        // Add listener
        console.log('🔵 [RevenueCat] Adding customer info update listener');
        Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);

        // Test that SDK is working by getting customer info
        console.log('🔵 [RevenueCat] Testing SDK by fetching customer info...');
        const customerInfo = await Purchases.getCustomerInfo();
        console.log('✅ [RevenueCat] SDK test successful. Customer info:', {
          originalAppUserId: customerInfo.originalAppUserId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          allEntitlements: Object.keys(customerInfo.entitlements.all),
        });
      } catch (error) {
        console.error('❌ [RevenueCat] Initialization error:', error);
        console.error('❌ [RevenueCat] Error details:', JSON.stringify(error, null, 2));
        this.initPromise = null;
        this.initialized = false;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Ensure RevenueCat is initialized before calling
   */
  private static async ensureInitialized(): Promise<void> {
    console.log('🔵 [RevenueCat] ensureInitialized called');
    console.log('🔵 [RevenueCat] Current state - initialized:', this.initialized, 'initPromise:', !!this.initPromise);

    if (!this.initialized && !this.initPromise) {
      throw new Error('❌ RevenueCat not initialized. Call RevenueCatService.initialize() first.');
    }

    if (this.initPromise) {
      console.log('⏳ [RevenueCat] Waiting for initialization to complete...');
      await this.initPromise;
      console.log('✅ [RevenueCat] Initialization complete');
    }
  }

  /**
   * Get available subscription offerings
   */
  static async getOfferings(): Promise<SubscriptionOffering[]> {
    console.log('🔵 [RevenueCat] getOfferings called');

    try {
      await this.ensureInitialized();

      console.log('🔵 [RevenueCat] Fetching offerings from RevenueCat...');
      const offerings = await Purchases.getOfferings();

      console.log('📦 [RevenueCat] Raw offerings response:', {
        hasOfferings: !!offerings,
        hasCurrent: !!offerings?.current,
        allOfferingsKeys: offerings?.all ? Object.keys(offerings.all) : [],
      });

      if (offerings?.all) {
        console.log(
          '📦 [RevenueCat] All offerings:',
          Object.keys(offerings.all).map((key) => ({
            identifier: key,
            packagesCount: offerings.all[key]?.availablePackages?.length || 0,
          }))
        );
      }

      if (!offerings) {
        console.warn('⚠️ [RevenueCat] Offerings object is null/undefined');
        return [];
      }

      if (!offerings.current) {
        console.warn('⚠️ [RevenueCat] No current offering found');
        console.log('💡 [RevenueCat] Make sure you have:');
        console.log('   1. Created products in App Store Connect');
        console.log('   2. Created products in RevenueCat dashboard');
        console.log('   3. Created an Offering in RevenueCat');
        console.log('   4. Set an offering as "Current"');
        console.log('   5. Added packages to your offering');
        return [];
      }

      console.log('✅ [RevenueCat] Current offering found:', {
        identifier: offerings.current.identifier,
        packagesCount: offerings.current.availablePackages.length,
      });

      // Log each package
      offerings.current.availablePackages.forEach((pkg, index) => {
        console.log(`📦 [RevenueCat] Package ${index + 1}:`, {
          identifier: pkg.identifier,
          productId: pkg.product.identifier,
          title: pkg.product.title,
          price: pkg.product.price,
          priceString: pkg.product.priceString,
        });
      });

      const packages = offerings.current.availablePackages.map((pkg) => ({
        identifier: pkg.identifier,
        package: pkg,
        priceString: pkg.product.priceString,
        price: pkg.product.price,
        product: {
          title: pkg.product.title,
          description: pkg.product.description,
        },
      }));

      console.log('✅ [RevenueCat] Returning', packages.length, 'packages');
      return packages;
    } catch (error) {
      console.error('❌ [RevenueCat] Error fetching offerings:', error);
      console.error('❌ [RevenueCat] Error details:', JSON.stringify(error, null, 2));
      return [];
    }
  }

  /**
   * Purchase a subscription package
   */
  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      await this.ensureInitialized();

      console.log('💳 [RevenueCat] Starting purchase for:', packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      console.log('✅ [RevenueCat] Purchase successful');
      await this.syncSubscriptionStatus(customerInfo);

      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('❌ [RevenueCat] Purchase error:', error);

      if (error.userCancelled) {
        console.log('ℹ️ [RevenueCat] User cancelled purchase');
        return { success: false, error: 'cancelled' };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Restore purchases
   */
  static async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureInitialized();

      console.log('🔄 [RevenueCat] Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();

      await this.syncSubscriptionStatus(customerInfo);
      const hasPremium = this.checkPremiumStatus(customerInfo);

      if (hasPremium) {
        console.log('✅ [RevenueCat] Purchases restored successfully');
        Alert.alert('✅ Purchases Restored', 'Your premium subscription has been restored!');
        return { success: true };
      } else {
        console.log('ℹ️ [RevenueCat] No active purchases found');
        Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
        return { success: false, error: 'no_purchases' };
      }
    } catch (error: any) {
      console.error('❌ [RevenueCat] Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current customer info
   */
  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      await this.ensureInitialized();

      console.log('🔵 [RevenueCat] Fetching customer info...');
      const customerInfo = await Purchases.getCustomerInfo();

      console.log('✅ [RevenueCat] Customer info retrieved:', {
        userId: customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
      });

      return customerInfo;
    } catch (error) {
      console.error('❌ [RevenueCat] Error fetching customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  static checkPremiumStatus(customerInfo: CustomerInfo): boolean {
    const hasPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
    console.log('🔵 [RevenueCat] Premium status:', hasPremium);
    return hasPremium;
  }

  /**
   * Sync subscription status to Supabase
   */
  private static async syncSubscriptionStatus(customerInfo: CustomerInfo): Promise<void> {
    try {
      const userId = customerInfo.originalAppUserId;
      const hasPremium = this.checkPremiumStatus(customerInfo);

      console.log('🔵 [RevenueCat] Syncing subscription to Supabase for user:', userId);

      if (hasPremium) {
        const entitlement = customerInfo.entitlements.active['premium'];
        const expirationDate = entitlement.expirationDate;

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_status: 'active',
            subscription_start_date: entitlement.latestPurchaseDate || new Date().toISOString(),
            subscription_end_date: expirationDate,
            platform: Platform.OS as 'ios' | 'android',
            transaction_id: entitlement.originalPurchaseDate || null,
          })
          .eq('id', userId);

        if (profileError) throw profileError;

        const { error: subError } = await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            tier: 'premium',
            status: 'active',
            platform: Platform.OS as 'ios' | 'android',
            product_id: entitlement.productIdentifier,
            transaction_id: entitlement.originalPurchaseDate || '',
            current_period_start: entitlement.latestPurchaseDate || new Date().toISOString(),
            current_period_end: expirationDate,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,transaction_id',
          }
        );

        if (subError) throw subError;

        console.log('✅ [RevenueCat] Subscription synced to Supabase');
      } else {
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
          })
          .eq('id', userId);

        if (error) throw error;
        console.log('✅ [RevenueCat] Free tier synced to Supabase');
      }
    } catch (error) {
      console.error('❌ [RevenueCat] Error syncing subscription to Supabase:', error);
    }
  }

  /**
   * Handle customer info updates (listener)
   */
  private static async handleCustomerInfoUpdate(customerInfo: CustomerInfo): Promise<void> {
    console.log('📱 [RevenueCat] Customer info updated:', customerInfo);
    await this.syncSubscriptionStatus(customerInfo);
  }

  /**
   * Check subscription status and sync with Supabase
   */
  static async checkAndSyncSubscription(userId: string): Promise<boolean> {
    try {
      console.log('🔵 [RevenueCat] Checking and syncing subscription for:', userId);
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) return false;

      const hasPremium = this.checkPremiumStatus(customerInfo);
      await this.syncSubscriptionStatus(customerInfo);

      return hasPremium;
    } catch (error) {
      console.error('❌ [RevenueCat] Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Log out user (clear RevenueCat cache)
   */
  static async logout(): Promise<void> {
    try {
      console.log('🔵 [RevenueCat] Logging out...');
      await Purchases.logOut();
      this.initialized = false;
      this.initPromise = null;
      console.log('✅ [RevenueCat] Logged out successfully');
    } catch (error) {
      console.error('❌ [RevenueCat] Error logging out:', error);
    }
  }
}
