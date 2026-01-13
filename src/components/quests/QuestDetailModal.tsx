/**
 * QuestDetailModal.tsx
 *
 * Modal affichant les détails d'une quête avec possibilité d'épingler/désépingler.
 */

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { QuestWithProgress } from '@/types/quest.types';
import { useTranslation } from 'react-i18next';

interface QuestDetailModalProps {
  visible: boolean;
  onClose: () => void;
  quest: QuestWithProgress | null;
  onTogglePin: (questId: string, isPinned: boolean) => Promise<boolean>;
}


export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({
  visible,
  onClose,
  quest,
  onTogglePin,
}) => {
  const { t } = useTranslation();
  const [isTogglingPin, setIsTogglingPin] = useState(false);

  if (!quest) return null;

  const isCompleted = quest.user_progress?.is_completed || false;
  const isPinned = quest.user_progress?.is_pinned || false;
  const rawProgressValue = quest.user_progress?.progress_value || 0;
  const targetValue = quest.adjusted_target || quest.target_value;
  // Cap progress at target value for display
  const progressValue = Math.min(rawProgressValue, targetValue);
  const progressPercentage = Math.min(quest.progress_percentage || 0, 100);

  const handleTogglePin = async () => {
    setIsTogglingPin(true);
    try {
      const success = await onTogglePin(quest.id, !isPinned);
      if (success) {
        // Le contexte rafraîchira automatiquement les données
      }
    } finally {
      setIsTogglingPin(false);
    }
  };

  const renderRewardInfo = () => {
    if (quest.reward.kind === 'XP') {
      return (
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardLabel}>{t('quests.reward')}</Text>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>{quest.reward.amount} XP</Text>
          </View>
        </View>
      );
    }

    if (quest.reward.kind === 'BOOST') {
      const boost = quest.reward.boost;
      return (
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardLabel}>{t('quests.reward')}</Text>
          <View style={styles.rewardBadgeBoost}>
            <Image
              source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
              style={styles.boostIconLarge}
              resizeMode="contain"
            />
            <Text style={styles.rewardText}>
              +{boost.percent}% XP · {boost.durationHours}h
            </Text>
          </View>
        </View>
      );
    }

    if (quest.reward.kind === 'TITLE') {
      return (
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardLabel}>{t('quests.reward')} titre</Text>
          <View style={styles.rewardBadge}>
            <Text style={styles.rewardText}>{t(`titles.${quest.reward.title.key}`)}</Text>
          </View>
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header avec icône centrée - grisé si non complété */}
            <View style={[styles.header, !isCompleted && styles.headerGrayed]}>
              <View style={[styles.iconContainer, !isCompleted && styles.iconGrayed]}>
                <Image
                  source={require('../../../assets/achievement-quests/achievement-icon.png')}
                  style={styles.questIconImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Nom de la quête */}
                <Text style={styles.questName}>{t(quest.name_key)}</Text>

                {/* Description longue */}
                <Text style={styles.questDescription}>
                  {t(quest.description_long_key)}
                </Text>

                {/* Progression */}
                {!isCompleted && (
                  <View style={styles.progressSection}>
                    <Text style={styles.progressLabel}>Progression</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                        />
                        <Text style={styles.progressText}>
                          {progressValue} / {targetValue}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Badge de complétion */}
                {/* Removed completed badge - card color shows completion status */}
                {isCompleted && quest.user_progress?.completed_at && (
                  <View style={styles.completedSection}>
                    <Text style={styles.completedDate}>
                      Accomplissement: {new Date(quest.user_progress.completed_at).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Récompense */}
                {renderRewardInfo()}
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                {!isCompleted && (
                  <Pressable
                    style={[
                      styles.pinButton,
                      isPinned && styles.pinButtonActive,
                    ]}
                    onPress={handleTogglePin}
                    disabled={isTogglingPin}
                  >
                    {isTogglingPin ? (
                      <ActivityIndicator size="small" color={isPinned ? "#ffffff" : "#92400e"} />
                    ) : (
                      <Text style={[styles.pinButtonText, isPinned && styles.pinButtonTextActive]}>
                        {isPinned ? t('quests.unpin') : t('quests.pin')}
                      </Text>
                    )}
                  </Pressable>
                )}

                <Pressable
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#fde68a',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 2,
    borderBottomColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGrayed: {
    backgroundColor: '#e7e5e4',
    borderBottomColor: '#d6d3d1',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGrayed: {
    backgroundColor: 'transparent',
  },
  questIconImage: {
    width: 140,
    height: 140,
  },
  content: {
    padding: 20,
    maxHeight: 500,
  },
  questName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 12,
  },
  questDescription: {
    fontSize: 14,
    color: '#57534e',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78716c',
    marginBottom: 8,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    position: 'relative',
    width: '100%',
    height: 40,
    backgroundColor: '#e7e5e4',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#d6d3d1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#f59e0b',
  },
  progressText: {
    fontSize: 16,
    color: '#1c1917',
    fontWeight: '800',
    zIndex: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  completedSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  completedIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  completedDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78350f',
  },
  rewardInfo: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    marginBottom: 20,
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716c',
    marginBottom: 8,
  },
  rewardBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fed7aa',
    borderWidth: 2,
    borderColor: '#fdba74',
  },
  rewardBadgeBoost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fed7aa',
    borderWidth: 2,
    borderColor: '#fdba74',
  },
  boostIconLarge: {
    width: 24,
    height: 24,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  pinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fed7aa',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fdba74',
  },
  pinButtonActive: {
    backgroundColor: '#78350f',
    borderColor: '#78350f',
  },
  pinButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  pinButtonTextActive: {
    color: '#ffffff',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#f5f5f4',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e7e5e4',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#78716c',
  },
});
