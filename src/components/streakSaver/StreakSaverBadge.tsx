// src/components/streakSaver/StreakSaverBadge.tsx
// Version élégante avec gradient violet Amethyst

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { ChevronRight, Zap, Sparkles } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { StreakSaverService } from '../../services/StreakSaverService';
import { useAuth } from '@/context/AuthContext';
import { HapticFeedback } from '@/utils/haptics';
import Logger from '@/utils/logger';
import { Config } from '@/config';

interface StreakSaverBadgeProps {
  onPress?: () => void;
  onShopPress?: () => void;
  refreshTrigger?: number;
}

const StreakSaverIcon = () => {
  try {
    return <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />;
  } catch (error) {
    return <Text style={{ fontSize: 36 }}>🔥</Text>;
  }
};

export const StreakSaverBadge: React.FC<StreakSaverBadgeProps> = ({ onPress, onShopPress, refreshTrigger }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [saveableCount, setSaveableCount] = useState(0);
  const [inventory, setInventory] = useState({ available: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(false);

  // ============================================================================
  // DEV MODE - Mock data for testing
  // ============================================================================
  const DEV_MODE = Config.debug.enabled;
  const mockData = {
    saveableCount: 2,
    inventory: { available: 3, totalUsed: 1 },
  };

  const displaySaveableCount = DEV_MODE ? mockData.saveableCount : saveableCount;
  const displayInventory = DEV_MODE ? mockData.inventory : inventory;

  // ============================================================================
  // Static styles (no animations to save CPU)
  // ============================================================================
  const breatheStyle = { transform: [{ scale: 1 }] };
  const glowStyle = { opacity: 0.5 };

  // ============================================================================
  // Data loading
  // ============================================================================
  useEffect(() => {
    if (user && !DEV_MODE) {
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

  // ============================================================================
  // Logic
  // ============================================================================
  const shouldShowShop = displayInventory.available === 0 && displaySaveableCount > 0;
  const hasStreaksToSave = displaySaveableCount > 0;

  // En DEV, toujours afficher
  if (!DEV_MODE && displaySaveableCount === 0) {
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

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <Animated.View entering={FadeInRight.duration(500).springify()} style={tw`mt-2`}>
      {/* Dev indicator */}
      {DEV_MODE && (
        <View style={tw`mb-2 px-3 py-1.5 bg-purple-100 rounded-lg self-start`}>
          <Text style={tw`text-xs font-bold text-purple-700`}>🎨 DEV MODE</Text>
        </View>
      )}

      <Pressable onPress={handlePress} style={({ pressed }) => [tw`rounded-2xl overflow-hidden`, pressed && tw`opacity-90`]}>
        <View style={tw`relative`}>
          {/* Gradient background */}
          <LinearGradient
            colors={
              shouldShowShop
                ? ['#fef3c7', '#fed7aa', '#fdba74']
                : ['#f3e8ff', '#e9d5ff', '#ddd6fe']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`px-3 py-2.5`}
          >
            <View style={tw`flex-row items-center`}>
              {/* Compact icon */}
              <View style={tw`relative mr-3`}>
                <View style={tw`w-10 h-10 rounded-xl bg-white items-center justify-center shadow-md`}>
                  <Image source={require('../../../assets/interface/streak-saver.png')} style={{ width: 28, height: 28 }} resizeMode="contain" />
                </View>

                {/* Notification badge */}
                {hasStreaksToSave && (
                  <View style={tw`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 items-center justify-center border-2 border-white`}>
                    <Text style={tw`text-white text-[10px] font-black`}>{displaySaveableCount}</Text>
                  </View>
                )}
              </View>

              {/* Content - more compact */}
              <View style={tw`flex-1`}>
                <View style={tw`flex-row items-center`}>
                  <Zap size={14} color={shouldShowShop ? '#EA580C' : '#7C3AED'} fill={shouldShowShop ? '#EA580C' : '#7C3AED'} />
                  <Text style={tw`text-sm font-black ml-1 ${shouldShowShop ? 'text-orange-900' : 'text-purple-900'}`}>
                    {shouldShowShop ? t('streakSaver.badge.outOfStock') : (hasStreaksToSave ? t('streakSaver.badge.streakAlert') : t('streakSaver.badge.readyToSave'))}
                  </Text>
                </View>
                <Text style={tw`text-xs font-medium mt-0.5 ${shouldShowShop ? 'text-orange-700' : 'text-purple-700'}`}>
                  {shouldShowShop
                    ? t('streakSaver.badge.tapToShop')
                    : (hasStreaksToSave
                        ? t('streakSaver.badge.needsSaving', { count: displaySaveableCount })
                        : t('streakSaver.badge.available', { count: displayInventory.available })
                      )
                  }
                </Text>
              </View>

              {/* Arrow */}
              <ChevronRight size={20} color={shouldShowShop ? '#9A3412' : '#6B21A8'} strokeWidth={2.5} />
            </View>
          </LinearGradient>

          {/* Border */}
          <View
            style={[
              tw`absolute inset-0 rounded-2xl`,
              {
                borderWidth: 1,
                borderColor: shouldShowShop ? 'rgba(251, 146, 60, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};
