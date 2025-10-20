// src/screens/PaywallScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Check, Zap, Target, BarChart3, Shield, Crown } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { RootStackParamList } from '@/navigation/types';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import { useSubscription } from '@/context/SubscriptionContext';
import { Image } from 'react-native';

// ============================================================================
// Types
// ============================================================================

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Feature {
  icon: any;
  title: string;
  description: string;
  gradient: string[];
}

interface PaywallScreenProps {
  route?: {
    params?: {
      source?: string;
    };
  };
}

// ============================================================================
// Premium Features with Gradient Colors
// ============================================================================

const features: Feature[] = [
  {
    icon: Target,
    title: 'Unlimited Habits',
    description: 'Track as many habits as you want without limits',
    gradient: ['#E0F2FE', '#BAE6FD'], // Soft blue
  },
  {
    icon: Zap,
    title: '3 Streak Savers/Month',
    description: 'Protect your progress with monthly streak savers',
    gradient: ['#FEF3C7', '#FDE68A'], // Soft amber
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Beautiful insights and detailed progress charts',
    gradient: ['#D1FAE5', '#A7F3D0'], // Soft emerald
  },
  {
    icon: Shield,
    title: 'Priority Support',
    description: 'Get personalized help whenever you need it',
    gradient: ['#E9D5FF', '#D8B4FE'], // Soft purple
  },
];

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
      const availablePackages = await RevenueCatService.getOfferings();

      if (!availablePackages || availablePackages.length === 0) {
        Alert.alert('Error', 'No subscription plans available. Please try again later.');
        return;
      }

      setPackages(availablePackages);
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

  const handleClose = () => {
    navigation.goBack();
  };

  // ==========================================================================
  // Loading State
  // ==========================================================================

  if (loadingOfferings) {
    return (
      <View style={tw`flex-1 bg-slate-50 items-center justify-center`}>
        <ActivityIndicator size="large" color="#64748B" />
        <Text style={tw`mt-4 text-slate-600 font-medium`}>Loading options...</Text>
      </View>
    );
  }

  // ==========================================================================
  // Calculations
  // ==========================================================================

  const monthlyPackage = packages.find((pkg) => pkg.packageType === 'MONTHLY');
  const yearlyPackage = packages.find((pkg) => pkg.packageType === 'ANNUAL');

  const savingsPercentage = monthlyPackage && yearlyPackage ? Math.round((1 - yearlyPackage.product.price / 12 / monthlyPackage.product.price) * 100) : 0;

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <View style={tw`flex-1 bg-slate-50`}>
      <SafeAreaView style={tw`flex-1`}>
        {/* Minimalist Header */}
        <View style={tw`px-6 py-4 flex-row justify-end`}>
          <Pressable onPress={handleClose} style={({ pressed }) => [tw`w-10 h-10 rounded-full items-center justify-center`, pressed && tw`bg-slate-100`]}>
            <X size={22} color="#64748B" strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-6 pb-8`} showsVerticalScrollIndicator={false}>
          {/* Hero Section - Minimalist */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`items-center mb-12 mt-4`}>
            <LinearGradient colors={['#818CF8', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-24 h-24 rounded-3xl items-center justify-center mb-6`}>
              <Image source={require('../../assets/paywall/paywall-portal.png')} style={{ width: 110, height: 110 }} resizeMode="contain" />
            </LinearGradient>

            <Text style={tw`text-3xl font-bold text-slate-900 text-center mb-3 tracking-tight`}>Upgrade to Premium</Text>
            {/* ... rest of hero */}
          </Animated.View>

          {/* Features - Clean Cards with Gradients */}
          <View style={tw`mb-10`}>
            {features.map((feature, index) => (
              <Animated.View key={index} entering={FadeInDown.delay(200 + index * 80)} style={tw`mb-3`}>
                <View style={tw`bg-white rounded-2xl p-5 flex-row items-center border border-slate-100`}>
                  <LinearGradient colors={feature.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-12 h-12 rounded-xl items-center justify-center mr-4`}>
                    <feature.icon size={22} color="#334155" strokeWidth={2} />
                  </LinearGradient>

                  <View style={tw`flex-1 pr-2`}>
                    <Text style={tw`text-base font-semibold text-slate-900 mb-1`}>{feature.title}</Text>
                    <Text style={tw`text-sm text-slate-600 leading-5`}>{feature.description}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Plan Selection - Elegant */}
          {packages.length > 0 && (
            <Animated.View entering={FadeInUp.delay(600)} style={tw`mb-6`}>
              {packages.map((pkg) => {
                const isYearly = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const monthlyPrice = isYearly ? pkg.product.price / 12 : pkg.product.price;

                return (
                  <Pressable key={pkg.identifier} onPress={() => setSelectedPackage(pkg)} style={({ pressed }) => [tw`mb-3 rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
                    <LinearGradient colors={isSelected ? ['#6366F1', '#818CF8'] : ['#FFFFFF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-5`}>
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <View style={tw`flex-row items-center`}>
                          <Text style={[tw`text-lg font-bold`, isSelected ? tw`text-white` : tw`text-slate-900`]}>{pkg.product.title}</Text>
                          {isYearly && savingsPercentage > 0 && (
                            <View style={tw`ml-3 px-3 py-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-emerald-50'}`}>
                              <Text style={[tw`text-xs font-bold`, isSelected ? tw`text-white` : tw`text-emerald-700`]}>Save {savingsPercentage}%</Text>
                            </View>
                          )}
                        </View>

                        <View style={[tw`w-6 h-6 rounded-full items-center justify-center`, isSelected ? tw`bg-white` : tw`bg-slate-100`]}>
                          {isSelected && <Check size={16} color="#6366F1" strokeWidth={3} />}
                        </View>
                      </View>

                      <View style={tw`flex-row items-baseline`}>
                        <Text style={[tw`text-2xl font-bold`, isSelected ? tw`text-white` : tw`text-slate-900`]}>{pkg.product.priceString}</Text>
                        {isYearly && <Text style={[tw`text-sm ml-2`, isSelected ? tw`text-white/80` : tw`text-slate-600`]}>${monthlyPrice.toFixed(2)}/month</Text>}
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </Animated.View>
          )}

          {/* CTA Button - Elegant Gradient */}
          <Animated.View entering={FadeInUp.delay(700)}>
            <Pressable
              onPress={handleSubscribe}
              disabled={loading || !selectedPackage}
              style={({ pressed }) => [tw`rounded-2xl overflow-hidden shadow-lg mb-6`, pressed && tw`opacity-90`, (loading || !selectedPackage) && tw`opacity-50`]}
            >
              <LinearGradient colors={['#6366F1', '#818CF8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`py-5 items-center justify-center`}>
                {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={tw`text-white text-lg font-bold tracking-wide`}>Continue to Premium</Text>}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Trust Indicators - Subtle */}
          <Animated.View entering={FadeInUp.delay(800)} style={tw`items-center mb-6`}>
            <Text style={tw`text-xs text-slate-500 text-center leading-5`}>Secure payment • Cancel anytime • 7-day free trial</Text>
          </Animated.View>

          {/* Restore Link - Minimal */}
          <Animated.View entering={FadeInUp.delay(900)} style={tw`items-center`}>
            <Pressable onPress={handleRestore} disabled={loading}>
              <Text style={tw`text-sm text-slate-600 font-medium`}>Restore Purchases</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PaywallScreen;
