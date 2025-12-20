/**
 * SwipeableDashboardCard.tsx
 *
 * Wrapper swipeable pour DashboardHabitCard.
 * Permet la suppression par swipe vers la gauche.
 */

import React, { useRef } from 'react';
import { View, Alert, Animated as RNAnimated, Dimensions } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { HapticFeedback } from '@/utils/haptics';
import { Habit } from '@/types';
import { DashboardHabitCard } from './DashboardHabitCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

interface SwipeableDashboardCardProps {
  habit: Habit;
  onDelete: (habitId: string) => void;
  onToggleTask: (habitId: string, date: string, taskId: string) => void;
  onNavigateToDetails: () => void;
  index?: number;
  pausedTasks?: Record<string, { pausedUntil: string; reason?: string }>;
  unlockedMilestonesCount?: number;
}

/**
 * Retourne le nom traduit de l'habitude
 */
const getTranslatedHabitName = (habit: Habit, t: (key: string) => string): string => {
  const translatedName = t(`habitHelpers.categories.${habit.type}.${habit.category}.habitName`);
  if (translatedName && !translatedName.includes('habitHelpers.categories')) {
    return translatedName;
  }
  return habit.name;
};

export const SwipeableDashboardCard: React.FC<SwipeableDashboardCardProps> = ({
  habit,
  onDelete,
  onToggleTask,
  onNavigateToDetails,
  index = 0,
  pausedTasks = {},
  unlockedMilestonesCount = 0,
}) => {
  const { t } = useTranslation();
  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleGestureEvent = (event: any) => {
    const { translationX: translation } = event.nativeEvent;
    if (translation <= 0) {
      translateX.setValue(translation);
    } else {
      translateX.setValue(0);
    }
  };

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: translation } = event.nativeEvent;

      if (translation < SWIPE_THRESHOLD) {
        HapticFeedback.medium();

        Alert.alert(
          t('dashboard.removeHabit'),
          t('dashboard.removeHabitConfirm', {
            name: getTranslatedHabitName(habit, t),
            streak: habit.currentStreak,
          }),
          [
            {
              text: t('habits.keepHabit'),
              onPress: () => {
                HapticFeedback.light();
                RNAnimated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 40,
                  friction: 8,
                }).start();
              },
              style: 'cancel',
            },
            {
              text: t('common.delete'),
              onPress: () => {
                HapticFeedback.medium();
                RNAnimated.timing(translateX, {
                  toValue: -SCREEN_WIDTH,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => {
                  onDelete(habit.id);
                });
              },
              style: 'destructive',
            },
          ],
          { cancelable: true }
        );
      } else {
        RNAnimated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      }
    }
  };

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={tw`relative`}>
      {/* Delete background */}
      <RNAnimated.View
        style={[
          tw`absolute inset-0 justify-center items-end pr-6 rounded-2xl overflow-hidden`,
          { opacity: deleteOpacity },
        ]}
      >
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={tw`absolute inset-0`}
        />
        <View style={tw`bg-white/20 rounded-xl p-3`}>
          <Trash2 size={24} color="#ffffff" />
        </View>
      </RNAnimated.View>

      {/* Swipeable card */}
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetX={[-10, 1000]}
        failOffsetY={[-5, 5]}
      >
        <RNAnimated.View
          style={[
            { transform: [{ translateX }] },
            tw`bg-transparent rounded-2xl`,
          ]}
        >
          <DashboardHabitCard
            habit={habit}
            onToggleTask={onToggleTask}
            onNavigateToDetails={onNavigateToDetails}
            index={index}
            pausedTasks={pausedTasks}
            unlockedMilestonesCount={unlockedMilestonesCount}
          />
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default SwipeableDashboardCard;
