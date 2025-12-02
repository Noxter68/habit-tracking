// src/components/streakSaver/StreakSaverShopModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Image, ActivityIndicator, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, CheckCircle, XCircle, Shield } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import { StreakSaverService } from '@/services/StreakSaverService';
import { useAuth } from '@/context/AuthContext';
import Logger from '@/utils/logger';
import { Config } from '@/config';

interface StreakSaverShopModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
}

type MessageState = 'success' | 'error' | null;

const getStreakSaverQuantity = (identifier: string): number => {
  if (identifier.includes('3')) return 3;
  if (identifier.includes('10')) return 10;
  if (identifier.includes('25')) return 25;
  return 3;
};

export const StreakSaverShopModal: React.FC<StreakSaverShopModalProps> = ({ visible, onClose, onPurchaseSuccess }) => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<MessageState>(null);
  const [purchasedQuantity, setPurchasedQuantity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const { user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      loadPackages();
      setMessageState(null);
    }
  }, [visible]);

  useEffect(() => {
    if (messageState) {
      const timer = setTimeout(() => {
        setMessageState(null);
        if (messageState === 'success') {
          onClose();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [messageState]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const { consumables } = await RevenueCatService.getAllOfferings();
      const streakSaverPackages = consumables.filter((pkg) => pkg.product.identifier.includes('streak_saver')).sort((a, b) => a.product.price - b.product.price);
      setPackages(streakSaverPackages);
    } catch (error) {
      Logger.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: SubscriptionPackage) => {
    try {
      setPurchasing(pkg.identifier);
      const result = await RevenueCatService.purchasePackage(pkg, user.id);

      if (result.success) {
        const quantity = getStreakSaverQuantity(pkg.product.identifier);
        await StreakSaverService.addStreakSavers(user.id, quantity);

        setPurchasedQuantity(quantity);
        setMessageState('success');
        onPurchaseSuccess?.();
      } else if (result.error !== 'cancelled') {
        setErrorMessage(result.error || t('streakSaver.shop.purchaseFailed'));
        setMessageState('error');
      }
    } catch (error: any) {
      setErrorMessage(error.message || t('streakSaver.shop.purchaseFailed'));
      setMessageState('error');
    } finally {
      setPurchasing(null);
    }
  };

  const getSavingsText = (quantity: number): string | undefined => {
    if (quantity === 10) return t('streakSaver.shop.save20');
    if (quantity === 25) return t('streakSaver.shop.save40');
    return undefined;
  };

  if (messageState) {
    return (
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
        <BlurView intensity={40} style={tw`flex-1`}>
          <Animated.View entering={FadeIn.duration(200)} style={tw`flex-1 bg-black/60 items-center justify-center px-5`}>
            <Animated.View entering={ZoomIn.duration(500).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-sm shadow-2xl p-8`}>
              {messageState === 'success' ? (
                <>
                  <View style={tw`items-center mb-6`}>
                    <LinearGradient colors={['#8b5cf6', '#7c3aed']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-full items-center justify-center mb-4`}>
                      <CheckCircle size={40} color="white" strokeWidth={2.5} />
                    </LinearGradient>
                    <Text style={tw`text-2xl font-black text-center text-stone-900`}>{t('streakSaver.shop.purchaseSuccess')}</Text>
                  </View>

                  <View style={tw`items-center mb-6`}>
                    <View style={tw`w-28 h-28 rounded-2xl bg-purple-50 items-center justify-center mb-3`}>
                      <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
                    </View>
                    <Text style={tw`text-5xl font-black text-stone-900`}>×{purchasedQuantity}</Text>
                  </View>

                  <Text style={tw`text-sm text-center text-stone-600`}>{t('streakSaver.shop.addedToInventory')}</Text>
                </>
              ) : (
                <>
                  <View style={tw`items-center mb-6`}>
                    <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-full items-center justify-center mb-4`}>
                      <XCircle size={40} color="white" strokeWidth={2.5} />
                    </LinearGradient>
                    <Text style={tw`text-2xl font-black text-center text-stone-900`}>{t('streakSaver.shop.purchaseFailed')}</Text>
                  </View>
                  <Text style={tw`text-sm text-center text-stone-600`}>{errorMessage}</Text>
                </>
              )}
            </Animated.View>
          </Animated.View>
        </BlurView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <BlurView intensity={40} style={tw`flex-1`}>
        <Animated.View entering={FadeIn.duration(200)} style={tw`flex-1 bg-black/60 items-center justify-center px-5`}>
          <Pressable style={tw`absolute inset-0`} onPress={onClose} />

          <Animated.View entering={FadeInDown.duration(400).springify()} style={tw`bg-white rounded-3xl overflow-hidden w-full max-w-md shadow-2xl`}>
            {/* Header avec gradient violet Amethyst */}
            <LinearGradient colors={['#f3e8ff', '#e9d5ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-5 pt-5 pb-4 relative`}>
              <Pressable onPress={onClose} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 items-center justify-center shadow-sm`}>
                <X size={18} color="#57534E" strokeWidth={2.5} />
              </Pressable>

              <Animated.View entering={ZoomIn.duration(600).springify()} style={tw`items-center`}>
                <View style={tw`w-16 h-16 rounded-xl bg-white items-center justify-center shadow-lg mb-3`}>
                  <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 38, height: 38 }} resizeMode="contain" />
                </View>
                <Text style={tw`text-lg font-black text-purple-900 mb-1`}>{t('streakSaver.shop.title')}</Text>
                <Text style={tw`text-xs text-purple-700/70 text-center`}>{t('streakSaver.shop.subtitle')}</Text>
              </Animated.View>
            </LinearGradient>

            <View style={tw`px-4 py-3`}>
              {/* 🔧 DEBUG BUTTONS - Remove in production */}
              {Config.debug.enabled && (
                <View style={tw`flex-row gap-2 mb-3`}>
                  <Pressable
                    onPress={() => {
                      setPurchasedQuantity(10);
                      setMessageState('success');
                    }}
                    style={tw`flex-1 bg-green-500 py-2 rounded-lg`}
                  >
                    <Text style={tw`text-white text-xs font-bold text-center`}>Test Success</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setErrorMessage('Test error message');
                      setMessageState('error');
                    }}
                    style={tw`flex-1 bg-red-500 py-2 rounded-lg`}
                  >
                    <Text style={tw`text-white text-xs font-bold text-center`}>Test Error</Text>
                  </Pressable>
                </View>
              )}

              {loading ? (
                <View style={tw`py-8 items-center`}>
                  <ActivityIndicator size="large" color="#8b5cf6" />
                  <Text style={tw`text-stone-500 text-sm mt-2`}>{t('streakSaver.shop.loading')}</Text>
                </View>
              ) : packages.length === 0 ? (
                <View style={tw`py-8 items-center`}>
                  <Text style={tw`text-stone-500 text-sm`}>{t('streakSaver.shop.noPackages')}</Text>
                </View>
              ) : (
                packages.map((pkg, index) => {
                  const quantity = getStreakSaverQuantity(pkg.product.identifier);
                  const savings = getSavingsText(quantity);
                  const isPopular = quantity === 10;
                  const isPurchasing = purchasing === pkg.identifier;

                  return (
                    <Animated.View key={pkg.identifier} entering={FadeInDown.delay(index * 80).springify()} style={tw`mb-2.5`}>
                      <Pressable
                        onPress={() => handlePurchase(pkg)}
                        disabled={isPurchasing || !!purchasing}
                        style={({ pressed }) => [
                          tw`relative rounded-xl overflow-hidden border-2 ${isPopular ? 'border-purple-400' : 'border-stone-200'}`,
                          pressed && tw`scale-98`,
                          (isPurchasing || purchasing) && tw`opacity-50`,
                        ]}
                      >
                        {/* Badge Popular */}
                        {isPopular && (
                          <View style={tw`absolute top-0 right-0 bg-purple-600 px-2.5 py-0.5 rounded-bl-lg z-10`}>
                            <Text style={tw`text-white text-[9px] font-black`}>{t('streakSaver.shop.popular')}</Text>
                          </View>
                        )}

                        <LinearGradient
                          colors={isPopular ? ['#faf5ff', '#FFFFFF'] : ['#FAFAF9', '#FFFFFF']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={tw`p-3.5`}
                        >
                          <View style={tw`flex-row items-center mb-4`}>
                            <View style={tw`w-12 h-12 rounded-xl ${isPopular ? 'bg-purple-100' : 'bg-purple-50'} items-center justify-center mr-3`}>
                              <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 30, height: 30 }} resizeMode="contain" />
                            </View>

                            <View style={tw`flex-1`}>
                              <Text style={tw`text-[15px] font-black text-stone-900`}>{t('streakSaver.shop.savers', { count: quantity })}</Text>
                              <Text style={tw`text-[11px] text-stone-500`}>
                                {t('streakSaver.shop.receiveDescription', { count: quantity })}
                              </Text>
                            </View>

                            <View style={tw`items-end`}>
                              <Text style={tw`text-lg font-black text-stone-900`}>{pkg.product.priceString}</Text>
                              {savings && <Text style={tw`text-[10px] font-bold text-purple-600`}>{savings}</Text>}
                            </View>
                          </View>

                          {/* Bouton d'achat */}
                          <LinearGradient
                            colors={['#8b5cf6', '#7c3aed']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={tw`py-2.5 rounded-lg items-center`}
                          >
                            {isPurchasing ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Text style={tw`text-white text-xs font-bold`}>{t('streakSaver.shop.buyNow')}</Text>
                            )}
                          </LinearGradient>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}

              {/* Footer */}
              {!loading && packages.length > 0 && (
                <>
                  <View style={tw`flex-row items-center justify-center mt-2`}>
                    <Shield size={12} color="#a1a1aa" strokeWidth={2} />
                    <Text style={tw`text-[10px] text-stone-400 ml-1`}>{t('streakSaver.shop.footer')}</Text>
                  </View>

                  {/* Legal Links */}
                  <View style={tw`flex-row items-center justify-center mt-2`}>
                    <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                      <Text style={tw`text-[10px] text-stone-400 underline`}>{t('paywall.termsOfUse')}</Text>
                    </Pressable>
                    <Text style={tw`text-[10px] text-stone-400 mx-1.5`}>•</Text>
                    <Pressable onPress={() => Linking.openURL('https://angry-cinnamon-945.notion.site/Privacy-Policy-Nuvoria-2b777cf8858880aca7befe0e62643bcd?source=copy_link')}>
                      <Text style={tw`text-[10px] text-stone-400 underline`}>{t('paywall.privacyPolicy')}</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
