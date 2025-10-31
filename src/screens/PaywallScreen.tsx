// src/screens/PaywallScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Check, Infinity, Shield, Sparkles, Crown } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { RootStackParamList } from '@/navigation/types';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import { useSubscription } from '@/context/SubscriptionContext';
import { Image } from 'react-native';
import Logger from '@/utils/logger';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Feature {
  icon: any;
  title: string;
  description: string;
  isPremium?: boolean;
  gradient: [string, string];
}

interface PaywallScreenProps {
  route?: {
    params?: {
      source?: string;
    };
  };
}

// ============================================================================
// Premium Features with Tier Colors
// ============================================================================

const sharedFeatures: Feature[] = [
  {
    icon: Infinity,
    title: 'Unlimited Habits',
    description: 'Track as many habits as you need',
    isPremium: true,
    gradient: ['#06B6D4', '#0891B2'], // Cyan
  },
  {
    icon: Shield,
    title: 'Unlimited Holiday Mode',
    description: 'Pause habits without losing progress',
    isPremium: true,
    gradient: ['#8B5CF6', '#7C3AED'], // Amethyst
  },
];

const monthlyExtraFeature: Feature = {
  icon: Sparkles,
  title: '3 Streak Savers/Month',
  description: 'Restore missed days automatically',
  isPremium: true,
  gradient: ['#F59E0B', '#D97706'], // Amber
};

const yearlyExtraFeature: Feature = {
  icon: Crown,
  title: '50 Streak Savers',
  description: 'Added to your inventory instantly',
  isPremium: true,
  gradient: ['#FBBF24', '#F59E0B'], // Topaz
};

// ============================================================================
// Paywall Screen
// ============================================================================

