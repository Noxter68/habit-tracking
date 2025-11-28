/**
 * TaskItem Component
 *
 * Swipeable task card with delete functionality
 * - Swipe left to reveal delete action
 * - Automatic spring-back animation
 * - Confirmation dialog before deletion
 * - Loading state during deletion
 * - Visual feedback with gradient background
 */

import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Animated as RNAnimated, Dimensions, ImageBackground, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { Task, HabitType } from '@/types';
import { HabitService } from '@/services/habitService';
import { useAuth } from '@/context/AuthContext';
import { getTasksForCategory } from '@/utils/habitHelpers';

// ============================================================================
// TYPES
// ============================================================================

interface TaskItemProps {
  task: Task;
  habitId: string;
  habitCategory: string;
  habitType: HabitType;
  onTaskDeleted: () => void;
  tierColor: string;
  isFirst?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

// ============================================================================
// COMPONENT
// ============================================================================

const TaskItem: React.FC<TaskItemProps> = ({ task, habitId, habitCategory, habitType, onTaskDeleted, tierColor, isFirst = false }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation subtile pour la première carte (2 fois)
  useEffect(() => {
    if (isFirst) {
      const sequence = RNAnimated.sequence([
        RNAnimated.delay(600),
        RNAnimated.timing(translateX, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.delay(200),
        RNAnimated.timing(translateX, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      sequence.start();
    }
  }, [isFirst]);

  // Récupérer les données traduites si c'est une tâche prédéfinie
  const getEnrichedTask = () => {
    // Si c'est une tâche custom, retourner telle quelle
    if (task.id.startsWith('custom-task-') || task.id.startsWith('custom_')) {
      return task;
    }

    // Chercher dans les tâches prédéfinies traduites
    const predefinedTasks = getTasksForCategory(habitCategory, habitType);
    const translatedTask = predefinedTasks.find((t) => t.id === task.id);

    if (translatedTask) {
      return {
        ...task,
        name: translatedTask.name || task.name,
        description: translatedTask.description || task.description,
        duration: translatedTask.duration || task.duration,
      };
    }

    return task;
  };

  const enrichedTask = getEnrichedTask();

  // ============================================================================
  // GESTURE HANDLERS
  // ============================================================================

  const handleGestureEvent = RNAnimated.event([{ nativeEvent: { translationX: translateX } }], { useNativeDriver: true });

  const handleStateChange = async (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX: translation } = event.nativeEvent;

      // Spring back animation
      RNAnimated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();

      // Trigger deletion if threshold exceeded
      if (translation < SWIPE_THRESHOLD) {
        await handleDelete();
      }
    }
  };

  // ============================================================================
  // DELETE HANDLER
  // ============================================================================

  const handleDelete = async () => {
    if (!user?.id) {
      console.error('❌ User not authenticated');
      return;
    }

    // Show confirmation alert with i18n
    Alert.alert(t('taskManager.deleteTask'), t('taskManager.deleteTaskConfirm', { taskName: enrichedTask.name }), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);

          try {
            await HabitService.deleteTask(habitId, user.id, task.id);
            onTaskDeleted();
          } catch (error) {
            console.error('❌ Error deleting task:', error);

            // Show error alert
            Alert.alert(t('common.error'), t('taskManager.deleteError'));

            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  const deleteOpacity = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View
      style={[
        tw`relative overflow-hidden rounded-xl`,
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }
      ]}
    >
      {/* Delete Background Gradient */}
      <RNAnimated.View style={[tw`absolute inset-0 justify-center items-end pr-5 rounded-xl overflow-hidden`, { opacity: deleteOpacity }]}>
        <LinearGradient colors={['#fee2e2', '#fca5a5', '#ef4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
        <View style={tw`bg-red-500 rounded-lg p-2.5`}>
          <Trash2 size={18} color="#ffffff" strokeWidth={2.5} />
        </View>
      </RNAnimated.View>

      {/* Swipeable Task Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]} failOffsetY={[-5, 5]} enabled={!isDeleting}>
        <RNAnimated.View style={{ transform: [{ translateX }] }}>
          <ImageBackground
            source={require('../../../assets/interface/textures/texture-white.png')}
            style={tw`rounded-xl overflow-hidden`}
            imageStyle={{ opacity: 0.4 }}
          >
            <View
              style={[
                tw`bg-white/95 border border-stone-200/60 rounded-xl px-4 py-3.5`,
              ]}
            >
              {isDeleting ? (
                /* Loading State */
                <View style={tw`flex-row items-center justify-center py-1`}>
                  <ActivityIndicator size="small" color={tierColor} />
                  <Text style={tw`text-stone-600 ml-2.5 font-medium text-sm`}>{t('taskManager.deleting')}</Text>
                </View>
              ) : (
                /* Task Content */
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-stone-900 font-bold text-sm mb-0.5`}>{enrichedTask.name}</Text>

                    {enrichedTask.description && (
                      <Text style={tw`text-stone-500 text-xs leading-4`} numberOfLines={1}>
                        {enrichedTask.description}
                      </Text>
                    )}
                  </View>

                  {/* Duration Badge à droite */}
                  {enrichedTask.duration && (
                    <View style={[tw`px-2.5 py-1 rounded-lg`, { backgroundColor: `${tierColor}15` }]}>
                      <Text style={[tw`text-[11px] font-bold`, { color: tierColor }]}>{enrichedTask.duration}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </ImageBackground>
        </RNAnimated.View>
      </PanGestureHandler>
    </View>
  );
};

export default TaskItem;
