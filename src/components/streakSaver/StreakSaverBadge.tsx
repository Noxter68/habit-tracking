// src/components/streakSaver/StreakSaverBadge.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeInRight, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { ChevronRight, Zap } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { StreakSaverService } from '../../services/StreakSaverService';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticFeedback } from '@/utils/haptics';
import Logger from '@/utils/logger';

interface StreakSaverBadgeProps {
  onPress?: () => void;
  onShopPress?: () => void;
  refreshTrigger?: number;
}

const StreakSaverIcon = () => {
  try {
    return <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />;
  } catch (error) {
    return <Text style={{ fontSize: 32 }}>🔥</Text>;
  }
};

export const StreakSaverBadge: React.FC<StreakSaverBadgeProps> = ({ onPress, onShopPress, refreshTrigger }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [saveableCount, setSaveableCount] = useState(0);
  const [inventory, setInventory] = useState({ available: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(false);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })), -1, false);
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0, { duration: 1500 })), -1, false);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
  }));

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, refreshTrigger]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [saveableHabits, userInventory] = await Promise.all([StreakSaverService.getSaveableHabits(user.id), StreakSaverService.getInventory(user.id)]);

      Logger.debug('📊 Badge Data:', {
        saveableCount: saveableHabits.length,
        inventory: userInventory,
        saveableHabits,
      });

      setSaveableCount(saveableHabits.length);
      setInventory(userInventory);
    } catch (error) {
      Logger.error('Error loading streak saver data:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowShop = inventory.available === 0 && saveableCount > 0;
  const hasStreaksToSave = saveableCount > 0;

  if (saveableCount === 0) {
    return null;
  }

  const handlePress = () => {
    HapticFeedback.light();
    if (shouldShowShop) {
      Logger.debug('🛒 Opening shop modal');
      onShopPress?.();
    } else {
      Logger.debug('🎯 Opening streak saver');
      onPress?.();
    }
  };

  return (
    <Animated.View entering={FadeInRight.duration(400).springify()} style={tw`mb-4`}>
      <Pressable onPress={handlePress} style={({ pressed }) => [tw`rounded-3xl overflow-hidden shadow-lg`, pressed && tw`opacity-90`]}>
        <LinearGradient colors={['#FEF3C7', '#FED7AA', '#FDBA74']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={tw`p-4 flex-row items-center relative`}>
          <Animated.View style={[tw`absolute inset-0 bg-orange-300`, glowStyle]} />

          <Animated.View style={[tw`relative mr-4`, pulseStyle]}>
            <Animated.View style={[tw`absolute inset-0 rounded-full bg-orange-400`, glowStyle, { transform: [{ scale: 1.3 }] }]} />

            <View style={tw`w-14 h-14 rounded-full bg-white items-center justify-center shadow-md`}>
              <StreakSaverIcon />
            </View>

            {hasStreaksToSave && (
              <View style={tw`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center border-2 border-white`}>
                <Text style={tw`text-white text-xs font-bold`}>{saveableCount}</Text>
              </View>
            )}
          </Animated.View>

          <View style={tw`flex-1`}>
            {shouldShowShop ? (
              <>
                <View style={tw`flex-row items-center mb-1`}>
                  <Zap size={16} color="#EA580C" fill="#EA580C" />
                  <Text style={tw`text-base font-black text-orange-900 ml-1`}>{t('streakSaver.badge.outOfStock')}</Text>
                </View>
                <Text style={tw`text-sm font-semibold text-orange-800`}>{t('streakSaver.badge.refillMessage')}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <View style={tw`w-2 h-2 rounded-full bg-orange-600 mr-1.5`} />
                  <Text style={tw`text-xs font-medium text-orange-700`}>{t('streakSaver.badge.tapToShop')}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={tw`flex-row items-center mb-1`}>
                  <Zap size={16} color="#EA580C" fill="#EA580C" />
                  <Text style={tw`text-base font-black text-orange-900 ml-1`}>{hasStreaksToSave ? t('streakSaver.badge.streakAlert') : t('streakSaver.badge.readyToSave')}</Text>
                </View>
                <Text style={tw`text-sm font-semibold text-orange-800`}>{hasStreaksToSave ? t('streakSaver.badge.needsSaving', { count: saveableCount }) : t('streakSaver.badge.allSafe')}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <View style={tw`w-2 h-2 rounded-full bg-orange-600 mr-1.5`} />
                  <Text style={tw`text-xs font-medium text-orange-700`}>{t('streakSaver.badge.available', { count: inventory.available })}</Text>
                </View>
              </>
            )}
          </View>

          <View style={tw`ml-2`}>
            <ChevronRight size={24} color="#9A3412" strokeWidth={3} />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};
