// src/screens/PaywallScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { X, Crown, Infinity, Shield, Sparkles, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '../lib/tailwind';
import { RootStackParamList } from '../../App';
import { useSubscription } from '@/context/SubscriptionContext';
import { useAuth } from '@/context/AuthContext';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import Logger from '@/utils/logger';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Paywall'>;

interface Feature {
  icon: any;
  title: string;
  description: string;
}

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
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);

  // Features list
  const sharedFeatures: Feature[] = [
    {
      icon: Infinity,
      title: t('paywall.features.unlimitedHabits.title'),
      description: t('paywall.features.unlimitedHabits.description'),
    },
    {
      icon: Shield,
      title: t('paywall.features.unlimitedHoliday.title'),
      description: t('paywall.features.unlimitedHoliday.description'),
    },
  ];

  const monthlyExtraFeature: Feature = {
    icon: Sparkles,
    title: t('paywall.features.monthlyStreakSavers.title'),
    description: t('paywall.features.monthlyStreakSavers.description'),
  };

  const yearlyExtraFeature: Feature = {
    icon: Crown,
    title: t('paywall.features.yearlyStreakSavers.title'),
    description: t('paywall.features.yearlyStreakSavers.description'),
  };

  // Load offerings
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const { subscriptions } = await RevenueCatService.getAllOfferings();

      if (!subscriptions || subscriptions.length === 0) {
        Alert.alert(t('common.error'), t('paywall.alerts.noPlans'));
        return;
      }

      setPackages(subscriptions);
      const yearlyPlan = subscriptions.find((pkg) => pkg.packageType === 'ANNUAL');
      setSelectedPackage(yearlyPlan || subscriptions[0]);
    } catch (error) {
      Logger.error('❌ [Paywall] Failed to load offerings');
      Alert.alert(t('common.error'), t('paywall.error'));
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) {
      Alert.alert(t('common.error'), t('paywall.alerts.selectPlan'));
      return;
    }

    setLoading(true);

    try {
      const result = await RevenueCatService.purchasePackage(selectedPackage, user?.id);

      if (result.success) {
        await refreshSubscription();
        Alert.alert(t('paywall.alerts.welcomeTitle'), t('paywall.alerts.welcomeMessage'), [
          {
            text: t('paywall.alerts.getStarted'),
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (result.error !== 'cancelled') {
        Alert.alert(t('paywall.alerts.purchaseFailedTitle'), result.error || t('paywall.alerts.purchaseFailedMessage'));
      }
    } catch (error) {
      Logger.error('❌ [Paywall] Purchase error');
      Alert.alert(t('common.error'), t('paywall.alerts.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const result = await RevenueCatService.restorePurchases();

      if (result.success) {
        Alert.alert(t('common.success'), t('paywall.alerts.restoreSuccess'), [
          {
            text: t('common.continue'),
            onPress: async () => {
              await refreshSubscription();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert(t('paywall.alerts.noPurchasesTitle'), t('paywall.alerts.noPurchasesMessage'));
      }
    } catch (error) {
      Logger.error('❌ [Paywall] Restore error');
      Alert.alert(t('common.error'), t('paywall.alerts.restoreError'));
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loadingOfferings) {
    return (
      <ImageBackground source={require('../../assets/interface/background-v3.png')} style={styles.background} resizeMode="cover">
        <View style={[StyleSheet.absoluteFill, tw`bg-black/40`]} />
        <View style={tw`flex-1 items-center justify-center`}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={tw`mt-4 text-white font-medium`}>{t('paywall.loadingPlans')}</Text>
        </View>
      </ImageBackground>
    );
  }

  // Calculations
  const monthlyPackage = packages.find((pkg) => pkg.packageType === 'MONTHLY');
  const yearlyPackage = packages.find((pkg) => pkg.packageType === 'ANNUAL');
  const isYearlySelected = selectedPackage?.packageType === 'ANNUAL';
  const savingsPercentage = monthlyPackage && yearlyPackage ? Math.round((1 - yearlyPackage.product.price / 12 / monthlyPackage.product.price) * 100) : 0;

  const displayFeatures = [...sharedFeatures, isYearlySelected ? yearlyExtraFeature : monthlyExtraFeature];

  return (
    <ImageBackground source={require('../../assets/interface/background-v3.png')} style={styles.background} resizeMode="cover">
      <View style={[StyleSheet.absoluteFill, tw`bg-black/40`]} />
      <SafeAreaView style={tw`flex-1`} edges={['top']}>
        {/* Close Button */}
        <View style={tw`px-6 pt-2 pb-4 flex-row justify-end`}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [tw`w-10 h-10 rounded-full items-center justify-center bg-white/15`, pressed && tw`opacity-70`]}>
            <X size={20} color="#ffffff" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView style={tw`flex-1`} contentContainerStyle={tw`px-8 pb-8`} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={tw`items-center mb-10`}>
            <View style={tw`w-20 h-20 rounded-3xl bg-amber-500/30 items-center justify-center mb-5`}>
              <Crown size={40} color="#fbbf24" strokeWidth={1.5} />
            </View>

            <Text style={tw`text-4xl font-bold text-white text-center mb-3`}>{t('paywall.title')}</Text>
            <Text style={tw`text-base text-white/80 text-center leading-6 px-2`}>{t('paywall.subtitle')}</Text>
          </Animated.View>

          {/* Plan Selection */}
          {packages.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200)} style={tw`mb-8`}>
              {packages.map((pkg, index) => {
                const isYearly = pkg.packageType === 'ANNUAL';
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const monthlyPrice = isYearly ? pkg.product.price / 12 : pkg.product.price;

                return (
                  <Animated.View key={pkg.identifier} entering={FadeInDown.delay(index * 30).duration(300)}>
                    <Pressable
                      onPress={() => setSelectedPackage(pkg)}
                      style={({ pressed }) => [
                        tw`mb-3 rounded-2xl p-5 border-2 ${isSelected ? 'border-amber-400/60' : 'border-white/20'}`,
                        { backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.15)' },
                        pressed && tw`opacity-80`,
                      ]}
                    >
                      <View style={tw`flex-row items-center justify-between mb-3`}>
                        <View style={tw`flex-row items-center flex-1`}>
                          <Text style={tw`text-lg font-bold text-white`}>{isYearly ? t('paywall.plans.yearly') : t('paywall.plans.monthly')}</Text>
                          {isYearly && savingsPercentage > 0 && (
                            <View style={tw`ml-3 px-2.5 py-1 rounded-full bg-emerald-500/30`}>
                              <Text style={tw`text-xs font-bold text-emerald-300`}>{t('paywall.plans.savePercent', { percent: savingsPercentage })}</Text>
                            </View>
                          )}
                        </View>

                        <View style={[tw`w-6 h-6 rounded-full items-center justify-center`, isSelected ? tw`bg-amber-500` : tw`bg-white/20`]}>
                          {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                        </View>
                      </View>

                      <View style={tw`flex-row items-baseline mb-1`}>
                        <Text style={tw`text-3xl font-bold text-white`}>{pkg.product.priceString}</Text>
                        <Text style={tw`text-sm text-white/70 ml-2`}>/ {isYearly ? t('paywall.plans.year') : t('paywall.plans.month')}</Text>
                      </View>

                      {isYearly && <Text style={tw`text-sm text-white/60`}>{t('paywall.plans.perMonth', { price: monthlyPrice.toFixed(2) })}</Text>}

                      {isYearly && (
                        <View style={tw`mt-3 pt-3 border-t border-white/20`}>
                          <View style={tw`flex-row items-center`}>
                            <Crown size={14} color="#fbbf24" strokeWidth={2} style={tw`mr-2`} />
                            <Text style={tw`text-xs font-medium text-white/90`}>{t('paywall.plans.includesBonus')}</Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Features List */}
          <Animated.View entering={FadeInDown.delay(300)} style={tw`mb-8`}>
            <Text style={tw`text-sm font-bold text-white/90 mb-4 tracking-wide`}>{t('paywall.includedIn', { plan: isYearlySelected ? t('paywall.plans.yearly').toUpperCase() : t('paywall.plans.monthly').toUpperCase() })}</Text>

            <View style={tw`gap-3`}>
              {displayFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Animated.View key={index} entering={FadeInDown.delay(index * 30).duration(300)}>
                    <View style={tw`bg-white/15 border-2 border-white/20 rounded-2xl p-4 flex-row items-start`}>
                      <View style={tw`w-10 h-10 rounded-xl bg-amber-500/30 items-center justify-center mr-4 mt-0.5`}>
                        <Icon size={20} color="#fbbf24" strokeWidth={2} />
                      </View>

                      <View style={tw`flex-1`}>
                        <Text style={tw`text-base font-semibold text-white mb-0.5`}>{feature.title}</Text>
                        <Text style={tw`text-sm text-white/70 leading-5`}>{feature.description}</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View entering={FadeInUp.delay(400)}>
            <Pressable
              onPress={handleSubscribe}
              disabled={loading || !selectedPackage}
              style={({ pressed }) => [tw`rounded-2xl py-5 items-center justify-center mb-4 ${loading || !selectedPackage ? 'bg-white/20' : 'bg-white'}`, pressed && tw`opacity-80`]}
            >
              {loading ? <ActivityIndicator color="#7c3aed" /> : <Text style={tw`text-purple-600 text-lg font-bold`}>{t('paywall.cta')}</Text>}
            </Pressable>
          </Animated.View>

          {/* Trust Indicators */}
          <Animated.View entering={FadeInUp.delay(500)} style={tw`items-center mb-4`}>
            <Text style={tw`text-xs text-white/50 text-center leading-5`}>{t('paywall.terms')}</Text>
          </Animated.View>

          {/* Restore Link */}
          <Animated.View entering={FadeInUp.delay(600)} style={tw`items-center mb-4`}>
            <Pressable onPress={handleRestore} disabled={loading}>
              <Text style={tw`text-sm text-white/80 font-medium underline`}>{t('paywall.restore')}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});

export default PaywallScreen;
