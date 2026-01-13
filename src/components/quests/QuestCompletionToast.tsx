/**
 * QuestCompletionToast.tsx
 *
 * Toast notification displayed at the top of the screen when a quest is completed
 * Similar to XP toast but with quest-specific styling
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { getLocales } from 'expo-localization';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuestCompletionToastProps {
  visible: boolean;
  questName: string;
  reward: {
    kind: 'XP' | 'BOOST' | 'TITLE';
    amount?: number;
    boost?: {
      percent: number;
      durationHours: number;
    };
    title?: {
      key: string;
    };
  };
  onHide: () => void;
}

export const QuestCompletionToast: React.FC<QuestCompletionToastProps> = ({
  visible,
  questName,
  reward,
  onHide,
}) => {
  const { t, i18n } = useTranslation();
  const translateY = useRef(new Animated.Value(-200)).current;

  // Get current date formatted based on language
  const currentDate = (() => {
    const date = new Date();
    const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-US';

    const formatted = date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // For French, replace full month names with abbreviations if needed
    if (i18n.language === 'fr') {
      return formatted
        .replace('janvier', 'janv.')
        .replace('février', 'févr.')
        .replace('mars', 'mars')
        .replace('avril', 'avr.')
        .replace('mai', 'mai')
        .replace('juin', 'juin')
        .replace('juillet', 'juil.')
        .replace('août', 'août')
        .replace('septembre', 'sept.')
        .replace('octobre', 'oct.')
        .replace('novembre', 'nov.')
        .replace('décembre', 'déc.');
    }

    // For English, format is already correct (Jan, Feb, etc.)
    return formatted;
  })();

  // Function to hide the toast manually (swipe gesture)
  const hideToast = () => {
    Animated.timing(translateY, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide();
    });
  };

  useEffect(() => {
    if (visible) {
      // Reset position to top before sliding in
      translateY.setValue(-200);

      // Slide in with smooth 60fps animation
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out when visibility changes to false
      Animated.timing(translateY, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  // Handle swipe gesture
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;

      // If swiped up significantly or with high velocity, dismiss
      if (translationY < -50 || velocityY < -500) {
        hideToast();
      } else {
        // Snap back to original position with smooth animation
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const renderReward = () => {
    if (reward.kind === 'XP') {
      return (
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardBadgeText}>+{reward.amount} XP</Text>
        </View>
      );
    }

    if (reward.kind === 'BOOST') {
      return (
        <View style={styles.rewardBadge}>
          <Image
            source={require('../../../assets/achievement-quests/achievement-boost-xp.png')}
            style={styles.boostIcon}
            resizeMode="contain"
          />
          <Text style={styles.rewardBadgeText}>
            +{reward.boost!.percent}% XP · {reward.boost!.durationHours}h
          </Text>
        </View>
      );
    }

    if (reward.kind === 'TITLE') {
      return (
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardBadgeText}>{t(reward.title!.key)}</Text>
        </View>
      );
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      activeOffsetY={[-10, 10]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#fef3c7', '#fde68a', '#fbbf24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Image
                source={require('../../../assets/achievement-quests/achievement-icon.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{t('quests.quest_completed')}</Text>
              <Text style={styles.questName}>{t(questName)}</Text>
              <View style={styles.bottomRow}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{currentDate}</Text>
                </View>
                <View style={styles.rewardContainer}>
                  {renderReward()}
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  gradient: {
    borderRadius: 16,
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#f59e0b',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 100,
    height: 100,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
    textTransform: 'uppercase',
    marginBottom: 4,
    opacity: 0.8,
    letterSpacing: 0.5,
  },
  questName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#78350f',
    marginBottom: 10,
    lineHeight: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    backgroundColor: '#78350f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 32,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fef3c7',
    letterSpacing: 0.3,
  },
  rewardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardBadge: {
    backgroundColor: '#78350f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
  },
  rewardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fef3c7',
    letterSpacing: 0.3,
  },
  boostIcon: {
    width: 20,
    height: 20,
  },
});
