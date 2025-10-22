// src/components/streakSaver/StreakSaverShopModal.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Pressable, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Sparkles, CheckCircle, XCircle } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import { LinearGradient } from 'expo-linear-gradient';
import { RevenueCatService, SubscriptionPackage } from '@/services/RevenueCatService';
import { StreakSaverService } from '@/services/StreakSaverService';
import { useAuth } from '@/context/AuthContext';

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

const getSavingsText = (quantity: number): string | undefined => {
  if (quantity === 10) return 'Save 20%';
  if (quantity === 25) return 'Save 40%';
  return undefined;
};

export const StreakSaverShopModal: React.FC<StreakSaverShopModalProps> = ({ visible, onClose, onPurchaseSuccess }) => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [messageState, setMessageState] = useState<MessageState>(null);
  const [purchasedQuantity, setPurchasedQuantity] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const { user } = useAuth();

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
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: SubscriptionPackage) => {
    try {
      setPurchasing(pkg.identifier);
      const result = await RevenueCatService.purchasePackage(pkg);

      if (result.success) {
        const quantity = getStreakSaverQuantity(pkg.product.identifier);
        await StreakSaverService.addStreakSavers(user.id, quantity);

        setPurchasedQuantity(quantity);
        setMessageState('success');
        onPurchaseSuccess?.();
      } else if (result.error !== 'cancelled') {
        setErrorMessage(result.error || 'Purchase failed');
        setMessageState('error');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong');
      setMessageState('error');
    } finally {
      setPurchasing(null);
    }
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
                    <LinearGradient colors={['#10b981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-full items-center justify-center mb-4`}>
                      <CheckCircle size={40} color="white" strokeWidth={2.5} />
                    </LinearGradient>
                    <Text style={tw`text-2xl font-black text-center text-stone-900`}>Purchase Successful!</Text>
                  </View>

                  <View style={tw`items-center mb-6`}>
                    <View style={tw`w-28 h-28 rounded-2xl bg-orange-50 items-center justify-center mb-3`}>
                      <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 64, height: 64 }} resizeMode="contain" />
                    </View>
                    <Text style={tw`text-5xl font-black text-stone-900`}>×{purchasedQuantity}</Text>
                  </View>

                  <Text style={tw`text-sm text-center text-stone-600`}>Added to your inventory</Text>
                </>
              ) : (
                <>
                  <View style={tw`items-center mb-6`}>
                    <LinearGradient colors={['#ef4444', '#dc2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`w-16 h-16 rounded-full items-center justify-center mb-4`}>
                      <XCircle size={40} color="white" strokeWidth={2.5} />
                    </LinearGradient>
                    <Text style={tw`text-2xl font-black text-center text-stone-900`}>Purchase Failed</Text>
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
            <LinearGradient colors={['#FEF3C7', '#FED7AA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`px-5 pt-5 pb-3 relative`}>
              <Pressable onPress={onClose} style={tw`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 items-center justify-center shadow-sm`}>
                <X size={18} color="#57534E" strokeWidth={2.5} />
              </Pressable>

              <Animated.View entering={ZoomIn.duration(600).springify()} style={tw`items-center`}>
                <View style={tw`w-14 h-14 rounded-full bg-white items-center justify-center shadow-xl mb-2`}>
                  <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
                </View>
                <Text style={tw`text-lg font-black text-orange-900`}>Streak Savers</Text>
              </Animated.View>
            </LinearGradient>

            <View style={tw`px-4 py-3`}>
              {loading ? (
                <View style={tw`py-8 items-center`}>
                  <ActivityIndicator size="large" color="#EA580C" />
                </View>
              ) : packages.length === 0 ? (
                <View style={tw`py-8 items-center`}>
                  <Text style={tw`text-stone-500 text-sm`}>No packages available</Text>
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
                          tw`relative rounded-xl overflow-hidden border-2 ${isPopular ? 'border-orange-400' : 'border-stone-200'}`,
                          pressed && tw`scale-98`,
                          (isPurchasing || purchasing) && tw`opacity-50`,
                        ]}
                      >
                        <LinearGradient colors={isPopular ? ['#FFFBEB', '#FFFFFF'] : ['#FAFAF9', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={tw`p-4`}>
                          <View style={tw`flex-row items-center justify-between mb-3`}>
                            <View style={tw`flex-row items-center flex-1`}>
                              <View style={tw`w-12 h-12 rounded-xl bg-orange-50 items-center justify-center mr-3`}>
                                <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                              </View>
                              <View style={tw`flex-1`}>
                                <Text style={tw`text-base font-black text-stone-900`}>{quantity} Savers</Text>
                                {isPopular && (
                                  <View style={tw`bg-orange-500 px-2.5 py-1 rounded-full mt-1 self-start`}>
                                    <Text style={tw`text-white text-[9px] font-black`}>POPULAR</Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            <View style={tw`items-end ml-2`}>
                              <Text style={tw`text-xl font-black text-stone-900`}>{pkg.product.priceString}</Text>
                              {savings && <Text style={tw`text-[10px] font-bold text-orange-600 mt-0.5`}>{savings}</Text>}
                            </View>
                          </View>

                          <LinearGradient colors={['#EA580C', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`py-2.5 rounded-lg items-center`}>
                            {isPurchasing ? <ActivityIndicator size="small" color="white" /> : <Text style={tw`text-white text-xs font-black`}>BUY NOW</Text>}
                          </LinearGradient>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  );
                })
              )}

              {!loading && packages.length > 0 && <Text style={tw`text-[10px] text-center text-stone-500 mt-2`}>Restore missed days within 24h 🔥</Text>}
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};
