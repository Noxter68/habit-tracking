// components/groups/GroupHabitCard.tsx
// Card d'habitude de groupe avec complétions dynamiques par membre

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Check } from 'lucide-react-native';
import { isToday, parseISO } from 'date-fns';
import tw from '@/lib/tailwind';
import type { GroupHabitWithCompletions } from '@/types/group.types';
import { groupService } from '@/services/groupTypeService';
import { useAuth } from '@/context/AuthContext';

interface Props {
  habit: GroupHabitWithCompletions;
  groupId: string;
  members: Array<{ user_id: string; user_name: string }>;
  onRefresh: () => void;
  onDelete: () => void;
}

export const GroupHabitCard: React.FC<Props> = ({ habit, groupId, members, onRefresh, onDelete }) => {
  const { user } = useAuth();
  const [isCompleting, setIsCompleting] = useState(false);

  // Vérifier si l'utilisateur actuel a complété aujourd'hui
  const userCompletion = habit.completions.find((c) => c.user_id === user?.id && isToday(parseISO(c.completed_at)));
  const isCompletedByUser = !!userCompletion;

  // Obtenir les complétions d'aujourd'hui
  const todayCompletions = habit.completions.filter((c) => isToday(parseISO(c.completed_at)));

  const handleToggleCompletion = async () => {
    if (!user?.id || isCompleting) return;

    setIsCompleting(true);
    try {
      if (isCompletedByUser) {
        await groupService.uncompleteGroupHabit(habit.id, user.id);
      } else {
        await groupService.completeGroupHabit(habit.id, user.id);
      }
      await onRefresh();
    } catch (error) {
      console.error('Error toggling completion:', error);
      Alert.alert('Erreur', 'Impossible de modifier la complétion');
    } finally {
      setIsCompleting(false);
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

  // Vérifier si un membre a complété aujourd'hui
  const isMemberCompleted = (memberId: string) => {
    return todayCompletions.some((c) => c.user_id === memberId);
  };

  // Générer une couleur basée sur l'user_id
  const getAvatarColor = (userId: string) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6366f1'];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Obtenir les initiales
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} activeOpacity={0.95} delayLongPress={500}>
      <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-stone-100`}>
        <View style={tw`flex-row items-center justify-between gap-3`}>
          {/* Gauche: Check + Nom */}
          <View style={tw`flex-row items-center gap-3 flex-1`}>
            {/* Checkbox */}
            <TouchableOpacity onPress={handleToggleCompletion} disabled={isCompleting} activeOpacity={0.7}>
              <View style={[tw`w-7 h-7 rounded-lg items-center justify-center border-2`, isCompletedByUser ? tw`bg-[#3b82f6] border-[#3b82f6]` : tw`bg-transparent border-stone-300`]}>
                {isCompletedByUser && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
              </View>
            </TouchableOpacity>

            {/* Emoji + Nom */}
            <View style={tw`flex-1`}>
              <View style={tw`flex-row items-center gap-2`}>
                <Text style={tw`text-2xl`}>{habit.emoji}</Text>
                <Text style={tw`text-base font-semibold text-stone-800 flex-1`} numberOfLines={1}>
                  {habit.name}
                </Text>
              </View>
              {habit.description && (
                <Text style={tw`text-xs text-stone-500 mt-1`} numberOfLines={1}>
                  {habit.description}
                </Text>
              )}
            </View>
          </View>

          {/* Droite: Avatars des membres avec états */}
          <View style={tw`flex-row -space-x-2`}>
            {members.map((member, index) => {
              const isCompleted = isMemberCompleted(member.user_id);
              const bgColor = isCompleted ? '#10b981' : '#E5E7EB';
              const initials = getInitials(member.user_name || 'User');

              return (
                <View key={member.user_id} style={[tw`w-9 h-9 rounded-full border-2 border-white items-center justify-center`, { backgroundColor: bgColor, zIndex: 10 - index }]}>
                  {isCompleted ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={tw`text-xs font-bold text-stone-500`}>{initials}</Text>}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Export nommé pour correspondre à l'import
export { GroupHabitCard };
