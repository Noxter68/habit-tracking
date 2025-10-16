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
import { RevenueCatService, SubscriptionOffering } from '@/services/RevenueCatService';
import { useSubscription } from '@/context/SubscriptionContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Feature {
  icon: any;
  title: string;
  description: string;
}

const features: Feature[] = [
  { icon: Target, title: 'Unlimited Habits', description: 'Track as many habits as you want' },
  { icon: Sparkles, title: 'Unlimited Streak Savers', description: 'Never lose your progress' },
  { icon: TrendingUp, title: 'Advanced Analytics', description: 'Detailed charts & insights' },
  { icon: Lock, title: 'Priority Support', description: 'Get help when you need it' },
];

interface PaywallScreenProps {
  route?: {
    params?: {
      source?: string;
    };
  };
}

const PaywallScreen: React.FC<PaywallScreenProps> = ({ route }) => {
  const navigation = useNavigation<NavigationProp>();
  const { refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [offerings, setOfferings] = useState<SubscriptionOffering[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<SubscriptionOffering | null>(null);

  // Load offerings from RevenueCat
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const availableOfferings = await RevenueCatService.getOfferings();
      console.log(availableOfferings);
      if (availableOfferings.length === 0) {
        Alert.alert('Error', 'No subscription plans available. Please try again later.');
        setLoadingOfferings(false);
        return;
      }

      setOfferings(availableOfferings);

      // Auto-select yearly plan if available (better value), otherwise monthly
      const yearlyPlan = availableOfferings.find((o) => o.identifier === '$rc_annual' || o.product.title.toLowerCase().includes('year'));

      setSelectedOffering(yearlyPlan || availableOfferings[0]);
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options. Please try again.');
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    if (!selectedOffering) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    setLoading(true);

    try {
      const result = await RevenueCatService.purchasePackage(selectedOffering.package);

      if (result.success) {
        // Refresh subscription status
        await refreshSubscription();

        // Show success message
        Alert.alert('🎉 Welcome to Premium!', 'You now have unlimited access to all features.', [
          {
            text: 'Get Started',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (result.error !== 'cancelled') {
        Alert.alert('Purchase Failed', 'Unable to complete purchase. Please try again.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
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
        await refreshSubscription();
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

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

            <Text style={tw`text-base text-stone-600 text-center px-4`}>Get unlimited habits and advanced features to build better routines</Text>
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

          {/* Pricing Card */}
          {/* Plan Selection - Only show if we have multiple plans */}
          {offerings.length > 1 && (
            <View style={tw`mb-6`}>
              {offerings.map((offering) => {
                const isYearly = offering.identifier === '$rc_annual' || offering.product.title.toLowerCase().includes('year');
                const isSelected = selectedOffering?.identifier === offering.identifier;

                return (
                  <Pressable
                    key={offering.identifier}
                    onPress={() => setSelectedOffering(offering)}
                    style={({ pressed }) => [
                      tw`mb-3 p-4 rounded-xl border-2 flex-row items-center justify-between`,
                      isSelected ? tw`border-stone-600 bg-stone-50` : tw`border-stone-200 bg-white`,
                      pressed && tw`opacity-70`,
                    ]}
                  >
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-base font-semibold text-stone-800 mb-1`}>{isYearly ? 'Yearly' : 'Monthly'}</Text>
                      <Text style={tw`text-lg font-bold text-stone-900`}>
                        {offering.priceString}
                        {isYearly && <Text style={tw`text-sm font-normal text-stone-600`}> ({(offering.price / 12).toFixed(2)}/mo)</Text>}
                      </Text>
                      {isYearly && (
                        <Text style={tw`text-xs font-medium text-emerald-600 mt-1`}>
                          Save {Math.round((1 - offering.price / 12 / offerings.find((o) => !o.product.title.toLowerCase().includes('year'))!.price) * 100)}%
                        </Text>
                      )}
                    </View>

                    <View style={[tw`w-6 h-6 rounded-full border-2 items-center justify-center`, isSelected ? tw`border-stone-600 bg-stone-600` : tw`border-stone-300`]}>
                      {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Trust Indicators */}
          <Animated.View entering={FadeInUp.delay(800)} style={tw`items-center mb-4`}>
            <Text style={tw`text-xs text-stone-500 text-center px-8`}>Join thousands of users building better habits. Secure payment via App Store.</Text>
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