const PaywallScreen: React.FC<PaywallScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { refreshSubscription } = useSubscription();

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

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const { subscriptions } = await RevenueCatService.getAllOfferings();

      if (!subscriptions || subscriptions.length === 0) {
        Alert.alert('Error', 'No subscription plans available. Please try again later.');
        return;
      }

      setPackages(subscriptions);
      const yearlyPlan = subscriptions.find((pkg) => pkg.packageType === 'ANNUAL');
      setSelectedPackage(yearlyPlan || subscriptions[0]);
    } catch (error) {
      Logger.error('❌ [Paywall] Failed to load offerings');
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  // ==========================================================================
  // Purchase Flow
  // ==========================================================================

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setLoading(true);

    try {
      const result = await RevenueCatService.purchasePackage(selectedPackage);

      if (result.success) {
        await refreshSubscription();
        Alert.alert('Welcome to Premium', 'You now have unlimited access to all features.', [
          {
            text: 'Get Started',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (result.error !== 'cancelled') {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error) {
      Logger.error('❌ [Paywall] Purchase error');
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await RevenueCatService.restorePurchases();

      if (result.success) {
        Alert.alert('Success', 'Your purchases have been restored.', [
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
      Logger.error('❌ [Paywall] Restore error');
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (loadingOfferings) {
    return (
      <View style={tw`flex-1 bg-stone-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#78716C" />
        <Text style={tw`mt-4 text-stone-600 font-medium`}>Loading plans...</Text>
      </View>
    );
  }

  // ==========================================================================
  // Calculations
  // ==========================================================================

  const monthlyPackage = packages.find((pkg) => pkg.packageType === 'MONTHLY');
  const yearlyPackage = packages.find((pkg) => pkg.packageType === 'ANNUAL');
  const isYearlySelected = selectedPackage?.packageType === 'ANNUAL';

  const savingsPercentage = monthlyPackage && yearlyPackage ? Math.round((1 - yearlyPackage.product.price / 12 / monthlyPackage.product.price) * 100) : 0;

  // Get features based on selected plan
  const displayFeatures = [...sharedFeatures, isYearlySelected ? yearlyExtraFeature : monthlyExtraFeature];

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <View style={tw`flex-1 bg-stone-50`}>
      <SafeAreaView style={tw`flex-1`}>
        {/* Close Button */}
        <View style={tw`px-6 py-3 flex-row justify-end`}>
          <Pressable onPress={handleClose} style={({ pressed }) => [tw`w-10 h-10 rounded-full items-center justify-center bg-white`, pressed && tw`opacity-70`]}>
            <X size={20} color="#78716C" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-8`} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`items-center mb-10`}>
            <LinearGradient colors={['#78716C', '#57534E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-20 h-20 rounded-2xl items-center justify-center mb-5 shadow-lg`}>
              <Crown size={36} color="#FFFFFF" strokeWidth={1.5} />
            </LinearGradient>

            <Text style={tw`text-3xl font-bold text-stone-900 text-center mb-2 tracking-tight`}>Upgrade to Premium</Text>
            <Text style={tw`text-base text-stone-600 text-center leading-6 px-4`}>Become the best version of yourself. Build unlimited habits and achieve more every day</Text>
          </Animated.View>

          {/* Plan Selection */}
          {packages.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200)} style={tw`mb-8`}>
              {packages.map((pkg) => {
                const isYearly = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const monthlyPrice = isYearly ? pkg.product.price / 12 : pkg.product.price;

                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => setSelectedPackage(pkg)}
                    style={({ pressed }) => [tw`mb-3 rounded-2xl overflow-hidden border-2`, isSelected ? tw`border-stone-600` : tw`border-gray-200`, pressed && tw`opacity-80`]}
                  >
                    <View style={tw`p-5 bg-white`}>
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <Text style={tw`text-lg font-bold text-stone-900`}>{isYearly ? 'Yearly' : 'Monthly'}</Text>
                          {isYearly && savingsPercentage > 0 && (
                            <View style={tw`ml-3 px-2.5 py-1 rounded-full bg-jade-100`}>
                              <Text style={tw`text-xs font-bold text-jade-700`}>Save {savingsPercentage}%</Text>
                            </View>
                          )}
                        </View>

                        <View style={[tw`w-5.5 h-5.5 rounded-full items-center justify-center`, isSelected ? tw`bg-stone-600` : tw`bg-stone-200`]}>
                          {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                        </View>
                      </View>

                      <View style={tw`flex-row items-baseline mb-1`}>
                        <Text style={tw`text-2xl font-bold text-stone-900`}>{pkg.product.priceString}</Text>
                        <Text style={tw`text-sm text-stone-600 ml-1.5`}>/ {isYearly ? 'year' : 'month'}</Text>
                      </View>

                      {isYearly && <Text style={tw`text-sm text-stone-500`}>${monthlyPrice.toFixed(2)} per month</Text>}

                      {isYearly && (
                        <View style={tw`mt-3 pt-3 border-t border-stone-100`}>
                          <View style={tw`flex-row items-center`}>
                            <Crown size={14} color="#78716C" strokeWidth={2} style={tw`mr-1.5`} />
                            <Text style={tw`text-xs font-medium text-stone-700`}>Includes 50 Streak Savers bonus</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* Features List */}
          <Animated.View entering={FadeInDown.delay(300)} style={tw`mb-8`}>
            <Text style={tw`text-sm font-bold text-stone-900 mb-4 tracking-wide`}>INCLUDED IN {isYearlySelected ? 'YEARLY' : 'MONTHLY'}</Text>

            <View style={tw`bg-white rounded-2xl overflow-hidden border border-gray-200`}>
              {displayFeatures.map((feature, index) => (
                <View key={index} style={[tw`p-4 flex-row items-start`, index !== displayFeatures.length - 1 && tw`border-b border-gray-100`]}>
                  <LinearGradient colors={feature.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-10 h-10 rounded-xl items-center justify-center mr-3.5 mt-0.5`}>
                    <feature.icon size={20} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>

                  <View style={tw`flex-1`}>
                    <Text style={tw`text-base font-semibold text-stone-900 mb-0.5`}>{feature.title}</Text>
                    <Text style={tw`text-sm text-stone-600 leading-5`}>{feature.description}</Text>
                  </View>

                  <View style={tw`ml-2 mt-1`}>
                    <View style={tw`w-5 h-5 rounded-full bg-jade-100 items-center justify-center`}>
                      <Check size={12} color="#059669" strokeWidth={3} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View entering={FadeInUp.delay(400)}>
            <Pressable
              onPress={handleSubscribe}
              disabled={loading || !selectedPackage}
              style={({ pressed }) => [tw`rounded-2xl overflow-hidden shadow-lg mb-4`, pressed && tw`opacity-90`, (loading || !selectedPackage) && tw`opacity-50`]}
            >
              <LinearGradient colors={['#78716C', '#57534E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-4.5 items-center justify-center`}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={tw`text-white text-base font-bold tracking-wide`}>Start Premium</Text>}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Trust Indicators */}
          <Animated.View entering={FadeInUp.delay(500)} style={tw`items-center mb-4`}>
            <Text style={tw`text-xs text-stone-500 text-center leading-5`}>Cancel anytime • Secure payment</Text>
          </Animated.View>

          {/* Restore Link */}
          <Animated.View entering={FadeInUp.delay(600)} style={tw`items-center mb-4`}>
            <Pressable onPress={handleRestore} disabled={loading}>
              <Text style={tw`text-sm text-stone-600 font-medium underline`}>Restore Purchases</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PaywallScreen;
