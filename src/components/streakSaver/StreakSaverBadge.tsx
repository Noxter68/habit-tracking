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

      <Pressable onPress={handlePress} style={({ pressed }) => [tw`rounded-3xl overflow-hidden`, pressed && tw`opacity-90`]}>
        <View style={tw`relative`}>
          {/* Gradient background violet Amethyst */}
          <LinearGradient
            colors={
              shouldShowShop
                ? ['#fef3c7', '#fed7aa', '#fdba74'] // Orange si out of stock
                : ['#f3e8ff', '#e9d5ff', '#ddd6fe'] // Violet Amethyst sinon
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={tw`px-5 py-4`}
          >
            {/* Glow effect subtil */}
            <Animated.View style={[tw`absolute inset-0`, { backgroundColor: shouldShowShop ? '#FED7AA' : '#E9D5FF' }, glowStyle]} />

            <View style={tw`flex-row items-center relative z-10`}>
              {/* Icon avec breathing animation */}
              <Animated.View style={[tw`relative mr-4`, breatheStyle]}>
                {/* Glow ring autour de l'icon */}
                <Animated.View
                  style={[
                    tw`absolute inset-0 rounded-full`,
                    {
                      backgroundColor: shouldShowShop ? '#FED7AA' : '#DDD6FE',
                      transform: [{ scale: 1.4 }],
                    },
                    glowStyle,
                  ]}
                />

                {/* Icon container */}
                <View style={tw`w-16 h-16 rounded-2xl bg-white items-center justify-center shadow-xl`}>
                  <StreakSaverIcon />
                </View>

                {/* Notification badge */}
                {hasStreaksToSave && (
                  <View style={tw`absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-red-500 items-center justify-center border-[3px] border-white shadow-lg`}>
                    <Text style={tw`text-white text-xs font-black`}>{displaySaveableCount}</Text>
                  </View>
                )}

                {/* Sparkle indicator si tout va bien */}
                {!shouldShowShop && !hasStreaksToSave && (
                  <View style={tw`absolute -top-1 -right-1 w-6 h-6 rounded-full bg-purple-500 items-center justify-center border-2 border-white shadow-md`}>
                    <Sparkles size={12} color="white" fill="white" />
                  </View>
                )}
              </Animated.View>

              {/* Content */}
              <View style={tw`flex-1`}>
                {shouldShowShop ? (
                  <>
                    <View style={tw`flex-row items-center mb-1`}>
                      <Zap size={16} color="#EA580C" fill="#EA580C" />
                      <Text style={tw`text-base font-black text-orange-900 ml-1.5 tracking-wide`}>{t('streakSaver.badge.outOfStock')}</Text>
                    </View>
                    <Text style={tw`text-sm font-semibold text-orange-800 leading-tight`}>{t('streakSaver.badge.refillMessage')}</Text>
                    <View style={tw`flex-row items-center mt-2`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-orange-600 mr-2`} />
                      <Text style={tw`text-xs font-bold text-orange-700`}>{t('streakSaver.badge.tapToShop')}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={tw`flex-row items-center mb-1`}>
                      <Zap size={16} color={hasStreaksToSave ? '#7C3AED' : '#8B5CF6'} fill={hasStreaksToSave ? '#7C3AED' : '#8B5CF6'} />
                      <Text style={tw`text-base font-black ml-1.5 tracking-wide ${hasStreaksToSave ? 'text-purple-900' : 'text-purple-800'}`}>
                        {hasStreaksToSave ? t('streakSaver.badge.streakAlert') : t('streakSaver.badge.readyToSave')}
                      </Text>
                    </View>

                    <Text style={tw`text-sm font-semibold text-purple-800 leading-tight`}>
                      {hasStreaksToSave ? t('streakSaver.badge.needsSaving', { count: displaySaveableCount }) : t('streakSaver.badge.allSafe')}
                    </Text>

                    <View style={tw`flex-row items-center mt-2`}>
                      <View style={tw`w-1.5 h-1.5 rounded-full bg-purple-600 mr-2`} />
                      <Text style={tw`text-xs font-bold text-purple-700`}>{t('streakSaver.badge.available', { count: displayInventory.available })}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Arrow indicator */}
              <View style={tw`ml-3`}>
                <ChevronRight size={24} color={shouldShowShop ? '#9A3412' : '#6B21A8'} strokeWidth={3} />
              </View>
            </View>
          </LinearGradient>

          {/* Subtle border pour plus d'élégance */}
          <View
            style={[
              tw`absolute inset-0 rounded-3xl`,
              {
                borderWidth: 1.5,
                borderColor: shouldShowShop ? 'rgba(251, 146, 60, 0.2)' : 'rgba(139, 92, 246, 0.25)',
              },
            ]}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
};
