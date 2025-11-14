// components/groups/GroupHabitCard.tsx
// Card d'habitude de groupe avec timeline 7 jours

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';
import type { GroupHabitWithCompletions, TimelineDay } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

interface GroupHabitCardProps {
  habit: GroupHabitWithCompletions;
  groupId: string;
  onRefresh: () => void;
}

export function GroupHabitCard({ habit, groupId, onRefresh }: GroupHabitCardProps) {
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
      if (userCompletedToday) {
        await groupService.uncompleteGroupHabit(user.id, habit.id);
      } else {
        await groupService.completeGroupHabit(user.id, { group_habit_id: habit.id });
      }

      // Recharger la timeline et le parent
      await loadTimeline();
      onRefresh();
    } catch (error) {
      console.error('Error toggling completion:', error);
    } finally {
      setCompleting(false);
    }
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
        return '#34D399'; // Green
      case 'partial':
        return '#60A5FA'; // Blue
      case 'today':
        return '#A78BFA'; // Purple
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

  return (
    <View style={tw`bg-white rounded-2xl p-5 border border-gray-100`}>
      {/* Header */}
      <View style={tw`flex-row items-start justify-between mb-4`}>
        <View style={tw`flex-row items-center gap-3 flex-1`}>
          <View style={tw`w-10 h-10 bg-[#F3F4F6] rounded-xl items-center justify-center`}>
            <Text style={tw`text-2xl`}>{habit.emoji}</Text>
          </View>
          <View style={tw`flex-1`}>
            <Text style={tw`text-base font-bold text-gray-900`} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={tw`text-xs text-gray-500`}>
              {habit.completions_today}/{habit.total_members} aujourd'hui
            </Text>
          </View>
        </View>

        {/* Bouton complétion */}
        <TouchableOpacity
          onPress={handleToggleComplete}
          disabled={completing}
          style={[tw`w-12 h-12 rounded-xl items-center justify-center border-2`, userCompletedToday ? tw`bg-[#34D399] border-[#34D399]` : tw`bg-white border-gray-200`]}
          activeOpacity={0.7}
        >
          {completing ? <ActivityIndicator size="small" color={userCompletedToday ? '#FFFFFF' : '#6B7280'} /> : userCompletedToday && <Check size={20} color="#FFFFFF" strokeWidth={3} />}
        </TouchableOpacity>
      </View>

      {/* Membres avec avatars */}
      {today && (
        <View style={tw`flex-row gap-2 mb-4`}>
          {today.completions.map((completion) => {
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
                style={[tw`w-8 h-8 rounded-full items-center justify-center border-2`, completion.completed ? tw`border-green-400` : tw`border-gray-200`, { backgroundColor: avatar.color }]}
              >
                {avatar.type === 'emoji' ? <Text style={tw`text-xs`}>{avatar.value}</Text> : <Text style={tw`text-xs font-semibold text-white`}>{avatar.value}</Text>}
              </View>
            );
          })}
        </View>
      )}

      {/* Timeline 7 jours */}
      {loading ? (
        <View style={tw`py-4 items-center`}>
          <ActivityIndicator size="small" color="#A78BFA" />
        </View>
      ) : (
        <View style={tw`gap-3`}>
          {/* Jours de la semaine */}
          <View style={tw`flex-row justify-between`}>
            {timeline.map((day) => (
              <View key={day.date} style={tw`items-center`}>
                <Text style={tw`text-xs font-medium text-gray-500 mb-1`}>{day.day_name}</Text>
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
      )}

      {/* Légende */}
      <View style={tw`flex-row justify-center gap-4 mt-3 pt-3 border-t border-gray-100`}>
        <View style={tw`flex-row items-center gap-1`}>
          <Text style={tw`text-xs font-bold text-[#34D399]`}>✓✓</Text>
          <Text style={tw`text-xs text-gray-500`}>Tous</Text>
        </View>
        <View style={tw`flex-row items-center gap-1`}>
          <Text style={tw`text-xs font-bold text-[#60A5FA]`}>✓○</Text>
          <Text style={tw`text-xs text-gray-500`}>Partiel</Text>
        </View>
        <View style={tw`flex-row items-center gap-1`}>
          <Text style={tw`text-xs font-bold text-[#E5E7EB]`}>○○</Text>
          <Text style={tw`text-xs text-gray-500`}>Aucun</Text>
        </View>
      </View>
    </View>
  );
}
