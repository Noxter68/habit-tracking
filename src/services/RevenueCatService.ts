// src/services/RevenueCatService.ts
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';

// Your RevenueCat API Keys (get from https://app.revenuecat.com)
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YOUR_IOS_API_KEY',
  android: 'goog_YOUR_ANDROID_API_KEY',
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

  /**
   * Initialize RevenueCat - call once on app start
   */
  static async initialize(userId: string): Promise<void> {
    try {
      if (this.initialized) return;

      // Configure RevenueCat
      Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Use INFO in production

      // Initialize with user ID
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId, // Your Supabase user ID
      });

      this.initialized = true;
      console.log('✅ RevenueCat initialized successfully');

      // Set up listener for subscription changes
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    } catch (error) {
      console.error('❌ RevenueCat initialization error:', error);
      throw error;
    }
  }

  /**
   * Get available subscription offerings
   */
  static async getOfferings(): Promise<SubscriptionOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();

      if (!offerings.current) {
        console.warn('No current offering found');
        return [];
      }

      // Map packages to our interface
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

      return packages;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return [];
    }
  }

  /**
   * Purchase a subscription package
   */
  static async purchasePackage(packageToPurchase: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      // Update Supabase with subscription status
      await this.syncSubscriptionStatus(customerInfo);

      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('Purchase error:', error);

      // Handle user cancellation
      if (error.userCancelled) {
        return { success: false, error: 'cancelled' };
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Restore purchases (required by Apple)
   */
  static async restorePurchases(): Promise<{ success: boolean; error?: string }> {
    try {
      const customerInfo = await Purchases.restorePurchases();

      // Update Supabase
      await this.syncSubscriptionStatus(customerInfo);

      // Check if they have an active subscription
      const hasPremium = this.checkPremiumStatus(customerInfo);

      if (hasPremium) {
        Alert.alert('✅ Purchases Restored', 'Your premium subscription has been restored!');
        return { success: true };
      } else {
        Alert.alert('No Purchases Found', 'No active subscriptions were found to restore.');
        return { success: false, error: 'no_purchases' };
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current customer info (subscription status)
   */
  static async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error fetching customer info:', error);
      return null;
    }
  }

  /**
   * Check if user has active premium subscription
   */
  static checkPremiumStatus(customerInfo: CustomerInfo): boolean {
    // Check if user has any active entitlement
    // RevenueCat uses "entitlements" to represent premium access
    const hasPremium = typeof customerInfo.entitlements.active['premium'] !== 'undefined';
    return hasPremium;
  }

  /**
   * Sync subscription status to Supabase
   */
  private static async syncSubscriptionStatus(customerInfo: CustomerInfo): Promise<void> {
    try {
      const userId = customerInfo.originalAppUserId;
      const hasPremium = this.checkPremiumStatus(customerInfo);

      if (hasPremium) {
        const entitlement = customerInfo.entitlements.active['premium'];
        const expirationDate = entitlement.expirationDate;

        // Update Supabase profile
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

        // Create/update subscription record
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

        console.log('✅ Subscription synced to Supabase');
      } else {
        // User doesn't have premium - update to free
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
          })
          .eq('id', userId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error syncing subscription to Supabase:', error);
    }
  }

  /**
   * Handle customer info updates (listener)
   */
  private static async handleCustomerInfoUpdate(customerInfo: CustomerInfo): Promise<void> {
    console.log('📱 Customer info updated:', customerInfo);

    // Sync to Supabase whenever subscription changes
    await this.syncSubscriptionStatus(customerInfo);
  }

  /**
   * Check subscription status and sync with Supabase
   */
  static async checkAndSyncSubscription(userId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (!customerInfo) return false;

      const hasPremium = this.checkPremiumStatus(customerInfo);

      // Sync to Supabase
      await this.syncSubscriptionStatus(customerInfo);

      return hasPremium;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  /**
   * Log out user (clear RevenueCat cache)
   */
  static async logout(): Promise<void> {
    try {
      await Purchases.logOut();
      this.initialized = false;
      console.log('✅ RevenueCat logged out');
    } catch (error) {
      console.error('Error logging out RevenueCat:', error);
    }
  }
}
