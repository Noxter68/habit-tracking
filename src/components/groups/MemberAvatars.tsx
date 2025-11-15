// components/groups/MemberAvatars.tsx
// Affichage des avatars des membres du groupe

import React from 'react';
import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import type { GroupMember } from '@/types/group.types';

interface Props {
  members: GroupMember[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const MemberAvatars: React.FC<Props> = ({ members, maxDisplay = 3, size = 'md' }) => {
  const visibleMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);

  // Tailles selon le prop
  const sizeStyles = {
    sm: tw`w-9 h-9`,
    md: tw`w-10 h-10`,
    lg: tw`w-12 h-12`,
  };

  const iconSizes = {
    sm: 18,
    md: 20,
    lg: 24,
  };

  const textSizes = {
    sm: tw`text-xs`,
    md: tw`text-sm`,
    lg: tw`text-base`,
  };

  // Générer une couleur basée sur l'user_id
  const getAvatarColor = (userId: string) => {
    const colors = [
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#06b6d4', // cyan
      '#ef4444', // red
      '#6366f1', // indigo
    ];

    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Obtenir les initiales d'un nom
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={tw`flex-row items-center`}>
      {/* Avatars visibles */}
      <View style={tw`flex-row -space-x-2`}>
        {visibleMembers.map((member, index) => {
          const bgColor = getAvatarColor(member.user_id);
          const initials = getInitials(member.user_name || 'User');

          return (
            <View key={member.user_id} style={[sizeStyles[size], tw`rounded-full border-2 border-white items-center justify-center`, { backgroundColor: bgColor, zIndex: 10 - index }]}>
              <Text style={[textSizes[size], tw`font-bold text-white`]}>{initials}</Text>
            </View>
          );
        })}

        {/* Compteur des membres restants */}
        {remainingCount > 0 && (
          <View style={[sizeStyles[size], tw`rounded-full bg-stone-200 border-2 border-white items-center justify-center`, { zIndex: 0 }]}>
            <Text style={[textSizes[size], tw`font-semibold text-stone-600`]}>+{remainingCount}</Text>
          </View>
        )}

        {/* Si aucun membre visible, afficher l'icône */}
        {visibleMembers.length === 0 && (
          <View style={[sizeStyles[size], tw`rounded-full bg-stone-100 border-2 border-white items-center justify-center`]}>
            <Users size={iconSizes[size]} color="#9CA3AF" />
          </View>
        )}
      </View>
    </View>
  );
};
