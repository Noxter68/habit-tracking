/**
 * ============================================================================
 * InventoryScreen.tsx
 * ============================================================================
 *
 * Écran de l'inventaire affichant les boosts disponibles,
 * les titres débloqués, et le boost actif.
 *
 * Fonctionnalités principales:
 * - Affichage du boost actif avec timer
 * - Liste des boosts disponibles avec activation
 * - Liste des titres débloqués
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Zap, Crown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useInventory } from '@/context/InventoryContext';
import { InventoryService } from '@/services/InventoryService';

import { InventoryItem, BoostReward, TitleReward } from '@/types/quest.types';
import Logger from '@/utils/logger';

// ============================================================================
// COMPOSANTS
// ============================================================================

interface BoostCardProps {
  item: InventoryItem;
  onActivate: () => void;
  isActivating: boolean;
}

const BoostCard: React.FC<BoostCardProps> = ({ item, onActivate, isActivating }) => {
  const { t } = useTranslation();
  const boost = item.item_data as BoostReward;

  return (
    <View style={styles.boostCard}>
      <View style={styles.boostIcon}>
        <Zap size={24} color="#f59e0b" />
      </View>

      <View style={styles.boostContent}>
        <Text style={styles.boostTitle}>
          {t('inventory.xp_boost')} +{boost.percent}%
        </Text>
        <Text style={styles.boostDuration}>
          {t('inventory.duration')}: {boost.durationHours}h
        </Text>
      </View>

      <Pressable
        style={[styles.activateButton, isActivating && styles.activateButtonDisabled]}
        onPress={onActivate}
        disabled={isActivating}
      >
        {isActivating ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.activateButtonText}>{t('inventory.activate')}</Text>
        )}
      </Pressable>
    </View>
  );
};

interface TitleCardProps {
  item: InventoryItem;
}

const TitleCard: React.FC<TitleCardProps> = ({ item }) => {
  const { t } = useTranslation();
  const title = item.item_data as TitleReward;

  return (
    <View style={styles.titleCard}>
      <View style={styles.titleIcon}>
        <Crown size={24} color="#8b5cf6" />
      </View>

      <View style={styles.titleContent}>
        <Text style={styles.titleText}>{t(title.key)}</Text>
        <Text style={styles.titleSubtext}>{t('inventory.exclusive_title')}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const InventoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const {
    availableBoosts,
    unlockedTitles,
    activeBoost,
    loading,
    refreshInventory,
    activateBoost: activateBoostContext,
    stats,
  } = useInventory();

  // ============================================================================
  // STATE
  // ============================================================================

  const [refreshing, setRefreshing] = useState(false);
  const [activatingItemId, setActivatingItemId] = useState<string | null>(null);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshInventory();
    } catch (error) {
      Logger.error('[InventoryScreen] Error refreshing inventory:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshInventory]);

  const handleActivateBoost = useCallback(
    async (item: InventoryItem) => {
      Logger.info('[InventoryScreen] Activating boost:', item.id);
      setActivatingItemId(item.id);

      try {
        const result = await activateBoostContext(item.id);

        if (result.success) {
          Alert.alert(
            t('inventory.boost_activated'),
            t('inventory.boost_activated_message'),
            [{ text: t('common.ok') }]
          );
        } else {
          if (result.error === 'boost_already_active') {
            Alert.alert(
              t('inventory.boost_already_active'),
              t('inventory.boost_already_active_message'),
              [{ text: t('common.ok') }]
            );
          } else {
            Alert.alert(
              t('common.error'),
              result.error || t('inventory.activation_failed'),
              [{ text: t('common.ok') }]
            );
          }
        }
      } catch (error) {
        Logger.error('[InventoryScreen] Error activating boost:', error);
        Alert.alert(t('common.error'), t('inventory.activation_failed'), [
          { text: t('common.ok') },
        ]);
      } finally {
        setActivatingItemId(null);
      }
    },
    [activateBoostContext, t]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>{t('inventory.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#92400e" />
        </Pressable>

        <Text style={styles.headerTitle}>{t('inventory.title')}</Text>

        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Boost actif */}
        {activeBoost && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.active_boost')}</Text>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.activeBoostCard}
            >
              <View style={styles.activeBoostIcon}>
                <Zap size={32} color="#ffffff" />
              </View>
              <View style={styles.activeBoostContent}>
                <Text style={styles.activeBoostTitle}>
                  +{activeBoost.boost_percent}% {t('inventory.habit_xp')}
                </Text>
                <Text style={styles.activeBoostTimer}>
                  {t('inventory.expires_in')}:{' '}
                  {InventoryService.formatBoostTimeRemaining(activeBoost.expires_at)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Boosts disponibles */}
        {availableBoosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.available_boosts')}</Text>
            <Text style={styles.sectionSubtitle}>
              {availableBoosts.length} {t('inventory.boosts_ready')}
            </Text>
            {availableBoosts.map((item) => (
              <BoostCard
                key={item.id}
                item={item}
                onActivate={() => handleActivateBoost(item)}
                isActivating={activatingItemId === item.id}
              />
            ))}
          </View>
        )}

        {/* Titres débloqués */}
        {unlockedTitles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.unlocked_titles')}</Text>
            <Text style={styles.sectionSubtitle}>
              {unlockedTitles.length} {t('inventory.titles_unlocked')}
            </Text>
            {unlockedTitles.map((item) => (
              <TitleCard key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* État vide */}
        {!activeBoost && availableBoosts.length === 0 && unlockedTitles.length === 0 && (
          <View style={styles.emptyState}>
            <Image
              source={require('../../assets/achievement-quests/achievement-inventaire.png')}
              style={styles.emptyStateIcon}
              resizeMode="contain"
            />
            <Text style={styles.emptyStateTitle}>{t('inventory.empty_title')}</Text>
            <Text style={styles.emptyStateText}>{t('inventory.empty_message')}</Text>
          </View>
        )}

        {/* Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffbeb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#92400e',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fef3c7',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#92400e',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#92400e',
    opacity: 0.7,
    marginBottom: 16,
  },
  activeBoostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  activeBoostIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activeBoostContent: {
    flex: 1,
  },
  activeBoostTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  activeBoostTimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  boostIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  boostContent: {
    flex: 1,
  },
  boostTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  boostDuration: {
    fontSize: 13,
    color: '#92400e',
    opacity: 0.7,
  },
  activateButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  activateButtonDisabled: {
    opacity: 0.6,
  },
  activateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  titleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  titleSubtext: {
    fontSize: 13,
    color: '#92400e',
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#92400e',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSpacer: {
    height: 40,
  },
});
