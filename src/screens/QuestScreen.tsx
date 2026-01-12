/**
 * ============================================================================
 * QuestScreen.tsx
 * ============================================================================
 *
 * Écran des quêtes avec style gamifié type Duolingo
 * Affiche une progression globale et toutes les quêtes disponibles
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { QuestCard } from '@/components/quests/QuestCard';
import { QuestDetailModal } from '@/components/quests/QuestDetailModal';

import { useQuests } from '@/context/QuestContext';

import { QuestWithProgress } from '@/types/quest.types';
import Logger from '@/utils/logger';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const QuestScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const {
    quests,
    pinnedQuests,
    loading: questsLoading,
    refreshQuests,
    togglePin,
    stats,
  } = useQuests();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedQuest, setSelectedQuest] = useState<QuestWithProgress | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleQuestPress = useCallback((quest: QuestWithProgress) => {
    Logger.info('[QuestScreen] Quest pressed:', quest.name_key);
    setSelectedQuest(quest);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedQuest(null);
  }, []);

  const handleTogglePin = useCallback(
    async (questId: string, isPinned: boolean): Promise<boolean> => {
      Logger.info('[QuestScreen] Toggling pin:', questId, isPinned);
      const success = await togglePin(questId, isPinned);
      if (success) {
        await refreshQuests();
      }
      return success;
    },
    [togglePin, refreshQuests]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshQuests();
    } catch (error) {
      Logger.error('[QuestScreen] Error refreshing quests:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshQuests]);

  const handleInventoryPress = useCallback(() => {
    Logger.info('[QuestScreen] Navigating to inventory');
    // @ts-ignore
    navigation.navigate('Inventory');
  }, [navigation]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Refresh quests when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      Logger.info('[QuestScreen] Screen focused, refreshing quests');
      refreshQuests();
    }, [refreshQuests])
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  if (questsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text style={styles.loadingText}>{t('quests.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progressPercentage = stats.completionPercentage;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Hero Card - Global Progress */}
        <View style={styles.heroCard}>
          {/* Header Row */}
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>{t('quests.title')}</Text>
            <Pressable onPress={handleInventoryPress} style={styles.inventoryButtonContainer}>
              <View style={styles.inventoryButton}>
                <Image
                  source={require('../../assets/achievement-quests/achievement-inventaire.png')}
                  style={styles.inventoryIcon}
                  resizeMode="contain"
                />
              </View>
            </Pressable>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedQuests}</Text>
              <Text style={styles.statLabel}>{t('quests.completed')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalQuests}</Text>
              <Text style={styles.statLabel}>{t('quests.total')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.pinnedQuests}</Text>
              <Text style={styles.statLabel}>{t('quests.tracked')}</Text>
            </View>
          </View>

          {/* Global Progress Bar */}
          <View style={styles.globalProgressContainer}>
            <View style={styles.globalProgressBar}>
              <View
                style={[styles.globalProgressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressPercentageText}>{Math.round(progressPercentage)}%</Text>
              <Text style={styles.globalProgressText}>
                {stats.completedQuests}/{stats.totalQuests} {t('quests.completed')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Quêtes épinglées */}
        {pinnedQuests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('quests.tracked')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pinnedQuests.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              {t('quests.tracked_description')}
            </Text>
            {pinnedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onPress={() => handleQuestPress(quest)}
                showProgress
              />
            ))}
          </View>
        )}

        {/* Section: Toutes les quêtes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('quests.all_quests')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{quests.length}</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>
            {quests.length} {t('quests.quests_available')}
          </Text>

          {quests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateText}>
                {t('quests.no_quests_found')}
              </Text>
            </View>
          ) : (
            quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onPress={() => handleQuestPress(quest)}
                showProgress
              />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de détails */}
      <QuestDetailModal
        visible={showModal}
        onClose={handleCloseModal}
        quest={selectedQuest}
        onTogglePin={handleTogglePin}
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  inventoryButtonContainer: {
    width: 48,
    height: 48,
    position: 'relative',
  },
  inventoryButton: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inventoryIcon: {
    width: 80,
    height: 80,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#fed7aa',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#92400e',
    opacity: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 0,
  },
  globalProgressContainer: {
    marginBottom: 0,
  },
  globalProgressBar: {
    width: '100%',
    height: 16,
    backgroundColor: '#fde68a',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  globalProgressFill: {
    height: '100%',
    backgroundColor: '#d97706',
    borderRadius: 10,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressPercentageText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400e',
  },
  globalProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    opacity: 0.8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#fbbf24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
