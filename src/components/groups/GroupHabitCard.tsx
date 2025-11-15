// components/groups/GroupHabitCard.tsx
// Card d'habitude de groupe avec timeline 7 jours et complétions dynamiques

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Check } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupHabitWithCompletions, TimelineDay } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

interface GroupHabitCardProps {
  habit: GroupHabitWithCompletions;
  groupId: string;
  members: Array<{ user_id: string; user_name: string }>; // Ajout du prop members
  onRefresh: () => void;
  onDelete: () => void; // Ajout du prop onDelete
}

export function GroupHabitCard({ habit, groupId, members, onRefresh, onDelete }: GroupHabitCardProps) {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadTimeline = async () => {
    try {
      const data = await groupService.getHabitTimeline(habit.id, 7);
      setTimeline(data);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [habit.id]);

  const today = timeline.find((day) => day.is_today);
  const userCompletedToday = today?.completions.find((c) => c.user_id === user?.id)?.completed || false;

  const handleToggleComplete = async () => {
    if (!user?.id || completing) return;

    setCompleting(true);
    try {
      if (completing) {
        await groupService.uncompleteGroupHabit(habit.id, user.id);
      } else {
        await groupService.completeGroupHabit(habit.id, user.id);
      }

      // ✅ FIX: Reload + trigger parent refresh
      await loadTimeline();
      onRefresh(); // ← Important !
    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert('Erreur', 'Impossible de modifier la complétion');
    } finally {
      setCompleting(false);
    }
  };

  const handleLongPress = () => {
    Alert.alert("Supprimer l'habitude", `Voulez-vous supprimer "${habit.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: onDelete,
      },
    ]);
  };

  const getCompletionStatus = (day: TimelineDay): 'all' | 'partial' | 'none' | 'today' => {
    if (day.is_today) return 'today';

    const completedCount = day.completions.filter((c) => c.completed).length;
    if (completedCount === 0) return 'none';
    if (completedCount === day.completions.length) return 'all';
    return 'partial';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'all':
        return '#10b981'; // Emerald
      case 'partial':
        return '#3b82f6'; // Blue
      case 'today':
        return '#8b5cf6'; // Purple
      default:
        return '#E5E7EB'; // Gray
    }
  };

  const getStatusSymbol = (status: string): string => {
    switch (status) {
      case 'all':
        return '✓✓';
      case 'partial':
        return '✓○';
      case 'none':
        return '○○';
      case 'today':
        return '●●';
      default:
        return '○○';
    }
  };

  // Générer initiales
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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
                {habit.completions_today || 0}/{habit.total_members || members.length} complété{(habit.completions_today || 0) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Bouton complétion */}
          <TouchableOpacity
            onPress={handleToggleComplete}
            disabled={completing}
            style={[tw`w-12 h-12 rounded-xl items-center justify-center border-2`, userCompletedToday ? tw`bg-[#10b981] border-[#10b981]` : tw`bg-white border-stone-300`]}
            activeOpacity={0.7}
          >
            {completing ? <ActivityIndicator size="small" color={userCompletedToday ? '#FFFFFF' : '#6B7280'} /> : userCompletedToday && <Check size={22} color="#FFFFFF" strokeWidth={3} />}
          </TouchableOpacity>
        </View>

        {/* Avatars des membres avec états (fallback si pas de timeline) */}
        {!today && members.length > 0 && (
          <View style={tw`flex-row -space-x-2 mb-4`}>
            {members.map((member, index) => {
              const initials = getInitials(member.user_name || 'User');
              const isCompleted = userCompletedToday && member.user_id === user?.id;
              const bgColor = isCompleted ? '#10b981' : '#E5E7EB';

              return (
                <View key={member.user_id} style={[tw`w-9 h-9 rounded-full border-2 border-white items-center justify-center`, { backgroundColor: bgColor, zIndex: 10 - index }]}>
                  {isCompleted ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={tw`text-xs font-bold text-stone-500`}>{initials}</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* Membres avec avatars (si timeline disponible) */}
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
                  style={[tw`w-9 h-9 rounded-full items-center justify-center border-2 border-white`, { backgroundColor: completion.completed ? '#10b981' : avatar.color, zIndex: 10 - index }]}
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

        {/* Timeline 7 jours */}
        {loading ? (
          <View style={tw`py-4 items-center`}>
            <ActivityIndicator size="small" color="#8b5cf6" />
          </View>
        ) : (
          timeline.length > 0 && (
            <View style={tw`gap-3`}>
              {/* Jours de la semaine */}
              <View style={tw`flex-row justify-between`}>
                {timeline.map((day) => (
                  <View key={day.date} style={tw`items-center w-10`}>
                    <Text style={tw`text-xs font-medium text-stone-500 mb-1`}>{day.day_name}</Text>
                  </View>
                ))}
              </View>

              {/* Indicateurs de complétion */}
              <View style={tw`flex-row justify-between items-center`}>
                {timeline.map((day) => {
                  const status = getCompletionStatus(day);
                  const color = getStatusColor(status);

                  return (
                    <View
                      key={day.date}
                      style={[
                        tw`w-10 h-10 rounded-lg items-center justify-center`,
                        { backgroundColor: color + '20' }, // 20% opacity
                      ]}
                    >
                      <Text style={[tw`text-xs font-bold`, { color }]}>{getStatusSymbol(status)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )
        )}

        {/* Légende */}
        {timeline.length > 0 && (
          <View style={tw`flex-row justify-center gap-4 mt-3 pt-3 border-t border-stone-100`}>
            <View style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-xs font-bold text-[#10b981]`}>✓✓</Text>
              <Text style={tw`text-xs text-stone-500`}>Tous</Text>
            </View>
            <View style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-xs font-bold text-[#3b82f6]`}>✓○</Text>
              <Text style={tw`text-xs text-stone-500`}>Partiel</Text>
            </View>
            <View style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-xs font-bold text-[#E5E7EB]`}>○○</Text>
              <Text style={tw`text-xs text-stone-500`}>Aucun</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
