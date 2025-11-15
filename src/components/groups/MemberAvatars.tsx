// components/groups/MemberAvatars.tsx
// Affichage des avatars des membres avec leurs vrais profils

import React from 'react';
import { View, Text } from 'react-native';
import { Users } from 'lucide-react-native';
import tw from '@/lib/tailwind';
import type { GroupMember } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';

interface Props {
  members: GroupMember[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const MemberAvatars: React.FC<Props> = ({ members, maxDisplay = 3, size = 'md' }) => {
  console.log('👥 MemberAvatars received:', members);
  console.log('📊 Members length:', members?.length);

  const visibleMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);

  console.log('👀 Visible members:', visibleMembers);
  console.log('➕ Remaining count:', remainingCount);

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

  const emojiSizes = {
    sm: tw`text-base`,
    md: tw`text-lg`,
    lg: tw`text-xl`,
  };

  const textSizes = {
    sm: tw`text-xs`,
    md: tw`text-sm`,
    lg: tw`text-base`,
  };

  return (
    <View style={tw`flex-row items-center`}>
      {/* Avatars visibles */}
      <View style={tw`flex-row -space-x-2`}>
        {visibleMembers.map((member, index) => {
          // Utilise la vraie fonction getAvatarDisplay
          const avatar = getAvatarDisplay({
            id: member.user_id,
            username: member.profile?.username || null,
            email: member.profile?.email || null,
            avatar_emoji: member.profile?.avatar_emoji || null,
            avatar_color: member.profile?.avatar_color || null,
            subscription_tier: member.profile?.subscription_tier || 'free',
          });

          return (
            <View key={member.user_id} style={[sizeStyles[size], tw`rounded-full border-2 border-white items-center justify-center`, { backgroundColor: avatar.color, zIndex: 10 - index }]}>
              {avatar.type === 'emoji' ? <Text style={emojiSizes[size]}>{avatar.value}</Text> : <Text style={[textSizes[size], tw`font-bold text-white`]}>{avatar.value}</Text>}
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
            <Users size={iconSizes[size]} color="#A8A29E" />
          </View>
        )}
      </View>
    </View>
  );
};
