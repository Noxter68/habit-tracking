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

import React, { useRef, useState } from 'react';
import { View, Text, ActivityIndicator, Animated as RNAnimated, Dimensions, ImageBackground, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import tw from '@/lib/tailwind';
import { Task } from '@/types';
import { HabitService } from '@/services/habitService';
import { useAuth } from '@/context/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface TaskItemProps {
  task: Task;
  habitId: string;
  onTaskDeleted: () => void;
  tierColor: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.25;

// ============================================================================
// COMPONENT
// ============================================================================

const TaskItem: React.FC<TaskItemProps> = ({ task, habitId, onTaskDeleted, tierColor }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const translateX = useRef(new RNAnimated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

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
    Alert.alert(t('taskManager.deleteTask'), t('taskManager.deleteTaskConfirm', { taskName: task.name }), [
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
    <View style={tw`relative overflow-hidden rounded-2xl`}>
      {/* Delete Background Gradient */}
      <RNAnimated.View style={[tw`absolute inset-0 justify-center items-end pr-6 rounded-2xl overflow-hidden`, { opacity: deleteOpacity }]}>
        <LinearGradient colors={['#fee2e2', '#fecaca', '#fca5a5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={tw`absolute inset-0`} />
        <View style={tw`bg-red-500 rounded-xl p-3`}>
          <Trash2 size={22} color="#ffffff" strokeWidth={2.5} />
        </View>
      </RNAnimated.View>

      {/* Swipeable Task Card */}
      <PanGestureHandler onGestureEvent={handleGestureEvent} onHandlerStateChange={handleStateChange} activeOffsetX={[-10, 10]} failOffsetY={[-5, 5]} enabled={!isDeleting}>
        <RNAnimated.View style={{ transform: [{ translateX }] }}>
          <ImageBackground source={require('../../../assets/interface/textures/texture-white.png')} style={tw`rounded-2xl overflow-hidden`} imageStyle={{ opacity: 0.3 }}>
            <View style={tw`bg-white/90 border border-stone-200 rounded-2xl p-4`}>
              {isDeleting ? (
                /* Loading State */
                <View style={tw`flex-row items-center justify-center py-2`}>
                  <ActivityIndicator size="small" color={tierColor} />
                  <Text style={tw`text-stone-600 ml-3 font-medium`}>{t('taskManager.deleting')}</Text>
                </View>
              ) : (
                /* Task Content */
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 pr-4`}>
                    <Text style={tw`text-stone-900 font-bold text-base mb-1.5`}>{task.name}</Text>

                    {task.description && (
                      <Text style={tw`text-stone-600 text-sm mb-2 leading-5`} numberOfLines={2}>
                        {task.description}
                      </Text>
                    )}

                    <View style={tw`flex-row items-center gap-2`}>
                      <View style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: `${tierColor}10` }]}>
                        <Text style={[tw`text-xs font-semibold`, { color: tierColor }]}>{task.category || task.duration}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Swipe Indicator */}
                  <View style={tw`items-center justify-center px-2`}>
                    <View style={tw`flex-row items-center gap-1`}>
                      <View style={[tw`w-1 h-6 rounded-full`, { backgroundColor: `${tierColor}20` }]} />
                      <View style={[tw`w-1 h-6 rounded-full`, { backgroundColor: `${tierColor}40` }]} />
                      <View style={[tw`w-1 h-6 rounded-full`, { backgroundColor: `${tierColor}60` }]} />
                    </View>
                    <Text style={tw`text-stone-400 text-[10px] font-medium mt-1`}>SWIPE</Text>
                  </View>
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
