/**
 * @file CustomTabBar.tsx
 * @description Custom tab bar avec animation de slide du fond entre les tabs.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, TouchableOpacity, Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import TabBarIcon from './TabBarIcon';
import { HapticFeedback } from '@/utils/haptics';

// Clé de stockage pour savoir si l'utilisateur a vu l'onglet Achievements
const ACHIEVEMENTS_SEEN_KEY = '@achievements_tab_seen';

// =============================================================================
// TYPES
// =============================================================================

interface CustomTabBarProps extends BottomTabBarProps {
  tierColor: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const TAB_NAMES: Array<'home' | 'calendar' | 'trophy' | 'quest-panel' | 'users' | 'settings'> = ['home', 'calendar', 'trophy', 'quest-panel', 'users', 'settings'];

// =============================================================================
// COMPOSANT
// =============================================================================

export const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, navigation, tierColor }) => {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get('window');
  const { t } = useTranslation();

  // État pour savoir si l'utilisateur a déjà vu l'onglet Achievements
  const [hasSeenAchievements, setHasSeenAchievements] = useState(true); // Par défaut true pour éviter flash

  // Charger l'état au montage
  useEffect(() => {
    const checkAchievementsSeen = async () => {
      try {
        const seen = await AsyncStorage.getItem(ACHIEVEMENTS_SEEN_KEY);
        setHasSeenAchievements(seen === 'true');
      } catch {
        setHasSeenAchievements(false);
      }
    };
    checkAchievementsSeen();
  }, []);

  // Marquer l'onglet Achievements comme vu
  const markAchievementsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ACHIEVEMENTS_SEEN_KEY, 'true');
      setHasSeenAchievements(true);
    } catch {
      // Ignorer l'erreur
    }
  }, []);

  // Calcul de la largeur de chaque tab
  const tabWidth = (width - 32) / state.routes.length; // 32 = paddingHorizontal * 2
  const indicatorWidth = 52;
  const indicatorHeight = 38;

  // Position animée de l'indicateur
  const translateX = useSharedValue(0);

  // Mettre à jour la position quand l'index change
  useEffect(() => {
    const targetX = state.index * tabWidth + (tabWidth - indicatorWidth) / 2;
    translateX.value = withSpring(targetX, {
      damping: 20,
      stiffness: 300,
      mass: 0.8,
    });
  }, [state.index, tabWidth]);

  // Style animé pour l'indicateur de fond
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: Platform.OS === 'ios' ? 80 : 56,
        paddingBottom: Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom - 10 : 6) : 6,
        paddingTop: 20,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Indicateur animé de fond - ovale horizontal */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 17,
            left: 16,
            width: indicatorWidth,
            height: indicatorHeight,
            borderRadius: indicatorHeight / 2,
            backgroundColor: '#f1f5f9',
            shadowColor: '#64748b',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
          },
          indicatorStyle,
        ]}
      />

      {/* Tabs */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          HapticFeedback.selection();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }

          // Marquer l'onglet Achievements comme vu au premier clic
          if (TAB_NAMES[index] === 'quest-panel' && !hasSeenAchievements) {
            markAchievementsSeen();
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <TabBarIcon
              name={TAB_NAMES[index]}
              color={isFocused ? tierColor : '#94a3b8'}
              focused={isFocused}
              tierColor={tierColor}
              showNewBadge={TAB_NAMES[index] === 'quest-panel' && !hasSeenAchievements}
              newBadgeText={t('common.new')}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default CustomTabBar;
