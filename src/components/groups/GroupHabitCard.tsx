// components/groups/GroupHabitCard.tsx
// Card d'habitude de groupe avec optimistic updates complets

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupHabitWithCompletions, TimelineDay } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import { GroupHabitTimeline } from './GroupHabitTimeline';
import tw from '@/lib/tailwind';

interface GroupHabitCardProps {
  habit: GroupHabitWithCompletions;
  groupId: string;
  members: Array<{ user_id: string; user_name: string }>;
  onRefresh: () => void;
  onDelete: () => void;
}

export function GroupHabitCard({ habit, groupId, members, onRefresh, onDelete }: GroupHabitCardProps) {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [userCompletedToday, setUserCompletedToday] = useState(false);
  const [completionsCount, setCompletionsCount] = useState(habit.completions_today || 0);

  const loadTimeline = async () => {
    try {
      const data = await groupService.getHabitTimeline(habit.id, groupId, 7);
      setTimeline(data);

      const today = data.find((day) => day.is_today);
      const isCompleted = today?.completions.find((c) => c.user_id === user?.id)?.completed || false;
      setUserCompletedToday(isCompleted);

      // Sync le compteur avec les vraies données
      const realCount = today?.completions.filter((c) => c.completed).length || 0;
      setCompletionsCount(realCount);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [habit.id]);

  // Recharger quand les props changent (Realtime)
  useEffect(() => {
    setCompletionsCount(habit.completions_today || 0);
  }, [habit.completions_today]);

  // ✨ NOUVEAU: Recharger la timeline quand une complétion change via Realtime
  useEffect(() => {
    if (!loading && habit.completions_today !== undefined) {
      // Silent reload de la timeline
      loadTimeline();
    }
  }, [habit.completions_today]);

  const today = timeline.find((day) => day.is_today);

  const handleToggleComplete = async () => {
    if (!user?.id || completing) return;

    setCompleting(true);
    const wasCompleted = userCompletedToday;

    // ✨ OPTIMISTIC UPDATE
    setUserCompletedToday(!wasCompleted);
    setCompletionsCount((prev) => (wasCompleted ? Math.max(0, prev - 1) : prev + 1));

    // Update optimiste de la timeline
    const optimisticTimeline = timeline.map((day) => {
      if (!day.is_today) return day;

      return {
        ...day,
        completions: day.completions.map((c) => (c.user_id === user.id ? { ...c, completed: !wasCompleted } : c)),
      };
    });
    setTimeline(optimisticTimeline);

    // Haptic feedback immédiat
    Haptics.impactAsync(wasCompleted ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (wasCompleted) {
        await groupService.uncompleteGroupHabit(user.id, habit.id);
      } else {
        await groupService.completeGroupHabit(user.id, {
          group_habit_id: habit.id,
        });
      }

      // Recharge les vraies données après succès
      await loadTimeline();
      onRefresh();

      // Success haptic
      if (!wasCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);

      // ❌ ROLLBACK en cas d'erreur
      setUserCompletedToday(wasCompleted);
      setCompletionsCount((prev) => (wasCompleted ? prev + 1 : Math.max(0, prev - 1)));
      await loadTimeline(); // Recharge la timeline originale

      // Error haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'Impossible de modifier la complétion');
    } finally {
      setCompleting(false);
    }
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Supprimer l'habitude", `Voulez-vous supprimer "${habit.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.98} delayLongPress={500}>
      <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-stone-100`}>
        {/* Header */}
        <View style={tw`flex-row items-start justify-between mb-4`}>
          <View style={tw`flex-row items-center gap-3 flex-1`}>
            <View style={tw`w-12 h-12 bg-stone-50 rounded-xl items-center justify-center`}>
              <Text style={tw`text-3xl`}>{habit.emoji}</Text>
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-base font-bold text-stone-800`} numberOfLines={1}>
                {habit.name}
              </Text>
              <Text style={tw`text-xs text-stone-500`}>
                {completionsCount}/{habit.total_members || members.length} complété{completionsCount > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Bouton complétion avec feedback visuel */}
          <TouchableOpacity
            onPress={handleToggleComplete}
            disabled={completing}
            style={[tw`w-12 h-12 rounded-xl items-center justify-center border-2`, userCompletedToday ? tw`bg-[#10b981] border-[#10b981]` : tw`bg-white border-stone-300`]}
            activeOpacity={0.7}
          >
            {completing ? <ActivityIndicator size="small" color={userCompletedToday ? '#FFFFFF' : '#6B7280'} /> : userCompletedToday && <Check size={22} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>
        </View>

        {/* Membres avec avatars - Utilise la timeline pour les données à jour */}
        {today && today.completions.length > 0 && (
          <View style={tw`flex-row -space-x-2 mb-4`}>
            {today.completions.map((completion, index) => {
              const avatar = getAvatarDisplay({
                id: completion.user_id,
                username: completion.username,
                email: null,
                avatar_emoji: completion.avatar_emoji,
                avatar_color: completion.avatar_color,
                subscription_tier: 'free',
              });

              return (
                <View
                  key={completion.user_id}
                  style={[
                    tw`w-9 h-9 rounded-full items-center justify-center border-2 border-white`,
                    {
                      backgroundColor: completion.completed ? '#10b981' : avatar.color,
                      zIndex: 10 - index,
                    },
                  ]}
                >
                  {completion.completed ? (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  ) : avatar.type === 'emoji' ? (
                    <Text style={tw`text-sm`}>{avatar.value}</Text>
                  ) : (
                    <Text style={tw`text-xs font-semibold text-white`}>{avatar.value}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Timeline stylée */}
        {loading ? (
          <View style={tw`py-4 items-center`}>
            <ActivityIndicator size="small" color="#3b82f6" />
          </View>
        ) : (
          timeline.length > 0 && <GroupHabitTimeline key={`timeline-${completionsCount}-${userCompletedToday}`} timeline={timeline} />
        )}
      </View>
    </TouchableOpacity>
  );
}
