// src/screens/PaywallScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Check, Sparkles, Target, TrendingUp, Lock } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { RootStackParamList } from '@/navigation/types';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import { useSubscription } from '@/context/SubscriptionContext';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Feature {
  icon: any;
  title: string;
  description: string;
}

interface PaywallScreenProps {
  route?: {
    params?: {
      source?: string; // Track where paywall was opened from
    };
  };
}

// ============================================================================
// Premium Features
// ============================================================================

const features: Feature[] = [
  {
    icon: Target,
    title: 'Unlimited Habits',
    description: 'Track as many habits as you want',
  },
  {
    icon: Sparkles,
    title: '3 Streak Savers/Month',
    description: 'Never lose your progress',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Detailed charts & insights',
  },
  {
    icon: Lock,
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
];

// ============================================================================
// Paywall Screen
// ============================================================================

/**
 * Paywall Screen
 *
 * Displays subscription options and handles purchases
 * Features:
 * - Loads available subscription packages from RevenueCat
 * - Shows pricing with savings calculations
 * - Handles purchase flow
 * - Supports purchase restoration
 */
const PaywallScreen: React.FC<PaywallScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { refreshSubscription } = useSubscription();

  // State
  const [loading, setLoading] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);

  // ==========================================================================
  // Load Offerings
  // ==========================================================================

  useEffect(() => {
    loadOfferings();
  }, []);

  /**
   * Load available subscription packages from RevenueCat
   */
  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const availablePackages = await RevenueCatService.getOfferings();

      if (!availablePackages || availablePackages.length === 0) {
        Alert.alert('Error', 'No subscription plans available. Please try again later.');
        return;
      }

      setPackages(availablePackages);

      // Auto-select yearly plan (better value) or first available
      const yearlyPlan = availablePackages.find((pkg) => pkg.packageType === 'ANNUAL');
      setSelectedPackage(yearlyPlan || availablePackages[0]);
    } catch (error) {
      console.error('❌ [Paywall] Failed to load offerings');
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  // ==========================================================================
  // Purchase Flow
  // ==========================================================================

  /**
   * Handle subscription purchase
   */
  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setLoading(true);

    try {
      const result = await RevenueCatService.purchasePackage(selectedPackage);

      if (result.success) {
        // Refresh subscription to sync with database
        await refreshSubscription();

        // Show success message
        Alert.alert('🎉 Welcome to Premium!', 'You now have unlimited access to all features.', [
          {
            text: 'Get Started',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (result.error !== 'cancelled') {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error) {
      console.error('❌ [Paywall] Purchase error');
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle purchase restoration
   * For users who reinstalled or changed devices
   */
  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await RevenueCatService.restorePurchases();

      if (result.success) {
        Alert.alert('✅ Success', 'Your purchases have been restored!', [
          {
            text: 'Continue',
            onPress: async () => {
              await refreshSubscription();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('No Purchases Found', "We couldn't find any previous purchases to restore.");
      }
    } catch (error) {
      console.error('❌ [Paywall] Restore error');
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Close paywall
   */
  const handleClose = () => {
    navigation.goBack();
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (loadingOfferings) {
    return (
      <View style={tw`flex-1 bg-sand-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#78716C" />
        <Text style={tw`mt-4 text-stone-600`}>Loading subscription options...</Text>
      </View>
    );
  }

  // ==========================================================================
  // Calculations
  // ==========================================================================

  const monthlyPackage = packages.find((pkg) => pkg.packageType === 'MONTHLY');
  const yearlyPackage = packages.find((pkg) => pkg.packageType === 'ANNUAL');

  // Calculate savings percentage for yearly plan
  const savingsPercentage = monthlyPackage && yearlyPackage ? Math.round((1 - yearlyPackage.product.price / 12 / monthlyPackage.product.price) * 100) : 0;

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <View style={tw`flex-1 bg-sand-50`}>
      <LinearGradient colors={['#F8F4EF', '#E8E0D5']} style={tw`absolute inset-0`} />

      <SafeAreaView style={tw`flex-1`}>
        {/* Header */}
        <View style={tw`px-6 pt-4 pb-6`}>
          <Pressable onPress={handleClose} style={({ pressed }) => [tw`self-end w-10 h-10 rounded-full bg-white/80 items-center justify-center`, pressed && tw`opacity-70`]}>
            <X size={20} color="#6B7280" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView style={tw`flex-1 px-6`} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`items-center mb-8`}>
            <LinearGradient colors={['#78716C', '#57534E']} style={tw`w-20 h-20 rounded-3xl items-center justify-center mb-4 shadow-lg`}>
              <Sparkles size={36} color="#ffffff" strokeWidth={2} />
            </LinearGradient>

            <Text style={tw`text-3xl font-bold text-stone-800 text-center mb-2`}>Unlock Your Full Potential</Text>

            <Text style={tw`text-base text-stone-600 text-center px-4`}>Get unlimited habits and streak savers to build better routines</Text>
          </Animated.View>

          {/* Features List */}
          <Animated.View entering={FadeInUp.delay(200)} style={tw`mb-8`}>
            {features.map((feature, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(300 + index * 100)} style={tw`flex-row items-start bg-white rounded-2xl p-4 mb-3 shadow-sm`}>
                <View style={tw`w-12 h-12 rounded-xl bg-stone-100 items-center justify-center mr-4`}>
                  <feature.icon size={24} color="#78716C" strokeWidth={2} />
                </View>

                <View style={tw`flex-1`}>
                  <Text style={tw`text-base font-semibold text-stone-800 mb-1`}>{feature.title}</Text>
                  <Text style={tw`text-sm text-stone-600`}>{feature.description}</Text>
                </View>

                <View style={tw`w-6 h-6 rounded-full bg-emerald-100 items-center justify-center`}>
                  <Check size={16} color="#059669" strokeWidth={3} />
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Plan Selection */}
          {packages.length > 0 && (
            <View style={tw`mb-6`}>
              {packages.map((pkg) => {
                const isYearly = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const monthlyPrice = isYearly ? pkg.product.price / 12 : pkg.product.price;

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => setSelectedPackage(pkg)}
                    style={({ pressed }) => [
                      tw`mb-3 p-4 rounded-xl border-2 flex-row items-center justify-between`,
                      isSelected ? tw`border-stone-600 bg-stone-50` : tw`border-stone-200 bg-white`,
                      pressed && tw`opacity-70`,
                    ]}
                  >
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center mb-1`}>
                        <Text style={tw`text-base font-semibold text-stone-800`}>{pkg.product.title}</Text>
                        {isYearly && savingsPercentage > 0 && (
                          <View style={tw`ml-2 px-2 py-0.5 bg-emerald-100 rounded-full`}>
                            <Text style={tw`text-xs font-bold text-emerald-700`}>Save {savingsPercentage}%</Text>
                          </View>
                        )}
                      </View>
                      <Text style={tw`text-lg font-bold text-stone-900`}>
                        {pkg.product.priceString}
                        {isYearly && <Text style={tw`text-sm font-normal text-stone-600`}> (${monthlyPrice.toFixed(2)}/mo)</Text>}
                      </Text>
                    </View>

                    <View style={[tw`w-6 h-6 rounded-full border-2 items-center justify-center`, isSelected ? tw`border-stone-600 bg-stone-600` : tw`border-stone-300`]}>
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Subscribe Button */}
          <Animated.View entering={FadeInUp.delay(700)}>
            <Pressable
              onPress={handleSubscribe}
              disabled={loading || !selectedPackage}
              style={({ pressed }) => [tw`bg-stone-800 rounded-xl py-4 items-center justify-center mb-4 shadow-lg`, pressed && tw`opacity-80`, (loading || !selectedPackage) && tw`opacity-50`]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={tw`text-white text-base font-bold`}>Start Premium</Text>}
            </Pressable>
          </Animated.View>

          {/* Trust Indicators */}
          <Animated.View entering={FadeInUp.delay(800)} style={tw`items-center mb-4`}>
            <Text style={tw`text-xs text-stone-500 text-center px-8`}>Join thousands of users building better habits. Secure payment via App Store. Cancel anytime.</Text>
          </Animated.View>

          {/* Restore Purchases Button */}
          <Animated.View entering={FadeInUp.delay(900)} style={tw`items-center mb-8`}>
            <Pressable onPress={handleRestore} disabled={loading}>
              <Text style={tw`text-sm text-stone-600 underline`}>Restore Purchases</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PaywallScreen;
