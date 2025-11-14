// components/groups/MemberAvatars.tsx
// Affichage des avatars des membres (cercles superposés)

import React from 'react';
import { View, Text } from 'react-native';
import type { GroupMember } from '@/types/group.types';
import { getAvatarDisplay } from '@/utils/groupUtils';
import tw from '@/lib/tailwind';

interface MemberAvatarsProps {
  members: GroupMember[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function MemberAvatars({ members, maxDisplay = 5, size = 'md' }: MemberAvatarsProps) {
  const displayMembers = members.slice(0, maxDisplay);
  const remainingCount = Math.max(0, members.length - maxDisplay);

  const sizeStyles = {
    sm: { container: 'w-7 h-7', text: 'text-xs', offset: '-ml-2' },
    md: { container: 'w-10 h-10', text: 'text-sm', offset: '-ml-3' },
    lg: { container: 'w-12 h-12', text: 'text-base', offset: '-ml-3' },
  };

  const styles = sizeStyles[size];

  return (
    <View style={tw`flex-row items-center`}>
      {displayMembers.map((member, index) => {
        const avatar = getAvatarDisplay(member.profile || null);

        return (
          <View
            key={member.id}
            style={[tw`${styles.container} rounded-full items-center justify-center border-2 border-white shadow-sm`, { backgroundColor: avatar.color }, index > 0 && tw`${styles.offset}`]}
          >
            {avatar.type === 'emoji' ? <Text style={tw`${styles.text}`}>{avatar.value}</Text> : <Text style={tw`${styles.text} font-semibold text-white`}>{avatar.value}</Text>}
          </View>
        );
      })}

      {remainingCount > 0 && (
        <View style={[tw`${styles.container} rounded-full bg-gray-200 items-center justify-center border-2 border-white ${styles.offset}`]}>
          <Text style={tw`${styles.text} font-semibold text-gray-600`}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
}
