/**
 * ============================================================================
 * QuestScreen.tsx
 * ============================================================================
 *
 * Écran des quêtes avec style gamifié type Duolingo
 * Affiche une progression globale et toutes les quêtes disponibles
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, StyleSheet, Image, Modal } from 'react-native';
import { SlidersHorizontal, HelpCircle, Sparkles, Award, Zap, Package } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

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

  const { quests, pinnedQuests, loading: questsLoading, refreshQuests, togglePin, stats } = useQuests();

  // ============================================================================
  // STATE
  // ============================================================================

  const [selectedQuest, setSelectedQuest] = useState<QuestWithProgress | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Filter quests based on completed filter
  const filteredQuests = useMemo(() => {
    if (showCompletedOnly) {
      return quests.filter((q) => q.user_progress?.completed_at);
    }
    return quests;
  }, [quests, showCompletedOnly]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Hero Card - Global Progress */}
        <View style={styles.heroCard}>
          {/* Header Row */}
          <View style={styles.heroHeader}>
            <View style={styles.titleRow}>
              <Text style={styles.heroTitle}>{t('quests.title')}</Text>
              <Pressable onPress={() => setShowHelpModal(true)} style={styles.helpButton}>
                <HelpCircle size={20} color="#92400e" strokeWidth={2.5} />
              </Pressable>
            </View>
            <Pressable onPress={handleInventoryPress} style={styles.inventoryButtonContainer}>
              <View style={styles.inventoryButton}>
                <Image source={require('../../assets/achievement-quests/achievement-inventaire.png')} style={styles.inventoryIcon} resizeMode="contain" />
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
              <View style={[styles.globalProgressFill, { width: `${progressPercentage}%` }]} />
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
            <Text style={styles.sectionSubtitle}>{t('quests.tracked_description')}</Text>
            {pinnedQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onPress={() => handleQuestPress(quest)} showProgress />
            ))}
          </View>
        )}

        {/* Section: Toutes les quêtes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('quests.all_quests')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{filteredQuests.length}</Text>
            </View>
          </View>

          {/* Filter row */}
          <View style={styles.filterRow}>
            <Text style={styles.sectionSubtitle}>
              {filteredQuests.length} {t('quests.quests_available')}
            </Text>
            <Pressable onPress={() => setShowCompletedOnly(!showCompletedOnly)} style={[styles.filterButton, showCompletedOnly && styles.filterButtonActive]}>
              <SlidersHorizontal size={14} color={showCompletedOnly ? '#92400e' : '#92400e'} strokeWidth={2.5} />
              <Text style={[styles.filterButtonText, showCompletedOnly && styles.filterButtonTextActive]}>{t('quests.completed')}</Text>
            </Pressable>
          </View>

          {filteredQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateText}>{showCompletedOnly ? t('quests.no_completed_quests') : t('quests.no_quests_found')}</Text>
            </View>
          ) : (
            filteredQuests.map((quest) => <QuestCard key={quest.id} quest={quest} onPress={() => handleQuestPress(quest)} showProgress />)
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal de détails */}
      <QuestDetailModal visible={showModal} onClose={handleCloseModal} quest={selectedQuest} onTogglePin={handleTogglePin} />

      {/* Modal d'aide */}
      <Modal visible={showHelpModal} transparent animationType="fade" onRequestClose={() => setShowHelpModal(false)}>
        <Pressable style={styles.helpModalOverlay} onPress={() => setShowHelpModal(false)}>
          <Pressable style={styles.helpModalContent} onPress={(e) => e.stopPropagation()}>
            <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.helpModalGradient}>
              <Text style={styles.helpModalTitle}>{t('quests.help.title')}</Text>
              <Text style={styles.helpModalIntro}>{t('quests.help.intro')}</Text>

              <View style={styles.helpModalItems}>
                <View style={styles.helpModalItem}>
                  <View style={styles.helpModalIconContainer}>
                    <Sparkles size={20} color="#d97706" />
                  </View>
                  <View style={styles.helpModalItemText}>
                    <Text style={styles.helpModalItemTitle}>{t('quests.help.xp_title')}</Text>
                    <Text style={styles.helpModalItemDescription}>{t('quests.help.xp_description')}</Text>
                  </View>
                </View>

                <View style={styles.helpModalItem}>
                  <View style={styles.helpModalIconContainer}>
                    <Award size={20} color="#d97706" />
                  </View>
                  <View style={styles.helpModalItemText}>
                    <Text style={styles.helpModalItemTitle}>{t('quests.help.titles_title')}</Text>
                    <Text style={styles.helpModalItemDescription}>{t('quests.help.titles_description')}</Text>
                  </View>
                </View>

                <View style={styles.helpModalItem}>
                  <View style={styles.helpModalIconContainer}>
                    <Zap size={20} color="#d97706" />
                  </View>
                  <View style={styles.helpModalItemText}>
                    <Text style={styles.helpModalItemTitle}>{t('quests.help.boosts_title')}</Text>
                    <Text style={styles.helpModalItemDescription}>{t('quests.help.boosts_description')}</Text>
                  </View>
                </View>

                <View style={styles.helpModalItem}>
                  <View style={styles.helpModalIconContainer}>
                    <Package size={20} color="#d97706" />
                  </View>
                  <View style={styles.helpModalItemText}>
                    <Text style={styles.helpModalItemTitle}>{t('quests.help.inventory_title')}</Text>
                    <Text style={styles.helpModalItemDescription}>{t('quests.help.inventory_description')}</Text>
                  </View>
                </View>
              </View>

              <Pressable style={styles.helpModalButton} onPress={() => setShowHelpModal(false)}>
                <Text style={styles.helpModalButtonText}>{t('quests.help.got_it')}</Text>
              </Pressable>
            </LinearGradient>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 80,
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
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#d97706',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#fbbf24',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  filterButtonTextActive: {
    color: '#92400e',
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
    height: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpButton: {
    padding: 4,
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
  },
  helpModalGradient: {
    padding: 24,
  },
  helpModalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 8,
  },
  helpModalIntro: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  helpModalItems: {
    gap: 16,
    marginBottom: 20,
  },
  helpModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  helpModalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModalItemText: {
    flex: 1,
  },
  helpModalItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  helpModalItemDescription: {
    fontSize: 13,
    color: '#92400e',
    opacity: 0.75,
    lineHeight: 18,
  },
  helpModalButton: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  helpModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
