/**
 * TaskManager Component
 *
 * Main orchestrator for task management
 * - Displays task count and opens management modal
 * - Lists existing tasks with swipe-to-delete
 * - Opens TaskCategoryPicker for adding new tasks
 * - Animated tutorial on first view showing swipe gesture
 * - Prevents duplicate tasks from being added
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, FlatList, ImageBackground, Animated } from 'react-native';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import tw from '@/lib/tailwind';
import { Task, HabitType } from '@/types';
import { tierThemes } from '@/utils/tierTheme';
import TaskItem from './TaskItem';
import TaskCategoryPicker from './TaskCategoryPicker';

// ============================================================================
// TYPES
// ============================================================================

interface TaskManagerProps {
  habitId: string;
  habitCategory: string;
  habitType: HabitType;
  currentTier: 'Crystal' | 'Ruby' | 'Amethyst';
  tasks: Task[];
  onTasksUpdated: () => void;
  tierColor: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const TaskManager: React.FC<TaskManagerProps> = ({ habitId, habitCategory, habitType, currentTier, tasks, onTasksUpdated, tierColor }) => {
  const { t } = useTranslation();

  // ============================================================================
  // STATE
  // ============================================================================

  const [visible, setVisible] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const swipeAnim = useRef(new Animated.Value(0)).current;
  const tierTheme = tierThemes[currentTier] || tierThemes.Crystal;

  // ============================================================================
  // EFFECTS - SWIPE TUTORIAL
  // ============================================================================

  useEffect(() => {
    if (visible && tasks.length > 0 && !showTutorial) {
      setShowTutorial(true);

      // Animate first task to show swipe gesture
      const swipeSequence = Animated.sequence([
        Animated.timing(swipeAnim, {
          toValue: -80,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(swipeAnim, {
          toValue: -80,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);

      swipeSequence.start();
    }
  }, [visible, tasks.length, showTutorial, swipeAnim]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddTaskPress = () => {
    setVisible(false);
    setTimeout(() => setShowCategoryPicker(true), 300);
  };

  const handleTasksUpdated = () => {
    setShowCategoryPicker(false);
    setVisible(false);
    if (onTasksUpdated) {
      onTasksUpdated();
    }
  };

  const handleTaskDeleted = () => {
    if (onTasksUpdated) {
      onTasksUpdated();
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* ============================================================ */}
      {/* TRIGGER BUTTON */}
      {/* ============================================================ */}

      <View style={tw`bg-white rounded-3xl p-5 mb-4 shadow-md border border-stone-100`}>
        <Pressable onPress={() => setVisible(true)} style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-1`}>
            <Text style={tw`font-bold text-lg mb-1 text-stone-900`}>{t('taskManager.manageTitle')}</Text>
            <Text style={tw`text-stone-500 text-sm`}>{t('taskManager.taskCount', { count: tasks.length })}</Text>
          </View>

          <View style={tw`flex-row items-center gap-3`}>
            {/* Task Count Badge */}
            <View style={[tw`px-4 py-2 rounded-full`, { backgroundColor: `${tierColor}15` }]}>
              <Text style={[tw`font-bold text-base`, { color: tierColor }]}>{tasks.length}</Text>
            </View>

            {/* Chevron */}
            <View style={tw`w-8 h-8 rounded-full bg-stone-100 items-center justify-center`}>
              <Text style={tw`text-stone-600 text-lg`}>›</Text>
            </View>
          </View>
        </Pressable>
      </View>

      {/* ============================================================ */}
      {/* MANAGEMENT MODAL */}
      {/* ============================================================ */}

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={tw`flex-1 bg-black/50`}>
          <ImageBackground
            source={require('../../../assets/interface/textures/texture-white.png')}
            style={{
              flex: 1,
              marginTop: 80,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
            }}
            imageStyle={{
              opacity: 0.6,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
            resizeMode="cover"
          >
            <View style={tw`flex-1 bg-white/80`}>
              {/* Header */}
              <View style={tw`px-6 py-5 border-b border-stone-200`}>
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-stone-900 text-2xl font-bold`}>{t('taskManager.manageTitle')}</Text>
                    <Text style={tw`text-stone-500 text-sm mt-1`}>{t('taskManager.maxTasks')}</Text>
                  </View>

                  <Pressable onPress={() => setVisible(false)} style={tw`w-10 h-10 items-center justify-center rounded-xl bg-stone-100`}>
                    <X size={20} color="#57534e" />
                  </Pressable>
                </View>
              </View>

              {/* Task List - ✅ FIX: Utilise item.id (unique dans cette FlatList) */}
              <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                contentContainerStyle={tw`p-5`}
                ListEmptyComponent={
                  <View style={tw`items-center justify-center py-16`}>
                    <View style={tw`w-20 h-20 rounded-full bg-stone-100 items-center justify-center mb-4`}>
                      <Trash2 size={32} color="#a8a29e" />
                    </View>
                    <Text style={tw`text-stone-900 font-bold text-lg mb-2`}>{t('taskManager.noTasksTitle')}</Text>
                    <Text style={tw`text-stone-500 text-center px-8`}>{t('taskManager.noTasks')}</Text>
                  </View>
                }
                renderItem={({ item, index }) => (
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateX: index === 0 && showTutorial ? swipeAnim : 0,
                        },
                      ],
                    }}
                  >
                    <TaskItem task={item} habitId={habitId} onTaskDeleted={handleTaskDeleted} tierColor={tierColor} />
                  </Animated.View>
                )}
                ItemSeparatorComponent={() => <View style={tw`h-3`} />}
              />

              {/* Add Task Button */}
              <View style={tw`p-6 border-t border-stone-200`}>
                <View
                  style={{
                    borderRadius: 16,
                    overflow: 'hidden',
                    shadowColor: tierColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <LinearGradient colors={tierTheme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Pressable onPress={handleAddTaskPress} style={tw`flex-row items-center justify-center py-4`}>
                      <Plus size={22} color="white" strokeWidth={2.5} />
                      <Text style={tw`text-white font-bold text-base ml-2`}>{t('taskManager.addNewTask')}</Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* TASK CATEGORY PICKER MODAL */}
      {/* ============================================================ */}

      <TaskCategoryPicker
        visible={showCategoryPicker}
        habitId={habitId}
        habitCategory={habitCategory}
        habitType={habitType}
        currentTaskCount={tasks.length}
        currentTier={currentTier}
        tierColor={tierColor}
        existingTaskIds={tasks.map((t) => t.id)} // ✅ Passe les IDs existants
        onClose={() => setShowCategoryPicker(false)}
        onTasksUpdated={handleTasksUpdated}
      />
    </>
  );
};

export default TaskManager;
