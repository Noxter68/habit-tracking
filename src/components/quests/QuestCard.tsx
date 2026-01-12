import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { QuestWithProgress } from '@/types/quest.types';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

interface QuestCardProps {
  quest: QuestWithProgress;
  onPress: () => void;
  showProgress?: boolean;
}


export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  onPress,
  showProgress = true,
}) => {
  const { t } = useTranslation();

  const isCompleted = quest.user_progress?.is_completed || false;
  const rawProgressValue = quest.user_progress?.progress_value || 0;
  const targetValue = quest.adjusted_target || quest.target_value;
  // Cap progress at target value for display (never show 55/7, always max at 7/7)
  const progressValue = Math.min(rawProgressValue, targetValue);
  const progressPercentage = Math.min(quest.progress_percentage || 0, 100);

  // Uniform Topaz theme for all quests
  const questTheme = {
    borderColor: '#f59e0b',
    borderColorLight: '#fbbf24',
    backgroundGradient: ['#fffbeb', '#fef3c7', '#fde68a'] as [string, string, string],
    progressBarBg: '#fef3c7',
    progressBarFill: '#f59e0b',
    textColor: '#92400e',
    texture: require('../../../assets/interface/progressBar/topaz-texture.png'),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.cardWrapper}
    >
      <LinearGradient
        colors={isCompleted ? questTheme.backgroundGradient : ['#f5f5f4', '#e7e5e4', '#d6d3d1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.cardGradient,
          { borderColor: isCompleted ? questTheme.borderColor : '#a8a29e' },
        ]}
      >
        <View style={[styles.card, !isCompleted && styles.cardGrayed]}>
          {/* Icon de quête avec fond brun foncé ou gris */}
          <View style={[styles.iconContainer, !isCompleted && styles.iconGrayed]}>
            <Image
              source={require('../../../assets/achievement-quests/achievement-icon.png')}
              style={styles.questIconImage}
              resizeMode="contain"
            />
          </View>

          {/* Contenu */}
          <View style={styles.content}>
            {/* Nom de la quête */}
            <Text style={[styles.questName, isCompleted && styles.textCompleted]}>
              {t(quest.name_key)}
            </Text>

            {/* Description courte */}
            <Text style={[styles.questDescription, isCompleted && styles.textMuted]}>
              {t(quest.description_short_key)}
            </Text>

            {/* Barre de progression avec récompense à droite */}
            {showProgress && quest.reward.kind !== 'TITLE' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarWrapper}>
                  <View
                    style={[
                      styles.progressBarBg,
                      { backgroundColor: questTheme.progressBarBg },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progressPercentage}%`,
                          backgroundColor: questTheme.progressBarFill,
                        },
                      ]}
                    />
                    <Text style={[styles.progressTextAbsolute, { color: questTheme.textColor }]}>
                      {progressValue} / {targetValue}
                    </Text>
                  </View>
                </View>

                {/* Badge de récompense */}
                <View style={[styles.rewardBadge, { backgroundColor: questTheme.progressBarBg, borderColor: questTheme.borderColorLight }]}>
                  {quest.reward.kind === 'XP' && (
                    <Text style={[styles.rewardText, { color: questTheme.textColor }]}>{quest.reward.amount} XP</Text>
                  )}
                  {quest.reward.kind === 'BOOST' && (
                    <Text style={[styles.rewardText, { color: questTheme.textColor }]}>+{quest.reward.boost.percent}%</Text>
                  )}
                </View>
              </View>
            )}

            {/* Titre exclusif (si type TITLE) */}
            {quest.reward.kind === 'TITLE' && (
              <View style={styles.titleRewardSection}>
                <View style={styles.progressBarWrapper}>
                  <View
                    style={[
                      styles.progressBarBg,
                      { backgroundColor: questTheme.progressBarBg },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progressPercentage}%`,
                          backgroundColor: questTheme.progressBarFill,
                        },
                      ]}
                    />
                    <Text style={[styles.progressTextAbsolute, { color: questTheme.textColor }]}>
                      {progressValue} / {targetValue}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.titleRewardLabel, { color: questTheme.textColor }]}>
                  Titre: {t(quest.reward.title.key)}
                </Text>
              </View>
            )}

          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 12,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 3,
    borderBottomWidth: 5,
  },
  card: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardGrayed: {
    opacity: 0.6,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#78350f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconGrayed: {
    backgroundColor: 'transparent',
  },
  questIconImage: {
    width: 100,
    height: 100,
  },
  content: {
    flex: 1,
  },
  questName: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 4,
    color: '#1c1917',
  },
  textCompleted: {
    // Removed strikethrough - card color shows completion status
  },
  questDescription: {
    fontSize: 12,
    color: '#57534e',
    marginBottom: 8,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'left',
  },
  textMuted: {
    color: '#a8a29e',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarWrapper: {
    flex: 1,
  },
  progressBarBg: {
    height: 14,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  progressTextAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '800',
  },
  titleRewardSection: {
    marginTop: 4,
  },
  titleRewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'left',
    marginTop: 6,
  },
  completedBadge: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    alignSelf: 'center',
  },
  completedText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
});
