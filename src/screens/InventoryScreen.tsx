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
 * - Grille 3 colonnes des boosts disponibles
 * - Modal de confirmation avant activation
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
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Crown, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useInventory } from '@/context/InventoryContext';
import { InventoryService } from '@/services/InventoryService';

import { InventoryItem, BoostReward, TitleReward } from '@/types/quest.types';
import Logger from '@/utils/logger';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

// ============================================================================
// COMPOSANTS
// ============================================================================

interface BoostGridItemProps {
  item: InventoryItem;
  onPress: () => void;
}

const BoostGridItem: React.FC<BoostGridItemProps> = ({ item, onPress }) => {
  const boost = item.item_data as BoostReward;

  return (
    <Pressable style={styles.boostGridItem} onPress={onPress}>
      <View style={styles.boostGridIconContainer}>
        <Image
          source={require('../../assets/achievement-quests/achievement-boost-xp.png')}
          style={styles.boostGridIcon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.boostGridPercent}>+{boost.boost?.percent || boost.percent}%</Text>
      <Text style={styles.boostGridDuration}>{boost.boost?.durationHours || boost.durationHours}h</Text>
    </Pressable>
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

interface ConfirmModalProps {
  visible: boolean;
  item: InventoryItem | null;
  hasActiveBoost: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isActivating: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  item,
  hasActiveBoost,
  onConfirm,
  onCancel,
  isActivating,
}) => {
  const { t } = useTranslation();

  if (!item) return null;

  const boost = item.item_data as BoostReward;
  const percent = boost.boost?.percent || boost.percent;
  const duration = boost.boost?.durationHours || boost.durationHours;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Close button */}
          <Pressable style={styles.modalCloseButton} onPress={onCancel}>
            <X size={24} color="#92400e" />
          </Pressable>

          {/* Icon */}
          <View style={styles.modalIconContainer}>
            <Image
              source={require('../../assets/achievement-quests/achievement-boost-xp.png')}
              style={styles.modalIcon}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.modalTitle}>
            {t('inventory.activate_boost_title')}
          </Text>

          {/* Boost details */}
          <View style={styles.modalBoostDetails}>
            <Text style={styles.modalBoostPercent}>+{percent}% XP</Text>
            <Text style={styles.modalBoostDuration}>
              {t('inventory.duration')}: {duration}h
            </Text>
          </View>

          {/* Warning if boost already active */}
          {hasActiveBoost && (
            <View style={styles.modalWarning}>
              <Text style={styles.modalWarningText}>
                {t('inventory.boost_already_active_warning')}
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalCancelButton} onPress={onCancel}>
              <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalConfirmButton,
                (hasActiveBoost || isActivating) && styles.modalConfirmButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={hasActiveBoost || isActivating}
            >
              {isActivating ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.modalConfirmButtonText}>
                  {t('inventory.activate')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  } = useInventory();

  // ============================================================================
  // STATE
  // ============================================================================

  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Refresh inventory when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      Logger.info('[InventoryScreen] Screen focused, refreshing inventory');
      refreshInventory();
    }, [refreshInventory])
  );

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

  const handleBoostPress = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  }, []);

  const handleModalCancel = useCallback(() => {
    setIsModalVisible(false);
    setSelectedItem(null);
  }, []);

  const handleModalConfirm = useCallback(async () => {
    if (!selectedItem || activeBoost) return;

    Logger.info('[InventoryScreen] Activating boost:', selectedItem.id);
    setIsActivating(true);

    try {
      const result = await activateBoostContext(selectedItem.id);

      if (result.success) {
        setIsModalVisible(false);
        setSelectedItem(null);
      } else {
        Logger.error('[InventoryScreen] Failed to activate boost:', result.error);
      }
    } catch (error) {
      Logger.error('[InventoryScreen] Error activating boost:', error);
    } finally {
      setIsActivating(false);
    }
  }, [selectedItem, activeBoost, activateBoostContext]);

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
                <Image
                  source={require('../../assets/achievement-quests/achievement-boost-xp.png')}
                  style={styles.activeBoostIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.activeBoostContent}>
                <Text style={styles.activeBoostTitle}>
                  +{activeBoost.boost_percent}% XP
                </Text>
                <Text style={styles.activeBoostTimer}>
                  {t('inventory.expires_in')}:{' '}
                  {InventoryService.formatBoostTimeRemaining(activeBoost.expires_at)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Boosts disponibles - Grille 3 colonnes */}
        {availableBoosts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('inventory.available_boosts')}</Text>
            <Text style={styles.sectionSubtitle}>
              {availableBoosts.length} {t('inventory.boosts_ready')}
            </Text>
            <View style={styles.boostGrid}>
              {availableBoosts.map((item) => (
                <BoostGridItem
                  key={item.id}
                  item={item}
                  onPress={() => handleBoostPress(item)}
                />
              ))}
            </View>
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

      {/* Modal de confirmation */}
      <ConfirmModal
        visible={isModalVisible}
        item={selectedItem}
        hasActiveBoost={activeBoost !== null}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        isActivating={isActivating}
      />
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
  // Active boost card
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
  activeBoostIconImage: {
    width: 40,
    height: 40,
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
  // Boost grid
  boostGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  boostGridItem: {
    width: ITEM_WIDTH,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  boostGridIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  boostGridIcon: {
    width: 40,
    height: 40,
  },
  boostGridPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  boostGridDuration: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    opacity: 0.7,
  },
  // Title card
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
  // Empty state
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fffbeb',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalIcon: {
    width: 56,
    height: 56,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBoostDetails: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  modalBoostPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 4,
  },
  modalBoostDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    opacity: 0.7,
  },
  modalWarning: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  modalWarningText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#fef3c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
